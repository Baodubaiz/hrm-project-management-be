import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'Mật khẩu hiện tại không được để trống' })
  oldPassword: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'Mật khẩu mới ít nhất 6 ký tự' })
  newPassword: string;
}

