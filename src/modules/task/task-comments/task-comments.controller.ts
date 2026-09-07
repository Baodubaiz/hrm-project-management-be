import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { Roles } from '../../../core/decorators/roles.decorator';
import { CreateTaskCommentDto, UpdateTaskCommentDto } from './dto';
import { TaskCommentsService } from './task-comments.service';

@Roles('ADMIN')
@Controller('task-comments')
export class TaskCommentsController {
  constructor(private readonly taskCommentsService: TaskCommentsService) {}

  @Post()
  async create(@Body() createDto: CreateTaskCommentDto) {
    return this.taskCommentsService.create(createDto);
  }

  @Get('task/:taskId')
  async findByTask(@Param('taskId') taskId: string) {
    return this.taskCommentsService.findByTask(taskId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.taskCommentsService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateTaskCommentDto,
  ) {
    return this.taskCommentsService.update(id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.taskCommentsService.remove(id);
  }
}
