import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { AssignPermissionsDto, CreateRoleDto, QueryRoleDto, UpdateRoleDto } from './dto';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── CRUD ────────────────────────────────────────────────────────────────────
  async create(dto: CreateRoleDto) {
    const existing = await this.prisma.role.findUnique({
      where: { code: dto.code },
    });

    if (existing) {
      throw new ConflictException(`Role code '${dto.code}' đã tồn tại trong hệ thống`);
    }

    const role = await this.prisma.role.create({
      data: {
        code: dto.code,
        name: dto.name,
        description: dto.description,
      },
    });

    return this.serialize(role);
  }

  async findAll(query: QueryRoleDto) {
    const { page = 1, limit = 10, search } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, roles] = await Promise.all([
      this.prisma.role.count({ where }),
      this.prisma.role.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
          _count: {
            select: { users: true },
          },
        },
      }),
    ]);

    return {
      data: roles.map((r) => this.serialize(r)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id: BigInt(id) },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        users: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundException(`Không tìm thấy Role với ID: ${id}`);
    }

    return this.serialize(role);
  }

  async update(id: string, dto: UpdateRoleDto) {
    await this.findOne(id);

    if (dto.code) {
      const existing = await this.prisma.role.findFirst({
        where: {
          code: dto.code,
          id: { not: BigInt(id) },
        },
      });
      if (existing) {
        throw new ConflictException(`Role code '${dto.code}' đã được sử dụng`);
      }
    }

    const updated = await this.prisma.role.update({
      where: { id: BigInt(id) },
      data: {
        ...(dto.code && { code: dto.code }),
        ...(dto.name && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
      },
    });

    return this.serialize(updated);
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.role.delete({
      where: { id: BigInt(id) },
    });

    return { message: `Role ID ${id} đã được xóa thành công` };
  }

  // ─── ROLE - PERMISSIONS RELATION ──────────────────────────────────────────────
  async getPermissions(roleId: string) {
    const role = await this.findOne(roleId);
    return {
      roleId: role.id,
      roleCode: role.code,
      roleName: role.name,
      permissions: role.permissions,
    };
  }

  async assignPermissions(roleId: string, dto: AssignPermissionsDto) {
    const rId = BigInt(roleId);
    await this.findOne(roleId);

    const permissionBigIntIds = dto.permissionIds.map((id) => BigInt(id));

    await this.prisma.rolePermission.createMany({
      data: permissionBigIntIds.map((pId) => ({
        roleId: rId,
        permissionId: pId,
      })),
      skipDuplicates: true,
    });

    return this.getPermissions(roleId);
  }

  async syncPermissions(roleId: string, dto: AssignPermissionsDto) {
    const rId = BigInt(roleId);
    await this.findOne(roleId);

    const permissionBigIntIds = dto.permissionIds.map((id) => BigInt(id));

    await this.prisma.$transaction([
      this.prisma.rolePermission.deleteMany({ where: { roleId: rId } }),
      this.prisma.rolePermission.createMany({
        data: permissionBigIntIds.map((pId) => ({
          roleId: rId,
          permissionId: pId,
        })),
      }),
    ]);

    return this.getPermissions(roleId);
  }

  async removePermission(roleId: string, permissionId: string) {
    const rId = BigInt(roleId);
    const pId = BigInt(permissionId);

    const existing = await this.prisma.rolePermission.findUnique({
      where: {
        roleId_permissionId: { roleId: rId, permissionId: pId },
      },
    });

    if (!existing) {
      throw new NotFoundException(
        `Không tìm thấy liên kết giữa Role ID ${roleId} và Permission ID ${permissionId}`,
      );
    }

    await this.prisma.rolePermission.delete({
      where: {
        roleId_permissionId: { roleId: rId, permissionId: pId },
      },
    });

    return { message: `Đã xóa permission ID ${permissionId} khỏi role ID ${roleId}` };
  }

  async removeAllPermissions(roleId: string) {
    const rId = BigInt(roleId);
    await this.findOne(roleId);

    const result = await this.prisma.rolePermission.deleteMany({
      where: { roleId: rId },
    });

    return { message: `Đã xóa toàn bộ ${result.count} permissions khỏi role ID ${roleId}` };
  }

  // ─── SERIALIZATION ────────────────────────────────────────────────────────────
  private serialize(role: any): any {
    if (!role) return null;
    return {
      ...role,
      id: role.id?.toString(),
      userCount: role._count?.users ?? role.users?.length ?? 0,
      permissions: role.permissions?.map((rp: any) => ({
        ...rp.permission,
        id: rp.permission.id?.toString(),
      })) ?? [],
      users: role.users?.map((ur: any) => ({
        ...ur.user,
        id: ur.user.id?.toString(),
      })) ?? undefined,
    };
  }
}
