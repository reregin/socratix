import { z } from 'zod';

export const ValidationProblemTypeSchema = z.enum([
  'arithmetic',
  'algebra',
  'geometry',
  'statistics',
]);

export const ValidationInputSchema = z.object({
  equation: z.string().trim().min(1),
  studentAnswer: z.union([z.number(), z.string().trim().min(1)]),
  problemType: ValidationProblemTypeSchema.nullable().optional(),
});

export const ValidationErrorTypeSchema = z.enum([
  'wrong_value',
  'sign_error',
  'arithmetic_error',
  'incomplete_step',
  'conceptual_error',
  'none',
]);

export const ValidationResultSchema = z.object({
  isCorrect: z.boolean(),
  expected: z.union([z.number(), z.string()]),
  studentAnswer: z.union([z.number(), z.string()]),
  errorType: ValidationErrorTypeSchema,
});

export type ValidationInput = z.infer<typeof ValidationInputSchema>;
export type ValidationResult = z.infer<typeof ValidationResultSchema>;

