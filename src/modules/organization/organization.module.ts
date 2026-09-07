import { Module } from '@nestjs/common';
import { DepartmentsController } from './departments/departments.controller';
import { DepartmentsService } from './departments/departments.service';
import { PositionsController } from './positions/positions.controller';
import { PositionsService } from './positions/positions.service';

@Module({
  controllers: [DepartmentsController, PositionsController],
  providers: [DepartmentsService, PositionsService],
  exports: [DepartmentsService, PositionsService],
})
export class OrganizationModule {}

