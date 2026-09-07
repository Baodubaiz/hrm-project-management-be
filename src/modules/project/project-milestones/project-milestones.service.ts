import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { CreateProjectMilestoneDto, QueryProjectMilestoneDto, UpdateProjectMilestoneDto } from './dto';

@Injectable()
export class ProjectMilestonesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProjectMilestoneDto) {
    const pId = BigInt(dto.projectId);

    // Verify Project
    const project = await this.prisma.project.findFirst({
      where: { id: pId, isDeleted: false },
    });
    if (!project) {
      throw new NotFoundException(`Dự án ID ${dto.projectId} không tồn tại`);
    }

    const milestone = await this.prisma.projectMilestone.create({
      data: {
        projectId: pId,
        name: dto.name,
        description: dto.description,
        startDate: dto.startDate,
        dueDate: dto.dueDate,
        status: dto.status,
        progress: dto.progress ?? 0,
      },
      include: {
        project: { select: { id: true, code: true, name: true } },
      },
    });

    return this.serialize(milestone);
  }

  async findAll(query: QueryProjectMilestoneDto) {
    const { page = 1, limit = 10, search, projectId, status } = query;
    const skip = (page - 1) * limit;

    const where: any = { isDeleted: false };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (projectId) where.projectId = BigInt(projectId);
    if (status) where.status = status;

    const [total, milestones] = await Promise.all([
      this.prisma.projectMilestone.count({ where }),
      this.prisma.projectMilestone.findMany({
        where,
        skip,
        take: limit,
        orderBy: { dueDate: 'asc' },
        include: {
          project: { select: { id: true, code: true, name: true } },
          _count: {
            select: { tasks: true },
          },
        },
      }),
    ]);

    return {
      data: milestones.map((ms) => this.serialize(ms)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const milestone = await this.prisma.projectMilestone.findFirst({
      where: { id: BigInt(id), isDeleted: false },
      include: {
        project: { select: { id: true, code: true, name: true } },
        tasks: {
          where: { isDeleted: false },
          select: {
            id: true,
            taskCode: true,
            title: true,
            status: true,
            priority: true,
            progress: true,
            assignee: { select: { id: true, fullName: true } },
          },
        },
      },
    });

    if (!milestone) {
      throw new NotFoundException(`Không tìm thấy cột mốc dự án với ID: ${id}`);
    }

    return this.serialize(milestone);
  }

  async update(id: string, dto: UpdateProjectMilestoneDto) {
    await this.findOne(id);

    const updated = await this.prisma.projectMilestone.update({
      where: { id: BigInt(id) },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.startDate && { startDate: dto.startDate }),
        ...(dto.dueDate && { dueDate: dto.dueDate }),
        ...(dto.status && { status: dto.status }),
        ...(dto.progress !== undefined && { progress: dto.progress }),
      },
      include: {
        project: { select: { id: true, code: true, name: true } },
      },
    });

    return this.serialize(updated);
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.projectMilestone.update({
      where: { id: BigInt(id) },
      data: { isDeleted: true },
    });

    return { message: `Cột mốc dự án ID ${id} đã được xóa mềm thành công` };
  }

  async findByProject(projectId: string) {
    const milestones = await this.prisma.projectMilestone.findMany({
      where: { projectId: BigInt(projectId), isDeleted: false },
      orderBy: { dueDate: 'asc' },
      include: {
        _count: { select: { tasks: true } },
      },
    });

    return milestones.map((ms) => this.serialize(ms));
  }

  private serialize(ms: any): any {
    if (!ms) return null;
    return {
      ...ms,
      id: ms.id?.toString(),
      projectId: ms.projectId?.toString(),
      taskCount: ms._count?.tasks ?? ms.tasks?.length ?? 0,
      project: ms.project ? { ...ms.project, id: ms.project.id?.toString() } : null,
      tasks: ms.tasks?.map((t: any) => ({
        ...t,
        id: t.id?.toString(),
        assignee: t.assignee ? { ...t.assignee, id: t.assignee.id?.toString() } : null,
      })) ?? undefined,
    };
  }
}

