import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { CreateNotificationDto, QueryNotificationDto } from './dto';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateNotificationDto) {
    const recipientId = BigInt(dto.recipientId);

    const recipient = await this.prisma.employee.findFirst({
      where: { id: recipientId, isDeleted: false },
    });
    if (!recipient) {
      throw new NotFoundException(`Người nhận (Employee ID ${dto.recipientId}) không tồn tại`);
    }

    const notification = await this.prisma.notification.create({
      data: {
        recipientId,
        type: dto.type,
        title: dto.title,
        content: dto.content,
        relatedEntityType: dto.relatedEntityType,
        relatedEntityId: dto.relatedEntityId ? BigInt(dto.relatedEntityId) : null,
      },
      include: {
        recipient: {
          select: { id: true, employeeCode: true, fullName: true, avatarUrl: true },
        },
      },
    });

    return this.serialize(notification);
  }

  async findAll(query: QueryNotificationDto) {
    const { page = 1, limit = 10, recipientId, type, isRead } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (recipientId) where.recipientId = BigInt(recipientId);
    if (type) where.type = type;
    if (isRead !== undefined) where.isRead = isRead;

    const [total, notifications, unreadCount] = await Promise.all([
      this.prisma.notification.count({ where }),
      this.prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          recipient: {
            select: { id: true, employeeCode: true, fullName: true, avatarUrl: true },
          },
        },
      }),
      this.prisma.notification.count({
        where: {
          ...(recipientId ? { recipientId: BigInt(recipientId) } : {}),
          isRead: false,
        },
      }),
    ]);

    return {
      data: notifications.map((n) => this.serialize(n)),
      meta: {
        total,
        unreadCount,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: BigInt(id) },
      include: {
        recipient: {
          select: { id: true, employeeCode: true, fullName: true, avatarUrl: true },
        },
      },
    });

    if (!notification) {
      throw new NotFoundException(`Không tìm thấy thông báo với ID: ${id}`);
    }

    return this.serialize(notification);
  }

  async markAsRead(id: string) {
    await this.findOne(id);

    const updated = await this.prisma.notification.update({
      where: { id: BigInt(id) },
      data: {
        isRead: true,
        readAt: new Date(),
      },
      include: {
        recipient: {
          select: { id: true, employeeCode: true, fullName: true, avatarUrl: true },
        },
      },
    });

    return this.serialize(updated);
  }

  async markAllAsRead(recipientId: string) {
    const rId = BigInt(recipientId);
    const result = await this.prisma.notification.updateMany({
      where: { recipientId: rId, isRead: false },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return { message: `Đã đánh dấu đọc ${result.count} thông báo của nhân viên ID ${recipientId}` };
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.notification.delete({
      where: { id: BigInt(id) },
    });

    return { message: `Thông báo ID ${id} đã được xóa thành công` };
  }

  private serialize(n: any): any {
    if (!n) return null;
    return {
      ...n,
      id: n.id?.toString(),
      recipientId: n.recipientId?.toString(),
      relatedEntityId: n.relatedEntityId?.toString() ?? null,
      recipient: n.recipient ? { ...n.recipient, id: n.recipient.id?.toString() } : null,
    };
  }
}

