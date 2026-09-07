import { IsNotEmpty, IsString } from 'class-validator';

export class ResolveBlockerDto {
  @IsString()
  @IsNotEmpty({ message: 'resolverId người giải quyết không được để trống' })
  resolverId: string;

  @IsString()
  @IsNotEmpty({ message: 'Giải pháp (solution) không được để trống' })
  solution: string;
}

