import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { CreateTaskDto, QueryTaskDto, UpdateTaskDto } from './dto';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTaskDto) {
    const existing = await this.prisma.task.findUnique({
      where: { taskCode: dto.taskCode },
    });

    if (existing) {
      throw new ConflictException(`Task code '${dto.taskCode}' đã tồn tại trong hệ thống`);
    }

    // Verify Project
    const project = await this.prisma.project.findFirst({
      where: { id: BigInt(dto.projectId), isDeleted: false },
    });
    if (!project) {
      throw new NotFoundException(`Dự án ID ${dto.projectId} không tồn tại`);
    }

    // Verify Reporter
    const reporter = await this.prisma.employee.findFirst({
      where: { id: BigInt(dto.reporterId), isDeleted: false },
    });
    if (!reporter) {
      throw new NotFoundException(`Reporter (Employee ID ${dto.reporterId}) không tồn tại`);
    }

    // Verify Assignee if provided
    if (dto.assigneeId) {
      const assignee = await this.prisma.employee.findFirst({
        where: { id: BigInt(dto.assigneeId), isDeleted: false },
      });
      if (!assignee) {
        throw new NotFoundException(`Assignee (Employee ID ${dto.assigneeId}) không tồn tại`);
      }
    }

    const task = await this.prisma.task.create({
      data: {
        taskCode: dto.taskCode,
        title: dto.title,
        description: dto.description,
        projectId: BigInt(dto.projectId),
        milestoneId: dto.milestoneId ? BigInt(dto.milestoneId) : null,
        assigneeId: dto.assigneeId ? BigInt(dto.assigneeId) : null,
        reporterId: BigInt(dto.reporterId),
        priority: dto.priority,
        status: dto.status,
        startDate: dto.startDate,
        dueDate: dto.dueDate,
        estimateHours: dto.estimateHours ?? 0,
      },
      include: {
        project: { select: { id: true, code: true, name: true } },
        assignee: { select: { id: true, employeeCode: true, fullName: true, avatarUrl: true } },
        reporter: { select: { id: true, employeeCode: true, fullName: true, avatarUrl: true } },
        milestone: { select: { id: true, name: true } },
      },
    });

    // Record initial activity log
    await this.prisma.taskActivity.create({
      data: {
        taskId: task.id,
        actorId: BigInt(dto.reporterId),
        actionType: 'CREATED',
        newValue: `Tạo công việc '${task.title}'`,
      },
    });

    return this.serialize(task);
  }

  async findAll(query: QueryTaskDto) {
    const {
      page = 1,
      limit = 10,
      search,
      projectId,
      milestoneId,
      assigneeId,
      reporterId,
      priority,
      status,
    } = query;
    const skip = (page - 1) * limit;

    const where: any = { isDeleted: false };
    if (search) {
      where.OR = [
        { taskCode: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (projectId) where.projectId = BigInt(projectId);
    if (milestoneId) where.milestoneId = BigInt(milestoneId);
    if (assigneeId) where.assigneeId = BigInt(assigneeId);
    if (reporterId) where.reporterId = BigInt(reporterId);
    if (priority) where.priority = priority;
    if (status) where.status = status;

    const [total, tasks] = await Promise.all([
      this.prisma.task.count({ where }),
      this.prisma.task.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          project: { select: { id: true, code: true, name: true } },
          assignee: { select: { id: true, employeeCode: true, fullName: true, avatarUrl: true } },
          reporter: { select: { id: true, employeeCode: true, fullName: true, avatarUrl: true } },
          milestone: { select: { id: true, name: true } },
          _count: { select: { comments: true, blockers: true } },
        },
      }),
    ]);

    return {
      data: tasks.map((t) => this.serialize(t)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const task = await this.prisma.task.findFirst({
      where: { id: BigInt(id), isDeleted: false },
      include: {
        project: { select: { id: true, code: true, name: true } },
        milestone: { select: { id: true, name: true, dueDate: true } },
        assignee: {
          select: { id: true, employeeCode: true, fullName: true, email: true, avatarUrl: true },
        },
        reporter: {
          select: { id: true, employeeCode: true, fullName: true, email: true, avatarUrl: true },
        },
        comments: {
          orderBy: { createdAt: 'asc' },
          include: {
            author: { select: { id: true, employeeCode: true, fullName: true, avatarUrl: true } },
          },
        },
        activities: {
          orderBy: { createdAt: 'desc' },
          include: {
            actor: { select: { id: true, employeeCode: true, fullName: true, avatarUrl: true } },
          },
        },
        _count: { select: { blockers: true } },
      },
    });

    if (!task) {
      throw new NotFoundException(`Không tìm thấy Task với ID: ${id}`);
    }

    return this.serialize(task);
  }

  async update(id: string, dto: UpdateTaskDto) {
    const current = await this.prisma.task.findFirst({
      where: { id: BigInt(id), isDeleted: false },
    });

    if (!current) {
      throw new NotFoundException(`Không tìm thấy Task với ID: ${id}`);
    }

    const taskId = current.id;
    const actorId = dto.actorId ? BigInt(dto.actorId) : current.reporterId;

    // Track activities for important changes
    const activityLogs: any[] = [];

    if (dto.status && dto.status !== current.status) {
      activityLogs.push({
        taskId,
        actorId,
        actionType: 'STATUS_CHANGED',
        fieldChanged: 'status',
        oldValue: current.status,
        newValue: dto.status,
      });
    }

    if (dto.assigneeId !== undefined) {
      const newAssigneeId = dto.assigneeId ? BigInt(dto.assigneeId) : null;
      if (newAssigneeId !== current.assigneeId) {
        activityLogs.push({
          taskId,
          actorId,
          actionType: 'ASSIGNEE_CHANGED',
          fieldChanged: 'assigneeId',
          oldValue: current.assigneeId?.toString() ?? 'None',
          newValue: dto.assigneeId ?? 'None',
        });
      }
    }

    if (dto.priority && dto.priority !== current.priority) {
      activityLogs.push({
        taskId,
        actorId,
        actionType: 'PRIORITY_CHANGED',
        fieldChanged: 'priority',
        oldValue: current.priority,
        newValue: dto.priority,
      });
    }

    const updated = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.milestoneId !== undefined && {
          milestoneId: dto.milestoneId ? BigInt(dto.milestoneId) : null,
        }),
        ...(dto.assigneeId !== undefined && {
          assigneeId: dto.assigneeId ? BigInt(dto.assigneeId) : null,
        }),
        ...(dto.priority && { priority: dto.priority }),
        ...(dto.status && { status: dto.status }),
        ...(dto.startDate !== undefined && { startDate: dto.startDate }),
        ...(dto.dueDate !== undefined && { dueDate: dto.dueDate }),
        ...(dto.estimateHours !== undefined && { estimateHours: dto.estimateHours }),
        ...(dto.actualHours !== undefined && { actualHours: dto.actualHours }),
        ...(dto.progress !== undefined && { progress: dto.progress }),
      },
      include: {
        project: { select: { id: true, code: true, name: true } },
        assignee: { select: { id: true, employeeCode: true, fullName: true, avatarUrl: true } },
        reporter: { select: { id: true, employeeCode: true, fullName: true, avatarUrl: true } },
        milestone: { select: { id: true, name: true } },
      },
    });

    // Save recorded activities
    if (activityLogs.length > 0) {
      await this.prisma.taskActivity.createMany({
        data: activityLogs,
      });
    }

    return this.serialize(updated);
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.task.update({
      where: { id: BigInt(id) },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    return { message: `Task ID ${id} đã được xóa mềm thành công` };
  }

  private serialize(task: any): any {
    if (!task) return null;
    return {
      ...task,
      id: task.id?.toString(),
      projectId: task.projectId?.toString(),
      milestoneId: task.milestoneId?.toString() ?? null,
      assigneeId: task.assigneeId?.toString() ?? null,
      reporterId: task.reporterId?.toString(),
      estimateHours: task.estimateHours ? Number(task.estimateHours) : 0,
      actualHours: task.actualHours ? Number(task.actualHours) : 0,
      commentCount: task._count?.comments ?? task.comments?.length ?? 0,
      blockerCount: task._count?.blockers ?? 0,
      project: task.project ? { ...task.project, id: task.project.id?.toString() } : null,
      milestone: task.milestone ? { ...task.milestone, id: task.milestone.id?.toString() } : null,
      assignee: task.assignee ? { ...task.assignee, id: task.assignee.id?.toString() } : null,
      reporter: task.reporter ? { ...task.reporter, id: task.reporter.id?.toString() } : null,
      comments: task.comments?.map((c: any) => ({
        ...c,
        id: c.id?.toString(),
        taskId: c.taskId?.toString(),
        authorId: c.authorId?.toString(),
        author: c.author ? { ...c.author, id: c.author.id?.toString() } : null,
      })) ?? undefined,
      activities: task.activities?.map((act: any) => ({
        ...act,
        id: act.id?.toString(),
        taskId: act.taskId?.toString(),
        actorId: act.actorId?.toString(),
        actor: act.actor ? { ...act.actor, id: act.actor.id?.toString() } : null,
      })) ?? undefined,
    };
  }
}
