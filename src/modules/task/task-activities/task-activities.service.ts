import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { QueryTaskActivityDto } from './dto';

@Injectable()
export class TaskActivitiesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryTaskActivityDto) {
    const { page = 1, limit = 20, taskId, actorId, actionType } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (taskId) where.taskId = BigInt(taskId);
    if (actorId) where.actorId = BigInt(actorId);
    if (actionType) where.actionType = actionType;

    const [total, activities] = await Promise.all([
      this.prisma.taskActivity.count({ where }),
      this.prisma.taskActivity.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          actor: {
            select: { id: true, employeeCode: true, fullName: true, avatarUrl: true },
          },
          task: {
            select: { id: true, taskCode: true, title: true },
          },
        },
      }),
    ]);

    return {
      data: activities.map((a) => this.serialize(a)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findByTask(taskId: string) {
    const task = await this.prisma.task.findFirst({
      where: { id: BigInt(taskId), isDeleted: false },
    });

    if (!task) {
      throw new NotFoundException(`Task ID ${taskId} không tồn tại`);
    }

    const activities = await this.prisma.taskActivity.findMany({
      where: { taskId: BigInt(taskId) },
      orderBy: { createdAt: 'desc' },
      include: {
        actor: {
          select: { id: true, employeeCode: true, fullName: true, avatarUrl: true },
        },
      },
    });

    return activities.map((a) => this.serialize(a));
  }

  async findOne(id: string) {
    const activity = await this.prisma.taskActivity.findUnique({
      where: { id: BigInt(id) },
      include: {
        actor: {
          select: { id: true, employeeCode: true, fullName: true, avatarUrl: true },
        },
        task: {
          select: { id: true, taskCode: true, title: true },
        },
      },
    });

    if (!activity) {
      throw new NotFoundException(`Không tìm thấy hoạt động với ID: ${id}`);
    }

    return this.serialize(activity);
  }

  // Hard delete old activity logs (cleanup utility for admins)
  async cleanupByTask(taskId: string) {
    const result = await this.prisma.taskActivity.deleteMany({
      where: { taskId: BigInt(taskId) },
    });

    return {
      message: `Đã xóa ${result.count} bản ghi hoạt động của Task ID ${taskId}`,
      deletedCount: result.count,
    };
  }

  private serialize(a: any): any {
    if (!a) return null;
    return {
      ...a,
      id: a.id?.toString(),
      taskId: a.taskId?.toString(),
      actorId: a.actorId?.toString(),
      actor: a.actor ? { ...a.actor, id: a.actor.id?.toString() } : null,
      task: a.task ? { ...a.task, id: a.task.id?.toString() } : null,
    };
  }
}

