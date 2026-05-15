import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ResponseGeneratorService } from './response-generator.service';
import type { ResponsePromptOutput } from '../prompt-builder/prompt-builder.types';

// Mock the AI SDK modules — same pattern as P1's router tests but for streaming
jest.mock('ai', () => ({
  streamText: jest.fn().mockReturnValue({
    textStream: (async function* () {
      yield 'Look ';
      yield 'at the ';
      yield 'balance scale — ';
      yield 'does it balance?';
    })(),
    text: Promise.resolve('Look at the balance scale — does it balance?'),
  }),
  generateText: jest.fn().mockResolvedValue({
    text: 'Look at the balance scale — does it balance with your answer? 🤔',
  }),
}));

jest.mock('@ai-sdk/groq', () => ({
  createGroq: jest.fn().mockReturnValue(
    jest.fn().mockReturnValue('mocked-groq-model'),
  ),
}));

describe('ResponseGeneratorService', () => {
  let service: ResponseGeneratorService;

  // ─── With API Key ─────────────────────────────────────────────

  describe('with GROQ_API_KEY configured', () => {
    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          ResponseGeneratorService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn().mockImplementation((key: string) => {
                const config: Record<string, string> = {
                  GROQ_API_KEY: 'test-groq-api-key',
                  GROQ_MODEL: 'llama-3.3-70b-versatile',
                  GROQ_TEMPERATURE: '0.7',
                  GROQ_MAX_TOKENS: '512',
                };
                return config[key];
              }),
            },
          },
        ],
      }).compile();

      service = module.get<ResponseGeneratorService>(ResponseGeneratorService);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    describe('generateStream', () => {
      it('should call streamText with correct parameters', async () => {
        const prompt = mockPrompt();
        const result = await service.generateStream(prompt);

        expect(result).not.toBeNull();

        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { streamText } = require('ai');
        expect(streamText).toHaveBeenCalledWith(
          expect.objectContaining({
            system: prompt.systemPrompt,
            prompt: prompt.userMessage,
            temperature: 0.7,
            maxOutputTokens: 512,
          }),
        );
      });

      it('should call createGroq with the API key', async () => {
        await service.generateStream(mockPrompt());

        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { createGroq } = require('@ai-sdk/groq');
        expect(createGroq).toHaveBeenCalledWith({
          apiKey: 'test-groq-api-key',
        });
      });

      it('should produce text chunks from the stream', async () => {
        const result = await service.generateStream(mockPrompt());
        const chunks: string[] = [];

        for await (const chunk of result!.textStream) {
          chunks.push(chunk);
        }

        expect(chunks).toEqual([
          'Look ',
          'at the ',
          'balance scale — ',
          'does it balance?',
        ]);
      });
    });

    describe('generateText', () => {
      it('should return the full text response', async () => {
        const text = await service.generateText(mockPrompt());

        expect(text).toBe(
          'Look at the balance scale — does it balance with your answer? 🤔',
        );
      });

      it('should call generateText with correct parameters', async () => {
        const prompt = mockPrompt();
        await service.generateText(prompt);

        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { generateText } = require('ai');
        expect(generateText).toHaveBeenCalledWith(
          expect.objectContaining({
            system: prompt.systemPrompt,
            prompt: prompt.userMessage,
          }),
        );
      });
    });
  });

  // ─── Without API Key ──────────────────────────────────────────

  describe('without GROQ_API_KEY', () => {
    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          ResponseGeneratorService,
          {
            provide: ConfigService,
            useValue: {
              // All env vars return undefined
              get: jest.fn().mockReturnValue(undefined),
            },
          },
        ],
      }).compile();

      service = module.get<ResponseGeneratorService>(ResponseGeneratorService);
    });

    it('generateStream should return null when API key is missing', async () => {
      const result = await service.generateStream(mockPrompt());
      expect(result).toBeNull();
    });

    it('generateText should return null when API key is missing', async () => {
      const result = await service.generateText(mockPrompt());
      expect(result).toBeNull();
    });
  });
});

// ─── Test Helpers ───────────────────────────────────────────────

function mockPrompt(): ResponsePromptOutput {
  return {
    systemPrompt:
      'You are Socratix, a Socratic math tutor. NEVER reveal the answer.',
    userMessage: 'I think the answer is 9',
  };
}
