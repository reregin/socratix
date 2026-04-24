import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { PlannerOutput, PlannerOutputSchema } from './planner.schema.js';
import type { Message } from '../router/router.service.js';

/**
 * Agent #1 — Planner Service
 *
 * Uses Gemini Flash-Lite in JSON structured mode to:
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
    const apiKey = this.configService.get<string>('GOOGLE_GENERATIVE_AI_API_KEY');
    if (!apiKey) {
      this.logger.warn('GOOGLE_GENERATIVE_AI_API_KEY not set — returning null extraction');
      return this.emptyOutput();
    }

    const google = createGoogleGenerativeAI({ apiKey });

    const historyContext = conversationHistory
      .slice(-10) // planner needs more context than router to find the equation
      .map((m) => `${m.role}: ${m.content}`)
      .join('\n');

    const { object } = await generateObject({
      model: google('gemini-2.0-flash-lite'),
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
        '2. **studentAnswer**: The numerical value the student is attempting as their answer.',
        `   - The student's intent has been classified as: "${intent}".`,
        '   - If intent is "attempting_answer", look for the student\'s proposed value.',
        '   - If the student is not answering, set to null.',
        '',
        '3. **problemType**: Classify the math domain:',
        '   - "arithmetic": basic operations (add, subtract, multiply, divide) with concrete numbers',
        '   - "algebra": equations with variables (x, y, etc.)',
        '   - "geometry": shapes, areas, angles, coordinates',
        '   - "statistics": mean, median, probability, data sets',
        '   - If no math problem is present, set to null.',
        '',
        '4. **extractedParams**: Key numerical parameters from the equation as a JSON object.',
        '   - For "3x + 5 = 14", extract: { "a": 3, "b": 5, "c": 14 }',
        '   - For "x^2 - 4 = 0", extract: { "a": 1, "b": -4, "c": 0 }',
        '   - If no equation, set to null.',
        '',
        'Conversation history (recent messages):',
        historyContext || '(none)',
        '',
        `Student's latest message: "${message}"`,
      ].join('\n'),
    });

    const result = PlannerOutputSchema.parse(object);
    this.logger.debug(
      `Planner extraction: equation="${result.equation}" studentAnswer=${result.studentAnswer} type="${result.problemType}"`,
    );
    return result;
  }

  /**
   * Returns an empty PlannerOutput (all null). Used as fallback
   * when the API key is missing or the LLM call fails.
   */
  private emptyOutput(): PlannerOutput {
    return {
      equation: null,
      studentAnswer: null,
      problemType: null,
      extractedParams: null,
    };
  }
}
