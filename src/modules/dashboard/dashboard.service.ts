import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { DashboardQueryDto } from './dto';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── 1. OVERVIEW SUMMARY COUNTERS ───────────────────────────────────────────
  async getSummaryOverview() {
    const now = new Date();

    const [
      totalEmployees,
      activeEmployees,
      totalProjects,
      inProgressProjects,
      totalTasks,
      inProgressTasks,
      overdueTasks,
      openBlockers,
      criticalBlockers,
    ] = await Promise.all([
      this.prisma.employee.count({ where: { isDeleted: false } }),
      this.prisma.employee.count({ where: { isDeleted: false, status: 'ACTIVE' } }),
      this.prisma.project.count({ where: { isDeleted: false } }),
      this.prisma.project.count({ where: { isDeleted: false, status: 'IN_PROGRESS' } }),
      this.prisma.task.count({ where: { isDeleted: false } }),
      this.prisma.task.count({ where: { isDeleted: false, status: 'IN_PROGRESS' } }),
      this.prisma.task.count({
        where: {
          isDeleted: false,
          status: { not: 'DONE' },
          dueDate: { lt: now },
        },
      }),
      this.prisma.blocker.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
      this.prisma.blocker.count({
        where: { status: { in: ['OPEN', 'IN_PROGRESS'] }, severity: 'CRITICAL' },
      }),
    ]);

    return {
      employees: { total: totalEmployees, active: activeEmployees },
      projects: { total: totalProjects, inProgress: inProgressProjects },
      tasks: { total: totalTasks, inProgress: inProgressTasks, overdue: overdueTasks },
      blockers: { open: openBlockers, critical: criticalBlockers },
    };
  }

  // ─── 2. PROJECT STATISTICS ──────────────────────────────────────────────────
  async getProjectStatistics() {
    const [statusGroups, priorityGroups, topProjects] = await Promise.all([
      this.prisma.project.groupBy({
        by: ['status'],
        where: { isDeleted: false },
        _count: { _all: true },
      }),
      this.prisma.project.groupBy({
        by: ['priority'],
        where: { isDeleted: false },
        _count: { _all: true },
      }),
      this.prisma.project.findMany({
        where: { isDeleted: false },
        orderBy: { overallProgress: 'desc' },
        take: 5,
        select: {
          id: true,
          code: true,
          name: true,
          status: true,
          overallProgress: true,
          projectManager: { select: { id: true, fullName: true } },
        },
      }),
    ]);

    const byStatus = statusGroups.reduce((acc, curr) => {
      acc[curr.status] = curr._count._all;
      return acc;
    }, {} as Record<string, number>);

    const byPriority = priorityGroups.reduce((acc, curr) => {
      acc[curr.priority] = curr._count._all;
      return acc;
    }, {} as Record<string, number>);

    return {
      byStatus,
      byPriority,
      topProjects: topProjects.map((p) => ({
        ...p,
        id: p.id.toString(),
        projectManager: p.projectManager
          ? { ...p.projectManager, id: p.projectManager.id.toString() }
          : null,
      })),
    };
  }

  // ─── 3. TASK STATISTICS ─────────────────────────────────────────────────────
  async getTaskStatistics() {
    const now = new Date();

    const [statusGroups, priorityGroups, overdueList] = await Promise.all([
      this.prisma.task.groupBy({
        by: ['status'],
        where: { isDeleted: false },
        _count: { _all: true },
      }),
      this.prisma.task.groupBy({
        by: ['priority'],
        where: { isDeleted: false },
        _count: { _all: true },
      }),
      this.prisma.task.findMany({
        where: {
          isDeleted: false,
          status: { not: 'DONE' },
          dueDate: { lt: now },
        },
        orderBy: { dueDate: 'asc' },
        take: 10,
        select: {
          id: true,
          taskCode: true,
          title: true,
          status: true,
          priority: true,
          dueDate: true,
          project: { select: { id: true, code: true, name: true } },
          assignee: { select: { id: true, fullName: true, avatarUrl: true } },
        },
      }),
    ]);

    const byStatus = statusGroups.reduce((acc, curr) => {
      acc[curr.status] = curr._count._all;
      return acc;
    }, {} as Record<string, number>);

    const byPriority = priorityGroups.reduce((acc, curr) => {
      acc[curr.priority] = curr._count._all;
      return acc;
    }, {} as Record<string, number>);

    return {
      byStatus,
      byPriority,
      overdueTasks: overdueList.map((t) => ({
        ...t,
        id: t.id.toString(),
        project: t.project ? { ...t.project, id: t.project.id.toString() } : null,
        assignee: t.assignee ? { ...t.assignee, id: t.assignee.id.toString() } : null,
      })),
    };
  }

  // ─── 4. EMPLOYEE WORKLOAD ANALYTICS ─────────────────────────────────────────
  async getEmployeeWorkload() {
    const employees = await this.prisma.employee.findMany({
      where: { isDeleted: false, status: 'ACTIVE' },
      select: {
        id: true,
        employeeCode: true,
        fullName: true,
        avatarUrl: true,
        department: { select: { id: true, name: true } },
        position: { select: { id: true, name: true } },
        assignedTasks: {
          where: { isDeleted: false, status: { in: ['TODO', 'IN_PROGRESS', 'REVIEW'] } },
          select: { id: true, estimateHours: true, actualHours: true },
        },
      },
    });

    const workloadData = employees.map((emp) => {
      const activeTaskCount = emp.assignedTasks.length;
      const totalEstimateHours = emp.assignedTasks.reduce(
        (sum, t) => sum + Number(t.estimateHours || 0),
        0,
      );
      const totalActualHours = emp.assignedTasks.reduce(
        (sum, t) => sum + Number(t.actualHours || 0),
        0,
      );

      return {
        id: emp.id.toString(),
        employeeCode: emp.employeeCode,
        fullName: emp.fullName,
        avatarUrl: emp.avatarUrl,
        departmentName: emp.department?.name ?? null,
        positionName: emp.position?.name ?? null,
        activeTaskCount,
        totalEstimateHours,
        totalActualHours,
      };
    });

    // Sort by most active tasks
    workloadData.sort((a, b) => b.activeTaskCount - a.activeTaskCount);

    return workloadData;
  }

  // ─── 5. BLOCKER STATISTICS ──────────────────────────────────────────────────
  async getBlockerStatistics() {
    const [statusGroups, severityGroups, openList] = await Promise.all([
      this.prisma.blocker.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      this.prisma.blocker.groupBy({
        by: ['severity'],
        _count: { _all: true },
      }),
      this.prisma.blocker.findMany({
        where: { status: { in: ['OPEN', 'IN_PROGRESS'] } },
        orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }],
        take: 10,
        select: {
          id: true,
          title: true,
          severity: true,
          status: true,
          createdAt: true,
          project: { select: { id: true, code: true, name: true } },
          reporter: { select: { id: true, fullName: true } },
        },
      }),
    ]);

    const byStatus = statusGroups.reduce((acc, curr) => {
      acc[curr.status] = curr._count._all;
      return acc;
    }, {} as Record<string, number>);

    const bySeverity = severityGroups.reduce((acc, curr) => {
      acc[curr.severity] = curr._count._all;
      return acc;
    }, {} as Record<string, number>);

    return {
      byStatus,
      bySeverity,
      openBlockers: openList.map((b) => ({
        ...b,
        id: b.id.toString(),
        project: b.project ? { ...b.project, id: b.project.id.toString() } : null,
        reporter: b.reporter ? { ...b.reporter, id: b.reporter.id.toString() } : null,
      })),
    };
  }

  // ─── 6. DAILY REPORT STATISTICS ─────────────────────────────────────────────
  async getDailyReportStatistics(query: DashboardQueryDto) {
    const { fromDate, toDate } = query;

    const where: any = {};
    if (fromDate || toDate) {
      where.reportDate = {};
      if (fromDate) where.reportDate.gte = new Date(fromDate);
      if (toDate) where.reportDate.lte = new Date(toDate);
    }

    const [statusGroups, totalReports] = await Promise.all([
      this.prisma.dailyReport.groupBy({
        by: ['status'],
        where,
        _count: { _all: true },
      }),
      this.prisma.dailyReport.count({ where }),
    ]);

    const byStatus = statusGroups.reduce((acc, curr) => {
      acc[curr.status] = curr._count._all;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalReports,
      byStatus,
    };
  }
}

