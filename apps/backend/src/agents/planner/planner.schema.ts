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
 * The Planner uses Groq (Llama 3.3 70B) in JSON structured mode to extract:
 * - equation:         the mathematical equation from the conversation context
 * - studentAnswer:    the student's attempted answer (null if not attempting)
 * - problemType:      classification of the math domain
 * - extractedParams:  key-value pairs of numerical parameters from the equation
 */
export const PlannerOutputSchema = z.object({
  equation: z.string().nullable().describe(
    'The mathematical equation extracted from the student message or conversation context. Null if no equation is present.',
  ),
  studentAnswer: z.union([z.number(), z.string()]).nullable().catch(null).describe(
    'The answer the student is attempting. Can be a number (3), fraction ("3/4"), ' +
    'or expression ("2x"). Pass raw to Validator for SymPy parsing. Null if not answering.',
  ),
  problemType: ProblemTypeEnum.nullable().describe(
    'Classification of the problem domain.',
  ),
  extractedParams: z.record(z.string(), z.union([z.number(), z.string()])).nullable().catch(null).describe(
    'Key-value pairs of parameters extracted from the equation (e.g., { a: 3, b: 5, c: 14 } for 3x + 5 = 14).',
  ),
  // TODO: Multimodal — always null until image pipeline is wired (see PIPELINE.md Phase 2)
  imageContext: z.string().nullable().catch(null).describe(
    'Extracted description of an uploaded image, if any. Null until multimodal input is supported.',
  ),
});

export type PlannerOutput = z.infer<typeof PlannerOutputSchema>;
