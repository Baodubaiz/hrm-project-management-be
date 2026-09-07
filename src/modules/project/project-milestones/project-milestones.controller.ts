import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Roles } from '../../../core/decorators/roles.decorator';
import { CreateProjectMilestoneDto, QueryProjectMilestoneDto, UpdateProjectMilestoneDto } from './dto';
import { ProjectMilestonesService } from './project-milestones.service';

@Roles('ADMIN')
@Controller('project-milestones')
export class ProjectMilestonesController {
  constructor(
    private readonly projectMilestonesService: ProjectMilestonesService,
  ) {}

  @Post()
  async create(@Body() createDto: CreateProjectMilestoneDto) {
    return this.projectMilestonesService.create(createDto);
  }

  @Get()
  async findAll(@Query() query: QueryProjectMilestoneDto) {
    return this.projectMilestonesService.findAll(query);
  }

  @Get('project/:projectId')
  async findByProject(@Param('projectId') projectId: string) {
    return this.projectMilestonesService.findByProject(projectId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.projectMilestonesService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateProjectMilestoneDto,
  ) {
    return this.projectMilestonesService.update(id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.projectMilestonesService.remove(id);
  }
}

