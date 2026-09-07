import { Injectable, NotFoundException } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../../../core/database/prisma.service';
import { RedisService } from '../../../core/redis/redis.service';
import { QueryRefreshTokenDto } from './dto';

@Injectable()
export class RefreshTokensService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  // ─── HASH UTILITY ─────────────────────────────────────────────────────────────
  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  // ─── CREATE ──────────────────────────────────────────────────────────────────
  async create(
    userId: string,
    tokenHash: string,
    expiresAt: Date,
    userAgent?: string,
    ipAddress?: string,
  ) {
    const token = await this.prisma.refreshToken.create({
      data: {
        userId: BigInt(userId),
        tokenHash,
        expiresAt,
        userAgent,
        ipAddress,
      },
    });

    const ttlSeconds = Math.max(
      1,
      Math.floor((expiresAt.getTime() - Date.now()) / 1000),
    );
    await this.redisService.set(`refresh_token:${tokenHash}`, userId, ttlSeconds);

    return this.serialize(token);
  }

  // ─── READ ALL ─────────────────────────────────────────────────────────────────
  async findAll(query: QueryRefreshTokenDto) {
    const { page = 1, limit = 10, userId, status } = query;
    const skip = (page - 1) * limit;
    const now = new Date();

    const where: any = {};

    if (userId) {
      where.userId = BigInt(userId);
    }

    if (status === 'active') {
      where.revokedAt = null;
      where.expiresAt = { gt: now };
    } else if (status === 'revoked') {
      where.revokedAt = { not: null };
    } else if (status === 'expired') {
      where.revokedAt = null;
      where.expiresAt = { lte: now };
    }

    const [total, tokens] = await Promise.all([
      this.prisma.refreshToken.count({ where }),
      this.prisma.refreshToken.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, username: true, email: true },
          },
        },
      }),
    ]);

    return {
      data: tokens.map((t) => this.serialize(t)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ─── READ ONE ─────────────────────────────────────────────────────────────────
  async findOne(id: string) {
    const token = await this.prisma.refreshToken.findUnique({
      where: { id: BigInt(id) },
      include: {
        user: { select: { id: true, username: true, email: true } },
      },
    });

    if (!token) {
      throw new NotFoundException(`Không tìm thấy refresh token với ID: ${id}`);
    }

    return this.serialize(token);
  }

  // ─── REVOKE ONE ───────────────────────────────────────────────────────────────
  async revoke(id: string) {
    const token = await this.findOne(id);

    if (token.revokedAt) {
      return { message: 'Token này đã bị thu hồi trước đó', token };
    }

    const updated = await this.prisma.refreshToken.update({
      where: { id: BigInt(id) },
      data: { revokedAt: new Date() },
    });

    await this.redisService.del(`refresh_token:${updated.tokenHash}`);

    return { message: 'Thu hồi token thành công', token: this.serialize(updated) };
  }

  // ─── REVOKE ALL BY USER ───────────────────────────────────────────────────────
  async revokeAllByUser(userId: string) {
    const activeTokens = await this.prisma.refreshToken.findMany({
      where: { userId: BigInt(userId), revokedAt: null },
      select: { tokenHash: true },
    });

    await this.prisma.refreshToken.updateMany({
      where: { userId: BigInt(userId), revokedAt: null },
      data: { revokedAt: new Date() },
    });

    for (const t of activeTokens) {
      await this.redisService.del(`refresh_token:${t.tokenHash}`);
    }

    return {
      message: `Đã thu hồi ${activeTokens.length} token của user ID ${userId}`,
      revokedCount: activeTokens.length,
    };
  }

  // ─── DELETE (Hard delete) ─────────────────────────────────────────────────────
  async remove(id: string) {
    const token = await this.findOne(id);

    await this.redisService.del(`refresh_token:${token.tokenHash}`);
    await this.prisma.refreshToken.delete({ where: { id: BigInt(id) } });

    return { message: `Refresh token ID ${id} đã được xóa vĩnh viễn` };
  }

  // ─── CLEANUP EXPIRED & REVOKED ────────────────────────────────────────────────
  async cleanup() {
    const result = await this.prisma.refreshToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { revokedAt: { not: null } },
        ],
      },
    });

    return {
      message: `Đã dọn dẹp ${result.count} token hết hạn hoặc đã thu hồi`,
      deletedCount: result.count,
    };
  }

  // ─── INTERNAL ─────────────────────────────────────────────────────────────────
  async findValidByHash(tokenHash: string) {
    const token = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });

    if (!token || token.revokedAt || token.expiresAt < new Date()) {
      return null;
    }

    return token;
  }

  async revokeByHash(tokenHash: string) {
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    await this.redisService.del(`refresh_token:${tokenHash}`);
  }

  // ─── SERIALIZE ────────────────────────────────────────────────────────────────
  private serialize(token: any): any {
    return {
      ...token,
      id: token.id?.toString(),
      userId: token.userId?.toString(),
      user: token.user
        ? { ...token.user, id: token.user.id?.toString() }
        : undefined,
    };
  }
}

