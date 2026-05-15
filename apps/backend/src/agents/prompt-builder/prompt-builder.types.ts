/**
 * Prompt Builder Type Contracts
 *
 * Defines all interfaces consumed and produced by Agent #2 (Prompt Builder).
 * These types bridge the gap between upstream agents (Router, Planner, Validator,
 * State Manager) and downstream agents (Visualizer, Response Generator).
 *
 * Reuses Zod-inferred types from P1 schemas where possible to avoid duplication.
 */

import type { RouterOutput } from '../router/router.schema.js';
import type { PlannerOutput, ProblemType } from '../planner/planner.schema.js';

// Re-export upstream types for convenience
export type { RouterOutput, PlannerOutput, ProblemType };

// ──────────────────────────────────────────────────────────────────────
// Conversation & State types (consumed from State Manager / BE)
// ──────────────────────────────────────────────────────────────────────

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface StateSnapshot {
  uid: string;
  equation: string | null;
  problemType: ProblemType | null;
  step: number;
  history: ConversationMessage[];
}

// ──────────────────────────────────────────────────────────────────────
// Validation result (consumed from BE Validator)
// ──────────────────────────────────────────────────────────────────────

export type ErrorType =
  | 'wrong_value'
  | 'sign_error'
  | 'arithmetic_error'
  | 'incomplete_step'
  | 'conceptual_error'
  | 'none';

export interface ValidationResult {
  isCorrect: boolean;
  expected: number | string;
  studentAnswer: number | string;
  errorType: ErrorType;
}

// ──────────────────────────────────────────────────────────────────────
// Prompt Builder Input (merge point — combines all upstream data)
// ──────────────────────────────────────────────────────────────────────

export interface StudentProfile {
  level: number;
  character: string;
}

export interface PromptBuilderInput {
  /** Intent classified by Router (Agent #0) */
  intent: RouterOutput['intent'];
  /** Equation extracted by Planner (Agent #1) */
  equation: string | null;
  /** Problem type classified by Planner (Agent #1) */
  problemType: ProblemType | null;
  /** Student's attempted answer from Planner (Agent #1) */
  studentAnswer: number | string | null;
  /** Validation result from BE Validator (null if validator was skipped) */
  validation: ValidationResult | null;
  /** Conversation history from State Manager */
  conversationHistory: ConversationMessage[];
  /** Student profile (optional, for adaptive difficulty) */
  studentProfile: StudentProfile | null;
  /** Current step number in the problem-solving session */
  step: number;
  /** The raw user message text */
  userMessage: string;
}

// ──────────────────────────────────────────────────────────────────────
// Prompt Builder Output → Visualizer (P3, Agent #4)
// ──────────────────────────────────────────────────────────────────────

export interface VisualLearningIntent {
  topic: string;
  step_number: number;
  socratic_question: string;
  math_state: string;
  target_concept: string;
  expected_student_focus: string;
  visual_type_expected:
    | 'balance_scale'
    | 'number_line'
    | 'fraction_bar'
    | 'area_model'
    | 'coordinate_plane'
    | 'geometry_shape'
    | 'angle_diagram'
    | 'bar_model'
    | 'table_pattern'
    | 'solid_shape'
    | 'simple_chart';
  visual_goal: string;
}

// ──────────────────────────────────────────────────────────────────────
// Scene Descriptor (received BACK from P3 Visualizer)
// ──────────────────────────────────────────────────────────────────────

export interface SceneComponent {
  component: string;
  props: Record<string, unknown>;
}

export interface SceneDescriptor {
  scene: SceneComponent[];
  animation: string | null;
}

// ──────────────────────────────────────────────────────────────────────
// Prompt Builder Output → Response Generator (Agent #3)
// ──────────────────────────────────────────────────────────────────────

export interface ResponsePromptOutput {
  systemPrompt: string;
  userMessage: string;
}
