import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { VisualizerService } from './visualizer.service';
import type { VisualizerPromptOutput } from '../prompt-builder/prompt-builder.types';

describe('VisualizerService', () => {
  let service: VisualizerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VisualizerService,
        {
          provide: ConfigService,
          useValue: {
            // No API key — LLM fallback won't fire in unit tests
            get: jest.fn().mockReturnValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<VisualizerService>(VisualizerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateScene (Fallback Mode)', () => {
    it('should return empty scene when GROQ_API_KEY is not set', async () => {
      const mockPrompt: VisualizerPromptOutput = {
        systemPrompt: 'Test prompt',
        availableComponents: ['BalanceScale'],
        context: {
          equation: '3x = 9',
          problemType: 'algebra',
          studentAnswer: 3,
          isCorrect: true,
          expected: 3,
          step: 1,
          errorType: null,
        },
      };

      const result = await service.generateScene(mockPrompt);
      expect(result).toEqual({
        scene: [],
        animation: null,
      });
    });
  });

  describe('generateFromPrompt (Fallback Mode)', () => {
    it('should return empty scene when GROQ_API_KEY is not set', async () => {
      const result = await service.generateFromPrompt('Test prompt');
      expect(result).toEqual({
        scene: [],
        animation: null,
      });
    });
  });
});
