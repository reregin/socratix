import { z } from 'zod';

/**
 * Mathematical problem types the Planner can classify.
 * Matches the enum in state.schema.ts for consistency.
 */
export const ProblemTypeEnum = z.enum([
  'arithmetic',
  'algebra',
  'geometry',
  'statistics',
]);

export type ProblemType = z.infer<typeof ProblemTypeEnum>;

/**
 * Structured output produced by Agent #1 (Planner).
 *
 * The Planner uses Gemini Flash-Lite in JSON structured mode to extract:
 * - equation:         the mathematical equation from the conversation context
 * - studentAnswer:    the student's attempted answer (null if not attempting)
 * - problemType:      classification of the math domain
 * - extractedParams:  key-value pairs of numerical parameters from the equation
 */
export const PlannerOutputSchema = z.object({
  equation: z.string().nullable().describe(
    'The mathematical equation extracted from the student message or conversation context. Null if no equation is present.',
  ),
  studentAnswer: z.number().nullable().describe(
    'The numerical answer the student is attempting. Null if the student is not answering.',
  ),
  problemType: ProblemTypeEnum.nullable().describe(
    'Classification of the problem domain.',
  ),
  extractedParams: z.record(z.string(), z.number()).nullable().describe(
    'Key-value pairs of parameters extracted from the equation (e.g., { a: 3, b: 5, c: 14 } for 3x + 5 = 14).',
  ),
});

export type PlannerOutput = z.infer<typeof PlannerOutputSchema>;
