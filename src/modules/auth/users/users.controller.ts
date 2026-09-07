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
import { AssignRolesDto, CreateUserDto, QueryUserDto, UpdateUserDto } from './dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ─── USER CRUD ───────────────────────────────────────────────────────────────
  @Roles('ADMIN')
  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Roles('ADMIN')
  @Get()
  async findAll(@Query() query: QueryUserDto) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Roles('ADMIN')
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @Patch(':id/unlock')
  async unlock(@Param('id') id: string) {
    return this.usersService.unlock(id);
  }

  @Roles('ADMIN')
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  // ─── USER - ROLES RELATION ENDPOINTS ─────────────────────────────────────────
  @Roles('ADMIN')
  @Get(':id/roles')
  async getRoles(@Param('id') id: string) {
    return this.usersService.getRoles(id);
  }

  @Roles('ADMIN')
  @Post(':id/roles')
  async assignRoles(
    @Param('id') id: string,
    @Body() dto: AssignRolesDto,
  ) {
    return this.usersService.assignRoles(id, dto);
  }

  @Roles('ADMIN')
  @Put(':id/roles')
  async syncRoles(
    @Param('id') id: string,
    @Body() dto: AssignRolesDto,
  ) {
    return this.usersService.syncRoles(id, dto);
  }

  @Roles('ADMIN')
  @Delete(':id/roles/:roleId')
  async removeRole(
    @Param('id') id: string,
    @Param('roleId') roleId: string,
  ) {
    return this.usersService.removeRole(id, roleId);
  }

  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @Delete(':id/roles')
  async removeAllRoles(@Param('id') id: string) {
    return this.usersService.removeAllRoles(id);
  }
}
