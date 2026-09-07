import { IsNotEmpty, IsString } from 'class-validator';

export class CreateTaskCommentDto {
  @IsString()
  @IsNotEmpty({ message: 'taskId không được để trống' })
  taskId: string;

  @IsString()
  @IsNotEmpty({ message: 'authorId không được để trống' })
  authorId: string;

  @IsString()
  @IsNotEmpty({ message: 'Nội dung bình luận không được để trống' })
  content: string;
}
