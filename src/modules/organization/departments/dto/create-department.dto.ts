import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateDepartmentDto {
  @IsString()
  @IsNotEmpty({ message: 'Mã phòng ban (code) không được để trống' })
  @MaxLength(50)
  code: string;

  @IsString()
  @IsNotEmpty({ message: 'Tên phòng ban (name) không được để trống' })
  @MaxLength(150)
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  managerId?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;
}

