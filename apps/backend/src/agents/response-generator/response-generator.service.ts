import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createGroq } from '@ai-sdk/groq';
import { streamText, generateText } from 'ai';

import type { ResponsePromptOutput } from '../prompt-builder/prompt-builder.types.js';

/**
 * Agent #3 — Response Generator Service
 *
 * Calls an LLM (Groq — Llama 3) via the Vercel AI SDK to generate a
 * streamed Socratic chat response. Receives the fully-assembled system
 * prompt from Agent #2 (Prompt Builder) and returns a streaming result.
 *
 * This is the ONLY agent in P2's scope that makes an LLM call.
 *
 * Pipeline Phase: 5b (runs AFTER the Visualizer completes)
 * Timing: First token ~200-400ms, full response ~1-3s (streaming)
 */
@Injectable()
export class ResponseGeneratorService {
  private readonly logger = new Logger(ResponseGeneratorService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * LLM configuration — reads from environment, with sensible defaults.
   */
  private getConfig() {
    return {
      model: this.configService.get<string>('GROQ_MODEL') ?? 'llama-3.3-70b-versatile',
      temperature: parseFloat(
        this.configService.get<string>('GROQ_TEMPERATURE') ?? '0.7',
      ),
      maxOutputTokens: parseInt(
        this.configService.get<string>('GROQ_MAX_TOKENS') ?? '512',
        10,
      ),
    };
  }

  /**
   * Initialize the Groq provider with the API key from ConfigService.
   * Returns null if the API key is not configured.
   */
  private createProvider() {
    const apiKey = this.configService.get<string>('GROQ_API_KEY');
    if (!apiKey) {
      this.logger.warn('GROQ_API_KEY not set — cannot generate response');
      return null;
    }
    return createGroq({ apiKey });
  }

  /**
   * Generate a streamed Socratic response.
   *
   * This is the primary method used in production. The Chat Controller (P3)
   * pipes the stream into SSE for the frontend via the UI Message Stream Protocol.
   *
   * @param prompt - The fully-assembled prompt from Prompt Builder (Agent #2)
   * @returns The streamText result from the AI SDK, or null if provider is unavailable
   *
   * @example
   * ```typescript
   * const prompt = promptBuilder.buildResponsePrompt(input, scene);
   * const stream = await responseGenerator.generateStream(prompt);
   *
   * // In the SSE controller:
   * for await (const chunk of stream.textStream) {
   *   res.write(`data: ${JSON.stringify({ type: 'text_delta', content: chunk })}\n\n`);
   * }
   * ```
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async generateStream(prompt: ResponsePromptOutput): Promise<any | null> {
    const config = this.getConfig();
    this.logger.log(
      `Generating streamed response: model=${config.model}, temp=${config.temperature}`,
    );
    this.logger.debug(
      `User message: "${prompt.userMessage.substring(0, 80)}..."`,
    );

    const groq = this.createProvider();
    if (!groq) {
      return null;
    }

    const result = streamText({
      model: groq(config.model),
      system: prompt.systemPrompt,
      prompt: prompt.userMessage,
      temperature: config.temperature,
      maxOutputTokens: config.maxOutputTokens,
    });

    this.logger.log('Stream initiated successfully');
    return result;
  }

  /**
   * Generate a non-streaming response (for testing, fallback, or simple cases).
   *
   * @param prompt - The fully-assembled prompt from Prompt Builder (Agent #2)
   * @returns The full text response as a string, or null if provider is unavailable
   */
  async generateText(prompt: ResponsePromptOutput): Promise<string | null> {
    const config = this.getConfig();
    this.logger.log(
      `Generating non-streaming response: model=${config.model}`,
    );

    const groq = this.createProvider();
    if (!groq) {
      return null;
    }

    const result = await generateText({
      model: groq(config.model),
      system: prompt.systemPrompt,
      prompt: prompt.userMessage,
      temperature: config.temperature,
      maxOutputTokens: config.maxOutputTokens,
    });

    this.logger.log(`Response generated: ${result.text.length} chars`);
    return result.text;
  }
}
