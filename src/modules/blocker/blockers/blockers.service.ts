import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { CreateBlockerDto, QueryBlockerDto, ResolveBlockerDto, UpdateBlockerDto } from './dto';

@Injectable()
export class BlockersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateBlockerDto) {
    const projectId = BigInt(dto.projectId);
    const reporterId = BigInt(dto.reporterId);

    // Verify Project
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, isDeleted: false },
    });
    if (!project) {
      throw new NotFoundException(`Dự án ID ${dto.projectId} không tồn tại`);
    }

    // Verify Reporter
    const reporter = await this.prisma.employee.findFirst({
      where: { id: reporterId, isDeleted: false },
    });
    if (!reporter) {
      throw new NotFoundException(`Người báo cáo (Employee ID ${dto.reporterId}) không tồn tại`);
    }

    const blocker = await this.prisma.blocker.create({
      data: {
        projectId,
        taskId: dto.taskId ? BigInt(dto.taskId) : null,
        dailyReportItemId: dto.dailyReportItemId ? BigInt(dto.dailyReportItemId) : null,
        reporterId,
        title: dto.title,
        description: dto.description,
        severity: dto.severity,
        status: dto.status,
      },
      include: {
        project: { select: { id: true, code: true, name: true } },
        task: { select: { id: true, taskCode: true, title: true } },
        reporter: { select: { id: true, employeeCode: true, fullName: true, avatarUrl: true } },
      },
    });

    return this.serialize(blocker);
  }

  async findAll(query: QueryBlockerDto) {
    const {
      page = 1,
      limit = 10,
      search,
      projectId,
      taskId,
      reporterId,
      resolverId,
      severity,
      status,
    } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { solution: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (projectId) where.projectId = BigInt(projectId);
    if (taskId) where.taskId = BigInt(taskId);
    if (reporterId) where.reporterId = BigInt(reporterId);
    if (resolverId) where.resolverId = BigInt(resolverId);
    if (severity) where.severity = severity;
    if (status) where.status = status;

    const [total, blockers] = await Promise.all([
      this.prisma.blocker.count({ where }),
      this.prisma.blocker.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          project: { select: { id: true, code: true, name: true } },
          task: { select: { id: true, taskCode: true, title: true } },
          reporter: { select: { id: true, employeeCode: true, fullName: true, avatarUrl: true } },
          resolver: { select: { id: true, employeeCode: true, fullName: true, avatarUrl: true } },
        },
      }),
    ]);

    return {
      data: blockers.map((b) => this.serialize(b)),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const blocker = await this.prisma.blocker.findUnique({
      where: { id: BigInt(id) },
      include: {
        project: { select: { id: true, code: true, name: true } },
        task: { select: { id: true, taskCode: true, title: true } },
        dailyReportItem: { select: { id: true, workDone: true, workingHours: true } },
        reporter: { select: { id: true, employeeCode: true, fullName: true, email: true, avatarUrl: true } },
        resolver: { select: { id: true, employeeCode: true, fullName: true, email: true, avatarUrl: true } },
      },
    });

    if (!blocker) {
      throw new NotFoundException(`Không tìm thấy vấn đề (Blocker) với ID: ${id}`);
    }

    return this.serialize(blocker);
  }

  async update(id: string, dto: UpdateBlockerDto) {
    await this.findOne(id);

    const updated = await this.prisma.blocker.update({
      where: { id: BigInt(id) },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.description && { description: dto.description }),
        ...(dto.severity && { severity: dto.severity }),
        ...(dto.status && { status: dto.status }),
        ...(dto.resolverId !== undefined && {
          resolverId: dto.resolverId ? BigInt(dto.resolverId) : null,
        }),
        ...(dto.solution !== undefined && { solution: dto.solution }),
        ...(dto.resolvedAt !== undefined && { resolvedAt: dto.resolvedAt }),
      },
      include: {
        project: { select: { id: true, code: true, name: true } },
        task: { select: { id: true, taskCode: true, title: true } },
        reporter: { select: { id: true, employeeCode: true, fullName: true, avatarUrl: true } },
        resolver: { select: { id: true, employeeCode: true, fullName: true, avatarUrl: true } },
      },
    });

    return this.serialize(updated);
  }

  async resolve(id: string, dto: ResolveBlockerDto) {
    await this.findOne(id);

    const resolverId = BigInt(dto.resolverId);
    const resolver = await this.prisma.employee.findFirst({
      where: { id: resolverId, isDeleted: false },
    });
    if (!resolver) {
      throw new NotFoundException(`Người giải quyết (Employee ID ${dto.resolverId}) không tồn tại`);
    }

    const updated = await this.prisma.blocker.update({
      where: { id: BigInt(id) },
      data: {
        resolverId,
        solution: dto.solution,
        status: 'RESOLVED',
        resolvedAt: new Date(),
      },
      include: {
        project: { select: { id: true, code: true, name: true } },
        task: { select: { id: true, taskCode: true, title: true } },
        reporter: { select: { id: true, employeeCode: true, fullName: true, avatarUrl: true } },
        resolver: { select: { id: true, employeeCode: true, fullName: true, avatarUrl: true } },
      },
    });

    return this.serialize(updated);
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.blocker.delete({
      where: { id: BigInt(id) },
    });

    return { message: `Vấn đề Blocker ID ${id} đã được xóa thành công` };
  }

  private serialize(b: any): any {
    if (!b) return null;
    return {
      ...b,
      id: b.id?.toString(),
      projectId: b.projectId?.toString(),
      taskId: b.taskId?.toString() ?? null,
      dailyReportItemId: b.dailyReportItemId?.toString() ?? null,
      reporterId: b.reporterId?.toString(),
      resolverId: b.resolverId?.toString() ?? null,
      project: b.project ? { ...b.project, id: b.project.id?.toString() } : null,
      task: b.task ? { ...b.task, id: b.task.id?.toString() } : null,
      dailyReportItem: b.dailyReportItem ? { ...b.dailyReportItem, id: b.dailyReportItem.id?.toString() } : null,
      reporter: b.reporter ? { ...b.reporter, id: b.reporter.id?.toString() } : null,
      resolver: b.resolver ? { ...b.resolver, id: b.resolver.id?.toString() } : null,
    };
  }
}

