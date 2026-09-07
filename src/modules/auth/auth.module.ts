import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RefreshTokensController } from './refresh-tokens/refresh-tokens.controller';
import { RefreshTokensService } from './refresh-tokens/refresh-tokens.service';
import { UsersController } from './users/users.controller';
import { UsersService } from './users/users.service';

@Module({
  controllers: [
    AuthController,
    UsersController,
    RefreshTokensController,
  ],
  providers: [
    AuthService,
    UsersService,
    RefreshTokensService,
  ],
  exports: [AuthService, UsersService, RefreshTokensService],
})
export class AuthModule {}

