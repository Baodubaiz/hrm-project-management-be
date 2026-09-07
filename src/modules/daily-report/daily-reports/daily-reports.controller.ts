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
import { CreateDailyReportDto, QueryDailyReportDto, UpdateDailyReportDto } from './dto';
import { DailyReportsService } from './daily-reports.service';

@Roles('ADMIN')
@Controller('daily-reports')
export class DailyReportsController {
  constructor(private readonly dailyReportsService: DailyReportsService) {}

  @Post()
  async create(@Body() createDto: CreateDailyReportDto) {
    return this.dailyReportsService.create(createDto);
  }

  @Get()
  async findAll(@Query() query: QueryDailyReportDto) {
    return this.dailyReportsService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.dailyReportsService.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateDto: UpdateDailyReportDto) {
    return this.dailyReportsService.update(id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.dailyReportsService.remove(id);
  }
}
