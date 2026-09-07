import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { CreatePositionDto, QueryPositionDto, UpdatePositionDto } from './dto';

@Injectable()
export class PositionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePositionDto) {
    const existing = await this.prisma.position.findUnique({
      where: { code: dto.code },
    });

    if (existing) {
      throw new ConflictException(`Position code '${dto.code}' đã tồn tại trong hệ thống`);
    }

    const position = await this.prisma.position.create({
      data: {
        code: dto.code,
        name: dto.name,
        description: dto.description,
        level: dto.level ?? 1,
        isActive: dto.isActive ?? true,
      },
    });

    return this.serialize(position);
  }

  async findAll(query: QueryPositionDto) {
    const { page = 1, limit = 10, search, level, isActive } = query;
    const skip = (page - 1) * limit;

    const where: any = { isDeleted: false };
    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (level !== undefined) {
      where.level = level;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [total, positions] = await Promise.all([
      this.prisma.position.count({ where }),
      this.prisma.position.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ level: 'asc' }, { createdAt: 'desc' }],
        include: {
          _count: {
            select: { employees: true },
          },
        },
      }),
    ]);

    return {
      data: positions.map((p) => this.serialize(p)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const position = await this.prisma.position.findFirst({
      where: { id: BigInt(id), isDeleted: false },
      include: {
        employees: {
          where: { isDeleted: false },
          select: {
            id: true,
            employeeCode: true,
            fullName: true,
            email: true,
            avatarUrl: true,
            status: true,
            department: {
              select: { id: true, code: true, name: true },
            },
          },
        },
      },
    });

    if (!position) {
      throw new NotFoundException(`Không tìm thấy chức vụ với ID: ${id}`);
    }

    return this.serialize(position);
  }

  async update(id: string, dto: UpdatePositionDto) {
    await this.findOne(id);

    if (dto.code) {
      const existing = await this.prisma.position.findFirst({
        where: {
          code: dto.code,
          id: { not: BigInt(id) },
        },
      });
      if (existing) {
        throw new ConflictException(`Position code '${dto.code}' đã được sử dụng`);
      }
    }

    const updated = await this.prisma.position.update({
      where: { id: BigInt(id) },
      data: {
        ...(dto.code && { code: dto.code }),
        ...(dto.name && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.level !== undefined && { level: dto.level }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });

    return this.serialize(updated);
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.position.update({
      where: { id: BigInt(id) },
      data: { isDeleted: true },
    });

    return { message: `Chức vụ ID ${id} đã được xóa mềm thành công` };
  }

  private serialize(pos: any): any {
    if (!pos) return null;
    return {
      ...pos,
      id: pos.id?.toString(),
      employeeCount: pos._count?.employees ?? pos.employees?.length ?? 0,
      employees: pos.employees?.map((emp: any) => ({
        ...emp,
        id: emp.id?.toString(),
        department: emp.department
          ? {
              ...emp.department,
              id: emp.department.id?.toString(),
            }
          : null,
      })) ?? undefined,
    };
  }
}

