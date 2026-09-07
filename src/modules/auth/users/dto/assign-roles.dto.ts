import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class AssignRolesDto {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ message: 'Danh sách roleIds không được để trống' })
  roleIds: string[];
}
