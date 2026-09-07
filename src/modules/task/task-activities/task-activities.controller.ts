import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Query,
} from '@nestjs/common';
import { Roles } from '../../../core/decorators/roles.decorator';
import { QueryTaskActivityDto } from './dto';
import { TaskActivitiesService } from './task-activities.service';

@Roles('ADMIN')
@Controller('task-activities')
export class TaskActivitiesController {
  constructor(
    private readonly taskActivitiesService: TaskActivitiesService,
  ) {}

  @Get()
  async findAll(@Query() query: QueryTaskActivityDto) {
    return this.taskActivitiesService.findAll(query);
  }

  @Get('task/:taskId')
  async findByTask(@Param('taskId') taskId: string) {
    return this.taskActivitiesService.findByTask(taskId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.taskActivitiesService.findOne(id);
  }

  @HttpCode(HttpStatus.OK)
  @Delete('cleanup/task/:taskId')
  async cleanupByTask(@Param('taskId') taskId: string) {
    return this.taskActivitiesService.cleanupByTask(taskId);
  }
}

