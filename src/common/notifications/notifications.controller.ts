import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Roles } from '../../core/decorators/roles.decorator';
import { CreateNotificationDto, QueryNotificationDto } from './dto';
import { NotificationsService } from './notifications.service';

@Roles('ADMIN')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  async create(@Body() createDto: CreateNotificationDto) {
    return this.notificationsService.create(createDto);
  }

  @Get()
  async findAll(@Query() query: QueryNotificationDto) {
    return this.notificationsService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.notificationsService.findOne(id);
  }

  @HttpCode(HttpStatus.OK)
  @Patch(':id/read')
  async markAsRead(@Param('id') id: string) {
    return this.notificationsService.markAsRead(id);
  }

  @HttpCode(HttpStatus.OK)
  @Patch('read-all/recipient/:recipientId')
  async markAllAsRead(@Param('recipientId') recipientId: string) {
    return this.notificationsService.markAllAsRead(recipientId);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.notificationsService.remove(id);
  }
}

