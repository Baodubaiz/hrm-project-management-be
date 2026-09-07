import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { AddProjectMemberDto, QueryProjectMemberDto, UpdateProjectMemberDto } from './dto';

@Injectable()
export class ProjectMembersService {
  constructor(private readonly prisma: PrismaService) {}

  async addMember(dto: AddProjectMemberDto) {
    const pId = BigInt(dto.projectId);
    const eId = BigInt(dto.employeeId);

    // Verify Project
    const project = await this.prisma.project.findFirst({
      where: { id: pId, isDeleted: false },
    });
    if (!project) {
      throw new NotFoundException(`Dự án ID ${dto.projectId} không tồn tại`);
    }

    // Verify Employee
    const employee = await this.prisma.employee.findFirst({
      where: { id: eId, isDeleted: false },
    });
    if (!employee) {
      throw new NotFoundException(`Nhân viên ID ${dto.employeeId} không tồn tại`);
    }

    // Check unique constraint
    const existing = await this.prisma.projectMember.findUnique({
      where: {
        projectId_employeeId: { projectId: pId, employeeId: eId },
      },
    });

    if (existing) {
      throw new ConflictException(
        `Nhân viên ID ${dto.employeeId} đã tham gia dự án ID ${dto.projectId}`,
      );
    }

    const member = await this.prisma.projectMember.create({
      data: {
        projectId: pId,
        employeeId: eId,
        projectRole: dto.projectRole,
        allocationPercentage: dto.allocationPercentage ?? 100,
        joinedAt: dto.joinedAt,
        status: dto.status,
      },
      include: {
        project: { select: { id: true, code: true, name: true } },
        employee: { select: { id: true, employeeCode: true, fullName: true, email: true, avatarUrl: true } },
      },
    });

    return this.serialize(member);
  }

  async findAll(query: QueryProjectMemberDto) {
    const { page = 1, limit = 10, projectId, employeeId, status } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (projectId) where.projectId = BigInt(projectId);
    if (employeeId) where.employeeId = BigInt(employeeId);
    if (status) where.status = status;

    const [total, members] = await Promise.all([
      this.prisma.projectMember.count({ where }),
      this.prisma.projectMember.findMany({
        where,
        skip,
        take: limit,
        orderBy: { joinedAt: 'desc' },
        include: {
          project: { select: { id: true, code: true, name: true, status: true } },
          employee: {
            select: {
              id: true,
              employeeCode: true,
              fullName: true,
              email: true,
              avatarUrl: true,
              position: { select: { id: true, name: true } },
              department: { select: { id: true, name: true } },
            },
          },
        },
      }),
    ]);

    return {
      data: members.map((m) => this.serialize(m)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const member = await this.prisma.projectMember.findUnique({
      where: { id: BigInt(id) },
      include: {
        project: { select: { id: true, code: true, name: true, status: true } },
        employee: {
          select: {
            id: true,
            employeeCode: true,
            fullName: true,
            email: true,
            avatarUrl: true,
            position: { select: { id: true, name: true } },
            department: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!member) {
      throw new NotFoundException(`Không tìm thấy thông tin thành viên với ID: ${id}`);
    }

    return this.serialize(member);
  }

  async update(id: string, dto: UpdateProjectMemberDto) {
    await this.findOne(id);

    const updated = await this.prisma.projectMember.update({
      where: { id: BigInt(id) },
      data: {
        ...(dto.projectRole && { projectRole: dto.projectRole }),
        ...(dto.allocationPercentage !== undefined && { allocationPercentage: dto.allocationPercentage }),
        ...(dto.joinedAt && { joinedAt: dto.joinedAt }),
        ...(dto.leftAt !== undefined && { leftAt: dto.leftAt }),
        ...(dto.status && { status: dto.status }),
      },
      include: {
        project: { select: { id: true, code: true, name: true } },
        employee: { select: { id: true, employeeCode: true, fullName: true, email: true } },
      },
    });

    return this.serialize(updated);
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.projectMember.delete({
      where: { id: BigInt(id) },
    });

    return { message: `Đã xóa thành viên dự án ID ${id} thành công` };
  }

  async getMembersByProject(projectId: string) {
    const members = await this.prisma.projectMember.findMany({
      where: { projectId: BigInt(projectId), status: 'ACTIVE' },
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            fullName: true,
            email: true,
            avatarUrl: true,
            position: { select: { id: true, name: true } },
          },
        },
      },
    });

    return members.map((m) => this.serialize(m));
  }

  private serialize(m: any): any {
    if (!m) return null;
    return {
      ...m,
      id: m.id?.toString(),
      projectId: m.projectId?.toString(),
      employeeId: m.employeeId?.toString(),
      project: m.project ? { ...m.project, id: m.project.id?.toString() } : null,
      employee: m.employee
        ? {
            ...m.employee,
            id: m.employee.id?.toString(),
            position: m.employee.position ? { ...m.employee.position, id: m.employee.position.id?.toString() } : null,
            department: m.employee.department ? { ...m.employee.department, id: m.employee.department.id?.toString() } : null,
          }
        : null,
    };
  }
}

