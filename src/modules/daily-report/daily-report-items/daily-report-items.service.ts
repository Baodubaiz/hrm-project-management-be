import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { CreateDailyReportItemDto, UpdateDailyReportItemDto } from './dto';

@Injectable()
export class DailyReportItemsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDailyReportItemDto) {
    const reportId = BigInt(dto.dailyReportId);
    const projectId = BigInt(dto.projectId);

    const report = await this.prisma.dailyReport.findFirst({
      where: { id: reportId },
    });
    if (!report) {
      throw new NotFoundException(`Báo cáo ID ${dto.dailyReportId} không tồn tại`);
    }

    const project = await this.prisma.project.findFirst({
      where: { id: projectId, isDeleted: false },
    });
    if (!project) {
      throw new NotFoundException(`Dự án ID ${dto.projectId} không tồn tại`);
    }

    const item = await this.prisma.dailyReportItem.create({
      data: {
        dailyReportId: reportId,
        projectId,
        taskId: dto.taskId ? BigInt(dto.taskId) : null,
        workDone: dto.workDone,
        workResult: dto.workResult,
        progressBefore: dto.progressBefore ?? 0,
        progressAfter: dto.progressAfter ?? 0,
        workingHours: dto.workingHours,
        hasBlocker: dto.hasBlocker ?? false,
        blockerDescription: dto.blockerDescription,
      },
      include: {
        project: { select: { id: true, code: true, name: true } },
        task: { select: { id: true, taskCode: true, title: true } },
      },
    });

    return this.serialize(item);
  }

  async findByReport(reportId: string) {
    const items = await this.prisma.dailyReportItem.findMany({
      where: { dailyReportId: BigInt(reportId) },
      orderBy: { createdAt: 'asc' },
      include: {
        project: { select: { id: true, code: true, name: true } },
        task: { select: { id: true, taskCode: true, title: true } },
      },
    });

    return items.map((i) => this.serialize(i));
  }

  async findOne(id: string) {
    const item = await this.prisma.dailyReportItem.findUnique({
      where: { id: BigInt(id) },
      include: {
        project: { select: { id: true, code: true, name: true } },
        task: { select: { id: true, taskCode: true, title: true } },
      },
    });

    if (!item) {
      throw new NotFoundException(`Không tìm thấy mục báo cáo với ID: ${id}`);
    }

    return this.serialize(item);
  }

  async update(id: string, dto: UpdateDailyReportItemDto) {
    await this.findOne(id);

    const updated = await this.prisma.dailyReportItem.update({
      where: { id: BigInt(id) },
      data: {
        ...(dto.projectId && { projectId: BigInt(dto.projectId) }),
        ...(dto.taskId !== undefined && {
          taskId: dto.taskId ? BigInt(dto.taskId) : null,
        }),
        ...(dto.workDone && { workDone: dto.workDone }),
        ...(dto.workResult !== undefined && { workResult: dto.workResult }),
        ...(dto.progressBefore !== undefined && { progressBefore: dto.progressBefore }),
        ...(dto.progressAfter !== undefined && { progressAfter: dto.progressAfter }),
        ...(dto.workingHours !== undefined && { workingHours: dto.workingHours }),
        ...(dto.hasBlocker !== undefined && { hasBlocker: dto.hasBlocker }),
        ...(dto.blockerDescription !== undefined && { blockerDescription: dto.blockerDescription }),
      },
      include: {
        project: { select: { id: true, code: true, name: true } },
        task: { select: { id: true, taskCode: true, title: true } },
      },
    });

    return this.serialize(updated);
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.dailyReportItem.delete({ where: { id: BigInt(id) } });

    return { message: `Mục báo cáo ID ${id} đã được xóa thành công` };
  }

  private serialize(item: any): any {
    if (!item) return null;
    return {
      ...item,
      id: item.id?.toString(),
      dailyReportId: item.dailyReportId?.toString(),
      projectId: item.projectId?.toString(),
      taskId: item.taskId?.toString() ?? null,
      workingHours: item.workingHours ? Number(item.workingHours) : 0,
      project: item.project ? { ...item.project, id: item.project.id?.toString() } : null,
      task: item.task ? { ...item.task, id: item.task.id?.toString() } : null,
    };
  }
}
