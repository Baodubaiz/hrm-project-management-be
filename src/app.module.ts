import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuditLogModule } from './common/audit-log/audit-log.module';
import { NotificationsModule } from './common/notifications/notifications.module';
import { CoreConfigModule } from './core/config/core-config.module';
import { PrismaModule } from './core/database/prisma.module';
import { JwtAuthGuard } from './core/guards/jwt-auth.guard';
import { RedisModule } from './core/redis/redis.module';
import { AuthModule } from './modules/auth/auth.module';
import { BlockerModule } from './modules/blocker/blocker.module';
import { DailyReportModule } from './modules/daily-report/daily-report.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { EmployeeModule } from './modules/employee/employee.module';
import { OrganizationModule } from './modules/organization/organization.module';
import { ProjectModule } from './modules/project/project.module';
import { RbacModule } from './modules/rbac/rbac.module';
import { TaskModule } from './modules/task/task.module';

@Module({
  imports: [
    CoreConfigModule,
    PrismaModule,
    RedisModule,
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.accessSecret') || 'default_secret',
        signOptions: {
          expiresIn: (configService.get<string>('jwt.accessExpiration') || '15m') as any,
        },
      }),
    }),

    // Cross-cutting modules
    NotificationsModule,
    AuditLogModule,

    // Domain Business modules
    AuthModule,
    RbacModule,
    OrganizationModule,
    EmployeeModule,
    ProjectModule,
    TaskModule,
    DailyReportModule,
    BlockerModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
