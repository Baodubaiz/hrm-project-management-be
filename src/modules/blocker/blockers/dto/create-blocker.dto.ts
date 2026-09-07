import { BlockerSeverity, BlockerStatus } from '@prisma/client';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateBlockerDto {
  @IsString()
  @IsNotEmpty({ message: 'projectId không được để trống' })
  projectId: string;

  @IsString()
  @IsOptional()
  taskId?: string;

  @IsString()
  @IsOptional()
  dailyReportItemId?: string;

  @IsString()
  @IsNotEmpty({ message: 'reporterId không được để trống' })
  reporterId: string;

  @IsString()
  @IsNotEmpty({ message: 'Tiêu đề vấn đề (title) không được để trống' })
  @MaxLength(200)
  title: string;

  @IsString()
  @IsNotEmpty({ message: 'Mô tả chi tiết vấn đề (description) không được để trống' })
  description: string;

  @IsEnum(BlockerSeverity)
  @IsOptional()
  severity?: BlockerSeverity = BlockerSeverity.MEDIUM;

  @IsEnum(BlockerStatus)
  @IsOptional()
  status?: BlockerStatus = BlockerStatus.OPEN;
}

