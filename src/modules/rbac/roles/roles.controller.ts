import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { Roles } from '../../../core/decorators/roles.decorator';
import { AssignPermissionsDto, CreateRoleDto, QueryRoleDto, UpdateRoleDto } from './dto';
import { RolesService } from './roles.service';

@Roles('ADMIN')
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  // ─── ROLE CRUD ────────────────────────────────────────────────────────────────
  @Post()
  async create(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.create(createRoleDto);
  }

  @Get()
  async findAll(@Query() query: QueryRoleDto) {
    return this.rolesService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.rolesService.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    return this.rolesService.update(id, updateRoleDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.rolesService.remove(id);
  }

  // ─── ROLE - PERMISSIONS RELATION ENDPOINTS ───────────────────────────────────
  @Get(':id/permissions')
  async getPermissions(@Param('id') id: string) {
    return this.rolesService.getPermissions(id);
  }

  @Post(':id/permissions')
  async assignPermissions(
    @Param('id') id: string,
    @Body() dto: AssignPermissionsDto,
  ) {
    return this.rolesService.assignPermissions(id, dto);
  }

  @Put(':id/permissions')
  async syncPermissions(
    @Param('id') id: string,
    @Body() dto: AssignPermissionsDto,
  ) {
    return this.rolesService.syncPermissions(id, dto);
  }

  @Delete(':id/permissions/:permissionId')
  async removePermission(
    @Param('id') id: string,
    @Param('permissionId') permissionId: string,
  ) {
    return this.rolesService.removePermission(id, permissionId);
  }

  @HttpCode(HttpStatus.OK)
  @Delete(':id/permissions')
  async removeAllPermissions(@Param('id') id: string) {
    return this.rolesService.removeAllPermissions(id);
  }
}
