import { TaskPriority, TaskStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty({ message: 'Mã task (taskCode) không được để trống' })
  @MaxLength(50)
  taskCode: string;

  @IsString()
  @IsNotEmpty({ message: 'Tiêu đề task (title) không được để trống' })
  @MaxLength(255)
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty({ message: 'projectId không được để trống' })
  projectId: string;

  @IsString()
  @IsOptional()
  milestoneId?: string;

  @IsString()
  @IsOptional()
  assigneeId?: string;

  @IsString()
  @IsNotEmpty({ message: 'reporterId không được để trống' })
  reporterId: string;

  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority = TaskPriority.MEDIUM;

  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus = TaskStatus.TODO;

  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'Ngày bắt đầu không đúng định dạng Date' })
  startDate?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'Ngày hạn hoàn thành không đúng định dạng Date' })
  dueDate?: Date;

  @IsNumber()
  @Min(0)
  @IsOptional()
  estimateHours?: number = 0;
}
