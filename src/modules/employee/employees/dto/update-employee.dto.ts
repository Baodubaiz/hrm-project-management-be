import { EmployeeStatus, EmploymentType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateEmployeeDto {
  @IsString()
  @IsOptional()
  @MaxLength(50)
  employeeCode?: string;

  @IsString()
  @IsOptional()
  @MaxLength(150)
  fullName?: string;

  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  userId?: string;

  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'Ngày sinh không đúng định dạng Date' })
  dateOfBirth?: Date;

  @IsString()
  @IsOptional()
  @MaxLength(10)
  gender?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'Ngày vào làm không đúng định dạng Date' })
  joinDate?: Date;

  @IsString()
  @IsOptional()
  departmentId?: string;

  @IsString()
  @IsOptional()
  positionId?: string;

  @IsString()
  @IsOptional()
  directManagerId?: string;

  @IsEnum(EmploymentType)
  @IsOptional()
  employmentType?: EmploymentType;

  @IsEnum(EmployeeStatus)
  @IsOptional()
  status?: EmployeeStatus;
}

