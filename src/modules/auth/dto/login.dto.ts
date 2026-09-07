import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty({ message: 'Username hoặc email không được để trống' })
  usernameOrEmail: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'Password ít nhất 6 ký tự' })
  password: string;
}

