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
  Query,
} from '@nestjs/common';
import { Roles } from '../../../core/decorators/roles.decorator';
import { CreateBlockerDto, QueryBlockerDto, ResolveBlockerDto, UpdateBlockerDto } from './dto';
import { BlockersService } from './blockers.service';

@Roles('ADMIN')
@Controller('blockers')
export class BlockersController {
  constructor(private readonly blockersService: BlockersService) {}

  @Post()
  async create(@Body() createDto: CreateBlockerDto) {
    return this.blockersService.create(createDto);
  }

  @Get()
  async findAll(@Query() query: QueryBlockerDto) {
    return this.blockersService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.blockersService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateBlockerDto,
  ) {
    return this.blockersService.update(id, updateDto);
  }

  @HttpCode(HttpStatus.OK)
  @Patch(':id/resolve')
  async resolve(
    @Param('id') id: string,
    @Body() resolveDto: ResolveBlockerDto,
  ) {
    return this.blockersService.resolve(id, resolveDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.blockersService.remove(id);
  }
}

