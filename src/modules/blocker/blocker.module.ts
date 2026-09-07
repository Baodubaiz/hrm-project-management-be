import { Module } from '@nestjs/common';
import { BlockersController } from './blockers/blockers.controller';
import { BlockersService } from './blockers/blockers.service';

@Module({
  controllers: [BlockersController],
  providers: [BlockersService],
  exports: [BlockersService],
})
export class BlockerModule {}

