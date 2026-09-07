import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { CreateEmployeeDto, QueryEmployeeDto, UpdateEmployeeDto } from './dto';

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateEmployeeDto) {
    // Check employeeCode uniqueness
    const existingCode = await this.prisma.employee.findUnique({
      where: { employeeCode: dto.employeeCode },
    });
    if (existingCode) {
      throw new ConflictException(`Mã nhân viên '${dto.employeeCode}' đã tồn tại`);
    }

    // Check email uniqueness
    const existingEmail = await this.prisma.employee.findUnique({
      where: { email: dto.email },
    });
    if (existingEmail) {
      throw new ConflictException(`Email nhân viên '${dto.email}' đã được đăng ký`);
    }

    // Validate userId if provided
    if (dto.userId) {
      const existingUserLink = await this.prisma.employee.findUnique({
        where: { userId: BigInt(dto.userId) },
      });
      if (existingUserLink) {
        throw new ConflictException(`User ID ${dto.userId} đã được liên kết với nhân viên khác`);
      }
    }

    const employee = await this.prisma.employee.create({
      data: {
        employeeCode: dto.employeeCode,
        fullName: dto.fullName,
        email: dto.email,
        userId: dto.userId ? BigInt(dto.userId) : null,
        avatarUrl: dto.avatarUrl,
        phone: dto.phone,
        dateOfBirth: dto.dateOfBirth,
        gender: dto.gender,
        address: dto.address,
        joinDate: dto.joinDate,
        departmentId: dto.departmentId ? BigInt(dto.departmentId) : null,
        positionId: dto.positionId ? BigInt(dto.positionId) : null,
        directManagerId: dto.directManagerId ? BigInt(dto.directManagerId) : null,
        employmentType: dto.employmentType,
        status: dto.status,
      },
      include: {
        department: { select: { id: true, code: true, name: true } },
        position: { select: { id: true, code: true, name: true } },
        directManager: { select: { id: true, employeeCode: true, fullName: true } },
        user: { select: { id: true, username: true, email: true, status: true } },
      },
    });

    return this.serialize(employee);
  }

  async findAll(query: QueryEmployeeDto) {
    const {
      page = 1,
      limit = 10,
      search,
      departmentId,
      positionId,
      directManagerId,
      employmentType,
      status,
    } = query;
    const skip = (page - 1) * limit;

    const where: any = { isDeleted: false };

    if (search) {
      where.OR = [
        { employeeCode: { contains: search, mode: 'insensitive' } },
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (departmentId) where.departmentId = BigInt(departmentId);
    if (positionId) where.positionId = BigInt(positionId);
    if (directManagerId) where.directManagerId = BigInt(directManagerId);
    if (employmentType) where.employmentType = employmentType;
    if (status) where.status = status;

    const [total, employees] = await Promise.all([
      this.prisma.employee.count({ where }),
      this.prisma.employee.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          department: { select: { id: true, code: true, name: true } },
          position: { select: { id: true, code: true, name: true } },
          directManager: { select: { id: true, employeeCode: true, fullName: true } },
          user: { select: { id: true, username: true, email: true, status: true } },
        },
      }),
    ]);

    return {
      data: employees.map((e) => this.serialize(e)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const employee = await this.prisma.employee.findFirst({
      where: { id: BigInt(id), isDeleted: false },
      include: {
        department: { select: { id: true, code: true, name: true } },
        position: { select: { id: true, code: true, name: true } },
        directManager: {
          select: {
            id: true,
            employeeCode: true,
            fullName: true,
            email: true,
            avatarUrl: true,
          },
        },
        subordinates: {
          where: { isDeleted: false },
          select: {
            id: true,
            employeeCode: true,
            fullName: true,
            email: true,
            avatarUrl: true,
            status: true,
            position: { select: { id: true, name: true } },
          },
        },
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            status: true,
            roles: {
              select: {
                role: { select: { id: true, code: true, name: true } },
              },
            },
          },
        },
      },
    });

    if (!employee) {
      throw new NotFoundException(`Không tìm thấy nhân viên với ID: ${id}`);
    }

    return this.serialize(employee);
  }

  async update(id: string, dto: UpdateEmployeeDto) {
    await this.findOne(id);

    if (dto.employeeCode) {
      const existing = await this.prisma.employee.findFirst({
        where: {
          employeeCode: dto.employeeCode,
          id: { not: BigInt(id) },
        },
      });
      if (existing) {
        throw new ConflictException(`Mã nhân viên '${dto.employeeCode}' đã được sử dụng`);
      }
    }

    if (dto.email) {
      const existing = await this.prisma.employee.findFirst({
        where: {
          email: dto.email,
          id: { not: BigInt(id) },
        },
      });
      if (existing) {
        throw new ConflictException(`Email '${dto.email}' đã được sử dụng bởi nhân viên khác`);
      }
    }

    const updated = await this.prisma.employee.update({
      where: { id: BigInt(id) },
      data: {
        ...(dto.employeeCode && { employeeCode: dto.employeeCode }),
        ...(dto.fullName && { fullName: dto.fullName }),
        ...(dto.email && { email: dto.email }),
        ...(dto.userId !== undefined && {
          userId: dto.userId ? BigInt(dto.userId) : null,
        }),
        ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.dateOfBirth !== undefined && { dateOfBirth: dto.dateOfBirth }),
        ...(dto.gender !== undefined && { gender: dto.gender }),
        ...(dto.address !== undefined && { address: dto.address }),
        ...(dto.joinDate && { joinDate: dto.joinDate }),
        ...(dto.departmentId !== undefined && {
          departmentId: dto.departmentId ? BigInt(dto.departmentId) : null,
        }),
        ...(dto.positionId !== undefined && {
          positionId: dto.positionId ? BigInt(dto.positionId) : null,
        }),
        ...(dto.directManagerId !== undefined && {
          directManagerId: dto.directManagerId ? BigInt(dto.directManagerId) : null,
        }),
        ...(dto.employmentType && { employmentType: dto.employmentType }),
        ...(dto.status && { status: dto.status }),
      },
      include: {
        department: { select: { id: true, code: true, name: true } },
        position: { select: { id: true, code: true, name: true } },
        directManager: { select: { id: true, employeeCode: true, fullName: true } },
        user: { select: { id: true, username: true, email: true, status: true } },
      },
    });

    return this.serialize(updated);
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.employee.update({
      where: { id: BigInt(id) },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    return { message: `Nhân viên ID ${id} đã được xóa mềm thành công` };
  }

  async getSubordinates(id: string) {
    await this.findOne(id);

    const subordinates = await this.prisma.employee.findMany({
      where: { directManagerId: BigInt(id), isDeleted: false },
      include: {
        department: { select: { id: true, code: true, name: true } },
        position: { select: { id: true, code: true, name: true } },
      },
    });

    return subordinates.map((s) => this.serialize(s));
  }

  async linkUser(id: string, userId: string | null) {
    await this.findOne(id);

    if (userId) {
      const existing = await this.prisma.employee.findFirst({
        where: {
          userId: BigInt(userId),
          id: { not: BigInt(id) },
        },
      });
      if (existing) {
        throw new ConflictException(`User ID ${userId} đã được gán cho nhân viên khác`);
      }
    }

    const updated = await this.prisma.employee.update({
      where: { id: BigInt(id) },
      data: { userId: userId ? BigInt(userId) : null },
      include: {
        user: { select: { id: true, username: true, email: true, status: true } },
      },
    });

    return this.serialize(updated);
  }

  private serialize(emp: any): any {
    if (!emp) return null;
    return {
      ...emp,
      id: emp.id?.toString(),
      userId: emp.userId?.toString() ?? null,
      departmentId: emp.departmentId?.toString() ?? null,
      positionId: emp.positionId?.toString() ?? null,
      directManagerId: emp.directManagerId?.toString() ?? null,
      department: emp.department
        ? { ...emp.department, id: emp.department.id?.toString() }
        : null,
      position: emp.position
        ? { ...emp.position, id: emp.position.id?.toString() }
        : null,
      directManager: emp.directManager
        ? { ...emp.directManager, id: emp.directManager.id?.toString() }
        : null,
      subordinates: emp.subordinates?.map((sub: any) => ({
        ...sub,
        id: sub.id?.toString(),
        position: sub.position
          ? { ...sub.position, id: sub.position.id?.toString() }
          : null,
      })) ?? undefined,
      user: emp.user
        ? {
            ...emp.user,
            id: emp.user.id?.toString(),
            roles: emp.user.roles?.map((ur: any) => ({
              ...ur.role,
              id: ur.role.id?.toString(),
            })),
          }
        : null,
    };
  }
}

