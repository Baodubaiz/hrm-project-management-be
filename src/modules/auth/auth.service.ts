import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { RedisService } from '../../core/redis/redis.service';
import { ChangePasswordDto, LoginDto, RefreshTokenDto, RegisterDto } from './dto';
import { RefreshTokensService } from './refresh-tokens/refresh-tokens.service';
import { UsersService } from './users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly refreshTokensService: RefreshTokensService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {}

  // ─── REGISTER ─────────────────────────────────────────────────────────────────
  async register(dto: RegisterDto) {
    const user = await this.usersService.create(dto);
    return {
      message: 'Đăng ký tài khoản thành công',
      data: user,
    };
  }

  // ─── LOGIN ────────────────────────────────────────────────────────────────────
  async login(dto: LoginDto, userAgent?: string, ipAddress?: string) {
    const user = await this.usersService.findFullForAuth(dto.usernameOrEmail);

    if (!user) {
      throw new UnauthorizedException('Tài khoản không tồn tại');
    }

    if (user.status === 'LOCKED') {
      throw new ForbiddenException('Tài khoản đã bị khóa do đăng nhập sai quá nhiều lần');
    }

    if (user.status === 'INACTIVE') {
      throw new ForbiddenException('Tài khoản chưa được kích hoạt');
    }

    const isValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!isValid) {
      const attempts = user.failedLoginAttempts + 1;
      const lock = attempts >= 5;
      await this.usersService.updateFailedLogin(user.id, attempts, lock);

      if (lock) {
        throw new ForbiddenException('Tài khoản đã bị khóa sau 5 lần đăng nhập sai');
      }

      throw new UnauthorizedException(`Sai mật khẩu. Còn ${5 - attempts} lần thử`);
    }

    await this.usersService.recordLogin(user.id);

    const roles = user.roles.map((ur: any) => ur.role.code);
    const permissionsSet = new Set<string>();
    user.roles.forEach((ur: any) =>
      ur.role.permissions.forEach((rp: any) =>
        permissionsSet.add(rp.permission.code),
      ),
    );
    const permissions = Array.from(permissionsSet);

    const payload = {
      id: user.id.toString(),
      username: user.username,
      email: user.email,
      roles,
      permissions,
      employeeId: user.employee?.id?.toString() ?? null,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.signAccessToken(payload),
      this.signRefreshToken(user.id.toString()),
    ]);

    const tokenHash = this.refreshTokensService.hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.refreshTokensService.create(
      user.id.toString(),
      tokenHash,
      expiresAt,
      userAgent,
      ipAddress,
    );

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id.toString(),
        username: user.username,
        email: user.email,
        status: user.status,
        roles,
        permissions,
        employee: user.employee
          ? { ...user.employee, id: user.employee.id.toString() }
          : null,
      },
    };
  }

  // ─── REFRESH TOKEN ────────────────────────────────────────────────────────────
  async refresh(dto: RefreshTokenDto, userAgent?: string, ipAddress?: string) {
    let payload: any;
    try {
      payload = await this.jwtService.verifyAsync(dto.refreshToken, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });
    } catch {
      throw new UnauthorizedException('Refresh token không hợp lệ hoặc đã hết hạn');
    }

    const tokenHash = this.refreshTokensService.hashToken(dto.refreshToken);
    const valid = await this.refreshTokensService.findValidByHash(tokenHash);

    if (!valid) {
      throw new UnauthorizedException('Refresh token đã bị thu hồi hoặc không tồn tại');
    }

    await this.refreshTokensService.revokeByHash(tokenHash);

    const user = await this.usersService.findByIdForAuth(BigInt(payload.id));

    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Tài khoản không còn hoạt động');
    }

    const roles = user.roles.map((ur: any) => ur.role.code);
    const permissionsSet = new Set<string>();
    user.roles.forEach((ur: any) =>
      ur.role.permissions.forEach((rp: any) =>
        permissionsSet.add(rp.permission.code),
      ),
    );

    const newPayload = {
      id: user.id.toString(),
      username: user.username,
      email: user.email,
      roles,
      permissions: Array.from(permissionsSet),
      employeeId: user.employee?.id?.toString() ?? null,
    };

    const [newAccessToken, newRefreshToken] = await Promise.all([
      this.signAccessToken(newPayload),
      this.signRefreshToken(user.id.toString()),
    ]);

    const newHash = this.refreshTokensService.hashToken(newRefreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.refreshTokensService.create(
      user.id.toString(),
      newHash,
      expiresAt,
      userAgent,
      ipAddress,
    );

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  // ─── LOGOUT ───────────────────────────────────────────────────────────────────
  async logout(accessToken: string, refreshToken?: string) {
    if (accessToken) {
      await this.redisService.blacklistToken(accessToken, 900); // 15m TTL
    }

    if (refreshToken) {
      const hash = this.refreshTokensService.hashToken(refreshToken);
      await this.refreshTokensService.revokeByHash(hash);
    }

    return { message: 'Đăng xuất thành công' };
  }

  // ─── GET PROFILE ─────────────────────────────────────────────────────────────
  async getProfile(userId: string) {
    return this.usersService.findOne(userId);
  }

  // ─── CHANGE PASSWORD ──────────────────────────────────────────────────────────
  async changePassword(userId: string, dto: ChangePasswordDto) {
    const raw = await this.usersService.findFullForAuth(userId);
    const user = raw || (await this.usersService.findByIdForAuth(BigInt(userId)));

    if (!user) {
      throw new UnauthorizedException('Không tìm thấy tài khoản');
    }

    const isMatch = await bcrypt.compare(dto.oldPassword, (user as any).passwordHash);
    if (!isMatch) {
      throw new BadRequestException('Mật khẩu hiện tại không đúng');
    }

    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(dto.newPassword, salt);

    await this.usersService.updatePassword(user.id, newHash);
    await this.refreshTokensService.revokeAllByUser(user.id.toString());

    return { message: 'Đổi mật khẩu thành công. Vui lòng đăng nhập lại' };
  }

  // ─── PRIVATE HELPERS ──────────────────────────────────────────────────────────
  private signAccessToken(payload: object) {
    return this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('jwt.accessSecret'),
      expiresIn: (this.configService.get<string>('jwt.accessExpiration') ?? '15m') as any,
    });
  }

  private signRefreshToken(userId: string) {
    return this.jwtService.signAsync(
      { id: userId },
      {
        secret: this.configService.get<string>('jwt.refreshSecret'),
        expiresIn: (this.configService.get<string>('jwt.refreshExpiration') ?? '7d') as any,
      },
    );
  }
}

