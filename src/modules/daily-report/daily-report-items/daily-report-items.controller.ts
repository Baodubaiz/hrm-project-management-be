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
import { CreateDailyReportItemDto, UpdateDailyReportItemDto } from './dto';
import { DailyReportItemsService } from './daily-report-items.service';

@Roles('ADMIN')
@Controller('daily-report-items')
export class DailyReportItemsController {
  constructor(
    private readonly dailyReportItemsService: DailyReportItemsService,
  ) {}

  @Post()
  async create(@Body() createDto: CreateDailyReportItemDto) {
    return this.dailyReportItemsService.create(createDto);
  }

  @Get('report/:reportId')
  async findByReport(@Param('reportId') reportId: string) {
    return this.dailyReportItemsService.findByReport(reportId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.dailyReportItemsService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateDailyReportItemDto,
  ) {
    return this.dailyReportItemsService.update(id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.dailyReportItemsService.remove(id);
  }
}
