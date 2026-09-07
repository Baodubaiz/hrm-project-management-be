import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { CurrentUser, type CurrentUserPayload } from '../../core/decorators/current-user.decorator';
import { Public } from '../../core/decorators/public.decorator';
import { AuthService } from './auth.service';
import {
  ChangePasswordDto,
  LoginDto,
  RefreshTokenDto,
  RegisterDto,
} from './dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /auth/register
   * Đăng ký tài khoản mới (không cần auth)
   */
  @Public()
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  /**
   * POST /auth/login
   * Đăng nhập lấy access token + refresh token (không cần auth)
   */
  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    const userAgent = req.headers['user-agent'];
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.ip;
    return this.authService.login(dto, userAgent, ipAddress);
  }

  /**
   * POST /auth/refresh
   * Làm mới access token bằng refresh token (không cần auth)
   */
  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refresh(@Body() dto: RefreshTokenDto, @Req() req: Request) {
    const userAgent = req.headers['user-agent'];
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.ip;
    return this.authService.refresh(dto, userAgent, ipAddress);
  }

  /**
   * POST /auth/logout
   * Đăng xuất (thu hồi tokens, blacklist access token)
   */
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout(
    @Req() req: Request,
    @Body('refreshToken') refreshToken?: string,
  ) {
    const accessToken = (req.headers.authorization || '').replace('Bearer ', '').trim();
    return this.authService.logout(accessToken, refreshToken);
  }

  /**
   * GET /auth/me
   * Lấy thông tin tài khoản hiện tại
   */
  @Get('me')
  async me(@CurrentUser() user: CurrentUserPayload) {
    return this.authService.getProfile(user.id);
  }

  /**
   * POST /auth/change-password
   * Đổi mật khẩu tài khoản hiện tại
   */
  @HttpCode(HttpStatus.OK)
  @Post('change-password')
  async changePassword(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(user.id, dto);
  }
}

