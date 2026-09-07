import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { CreateProjectDto, QueryProjectDto, UpdateProjectDto } from './dto';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProjectDto) {
    const existing = await this.prisma.project.findUnique({
      where: { code: dto.code },
    });

    if (existing) {
      throw new ConflictException(`Mã dự án '${dto.code}' đã tồn tại trong hệ thống`);
    }

    // Verify PM exists
    const pm = await this.prisma.employee.findFirst({
      where: { id: BigInt(dto.pmId), isDeleted: false },
    });
    if (!pm) {
      throw new NotFoundException(`Không tìm thấy Project Manager với Employee ID: ${dto.pmId}`);
    }

    const project = await this.prisma.project.create({
      data: {
        code: dto.code,
        name: dto.name,
        description: dto.description,
        customerName: dto.customerName,
        pmId: BigInt(dto.pmId),
        startDate: dto.startDate,
        expectedEndDate: dto.expectedEndDate,
        priority: dto.priority,
        status: dto.status,
      },
      include: {
        projectManager: {
          select: { id: true, employeeCode: true, fullName: true, email: true, avatarUrl: true },
        },
      },
    });

    return this.serialize(project);
  }

  async findAll(query: QueryProjectDto) {
    const { page = 1, limit = 10, search, pmId, priority, status } = query;
    const skip = (page - 1) * limit;

    const where: any = { isDeleted: false };
    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (pmId) where.pmId = BigInt(pmId);
    if (priority) where.priority = priority;
    if (status) where.status = status;

    const [total, projects] = await Promise.all([
      this.prisma.project.count({ where }),
      this.prisma.project.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          projectManager: {
            select: { id: true, employeeCode: true, fullName: true, email: true, avatarUrl: true },
          },
          _count: {
            select: { members: true, milestones: true, tasks: true, blockers: true },
          },
        },
      }),
    ]);

    return {
      data: projects.map((p) => this.serialize(p)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: BigInt(id), isDeleted: false },
      include: {
        projectManager: {
          select: { id: true, employeeCode: true, fullName: true, email: true, avatarUrl: true, phone: true },
        },
        members: {
          where: { status: 'ACTIVE' },
          include: {
            employee: {
              select: {
                id: true,
                employeeCode: true,
                fullName: true,
                email: true,
                avatarUrl: true,
                position: { select: { id: true, name: true } },
              },
            },
          },
        },
        milestones: {
          where: { isDeleted: false },
          orderBy: { dueDate: 'asc' },
        },
        _count: {
          select: { tasks: true, blockers: true },
        },
      },
    });

    if (!project) {
      throw new NotFoundException(`Không tìm thấy dự án với ID: ${id}`);
    }

    return this.serialize(project);
  }

  async update(id: string, dto: UpdateProjectDto) {
    await this.findOne(id);

    if (dto.code) {
      const existing = await this.prisma.project.findFirst({
        where: {
          code: dto.code,
          id: { not: BigInt(id) },
        },
      });
      if (existing) {
        throw new ConflictException(`Mã dự án '${dto.code}' đã được sử dụng`);
      }
    }

    if (dto.pmId) {
      const pm = await this.prisma.employee.findFirst({
        where: { id: BigInt(dto.pmId), isDeleted: false },
      });
      if (!pm) {
        throw new NotFoundException(`Không tìm thấy PM với Employee ID: ${dto.pmId}`);
      }
    }

    const updated = await this.prisma.project.update({
      where: { id: BigInt(id) },
      data: {
        ...(dto.code && { code: dto.code }),
        ...(dto.name && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.customerName !== undefined && { customerName: dto.customerName }),
        ...(dto.pmId && { pmId: BigInt(dto.pmId) }),
        ...(dto.startDate && { startDate: dto.startDate }),
        ...(dto.expectedEndDate && { expectedEndDate: dto.expectedEndDate }),
        ...(dto.actualEndDate !== undefined && { actualEndDate: dto.actualEndDate }),
        ...(dto.priority && { priority: dto.priority }),
        ...(dto.status && { status: dto.status }),
        ...(dto.overallProgress !== undefined && { overallProgress: dto.overallProgress }),
      },
      include: {
        projectManager: {
          select: { id: true, employeeCode: true, fullName: true, email: true, avatarUrl: true },
        },
      },
    });

    return this.serialize(updated);
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.project.update({
      where: { id: BigInt(id) },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    return { message: `Dự án ID ${id} đã được xóa mềm thành công` };
  }

  private serialize(project: any): any {
    if (!project) return null;
    return {
      ...project,
      id: project.id?.toString(),
      pmId: project.pmId?.toString(),
      memberCount: project._count?.members ?? project.members?.length ?? 0,
      milestoneCount: project._count?.milestones ?? project.milestones?.length ?? 0,
      taskCount: project._count?.tasks ?? 0,
      blockerCount: project._count?.blockers ?? 0,
      projectManager: project.projectManager
        ? { ...project.projectManager, id: project.projectManager.id?.toString() }
        : null,
      members: project.members?.map((m: any) => ({
        ...m,
        id: m.id?.toString(),
        projectId: m.projectId?.toString(),
        employeeId: m.employeeId?.toString(),
        employee: m.employee
          ? {
              ...m.employee,
              id: m.employee.id?.toString(),
              position: m.employee.position
                ? { ...m.employee.position, id: m.employee.position.id?.toString() }
                : null,
            }
          : null,
      })) ?? undefined,
      milestones: project.milestones?.map((ms: any) => ({
        ...ms,
        id: ms.id?.toString(),
        projectId: ms.projectId?.toString(),
      })) ?? undefined,
    };
  }
}

