import { ProjectPriority, ProjectStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty({ message: 'Mã dự án (code) không được để trống' })
  @MaxLength(50)
  code: string;

  @IsString()
  @IsNotEmpty({ message: 'Tên dự án (name) không được để trống' })
  @MaxLength(200)
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  @MaxLength(150)
  customerName?: string;

  @IsString()
  @IsNotEmpty({ message: 'ID quản lý dự án (pmId) không được để trống' })
  pmId: string;

  @Type(() => Date)
  @IsDate({ message: 'Ngày bắt đầu không đúng định dạng Date' })
  @IsNotEmpty({ message: 'Ngày bắt đầu dự án không được để trống' })
  startDate: Date;

  @Type(() => Date)
  @IsDate({ message: 'Ngày kết thúc dự kiến không đúng định dạng Date' })
  @IsNotEmpty({ message: 'Ngày kết thúc dự kiến không được để trống' })
  expectedEndDate: Date;

  @IsEnum(ProjectPriority)
  @IsOptional()
  priority?: ProjectPriority = ProjectPriority.MEDIUM;

  @IsEnum(ProjectStatus)
  @IsOptional()
  status?: ProjectStatus = ProjectStatus.PLANNING;
}

