import { ProjectMemberStatus } from '@prisma/client';
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

export class UpdateProjectMemberDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  projectRole?: string;

  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  allocationPercentage?: number;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  joinedAt?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  leftAt?: Date;

  @IsEnum(ProjectMemberStatus)
  @IsOptional()
  status?: ProjectMemberStatus;
}

