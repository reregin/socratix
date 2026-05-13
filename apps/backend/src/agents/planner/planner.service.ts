import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createGroq } from '@ai-sdk/groq';
import { generateObject } from 'ai';
import { PlannerOutput, PlannerOutputSchema } from './planner.schema.js';
import type { Message } from '../router/router.service.js';

export const EMPTY_PLANNER_OUTPUT: PlannerOutput = {
  equation: null,
  studentAnswer: null,
  problemType: null,
  extractedParams: null,
  imageContext: null,
};

/**
 * Agent #1 — Planner Service
 *
 * Uses Groq (Llama 3.3 70B) in JSON structured mode to:
 *   1. Extract the mathematical equation from the conversation
 *   2. Extract the student's attempted answer (if any)
 *   3. Classify the problem type (arithmetic, algebra, geometry, statistics)
 *   4. Extract relevant numerical parameters from the equation
 *
 * Runs only when Router sets plannerRequired = true.
 */
@Injectable()
export class PlannerService {
  private readonly logger = new Logger(PlannerService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Extract structured math context from the student's message.
   *
   * @param message             - The latest user message
   * @param conversationHistory - Previous messages for context
   * @param intent              - The Router's classified intent (for prompt tuning)
   * @returns PlannerOutput
   */
  async extract(
    message: string,
    conversationHistory: Message[] = [],
    intent: string = 'attempting_answer',
  ): Promise<PlannerOutput> {
    const apiKey = this.configService.get<string>('GROQ_API_KEY');
    if (!apiKey) {
      this.logger.warn('GROQ_API_KEY not set — returning null extraction');
      return EMPTY_PLANNER_OUTPUT;
    }

    const groq = createGroq({ apiKey });

    const historyContext = conversationHistory
      .slice(-10) // Planner needs more history — equations are often introduced 5-8 turns back
                  // Do NOT reduce this; it will break equation extraction on longer sessions
      .map((m) => `${m.role}: ${m.content}`)
      .join('\n');

    try {
      const { object } = await generateObject({
        model: groq('llama-3.3-70b-versatile'),
        providerOptions: {
          groq: { structuredOutputs: false },
        },
        schema: PlannerOutputSchema,
        prompt: [
          'You are a math extraction agent for a Socratic tutoring app.',
          'Analyze the student\'s latest message and the conversation history to extract:',
          '',
          '1. **equation**: The mathematical equation being discussed (e.g., "3x + 5 = 14").',
          '   - Look in both the latest message AND the conversation history.',
          '   - If the equation was stated in a previous message by either the student or the tutor, extract it from there.',
          '   - Normalize the equation (e.g., "three x plus five equals fourteen" → "3x + 5 = 14").',
          '   - If no equation is present anywhere in the conversation, set to null.',
          '',
          '2. **studentAnswer**: The exact value or expression the student is attempting as their answer.',
          '   - Extract it as a raw string exactly as the student stated (e.g., "3/4", "2x", "pi", "3").',
          '   - The downstream Validator will parse and evaluate it — do not convert to decimal.',
          '   - If the student is not answering, set to null.',
          `   - The student's intent has been classified as: "${intent}".`,
          '   - If intent is "new_problem", all fields will likely be null — this is expected and correct.',
          '     Do not infer or hallucinate an equation from context.',
          '   - If intent is "just_chatting", return all null fields.',
          '',
          '3. **problemType**: Classify the math domain:',
          '   - "arithmetic": basic operations (add, subtract, multiply, divide) with concrete numbers',
          '   - "algebra": equations with variables (x, y, etc.)',
          '   - "geometry": shapes, areas, angles, coordinates',
          '   - "statistics": mean, median, probability, data sets',
          '   - If no math problem is present, set to null.',
          '',
          '4. **extractedParams**: Extract the left and right sides of the equation as strings,',
          '   plus any isolated coefficients needed for visualization:',
          '   - Always include: { "left": "3x + 5", "right": "14" }',
          '   - For linear equations (ax + b = c), also include: { "a": 3, "b": 5, "c": 14 }',
          '   - For quadratics (ax^2 + bx + c = 0), also include: { "a": 1, "b": 0, "c": -4 }',
          '   - If no equation, set to null.',
          '',
          'Conversation history (recent messages):',
          historyContext || '(none)',
          '',
          `Student's latest message:`,
          `"""`,
          message,
          `"""`,
          '',
          'Must output valid JSON.',
        ].join('\n'),
      });

      const result = PlannerOutputSchema.parse(object);
      this.logger.debug(
        `Planner extraction: equation="${result.equation ?? 'null'}" studentAnswer=${result.studentAnswer} type="${result.problemType}"`,
      );
      return result;
    } catch (err) {
      this.logger.error('Planner LLM call failed — returning empty output', err);
      return EMPTY_PLANNER_OUTPUT;
    }
  }

}
