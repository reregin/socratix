import { Injectable } from '@nestjs/common';
import type { IValidator } from './validator.interface.js';
import { MathValidatorService } from './math-validator.service.js';
import { ValidationCacheService } from './validation-cache.service.js';
import {
  ValidationInput,
  ValidationInputSchema,
  ValidationResult,
} from './validator.schema.js';

@Injectable()
export class CachedValidatorService implements IValidator {
  constructor(
    private readonly mathValidator: MathValidatorService,
    private readonly validationCache: ValidationCacheService,
  ) {}

  async validate(input: ValidationInput): Promise<ValidationResult | null> {
    const parsedInput = ValidationInputSchema.safeParse(input);

    if (!parsedInput.success) {
      return null;
    }

    const validationInput = parsedInput.data;
    const cachedResult = await this.validationCache.get(validationInput);

    if (cachedResult) {
      return cachedResult;
    }

    const validationResult = await this.mathValidator.validate(validationInput);

    if (validationResult) {
      await this.validationCache.set(validationInput, validationResult);
    }

    return validationResult;
  }
}

