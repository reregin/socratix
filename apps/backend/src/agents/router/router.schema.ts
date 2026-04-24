import { z } from 'zod';

/**
 * The four possible user intents the Router can classify.
 *
 * - attempting_answer — student is submitting a solution attempt
 * - conceptual_help  — student is asking for an explanation / hint
 * - new_problem      — student wants a new problem
 * - just_chatting    — off-topic or social greeting
 */
export const IntentEnum = z.enum([
  'attempting_answer',
  'conceptual_help',
  'new_problem',
  'just_chatting',
]);

export type Intent = z.infer<typeof IntentEnum>;

/**
 * Structured output produced by Agent #0 (Router).
 *
 * validatorRequired — true only for `attempting_answer` (needs math check)
 * plannerRequired   — true for everything except `just_chatting`
 */
export const RouterOutputSchema = z.object({
  intent: IntentEnum,
  validatorRequired: z.boolean(),
  plannerRequired: z.boolean(),
});

export type RouterOutput = z.infer<typeof RouterOutputSchema>;
