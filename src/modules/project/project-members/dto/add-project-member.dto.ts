import { ProjectMemberStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class AddProjectMemberDto {
  @IsString()
  @IsNotEmpty({ message: 'projectId không được để trống' })
  projectId: string;

  @IsString()
  @IsNotEmpty({ message: 'employeeId không được để trống' })
  employeeId: string;

  @IsString()
  @IsNotEmpty({ message: 'Vai trò dự án (projectRole) không được để trống' })
  @MaxLength(100)
  projectRole: string;

  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  allocationPercentage?: number = 100;

  @Type(() => Date)
  @IsDate({ message: 'Ngày gia nhập (joinedAt) không đúng định dạng Date' })
  @IsNotEmpty({ message: 'Ngày gia nhập dự án không được để trống' })
  joinedAt: Date;

  @IsEnum(ProjectMemberStatus)
  @IsOptional()
  status?: ProjectMemberStatus = ProjectMemberStatus.ACTIVE;
}

