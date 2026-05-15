import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Groq } from 'groq-sdk';
import {
  SimpleScenePlanSchema,
  FALLBACK_SCENE_PLAN,
  type VisualStepInput,
  type SimpleScenePlan,
} from './visualizer.schema.js';

/**
 * Agent #4 — Math Visualizer Agent v1
 *
 * Sesuai VISUALIZATION_AGENT_RULE.md:
 * - Menerima Visual Step JSON dari Socratic Agent
 * - Menghasilkan Simple Scene Plan JSON
 * - Menggunakan Groq (Llama 3.3 70B) dengan JSON structured mode
 * - Tidak membuat SVG/HTML/koordinat detail — hanya rencana visual
 */
@Injectable()
export class VisualizerService {
  private readonly logger = new Logger(VisualizerService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Generate a Simple Scene Plan from a Visual Step JSON.
   * Sesuai alur: Socratic Agent → Visual Step JSON → Math Visualizer Agent → Simple Scene Plan
   */
  async generateScenePlan(input: VisualStepInput): Promise<SimpleScenePlan> {
    this.logger.debug(
      `Generating scene plan for topic="${input.topic}" step=${input.step_number}`,
    );

    const systemPrompt = this.buildPrompt(input);
    return this.callLLM(systemPrompt);
  }

  /**
   * Build the LLM prompt sesuai VISUALIZATION_AGENT_RULE.md Section 17
   */
  private buildPrompt(input: VisualStepInput): string {
    return `You are a Math Visualization Planner for Indonesian middle school students.

Your task is to convert a Visual Step JSON into a Simple Scene Plan JSON.

Rules:
- Output JSON only.
- Do not solve the problem.
- Do not reveal the final answer.
- Use only the allowed component names.
- Use only the allowed interaction modes.
- Keep all text in Indonesian.
- Keep the scene simple and focused on one concept.
- Do not create SVG, HTML, coordinates, CSS, or detailed render objects.
- Do not add fields outside the required JSON shape.

Allowed components:
- BalanceScaleVisualizer
- NumberLineVisualizer
- FractionBarVisualizer
- AreaModelVisualizer
- CoordinatePlaneVisualizer
- GeometryShapeVisualizer
- AngleDiagramVisualizer
- BarModelVisualizer
- TablePatternVisualizer
- SolidShapeVisualizer
- SimpleChartVisualizer

Allowed interaction modes:
- none
- highlight
- select
- drag
- slider
- construct

Return exactly this JSON shape:
{
  "component": "",
  "scene_intent": "",
  "highlight_focus": "",
  "interaction_mode": "",
  "student_instruction": "",
  "correct_target": "",
  "hint": "",
  "success_feedback": ""
}

Visual Step JSON:
${JSON.stringify(input, null, 2)}`;
  }

  /**
   * Reusable LLM call for JSON generation with Zod validation + fallback.
   */
  private async callLLM(systemPrompt: string): Promise<SimpleScenePlan> {
    const apiKey = this.configService.get<string>('GROQ_API_KEY');
    if (!apiKey) {
      this.logger.warn('GROQ_API_KEY not set — returning fallback scene plan');
      return FALLBACK_SCENE_PLAN;
    }

    const groq = new Groq({ apiKey });
    const modelStr =
      this.configService.get<string>('GROQ_MODEL') ?? 'llama-3.3-70b-versatile';

    try {
      const chatCompletion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: systemPrompt }],
        model: modelStr,
        temperature: 0.7,
        max_tokens: 1024,
        response_format: { type: 'json_object' },
      });

      const content = chatCompletion.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(content);

      // Validate with Zod
      const result = SimpleScenePlanSchema.safeParse(parsed);

      if (result.success) {
        this.logger.debug(
          `Scene plan generated: component=${result.data.component}, mode=${result.data.interaction_mode}`,
        );
        return result.data;
      } else {
        this.logger.warn(
          'LLM output did not match SimpleScenePlan schema — using fallback',
          result.error.issues,
        );
        return FALLBACK_SCENE_PLAN;
      }
    } catch (error) {
      this.logger.error('Failed to generate scene plan JSON', error);
      return FALLBACK_SCENE_PLAN;
    }
  }
}
