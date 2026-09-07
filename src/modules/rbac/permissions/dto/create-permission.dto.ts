import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreatePermissionDto {
  @IsString()
  @IsNotEmpty({ message: 'Mã quyền (code) không được để trống' })
  @MaxLength(100)
  code: string;

  @IsString()
  @IsNotEmpty({ message: 'Tên quyền (name) không được để trống' })
  @MaxLength(150)
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'Module không được để trống' })
  @MaxLength(50)
  module: string;

  @IsString()
  @IsOptional()
  description?: string;
}

