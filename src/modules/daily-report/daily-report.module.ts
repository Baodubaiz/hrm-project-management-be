import { Module } from '@nestjs/common';
import { DailyReportItemsController } from './daily-report-items/daily-report-items.controller';
import { DailyReportItemsService } from './daily-report-items/daily-report-items.service';
import { DailyReportsController } from './daily-reports/daily-reports.controller';
import { DailyReportsService } from './daily-reports/daily-reports.service';

@Module({
  controllers: [DailyReportsController, DailyReportItemsController],
  providers: [DailyReportsService, DailyReportItemsService],
  exports: [DailyReportsService, DailyReportItemsService],
})
export class DailyReportModule {}
