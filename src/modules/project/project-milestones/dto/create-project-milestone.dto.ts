import { MilestoneStatus } from '@prisma/client';
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

export class CreateProjectMilestoneDto {
  @IsString()
  @IsNotEmpty({ message: 'projectId không được để trống' })
  projectId: string;

  @IsString()
  @IsNotEmpty({ message: 'Tên cột mốc (name) không được để trống' })
  @MaxLength(150)
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @Type(() => Date)
  @IsDate({ message: 'Ngày bắt đầu không đúng định dạng Date' })
  @IsNotEmpty({ message: 'Ngày bắt đầu cột mốc không được để trống' })
  startDate: Date;

  @Type(() => Date)
  @IsDate({ message: 'Ngày hạn hoàn thành (dueDate) không đúng định dạng Date' })
  @IsNotEmpty({ message: 'Ngày hạn hoàn thành không được để trống' })
  dueDate: Date;

  @IsEnum(MilestoneStatus)
  @IsOptional()
  status?: MilestoneStatus = MilestoneStatus.PLANNED;

  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  progress?: number = 0;
}

