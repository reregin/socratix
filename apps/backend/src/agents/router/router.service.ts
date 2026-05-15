import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createGroq } from '@ai-sdk/groq';
import { generateText } from 'ai';
import { z } from 'zod';
import {
  Intent,
  RouterOutput,
  RouterOutputSchema,
  IntentEnum,
} from './router.schema.js';

/** Conversation message shape consumed by the Router. */
export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const RouterIntentPayloadSchema = z.object({
  intent: IntentEnum,
});

/**
 * Agent #0 - Router Service
 *
 * Classifies user intent using a two-tier approach:
 *   Tier 1 - Regex fast-path (~5 ms)
 *   Tier 2 - Groq LLM fallback (~50-100 ms)
 *
 * Returns a RouterOutput with intent, validatorRequired, plannerRequired flags.
 */
@Injectable()
export class RouterService {
  private readonly logger = new Logger(RouterService.name);

  /**
   * Regex patterns for Tier 1 classification.
   *
   * Order matters:
   *   1. attempting_answer
   *   2. new_problem
   *   3. conceptual_help
   */
  private readonly regexPatterns: { pattern: RegExp; intent: Intent }[] = [
    {
      pattern: /\b(i think|i got|i found|my answer is|the answer is|result is|i believe(?: it'?s)?|i guess)\b/i,
      intent: 'attempting_answer',
    },
    {
      pattern: /\b[a-zA-Z]\s*(?:is|=)\s*-?\d+(?:\.\d+)?\b/i,
      intent: 'attempting_answer',
    },
    {
      pattern: /\b(?:next number is|next term is)\s*-?\d+(?:\.\d+)?\b/i,
      intent: 'attempting_answer',
    },
    {
      pattern: /\b(?:it'?s|that'?s)\s*-?\d+(?:\.\d+)?\s*(?:right|correct)\??$/i,
      intent: 'attempting_answer',
    },
    {
      pattern: /\b(?:is|equals?|=)\s*-?\d+(?:\.\d+)?\s*(?:right|correct)\??$/i,
      intent: 'attempting_answer',
    },
    {
      pattern: /\b(new problem|another problem|next problem|next question|next exercise|give me another|new question)\b/i,
      intent: 'new_problem',
    },
    {
      pattern: /\b(help|explain|how|why|what does|don'?t understand|can you show|teach me|clarify)\b/i,
      intent: 'conceptual_help',
    },
    {
      pattern: /\b(find|calculate|compute|solve|evaluate|what is)\b/i,
      intent: 'conceptual_help',
    },
  ];

  constructor(private readonly configService: ConfigService) {}

  /**
   * Classify user intent from a message and conversation history.
   */
  async classify(
    message: string,
    conversationHistory: Message[] = [],
  ): Promise<RouterOutput> {
    const regexResult = this.classifyByRegex(message);
    if (regexResult !== null) {
      this.logger.debug(`Router Tier 1 (regex): intent="${regexResult}"`);
      return this.buildOutput(regexResult);
    }

    this.logger.debug('Router Tier 1 miss - falling back to LLM classifier');
    return this.classifyByLLM(message, conversationHistory);
  }

  /**
   * Tier 1 - Regex-based classifier. Returns null if no pattern matches.
   */
  classifyByRegex(message: string): Intent | null {
    for (const { pattern, intent } of this.regexPatterns) {
      if (pattern.test(message)) {
        return intent;
      }
    }
    return null;
  }

  /**
   * Tier 2 - Lightweight LLM classifier using Groq.
   */
  private async classifyByLLM(
    message: string,
    conversationHistory: Message[],
  ): Promise<RouterOutput> {
    const apiKey = this.configService.get<string>('GROQ_API_KEY');
    if (!apiKey) {
      this.logger.warn('GROQ_API_KEY not set - defaulting to just_chatting');
      return this.buildOutput('just_chatting');
    }

    const groq = createGroq({ apiKey });

    const historyContext = conversationHistory
      .slice(-6)
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
          'You are an intent classifier for an English-only Socratic math tutoring app.',
          'Classify the latest student message into exactly one of these intents:',
          '- attempting_answer: the student proposes an answer or asks whether their answer is correct',
          '- conceptual_help: the student asks for explanation, solving help, or provides a problem to work on',
          '- new_problem: the student explicitly asks for another or a fresh problem',
          '- just_chatting: the message is casual or unrelated to a math task',
          '',
          'Important rules:',
          '- Only support English intentionally in this pass.',
          '- Non-English or mixed-language inputs may be ambiguous and should default conservatively.',
          '- "next" alone is not new_problem; phrases like "next problem" are new_problem.',
          '- Messages like "x is 1 right?" or "the next number is 10 right?" are attempting_answer.',
          '- Messages like "what is 10 times 100 divided by 12" or "find the area of a square" are conceptual_help.',
          '- Short acknowledgments like "ok", "cool", or "thanks" are just_chatting.',
          '',
          'Return only valid JSON with this exact shape:',
          '{"intent":"attempting_answer"|"conceptual_help"|"new_problem"|"just_chatting"}',
          '',
          'Conversation history (last few messages):',
          historyContext || '(none)',
          '',
          "Student's latest message:",
          '"""',
          message,
          '"""',
        ].join('\n'),
      });

      const parsed = this.parseJsonPayload(result.text, RouterIntentPayloadSchema);
      this.logger.debug(`Router Tier 2 (LLM): intent="${parsed.intent}"`);
      return this.buildOutput(parsed.intent);
    } catch (err) {
      this.logger.error('Router LLM call failed - defaulting to just_chatting', err);
      return this.buildOutput('just_chatting');
    }
  }

  buildOutput(intent: Intent): RouterOutput {
    const flagMap: Record<
      Intent,
      { plannerRequired: boolean; validatorRequired: boolean }
    > = {
      attempting_answer: { plannerRequired: true, validatorRequired: true },
      conceptual_help: { plannerRequired: true, validatorRequired: false },
      new_problem: { plannerRequired: true, validatorRequired: false },
      just_chatting: { plannerRequired: false, validatorRequired: false },
    };

    return RouterOutputSchema.parse({
      intent,
      ...flagMap[intent],
    });
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
