import { Controller, Get, Query } from '@nestjs/common';
import { Roles } from '../../core/decorators/roles.decorator';
import { DashboardService } from './dashboard.service';
import { DashboardQueryDto } from './dto';

@Roles('ADMIN')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * GET /dashboard/overview
   * Tổng quan thống kê hệ thống (tổng nhân viên, dự án, tasks, blockers)
   */
  @Get('overview')
  async getSummaryOverview() {
    return this.dashboardService.getSummaryOverview();
  }

  /**
   * GET /dashboard/projects
   * Thống kê chi tiết dự án (theo trạng thái, độ ưu tiên, top dự án tiến độ tốt)
   */
  @Get('projects')
  async getProjectStatistics() {
    return this.dashboardService.getProjectStatistics();
  }

  /**
   * GET /dashboard/tasks
   * Thống kê công việc (theo trạng thái, độ ưu tiên, danh sách công việc trễ hạn)
   */
  @Get('tasks')
  async getTaskStatistics() {
    return this.dashboardService.getTaskStatistics();
  }

  /**
   * GET /dashboard/workload
   * Thống kê tải công việc nhân viên (số công việc đang làm, tổng giờ ước tính vs thực tế)
   */
  @Get('workload')
  async getEmployeeWorkload() {
    return this.dashboardService.getEmployeeWorkload();
  }

  /**
   * GET /dashboard/blockers
   * Thống kê các cản trở/vấn đề (theo mức độ nghiêm trọng, danh sách blocker mở)
   */
  @Get('blockers')
  async getBlockerStatistics() {
    return this.dashboardService.getBlockerStatistics();
  }

  /**
   * GET /dashboard/daily-reports
   * Thống kê báo cáo ngày (tỷ lệ nộp, trạng thái báo cáo)
   */
  @Get('daily-reports')
  async getDailyReportStatistics(@Query() query: DashboardQueryDto) {
    return this.dashboardService.getDailyReportStatistics(query);
  }
}

