import { NotificationType } from '@prisma/client';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateNotificationDto {
  @IsString()
  @IsNotEmpty({ message: 'recipientId không được để trống' })
  recipientId: string;

  @IsEnum(NotificationType, { message: 'Loại thông báo không hợp lệ' })
  @IsNotEmpty()
  type: NotificationType;

  @IsString()
  @IsNotEmpty({ message: 'Tiêu đề (title) không được để trống' })
  @MaxLength(200)
  title: string;

  @IsString()
  @IsNotEmpty({ message: 'Nội dung thông báo (content) không được để trống' })
  content: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  relatedEntityType?: string;

  @IsString()
  @IsOptional()
  relatedEntityId?: string;
}

