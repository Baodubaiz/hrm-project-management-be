import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import { Roles } from '../../../core/decorators/roles.decorator';
import { QueryRefreshTokenDto } from './dto';
import { RefreshTokensService } from './refresh-tokens.service';

@Roles('ADMIN')
@Controller('refresh-tokens')
export class RefreshTokensController {
  constructor(private readonly refreshTokensService: RefreshTokensService) {}

  /**
   * GET /refresh-tokens
   * Lấy danh sách tất cả refresh tokens (có lọc theo userId, status)
   */
  @Get()
  async findAll(@Query() query: QueryRefreshTokenDto) {
    return this.refreshTokensService.findAll(query);
  }

  /**
   * GET /refresh-tokens/:id
   * Lấy chi tiết một refresh token theo ID
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.refreshTokensService.findOne(id);
  }

  /**
   * PATCH /refresh-tokens/:id/revoke
   * Thu hồi một refresh token (vô hiệu hoá session đó)
   */
  @HttpCode(HttpStatus.OK)
  @Patch(':id/revoke')
  async revoke(@Param('id') id: string) {
    return this.refreshTokensService.revoke(id);
  }

  /**
   * PATCH /refresh-tokens/revoke-all/:userId
   * Thu hồi tất cả refresh tokens của một user (force logout all devices)
   */
  @HttpCode(HttpStatus.OK)
  @Patch('revoke-all/:userId')
  async revokeAllByUser(@Param('userId') userId: string) {
    return this.refreshTokensService.revokeAllByUser(userId);
  }

  /**
   * DELETE /refresh-tokens/:id
   * Xóa vĩnh viễn một refresh token
   */
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.refreshTokensService.remove(id);
  }

  /**
   * DELETE /refresh-tokens/cleanup
   * Dọn dẹp toàn bộ token hết hạn hoặc đã thu hồi
   */
  @HttpCode(HttpStatus.OK)
  @Delete('cleanup')
  async cleanup() {
    return this.refreshTokensService.cleanup();
  }
}

