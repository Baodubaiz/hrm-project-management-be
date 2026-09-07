import { ProjectPriority, ProjectStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateProjectDto {
  @IsString()
  @IsOptional()
  @MaxLength(50)
  code?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  @MaxLength(150)
  customerName?: string;

  @IsString()
  @IsOptional()
  pmId?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  expectedEndDate?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  actualEndDate?: Date;

  @IsEnum(ProjectPriority)
  @IsOptional()
  priority?: ProjectPriority;

  @IsEnum(ProjectStatus)
  @IsOptional()
  status?: ProjectStatus;

  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  overallProgress?: number;
}

