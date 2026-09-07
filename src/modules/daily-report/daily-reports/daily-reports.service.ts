import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { CreateDailyReportDto, QueryDailyReportDto, UpdateDailyReportDto } from './dto';

@Injectable()
export class DailyReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDailyReportDto) {
    const empId = BigInt(dto.employeeId);

    const employee = await this.prisma.employee.findFirst({
      where: { id: empId, isDeleted: false },
    });
    if (!employee) {
      throw new NotFoundException(`Nhân viên ID ${dto.employeeId} không tồn tại`);
    }

    const existing = await this.prisma.dailyReport.findUnique({
      where: {
        employeeId_reportDate: { employeeId: empId, reportDate: dto.reportDate },
      },
    });
    if (existing) {
      throw new ConflictException('Đã tồn tại báo cáo cho nhân viên này trong ngày đã chọn');
    }

    const report = await this.prisma.dailyReport.create({
      data: {
        employeeId: empId,
        reportDate: dto.reportDate,
        submittedAt: dto.submittedAt,
        overallNote: dto.overallNote,
        tomorrowPlan: dto.tomorrowPlan,
        status: dto.status,
      },
      include: {
        employee: { select: { id: true, employeeCode: true, fullName: true, avatarUrl: true } },
        _count: { select: { items: true } },
      },
    });

    return this.serialize(report);
  }

  async findAll(query: QueryDailyReportDto) {
    const { page = 1, limit = 10, employeeId, status, fromDate, toDate } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (employeeId) where.employeeId = BigInt(employeeId);
    if (status) where.status = status;
    if (fromDate || toDate) {
      where.reportDate = {};
      if (fromDate) where.reportDate.gte = new Date(fromDate);
      if (toDate) where.reportDate.lte = new Date(toDate);
    }

    const [total, reports] = await Promise.all([
      this.prisma.dailyReport.count({ where }),
      this.prisma.dailyReport.findMany({
        where,
        skip,
        take: limit,
        orderBy: { reportDate: 'desc' },
        include: {
          employee: { select: { id: true, employeeCode: true, fullName: true, avatarUrl: true } },
          items: { select: { workingHours: true } },
          _count: { select: { items: true } },
        },
      }),
    ]);

    return {
      data: reports.map((r) => this.serialize(r)),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const report = await this.prisma.dailyReport.findUnique({
      where: { id: BigInt(id) },
      include: {
        employee: {
          select: { id: true, employeeCode: true, fullName: true, email: true, avatarUrl: true },
        },
        items: {
          include: {
            project: { select: { id: true, code: true, name: true } },
            task: { select: { id: true, taskCode: true, title: true } },
          },
        },
      },
    });

    if (!report) {
      throw new NotFoundException(`Không tìm thấy báo cáo với ID: ${id}`);
    }

    return this.serialize(report);
  }

  async update(id: string, dto: UpdateDailyReportDto) {
    await this.findOne(id);

    const updated = await this.prisma.dailyReport.update({
      where: { id: BigInt(id) },
      data: {
        ...(dto.reportDate && { reportDate: dto.reportDate }),
        ...(dto.submittedAt !== undefined && { submittedAt: dto.submittedAt }),
        ...(dto.overallNote !== undefined && { overallNote: dto.overallNote }),
        ...(dto.tomorrowPlan !== undefined && { tomorrowPlan: dto.tomorrowPlan }),
        ...(dto.status && { status: dto.status }),
      },
      include: {
        employee: { select: { id: true, employeeCode: true, fullName: true, avatarUrl: true } },
        _count: { select: { items: true } },
      },
    });

    return this.serialize(updated);
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.dailyReport.delete({
      where: { id: BigInt(id) },
    });

    return { message: `Báo cáo ID ${id} đã được xóa thành công` };
  }

  private serialize(r: any): any {
    if (!r) return null;
    const totalWorkingHours = r.items
      ? r.items.reduce((sum: number, item: any) => sum + Number(item.workingHours || 0), 0)
      : 0;

    return {
      ...r,
      id: r.id?.toString(),
      employeeId: r.employeeId?.toString(),
      totalWorkingHours,
      itemCount: r._count?.items ?? r.items?.length ?? 0,
      employee: r.employee ? { ...r.employee, id: r.employee.id?.toString() } : null,
      items: r.items?.map((item: any) => ({
        ...item,
        id: item.id?.toString(),
        dailyReportId: item.dailyReportId?.toString(),
        projectId: item.projectId?.toString(),
        taskId: item.taskId?.toString() ?? null,
        workingHours: item.workingHours ? Number(item.workingHours) : 0,
        project: item.project ? { ...item.project, id: item.project.id?.toString() } : null,
        task: item.task ? { ...item.task, id: item.task.id?.toString() } : null,
      })) ?? undefined,
    };
  }
}
