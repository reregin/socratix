import { z } from 'zod';

export const SessionStateSchema = z.object({
  uid: z.string(),
  equation: z.string().nullable().optional(),
  problemType: z.enum(['arithmetic', 'algebra', 'geometry', 'statistics']).nullable().optional(),
  step: z.number().default(0),
  history: z.array(z.any()).default([]),
  next_state: z.string().nullable().optional(),
});

export type SessionState = z.infer<typeof SessionStateSchema>;
