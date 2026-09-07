import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class AssignPermissionsDto {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ message: 'Danh sách permissionIds không được để trống' })
  permissionIds: string[];
}
