import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { Roles } from '../../core/decorators/roles.decorator';
import { AuditLogService } from './audit-log.service';
import { CreateAuditLogDto, QueryAuditLogDto } from './dto';

@Roles('ADMIN')
@Controller('audit-logs')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Post()
  async logAction(@Body() createDto: CreateAuditLogDto) {
    return this.auditLogService.logAction(createDto);
  }

  @Get()
  async findAll(@Query() query: QueryAuditLogDto) {
    return this.auditLogService.findAll(query);
  }

  @Get('entity/:entityType/:entityId')
  async findByEntity(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
  ) {
    return this.auditLogService.findByEntity(entityType, entityId);
  }

  @Get('user/:userId')
  async findByUser(@Param('userId') userId: string) {
    return this.auditLogService.findByUser(userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.auditLogService.findOne(id);
  }
}

