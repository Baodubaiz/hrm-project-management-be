import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { CreateAuditLogDto, QueryAuditLogDto } from './dto';

@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  async logAction(dto: CreateAuditLogDto) {
    const log = await this.prisma.auditLog.create({
      data: {
        userId: dto.userId ? BigInt(dto.userId) : null,
        action: dto.action,
        entityType: dto.entityType,
        entityId: BigInt(dto.entityId),
        payloadBefore: dto.payloadBefore,
        payloadAfter: dto.payloadAfter,
        ipAddress: dto.ipAddress,
        userAgent: dto.userAgent,
      },
      include: {
        user: {
          select: { id: true, username: true, email: true },
        },
      },
    });

    return this.serialize(log);
  }

  async findAll(query: QueryAuditLogDto) {
    const { page = 1, limit = 10, userId, entityType, entityId, action, fromDate, toDate } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (userId) where.userId = BigInt(userId);
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = BigInt(entityId);
    if (action) where.action = { contains: action, mode: 'insensitive' };
    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) where.createdAt.gte = new Date(fromDate);
      if (toDate) where.createdAt.lte = new Date(toDate);
    }

    const [total, logs] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
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
      data: logs.map((l) => this.serialize(l)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findByEntity(entityType: string, entityId: string) {
    const logs = await this.prisma.auditLog.findMany({
      where: {
        entityType,
        entityId: BigInt(entityId),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, username: true, email: true } },
      },
    });

    return logs.map((l) => this.serialize(l));
  }

  async findByUser(userId: string) {
    const logs = await this.prisma.auditLog.findMany({
      where: { userId: BigInt(userId) },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, username: true, email: true } },
      },
    });

    return logs.map((l) => this.serialize(l));
  }

  async findOne(id: string) {
    const log = await this.prisma.auditLog.findUnique({
      where: { id: BigInt(id) },
      include: {
        user: { select: { id: true, username: true, email: true } },
      },
    });

    if (!log) {
      throw new NotFoundException(`Không tìm thấy audit log với ID: ${id}`);
    }

    return this.serialize(log);
  }

  private serialize(l: any): any {
    if (!l) return null;
    return {
      ...l,
      id: l.id?.toString(),
      userId: l.userId?.toString() ?? null,
      entityId: l.entityId?.toString(),
      user: l.user ? { ...l.user, id: l.user.id?.toString() } : null,
    };
  }
}

