import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createGroq } from '@ai-sdk/groq';
import { generateText } from 'ai';
import { z } from 'zod';
import { PlannerOutput, PlannerOutputSchema } from './planner.schema.js';
import type { Message } from '../router/router.service.js';

export const EMPTY_PLANNER_OUTPUT: PlannerOutput = {
  problemText: null,
  problemType: null,
  subtype: null,
  equation: null,
  normalizedExpression: null,
  studentAnswer: null,
  target: null,
  extractedParams: null,
  confidence: null,
  imageContext: null,
};

/**
 * Agent #1 - Planner Service
 *
 * Extracts structured math context from the latest student message while using
 * recent history only as secondary context when the latest message is truly a follow-up.
 */
@Injectable()
export class PlannerService {
  private readonly logger = new Logger(PlannerService.name);

  constructor(private readonly configService: ConfigService) {}

  async extract(
    message: string,
    conversationHistory: Message[] = [],
    intent: string = 'attempting_answer',
  ): Promise<PlannerOutput> {
    const apiKey = this.configService.get<string>('GROQ_API_KEY');
    if (!apiKey) {
      this.logger.warn('GROQ_API_KEY not set - returning null extraction');
      return EMPTY_PLANNER_OUTPUT;
    }

    const groq = createGroq({ apiKey });

    const historyContext = conversationHistory
      .slice(-10)
      .map((m) => `${m.role}: ${m.content}`)
      .join('\n');

    try {
      const result = await generateText({
        model: groq('openai/gpt-oss-120b'),
        providerOptions: {
          groq: { structuredOutputs: false },
        },
        temperature: 0,
        prompt: [
          'You are Agent #1 Planner for Socratix, an English-only math tutoring system.',
          'Your job is to extract structured information from the latest student message.',
          'Do not solve the problem unless extracting an obvious pattern is necessary for classification.',
          'Do not generate a tutoring response.',
          'Return only valid JSON. Do not include markdown.',
          '',
          'The latest user message has highest priority.',
          'If the latest user message contains a new explicit problem, equation, arithmetic expression, dataset, geometry description, or sequence, extract from the latest message.',
          'Only use previous state if the latest message is clearly a follow-up and does not contain a new problem.',
          '',
          `The router intent is "${intent}".`,
          '- If intent is "just_chatting", return null for all extractable fields and low confidence.',
          '- If intent is "new_problem", extract the new problem if one is present rather than reusing older math context.',
          '',
          'Only support English input intentionally in this pass.',
          'Non-English input may be ambiguous; if unsure, extract conservatively and lower confidence.',
          '',
          'Classify the problem into exactly one of these types when math is present:',
          '- arithmetic',
          '- algebra',
          '- geometry',
          '- statistics',
          '',
          'Sequences must be classified under algebra using subtypes like:',
          '- sequence',
          '- arithmetic_sequence',
          '- geometric_sequence',
          '',
          'Identify a subtype when possible:',
          '- arithmetic: expression_evaluation',
          '- algebra: linear_equation, sequence, arithmetic_sequence, geometric_sequence, unknown',
          '- geometry: square_area, rectangle_area, triangle_area, circle_area, perimeter, unknown',
          '- statistics: mean, median, mode, range, unknown',
          '',
          'Extraction rules:',
          '- Keep problemText as the latest user message when math is present.',
          '- Set equation when an explicit equation is present.',
          '- Set normalizedExpression for arithmetic phrased in words when possible.',
          '- Set studentAnswer when the student proposes a value or expression.',
          '- Set target when the request clearly asks to solve, evaluate, calculate, or find something.',
          '- Use extractedParams as a flexible object.',
          '- Never return null extractedParams if the message contains useful numbers, dimensions, datasets, or sequence terms; extract partial information instead.',
          '',
          'Helpful parameter examples:',
          '- Algebra equation: { "left": "5x + 5", "right": "10", "variable": "x" }',
          '- Sequence: { "sequence": [2, 4, 6, 8], "proposedNext": 10 }',
          '- Geometry: { "shape": "square", "sideLength": 5, "unit": "cm" }',
          '- Statistics: { "data": [2, 5, 6, 7, 890, 1] }',
          '- Arithmetic: { "numbers": [10, 100, 12], "operations": ["multiply", "divide"] }',
          '',
          'Return JSON using this shape:',
          '{',
          '  "problemText": string | null,',
          '  "problemType": "arithmetic" | "algebra" | "geometry" | "statistics" | null,',
          '  "subtype": string | null,',
          '  "equation": string | null,',
          '  "normalizedExpression": string | null,',
          '  "studentAnswer": number | string | null,',
          '  "target": string | null,',
          '  "extractedParams": object | null,',
          '  "confidence": number | null,',
          '  "imageContext": null',
          '}',
          '',
          'Conversation history (recent messages):',
          historyContext || '(none)',
          '',
          "Student's latest message:",
          '"""',
          message,
          '"""',
        ].join('\n'),
      });

      const parsed = this.parseJsonPayload(result.text, PlannerOutputSchema);
      const normalized = {
        ...EMPTY_PLANNER_OUTPUT,
        ...parsed,
      };
      this.logger.debug(
        `Planner extraction: equation="${normalized.equation ?? 'null'}" studentAnswer=${normalized.studentAnswer} type="${normalized.problemType}" subtype="${normalized.subtype ?? 'null'}"`,
      );
      return normalized;
    } catch (err) {
      this.logger.error('Planner LLM call failed - returning empty output', err);
      return EMPTY_PLANNER_OUTPUT;
    }
  }

  private parseJsonPayload<T>(
    rawText: string,
    schema: z.ZodType<T>,
  ): T {
    const normalized = rawText.trim()
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    const parsed = JSON.parse(normalized);
    return schema.parse(parsed);
  }
}
