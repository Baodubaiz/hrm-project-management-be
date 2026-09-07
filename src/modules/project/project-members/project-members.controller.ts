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
import { AddProjectMemberDto, QueryProjectMemberDto, UpdateProjectMemberDto } from './dto';
import { ProjectMembersService } from './project-members.service';

@Roles('ADMIN')
@Controller('project-members')
export class ProjectMembersController {
  constructor(
    private readonly projectMembersService: ProjectMembersService,
  ) {}

  @Post()
  async addMember(@Body() addProjectMemberDto: AddProjectMemberDto) {
    return this.projectMembersService.addMember(addProjectMemberDto);
  }

  @Get()
  async findAll(@Query() query: QueryProjectMemberDto) {
    return this.projectMembersService.findAll(query);
  }

  @Get('project/:projectId')
  async getMembersByProject(@Param('projectId') projectId: string) {
    return this.projectMembersService.getMembersByProject(projectId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.projectMembersService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateProjectMemberDto: UpdateProjectMemberDto,
  ) {
    return this.projectMembersService.update(id, updateProjectMemberDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.projectMembersService.remove(id);
  }
}

