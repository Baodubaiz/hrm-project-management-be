import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../../core/database/prisma.service';
import { AssignRolesDto, CreateUserDto, QueryUserDto, UpdateUserDto } from './dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── CREATE ──────────────────────────────────────────────────────────────────
  async create(createUserDto: CreateUserDto) {
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [
          { username: createUserDto.username },
          { email: createUserDto.email },
        ],
      },
    });

    if (existing) {
      throw new ConflictException('Username hoặc email đã tồn tại trong hệ thống');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(createUserDto.password, salt);

    const user = await this.prisma.user.create({
      data: {
        username: createUserDto.username,
        email: createUserDto.email,
        passwordHash,
      },
      select: {
        id: true,
        username: true,
        email: true,
        status: true,
        failedLoginAttempts: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return this.serializeUser(user);
  }

  // ─── READ ALL ─────────────────────────────────────────────────────────────────
  async findAll(query: QueryUserDto) {
    const { page = 1, limit = 10, search, status } = query;
    const skip = (page - 1) * limit;

    const where: any = { isDeleted: false };

    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    const [total, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          username: true,
          email: true,
          status: true,
          failedLoginAttempts: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
          employee: {
            select: {
              id: true,
              fullName: true,
              employeeCode: true,
              avatarUrl: true,
            },
          },
          roles: {
            select: {
              role: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                },
              },
            },
          },
        },
      }),
    ]);

    return {
      data: users.map((u) => this.serializeUser(u)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ─── READ ONE ─────────────────────────────────────────────────────────────────
  async findOne(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: BigInt(id), isDeleted: false },
      select: {
        id: true,
        username: true,
        email: true,
        status: true,
        failedLoginAttempts: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        employee: {
          select: {
            id: true,
            fullName: true,
            employeeCode: true,
            email: true,
            avatarUrl: true,
            phone: true,
            status: true,
            department: { select: { id: true, name: true } },
            position: { select: { id: true, name: true } },
          },
        },
        roles: {
          select: {
            role: {
              select: {
                id: true,
                code: true,
                name: true,
                permissions: {
                  select: {
                    permission: { select: { code: true, name: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`Không tìm thấy user với ID: ${id}`);
    }

    return this.serializeUser(user);
  }

  // ─── UPDATE ──────────────────────────────────────────────────────────────────
  async update(id: string, updateUserDto: UpdateUserDto) {
    await this.findOne(id);

    if (updateUserDto.username || updateUserDto.email) {
      const conflict = await this.prisma.user.findFirst({
        where: {
          AND: [
            { id: { not: BigInt(id) } },
            {
              OR: [
                ...(updateUserDto.username ? [{ username: updateUserDto.username }] : []),
                ...(updateUserDto.email ? [{ email: updateUserDto.email }] : []),
              ],
            },
          ],
        },
      });
      if (conflict) {
        throw new ConflictException('Username hoặc email đã được sử dụng bởi tài khoản khác');
      }
    }

    const updated = await this.prisma.user.update({
      where: { id: BigInt(id) },
      data: {
        ...(updateUserDto.username && { username: updateUserDto.username }),
        ...(updateUserDto.email && { email: updateUserDto.email }),
        ...(updateUserDto.status && { status: updateUserDto.status }),
      },
      select: {
        id: true,
        username: true,
        email: true,
        status: true,
        failedLoginAttempts: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return this.serializeUser(updated);
  }

  // ─── SOFT DELETE ──────────────────────────────────────────────────────────────
  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.user.update({
      where: { id: BigInt(id) },
      data: { isDeleted: true, deletedAt: new Date() },
    });

    return { message: `User ID ${id} đã được xóa thành công` };
  }

  // ─── UNLOCK ───────────────────────────────────────────────────────────────────
  async unlock(id: string) {
    await this.findOne(id);

    const user = await this.prisma.user.update({
      where: { id: BigInt(id) },
      data: { status: 'ACTIVE', failedLoginAttempts: 0 },
      select: { id: true, username: true, status: true },
    });

    return { message: 'Tài khoản đã được mở khóa', user: this.serializeUser(user) };
  }

  // ─── USER - ROLES RELATION ───────────────────────────────────────────────────
  async getRoles(userId: string) {
    const user = await this.findOne(userId);
    return {
      userId: user.id,
      username: user.username,
      email: user.email,
      roles: user.roles,
    };
  }

  async assignRoles(userId: string, dto: AssignRolesDto) {
    const uId = BigInt(userId);
    await this.findOne(userId);

    const roleBigIntIds = dto.roleIds.map((id) => BigInt(id));

    await this.prisma.userRole.createMany({
      data: roleBigIntIds.map((rId) => ({
        userId: uId,
        roleId: rId,
      })),
      skipDuplicates: true,
    });

    return this.getRoles(userId);
  }

  async syncRoles(userId: string, dto: AssignRolesDto) {
    const uId = BigInt(userId);
    await this.findOne(userId);

    const roleBigIntIds = dto.roleIds.map((id) => BigInt(id));

    await this.prisma.$transaction([
      this.prisma.userRole.deleteMany({ where: { userId: uId } }),
      this.prisma.userRole.createMany({
        data: roleBigIntIds.map((rId) => ({
          userId: uId,
          roleId: rId,
        })),
      }),
    ]);

    return this.getRoles(userId);
  }

  async removeRole(userId: string, roleId: string) {
    const uId = BigInt(userId);
    const rId = BigInt(roleId);

    const existing = await this.prisma.userRole.findUnique({
      where: {
        userId_roleId: { userId: uId, roleId: rId },
      },
    });

    if (!existing) {
      throw new NotFoundException(
        `Không tìm thấy gán role ID ${roleId} cho user ID ${userId}`,
      );
    }

    await this.prisma.userRole.delete({
      where: {
        userId_roleId: { userId: uId, roleId: rId },
      },
    });

    return { message: `Đã xóa role ID ${roleId} khỏi user ID ${userId}` };
  }

  async removeAllRoles(userId: string) {
    const uId = BigInt(userId);
    await this.findOne(userId);

    const result = await this.prisma.userRole.deleteMany({
      where: { userId: uId },
    });

    return { message: `Đã xóa toàn bộ ${result.count} roles khỏi user ID ${userId}` };
  }

  // ─── INTERNAL (dùng trong AuthService) ───────────────────────────────────────
  async findByUsernameOrEmail(identifier: string) {
    return this.prisma.user.findFirst({
      where: {
        OR: [{ username: identifier }, { email: identifier }],
        isDeleted: false,
      },
    });
  }

  async findFullForAuth(identifier: string) {
    return this.prisma.user.findFirst({
      where: {
        OR: [{ username: identifier }, { email: identifier }],
        isDeleted: false,
      },
      include: {
        employee: {
          select: { id: true, fullName: true, employeeCode: true, avatarUrl: true },
        },
        roles: {
          include: {
            role: {
              include: {
                permissions: { include: { permission: true } },
              },
            },
          },
        },
      },
    });
  }

  async findByIdForAuth(id: bigint) {
    return this.prisma.user.findFirst({
      where: { id, isDeleted: false },
      include: {
        employee: {
          select: { id: true, fullName: true, employeeCode: true, avatarUrl: true },
        },
        roles: {
          include: {
            role: {
              include: {
                permissions: { include: { permission: true } },
              },
            },
          },
        },
      },
    });
  }

  async updateFailedLogin(id: bigint, attempts: number, lock = false) {
    return this.prisma.user.update({
      where: { id },
      data: {
        failedLoginAttempts: attempts,
        ...(lock && { status: 'LOCKED' }),
      },
    });
  }

  async recordLogin(id: bigint) {
    return this.prisma.user.update({
      where: { id },
      data: { failedLoginAttempts: 0, lastLoginAt: new Date() },
    });
  }

  async updatePassword(id: bigint, passwordHash: string) {
    return this.prisma.user.update({
      where: { id },
      data: { passwordHash },
    });
  }

  // ─── SERIALIZER ───────────────────────────────────────────────────────────────
  private serializeUser(user: any): any {
    if (!user) return null;
    return {
      ...user,
      id: user.id?.toString(),
      employee: user.employee
        ? {
            ...user.employee,
            id: user.employee.id?.toString(),
            department: user.employee.department
              ? {
                  ...user.employee.department,
                  id: user.employee.department.id?.toString(),
                }
              : null,
            position: user.employee.position
              ? {
                  ...user.employee.position,
                  id: user.employee.position.id?.toString(),
                }
              : null,
          }
        : undefined,
      roles: user.roles?.map((ur: any) => ({
        ...ur.role,
        id: ur.role.id?.toString(),
        permissions: ur.role.permissions?.map((rp: any) => rp.permission) ?? [],
      })),
    };
  }
}
