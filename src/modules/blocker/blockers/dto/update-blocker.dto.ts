import { BlockerSeverity, BlockerStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateBlockerDto {
  @IsString()
  @IsOptional()
  @MaxLength(200)
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(BlockerSeverity)
  @IsOptional()
  severity?: BlockerSeverity;

  @IsEnum(BlockerStatus)
  @IsOptional()
  status?: BlockerStatus;

  @IsString()
  @IsOptional()
  resolverId?: string;

  @IsString()
  @IsOptional()
  solution?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  resolvedAt?: Date;
}

