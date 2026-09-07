import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateTaskCommentDto {
  @IsString()
  @IsNotEmpty({ message: 'Nội dung bình luận không được để trống' })
  content: string;
}
