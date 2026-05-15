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

const NullableStringField = z.string().nullable().optional();
const RequiredNullableStringField = z.string().nullable().catch(null);
const RequiredNullableProblemTypeField = ProblemTypeEnum.nullable();
const RequiredNullableStudentAnswerField = z.union([z.number(), z.string()])
  .nullable()
  .catch(null);
const RequiredNullableExtractedParamsField = z.record(z.string(), z.unknown())
  .nullable()
  .catch(null);
const RequiredNullableImageContextField = z.string().nullable().catch(null);
const NullableConfidenceField = z.number()
  .min(0)
  .max(1)
  .nullable()
  .optional()
  .catch(null);

/**
 * Structured output produced by Agent #1 (Planner).
 *
 * The Planner extracts structured math context from the latest user message,
 * while keeping backward-compatible fields for existing downstream consumers.
 */
export const PlannerOutputSchema = z.object({
  problemText: NullableStringField.describe(
    'The latest problem statement or raw user message being analyzed.',
  ),
  problemType: RequiredNullableProblemTypeField.describe(
    'Classification of the problem domain.',
  ),
  subtype: NullableStringField.describe(
    'Subtype within the detected problem domain, such as linear_equation or square_area.',
  ),
  equation: RequiredNullableStringField.describe(
    'The mathematical equation extracted from the student message or conversation context. Null if no equation is present.',
  ),
  normalizedExpression: NullableStringField.describe(
    'Normalized arithmetic expression when the problem is phrased in natural language.',
  ),
  studentAnswer: RequiredNullableStudentAnswerField.describe(
    'The answer the student is attempting. Can be a number (3), fraction ("3/4"), ' +
    'or expression ("2x"). Pass raw to Validator for SymPy parsing. Null if not answering.',
  ),
  target: NullableStringField.describe(
    'The requested task, such as solve_for_x or calculate_area.',
  ),
  extractedParams: RequiredNullableExtractedParamsField.describe(
    'Flexible key-value parameters extracted from the problem statement.',
  ),
  confidence: NullableConfidenceField.describe(
    'Model confidence score between 0 and 1.',
  ),
  // TODO: Multimodal - always null until image pipeline is wired (see PIPELINE.md Phase 2)
  imageContext: RequiredNullableImageContextField.describe(
    'Extracted description of an uploaded image, if any. Null until multimodal input is supported.',
  ),
});

export type PlannerOutput = z.infer<typeof PlannerOutputSchema>;
