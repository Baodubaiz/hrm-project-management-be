import { Module } from '@nestjs/common';
import { TaskActivitiesController } from './task-activities/task-activities.controller';
import { TaskActivitiesService } from './task-activities/task-activities.service';
import { TaskCommentsController } from './task-comments/task-comments.controller';
import { TaskCommentsService } from './task-comments/task-comments.service';
import { TasksController } from './tasks/tasks.controller';
import { TasksService } from './tasks/tasks.service';

@Module({
  controllers: [
    TasksController,
    TaskCommentsController,
    TaskActivitiesController,
  ],
  providers: [
    TasksService,
    TaskCommentsService,
    TaskActivitiesService,
  ],
  exports: [
    TasksService,
    TaskCommentsService,
    TaskActivitiesService,
  ],
})
export class TaskModule {}

