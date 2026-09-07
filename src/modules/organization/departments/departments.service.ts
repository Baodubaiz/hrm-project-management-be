import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { CreateDepartmentDto, QueryDepartmentDto, UpdateDepartmentDto } from './dto';

@Injectable()
export class DepartmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDepartmentDto) {
    const existing = await this.prisma.department.findUnique({
      where: { code: dto.code },
    });

    if (existing) {
      throw new ConflictException(`Department code '${dto.code}' đã tồn tại trong hệ thống`);
    }

    const department = await this.prisma.department.create({
      data: {
        code: dto.code,
        name: dto.name,
        description: dto.description,
        managerId: dto.managerId ? BigInt(dto.managerId) : null,
        isActive: dto.isActive ?? true,
      },
    });

    return this.serialize(department);
  }

  async findAll(query: QueryDepartmentDto) {
    const { page = 1, limit = 10, search, isActive } = query;
    const skip = (page - 1) * limit;

    const where: any = { isDeleted: false };
    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [total, departments] = await Promise.all([
      this.prisma.department.count({ where }),
      this.prisma.department.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          manager: {
            select: {
              id: true,
              employeeCode: true,
              fullName: true,
              email: true,
              avatarUrl: true,
            },
          },
          _count: {
            select: { employees: true },
          },
        },
      }),
    ]);

    return {
      data: departments.map((d) => this.serialize(d)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const department = await this.prisma.department.findFirst({
      where: { id: BigInt(id), isDeleted: false },
      include: {
        manager: {
          select: {
            id: true,
            employeeCode: true,
            fullName: true,
            email: true,
            avatarUrl: true,
            phone: true,
          },
        },
        employees: {
          where: { isDeleted: false },
          select: {
            id: true,
            employeeCode: true,
            fullName: true,
            email: true,
            avatarUrl: true,
            status: true,
            position: {
              select: { id: true, code: true, name: true },
            },
          },
        },
      },
    });

    if (!department) {
      throw new NotFoundException(`Không tìm thấy phòng ban với ID: ${id}`);
    }

    return this.serialize(department);
  }

  async update(id: string, dto: UpdateDepartmentDto) {
    await this.findOne(id);

    if (dto.code) {
      const existing = await this.prisma.department.findFirst({
        where: {
          code: dto.code,
          id: { not: BigInt(id) },
        },
      });
      if (existing) {
        throw new ConflictException(`Department code '${dto.code}' đã được sử dụng`);
      }
    }

    const updated = await this.prisma.department.update({
      where: { id: BigInt(id) },
      data: {
        ...(dto.code && { code: dto.code }),
        ...(dto.name && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.managerId !== undefined && {
          managerId: dto.managerId ? BigInt(dto.managerId) : null,
        }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });

    return this.serialize(updated);
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.department.update({
      where: { id: BigInt(id) },
      data: { isDeleted: true },
    });

    return { message: `Phòng ban ID ${id} đã được xóa mềm thành công` };
  }

  async assignManager(id: string, managerId: string) {
    await this.findOne(id);

    const updated = await this.prisma.department.update({
      where: { id: BigInt(id) },
      data: { managerId: BigInt(managerId) },
      include: {
        manager: {
          select: {
            id: true,
            employeeCode: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    return this.serialize(updated);
  }

  private serialize(dept: any): any {
    if (!dept) return null;
    return {
      ...dept,
      id: dept.id?.toString(),
      managerId: dept.managerId?.toString() ?? null,
      employeeCount: dept._count?.employees ?? dept.employees?.length ?? 0,
      manager: dept.manager
        ? {
            ...dept.manager,
            id: dept.manager.id?.toString(),
          }
        : null,
      employees: dept.employees?.map((emp: any) => ({
        ...emp,
        id: emp.id?.toString(),
        position: emp.position
          ? {
              ...emp.position,
              id: emp.position.id?.toString(),
            }
          : null,
      })) ?? undefined,
    };
  }
}

