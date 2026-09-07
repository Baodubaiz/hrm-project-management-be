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

import { CreateEmployeeDto, QueryEmployeeDto, UpdateEmployeeDto } from './dto';
import { EmployeesService } from './employees.service';

@Roles('ADMIN')
@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Post()
  async create(@Body() createEmployeeDto: CreateEmployeeDto) {
    return this.employeesService.create(createEmployeeDto);
  }

  @Get()
  async findAll(@Query() query: QueryEmployeeDto) {
    return this.employeesService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.employeesService.findOne(id);
  }

  @Get(':id/subordinates')
  async getSubordinates(@Param('id') id: string) {
    return this.employeesService.getSubordinates(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateEmployeeDto: UpdateEmployeeDto,
  ) {
    return this.employeesService.update(id, updateEmployeeDto);
  }

  @HttpCode(HttpStatus.OK)
  @Patch(':id/link-user')
  async linkUser(
    @Param('id') id: string,
    @Body('userId') userId: string | null,
  ) {
    return this.employeesService.linkUser(id, userId);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.employeesService.remove(id);
  }
}

