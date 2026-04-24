import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createGroq } from '@ai-sdk/groq';
import { generateObject } from 'ai';
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

/**
 * Agent #0 — Router Service
 *
 * Classifies user intent using a two-tier approach:
 *   Tier 1 — Regex fast-path (~5 ms)
 *   Tier 2 — Groq LLM fallback (~50-100 ms)
 *
 * Returns a RouterOutput with intent, validatorRequired, plannerRequired flags.
 */
@Injectable()
export class RouterService {
  private readonly logger = new Logger(RouterService.name);

  /**
   * Regex patterns for Tier 1 classification.
   * Order matters — first match wins.
   */
  private readonly regexPatterns: { pattern: RegExp; intent: Intent }[] = [
    {
      pattern: /\b(answer is|i got|i think|my answer|result is|i believe it'?s|it'?s|equals)\b/i,
      intent: 'attempting_answer',
    },
    {
      pattern: /\b(help|explain|how|why|what does|don'?t understand|can you show|teach me|what is|clarify)\b/i,
      intent: 'conceptual_help',
    },
    {
      pattern: /\b(new problem|next|another|different|give me|start over|reset)\b/i,
      intent: 'new_problem',
    },
  ];

  constructor(private readonly configService: ConfigService) {}

  /**
   * Classify user intent from a message and conversation history.
   *
   * @param message        - The latest user message
   * @param conversationHistory - Previous messages for LLM context (used only in Tier 2)
   * @returns RouterOutput
   */
  async classify(
    message: string,
    conversationHistory: Message[] = [],
  ): Promise<RouterOutput> {
    // --- Tier 1: Regex fast-path ---
    const regexResult = this.classifyByRegex(message);
    if (regexResult !== null) {
      this.logger.debug(`Router Tier 1 (regex): intent="${regexResult}"`);
      return this.buildOutput(regexResult);
    }

    // --- Tier 2: LLM fallback ---
    this.logger.debug('Router Tier 1 miss — falling back to LLM classifier');
    return this.classifyByLLM(message, conversationHistory);
  }

  /**
   * Tier 1 — Regex-based classifier. Returns null if no pattern matches.
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
   * Tier 2 — Lightweight LLM classifier using Groq (Llama 3.3 70B).
   */
  private async classifyByLLM(
    message: string,
    conversationHistory: Message[],
  ): Promise<RouterOutput> {
    const apiKey = this.configService.get<string>('GROQ_API_KEY');
    if (!apiKey) {
      this.logger.warn('GROQ_API_KEY not set — defaulting to just_chatting');
      return this.buildOutput('just_chatting');
    }

    const groq = createGroq({ apiKey });

    const historyContext = conversationHistory
      .slice(-6) // keep context window small for the classifier
      .map((m) => `${m.role}: ${m.content}`)
      .join('\n');

    const { object } = await generateObject({
      model: groq('llama-3.3-70b-versatile'),
      providerOptions: {
        groq: { structuredOutputs: false },
      },
      schema: z.object({
        intent: IntentEnum,
      }),
      prompt: [
        'You are an intent classifier for a Socratic math tutoring app.',
        'Classify the student\'s latest message into exactly one of these intents:',
        '- attempting_answer: the student is submitting or guessing an answer to a math problem',
        '- conceptual_help: the student is asking for an explanation, hint, or clarification',
        '- new_problem: the student wants a new or different problem',
        '- just_chatting: the student is making small talk or saying something unrelated to math',
        '',
        'Conversation history (last few messages):',
        historyContext || '(none)',
        '',
        `Student's latest message: "${message}"`,
        '',
        'Must output valid JSON.',
      ].join('\n'),
    });

    const intent = object.intent;
    this.logger.debug(`Router Tier 2 (LLM): intent="${intent}"`);
    return this.buildOutput(intent);
  }

  /**
   * Build the full RouterOutput with correct flags for a given intent.
   *
   * Flag logic (from PIPELINE.md):
   *   attempting_answer → planner ON,  validator ON
   *   conceptual_help   → planner ON,  validator OFF
   *   new_problem        → planner ON,  validator OFF
   *   just_chatting      → planner OFF, validator OFF
   */
  buildOutput(intent: Intent): RouterOutput {
    const flagMap: Record<Intent, { plannerRequired: boolean; validatorRequired: boolean }> = {
      attempting_answer: { plannerRequired: true, validatorRequired: true },
      conceptual_help:   { plannerRequired: true, validatorRequired: false },
      new_problem:       { plannerRequired: true, validatorRequired: false },
      just_chatting:     { plannerRequired: false, validatorRequired: false },
    };

    const flags = flagMap[intent];

    return RouterOutputSchema.parse({
      intent,
      ...flags,
    });
  }
}
