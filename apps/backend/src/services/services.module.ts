import { Module } from '@nestjs/common';
import { DbModule } from '../db/db.module.js';
import { PrismaStateManagerService } from './state-manager/prisma-state-manager.service.js';

@Module({
  imports: [DbModule],
  providers: [
    {
      provide: 'IStateManager',
      useClass: PrismaStateManagerService,
    },
  ],
  exports: ['IStateManager'],
})
export class ServicesModule {}
