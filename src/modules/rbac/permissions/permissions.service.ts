import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { CreatePermissionDto, QueryPermissionDto, UpdatePermissionDto } from './dto';

@Injectable()
export class PermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePermissionDto) {
    const existing = await this.prisma.permission.findUnique({
      where: { code: dto.code },
    });

    if (existing) {
      throw new ConflictException(`Permission code '${dto.code}' đã tồn tại`);
    }

    const permission = await this.prisma.permission.create({
      data: {
        code: dto.code,
        name: dto.name,
        module: dto.module,
        description: dto.description,
      },
    });

    return this.serialize(permission);
  }

  async findAll(query: QueryPermissionDto) {
    const { page = 1, limit = 10, search, module } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (module) {
      where.module = module;
    }

    const [total, permissions] = await Promise.all([
      this.prisma.permission.count({ where }),
      this.prisma.permission.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ module: 'asc' }, { createdAt: 'desc' }],
        include: {
          _count: {
            select: { roles: true },
          },
        },
      }),
    ]);

    return {
      data: permissions.map((p) => this.serialize(p)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const permission = await this.prisma.permission.findUnique({
      where: { id: BigInt(id) },
      include: {
        roles: {
          include: {
            role: {
              select: { id: true, code: true, name: true },
            },
          },
        },
      },
    });

    if (!permission) {
      throw new NotFoundException(`Không tìm thấy Permission với ID: ${id}`);
    }

    return this.serialize(permission);
  }

  async update(id: string, dto: UpdatePermissionDto) {
    await this.findOne(id);

    if (dto.code) {
      const existing = await this.prisma.permission.findFirst({
        where: {
          code: dto.code,
          id: { not: BigInt(id) },
        },
      });
      if (existing) {
        throw new ConflictException(`Permission code '${dto.code}' đã được sử dụng`);
      }
    }

    const updated = await this.prisma.permission.update({
      where: { id: BigInt(id) },
      data: {
        ...(dto.code && { code: dto.code }),
        ...(dto.name && { name: dto.name }),
        ...(dto.module && { module: dto.module }),
        ...(dto.description !== undefined && { description: dto.description }),
      },
    });

    return this.serialize(updated);
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.permission.delete({
      where: { id: BigInt(id) },
    });

    return { message: `Permission ID ${id} đã được xóa thành công` };
  }

  async getModules() {
    const result = await this.prisma.permission.findMany({
      distinct: ['module'],
      select: { module: true },
      orderBy: { module: 'asc' },
    });
    return result.map((r) => r.module);
  }

  private serialize(permission: any): any {
    if (!permission) return null;
    return {
      ...permission,
      id: permission.id?.toString(),
      roleCount: permission._count?.roles ?? permission.roles?.length ?? 0,
      roles: permission.roles?.map((rp: any) => ({
        ...rp.role,
        id: rp.role.id?.toString(),
      })) ?? undefined,
    };
  }
}

