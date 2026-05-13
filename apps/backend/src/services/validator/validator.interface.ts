import type { ValidationInput, ValidationResult } from './validator.schema.js';

export const VALIDATOR = 'IValidator';

export interface IValidator {
  validate(input: ValidationInput): Promise<ValidationResult | null>;
}

