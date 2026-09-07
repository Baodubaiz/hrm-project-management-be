import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreatePositionDto {
  @IsString()
  @IsNotEmpty({ message: 'Mã chức vụ (code) không được để trống' })
  @MaxLength(50)
  code: string;

  @IsString()
  @IsNotEmpty({ message: 'Tên chức vụ (name) không được để trống' })
  @MaxLength(150)
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  level?: number = 1;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;
}

