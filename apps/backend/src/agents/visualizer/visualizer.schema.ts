import { z } from 'zod';

/**
 * Schema input: Visual Step JSON dari Socratic Agent
 */
export const VisualStepInputSchema = z.object({
  topic: z.string(),
  step_number: z.number(),
  socratic_question: z.string(),
  math_state: z.string(),
  target_concept: z.string(),
  expected_student_focus: z.string(),
  visual_type_expected: z.enum([
    'balance_scale',
    'number_line',
    'fraction_bar',
    'area_model',
    'coordinate_plane',
    'geometry_shape',
    'angle_diagram',
    'bar_model',
    'table_pattern',
    'solid_shape',
    'simple_chart',
  ]),
  visual_goal: z.string(),
});

/**
 * Schema output: Simple Scene Plan JSON dari Math Visualizer Agent
 * Sesuai VISUALIZATION_AGENT_RULE.md Section 4
 */
export const SimpleScenePlanSchema = z.object({
  component: z.enum([
    'BalanceScaleVisualizer',
    'NumberLineVisualizer',
    'FractionBarVisualizer',
    'AreaModelVisualizer',
    'CoordinatePlaneVisualizer',
    'GeometryShapeVisualizer',
    'AngleDiagramVisualizer',
    'BarModelVisualizer',
    'TablePatternVisualizer',
    'SolidShapeVisualizer',
    'SimpleChartVisualizer',
  ]),
  scene_intent: z.string(),
  highlight_focus: z.string(),
  interaction_mode: z.enum([
    'none',
    'highlight',
    'select',
    'drag',
    'slider',
    'construct',
  ]),
  student_instruction: z.string(),
  correct_target: z.string(),
  hint: z.string(),
  success_feedback: z.string(),
});

export type VisualStepInput = z.infer<typeof VisualStepInputSchema>;
export type SimpleScenePlan = z.infer<typeof SimpleScenePlanSchema>;

/**
 * Fallback output jika LLM gagal menghasilkan JSON valid.
 * Sesuai VISUALIZATION_AGENT_RULE.md Section 16
 */
export const FALLBACK_SCENE_PLAN: SimpleScenePlan = {
  component: 'GeometryShapeVisualizer',
  scene_intent: 'Menampilkan visual sederhana sesuai langkah soal.',
  highlight_focus: 'bagian penting pada langkah ini',
  interaction_mode: 'highlight',
  student_instruction: 'Perhatikan bagian yang disorot.',
  correct_target: 'bagian yang disorot',
  hint: 'Coba baca kembali pertanyaannya dan perhatikan bagian yang disorot.',
  success_feedback: 'Bagus, kamu sudah memperhatikan bagian pentingnya.',
};
