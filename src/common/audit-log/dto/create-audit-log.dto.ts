import { IsNotEmpty, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateAuditLogDto {
  @IsString()
  @IsOptional()
  userId?: string;

  @IsString()
  @IsNotEmpty({ message: 'Hành động (action) không được để trống' })
  @MaxLength(100)
  action: string;

  @IsString()
  @IsNotEmpty({ message: 'Tên thực thể (entityType) không được để trống' })
  @MaxLength(50)
  entityType: string;

  @IsString()
  @IsNotEmpty({ message: 'ID thực thể (entityId) không được để trống' })
  entityId: string;

  @IsObject()
  @IsOptional()
  payloadBefore?: Record<string, any>;

  @IsObject()
  @IsOptional()
  payloadAfter?: Record<string, any>;

  @IsString()
  @IsOptional()
  @MaxLength(45)
  ipAddress?: string;

  @IsString()
  @IsOptional()
  userAgent?: string;
}

