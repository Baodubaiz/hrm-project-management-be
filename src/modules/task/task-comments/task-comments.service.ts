import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { CreateTaskCommentDto, UpdateTaskCommentDto } from './dto';

@Injectable()
export class TaskCommentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTaskCommentDto) {
    const taskId = BigInt(dto.taskId);
    const authorId = BigInt(dto.authorId);

    const task = await this.prisma.task.findFirst({
      where: { id: taskId, isDeleted: false },
    });
    if (!task) {
      throw new NotFoundException(`Task ID ${dto.taskId} không tồn tại`);
    }

    const author = await this.prisma.employee.findFirst({
      where: { id: authorId, isDeleted: false },
    });
    if (!author) {
      throw new NotFoundException(`Tác giả (Employee ID ${dto.authorId}) không tồn tại`);
    }

    const comment = await this.prisma.taskComment.create({
      data: { taskId, authorId, content: dto.content },
      include: {
        author: {
          select: { id: true, employeeCode: true, fullName: true, avatarUrl: true },
        },
      },
    });

    // Log activity
    await this.prisma.taskActivity.create({
      data: {
        taskId,
        actorId: authorId,
        actionType: 'COMMENT_ADDED',
        newValue: `Bình luận: "${dto.content.substring(0, 50)}${dto.content.length > 50 ? '...' : ''}"`,
      },
    });

    return this.serialize(comment);
  }

  async findByTask(taskId: string) {
    const comments = await this.prisma.taskComment.findMany({
      where: { taskId: BigInt(taskId) },
      orderBy: { createdAt: 'asc' },
      include: {
        author: {
          select: { id: true, employeeCode: true, fullName: true, avatarUrl: true },
        },
      },
    });

    return comments.map((c) => this.serialize(c));
  }

  async findOne(id: string) {
    const comment = await this.prisma.taskComment.findUnique({
      where: { id: BigInt(id) },
      include: {
        author: {
          select: { id: true, employeeCode: true, fullName: true, avatarUrl: true },
        },
      },
    });

    if (!comment) {
      throw new NotFoundException(`Không tìm thấy bình luận với ID: ${id}`);
    }

    return this.serialize(comment);
  }

  async update(id: string, dto: UpdateTaskCommentDto) {
    await this.findOne(id);

    const updated = await this.prisma.taskComment.update({
      where: { id: BigInt(id) },
      data: { content: dto.content },
      include: {
        author: {
          select: { id: true, employeeCode: true, fullName: true, avatarUrl: true },
        },
      },
    });

    return this.serialize(updated);
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.taskComment.delete({ where: { id: BigInt(id) } });

    return { message: `Bình luận ID ${id} đã được xóa thành công` };
  }

  private serialize(c: any): any {
    if (!c) return null;
    return {
      ...c,
      id: c.id?.toString(),
      taskId: c.taskId?.toString(),
      authorId: c.authorId?.toString(),
      author: c.author ? { ...c.author, id: c.author.id?.toString() } : null,
    };
  }
}
