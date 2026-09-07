import { EmployeeStatus, EmploymentType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateEmployeeDto {
  @IsString()
  @IsNotEmpty({ message: 'Mã nhân viên (employeeCode) không được để trống' })
  @MaxLength(50)
  employeeCode: string;

  @IsString()
  @IsNotEmpty({ message: 'Họ và tên (fullName) không được để trống' })
  @MaxLength(150)
  fullName: string;

  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsNotEmpty()
  email: string;

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

  @Type(() => Date)
  @IsDate({ message: 'Ngày vào làm (joinDate) không đúng định dạng Date' })
  @IsNotEmpty({ message: 'Ngày vào làm không được để trống' })
  joinDate: Date;

  @IsString()
  @IsOptional()
  departmentId?: string;

  @IsString()
  @IsOptional()
  positionId?: string;

  @IsString()
  @IsOptional()
  directManagerId?: string;

  @IsEnum(EmploymentType, { message: 'Loại hình hợp đồng không hợp lệ' })
  @IsOptional()
  employmentType?: EmploymentType = EmploymentType.OFFICIAL;

  @IsEnum(EmployeeStatus, { message: 'Trạng thái nhân viên không hợp lệ' })
  @IsOptional()
  status?: EmployeeStatus = EmployeeStatus.ACTIVE;
}

