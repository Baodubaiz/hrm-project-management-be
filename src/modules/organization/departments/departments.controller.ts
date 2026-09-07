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
import { Roles } from '../../../core/decorators/roles.decorator';

import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto, QueryDepartmentDto, UpdateDepartmentDto } from './dto';

@Roles('ADMIN')
@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Post()
  async create(@Body() createDepartmentDto: CreateDepartmentDto) {
    return this.departmentsService.create(createDepartmentDto);
  }

  @Get()
  async findAll(@Query() query: QueryDepartmentDto) {
    return this.departmentsService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.departmentsService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDepartmentDto: UpdateDepartmentDto,
  ) {
    return this.departmentsService.update(id, updateDepartmentDto);
  }

  @HttpCode(HttpStatus.OK)
  @Patch(':id/manager/:managerId')
  async assignManager(
    @Param('id') id: string,
    @Param('managerId') managerId: string,
  ) {
    return this.departmentsService.assignManager(id, managerId);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.departmentsService.remove(id);
  }
}

