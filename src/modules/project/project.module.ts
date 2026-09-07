import { Module } from '@nestjs/common';
import { ProjectMembersController } from './project-members/project-members.controller';
import { ProjectMembersService } from './project-members/project-members.service';
import { ProjectMilestonesController } from './project-milestones/project-milestones.controller';
import { ProjectMilestonesService } from './project-milestones/project-milestones.service';
import { ProjectsController } from './projects/projects.controller';
import { ProjectsService } from './projects/projects.service';

@Module({
  controllers: [
    ProjectsController,
    ProjectMembersController,
    ProjectMilestonesController,
  ],
  providers: [
    ProjectsService,
    ProjectMembersService,
    ProjectMilestonesService,
  ],
  exports: [
    ProjectsService,
    ProjectMembersService,
    ProjectMilestonesService,
  ],
})
export class ProjectModule {}

