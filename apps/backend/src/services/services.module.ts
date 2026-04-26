import { Module } from '@nestjs/common';
import { DbModule } from '../db/db.module.js';
import { PrismaStateManagerService } from './state-manager/prisma-state-manager.service.js';
import { CachedValidatorService } from './validator/cached-validator.service.js';
import { MathValidatorService } from './validator/math-validator.service.js';
import { ValidationCacheService } from './validator/validation-cache.service.js';
import { VALIDATOR } from './validator/validator.interface.js';

@Module({
  imports: [DbModule],
  providers: [
    MathValidatorService,
    ValidationCacheService,
    CachedValidatorService,
    {
      provide: 'IStateManager',
      useClass: PrismaStateManagerService,
    },
    {
      provide: VALIDATOR,
      useExisting: CachedValidatorService,
    },
  ],
  exports: ['IStateManager', VALIDATOR],
})
export class ServicesModule {}
