import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdatePermissionDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  code?: string;

  @IsString()
  @IsOptional()
  @MaxLength(150)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  module?: string;

  @IsString()
  @IsOptional()
  description?: string;
}

