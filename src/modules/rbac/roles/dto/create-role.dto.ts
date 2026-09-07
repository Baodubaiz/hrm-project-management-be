import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateRoleDto {
  @IsString()
  @IsNotEmpty({ message: 'Mã role (code) không được để trống' })
  @MaxLength(50)
  code: string;

  @IsString()
  @IsNotEmpty({ message: 'Tên role (name) không được để trống' })
  @MaxLength(100)
  name: string;

  @IsString()
  @IsOptional()
  description?: string;
}

