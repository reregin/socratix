import { Test, TestingModule } from '@nestjs/testing';
import { PromptBuilderService } from './prompt-builder.service';
import type {
  PromptBuilderInput,
  SceneDescriptor,
  ValidationResult,
} from './prompt-builder.types';

describe('PromptBuilderService', () => {
  let service: PromptBuilderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PromptBuilderService],
    }).compile();

    service = module.get<PromptBuilderService>(PromptBuilderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── buildVisualizerPrompt ───────────────────────────────────────

  describe('buildVisualizerPrompt', () => {
    it('should include the equation in the visualizer prompt', () => {
      const input = mockInput({
        equation: '3x + 5 = 14',
        problemType: 'algebra',
        studentAnswer: 9,
        validation: mockValidation({ isCorrect: false, expected: 3, studentAnswer: 9 }),
      });

      const result = service.buildVisualizerPrompt(input);

      expect(result.systemPrompt).toContain('3x + 5 = 14');
      expect(result.context.equation).toBe('3x + 5 = 14');
    });

    it('should resolve BalanceScale for algebra problems', () => {
      const input = mockInput({ problemType: 'algebra' });

      const result = service.buildVisualizerPrompt(input);

      expect(result.availableComponents).toContain('BalanceScale');
      expect(result.availableComponents).toContain('Equation');
    });

    it('should resolve ShapeCanvas for geometry problems', () => {
      const input = mockInput({ problemType: 'geometry' });

      const result = service.buildVisualizerPrompt(input);

      expect(result.availableComponents).toContain('ShapeCanvas');
      expect(result.availableComponents).toContain('AngleMarker');
      expect(result.availableComponents).not.toContain('BalanceScale');
    });

    it('should resolve BarChart for statistics problems', () => {
      const input = mockInput({ problemType: 'statistics' });

      const result = service.buildVisualizerPrompt(input);

      expect(result.availableComponents).toContain('BarChart');
      expect(result.availableComponents).toContain('DataTable');
    });

    it('should fall back to arithmetic components for null problemType', () => {
      const input = mockInput({ problemType: null });

      const result = service.buildVisualizerPrompt(input);

      expect(result.availableComponents).toContain('NumberLine');
      expect(result.availableComponents).toContain('CountingBlocks');
    });

    it('should handle null equation gracefully', () => {
      const input = mockInput({ equation: null });

      const result = service.buildVisualizerPrompt(input);

      expect(result.systemPrompt).toContain('No equation');
      expect(result.context.equation).toBeNull();
    });

    it('should include error context when student answered incorrectly', () => {
      const input = mockInput({
        studentAnswer: 9,
        validation: mockValidation({
          isCorrect: false,
          expected: 3,
          studentAnswer: 9,
          errorType: 'wrong_value',
        }),
      });

      const result = service.buildVisualizerPrompt(input);

      expect(result.systemPrompt).toContain('answered 9 instead of 3');
      expect(result.context.isCorrect).toBe(false);
    });

    it('should include success context when student answered correctly', () => {
      const input = mockInput({
        studentAnswer: 3,
        validation: mockValidation({
          isCorrect: true,
          expected: 3,
          studentAnswer: 3,
          errorType: 'none',
        }),
      });

      const result = service.buildVisualizerPrompt(input);

      expect(result.systemPrompt).toContain('answered correctly');
      expect(result.context.isCorrect).toBe(true);
    });
  });

  // ─── buildResponsePrompt ────────────────────────────────────────

  describe('buildResponsePrompt', () => {
    it('should include Socratic guardrails for incorrect answer', () => {
      const input = mockInput({
        intent: 'attempting_answer',
        equation: '3x + 5 = 14',
        studentAnswer: 9,
        validation: mockValidation({ isCorrect: false, expected: 3, studentAnswer: 9 }),
      });

      const result = service.buildResponsePrompt(input, null);

      expect(result.systemPrompt).toContain('NEVER');
      expect(result.systemPrompt).toContain('reveal');
      expect(result.systemPrompt).toContain('3x + 5 = 14');
      expect(result.systemPrompt).toContain('DO NOT REVEAL');
    });

    it('should celebrate when the student is correct', () => {
      const input = mockInput({
        intent: 'attempting_answer',
        validation: mockValidation({
          isCorrect: true,
          expected: 5,
          studentAnswer: 5,
          errorType: 'none',
        }),
      });

      const result = service.buildResponsePrompt(input, null);

      expect(result.systemPrompt).toContain('CORRECT');
      expect(result.systemPrompt).toContain('Celebrate');
    });

    it('should inject scene context when visualization is available', () => {
      const input = mockInput({ intent: 'attempting_answer' });

      const scene: SceneDescriptor = {
        scene: [
          {
            component: 'BalanceScale',
            props: {
              left: '3(9)+5',
              leftValue: 32,
              right: '14',
              rightValue: 14,
              balanced: false,
            },
          },
        ],
        animation: 'tilt_scale_left',
      };

      const result = service.buildResponsePrompt(input, scene);

      expect(result.systemPrompt).toContain('VISUALIZATION ON SCREEN');
      expect(result.systemPrompt).toContain('BalanceScale');
      expect(result.systemPrompt).toContain('tilt_scale_left');
    });

    it('should NOT inject scene context when scene is null', () => {
      const input = mockInput({ intent: 'conceptual_help' });

      const result = service.buildResponsePrompt(input, null);

      expect(result.systemPrompt).not.toContain('VISUALIZATION ON SCREEN');
    });

    it('should NOT inject scene context when scene is empty', () => {
      const input = mockInput({ intent: 'attempting_answer' });
      const emptyScene: SceneDescriptor = { scene: [], animation: null };

      const result = service.buildResponsePrompt(input, emptyScene);

      expect(result.systemPrompt).not.toContain('VISUALIZATION ON SCREEN');
    });

    it('should use lightweight template for just_chatting intent', () => {
      const input = mockInput({
        intent: 'just_chatting',
        equation: null,
        problemType: null,
        validation: null,
      });

      const result = service.buildResponsePrompt(input, null);

      expect(result.systemPrompt).not.toContain('Error Classification');
      expect(result.systemPrompt).toContain('chatting');
    });

    it('should use new_problem template and include equation', () => {
      const input = mockInput({
        intent: 'new_problem',
        equation: '2x - 7 = 11',
        problemType: 'algebra',
      });

      const result = service.buildResponsePrompt(input, null);

      expect(result.systemPrompt).toContain('New Problem');
      expect(result.systemPrompt).toContain('2x - 7 = 11');
    });

    it('should include conversation history when available', () => {
      const input = mockInput({
        conversationHistory: [
          { role: 'user', content: 'How do I solve this?' },
          { role: 'assistant', content: 'What do you think the first step is?' },
        ],
      });

      const result = service.buildResponsePrompt(input, null);

      expect(result.systemPrompt).toContain('CONVERSATION HISTORY');
      expect(result.systemPrompt).toContain('How do I solve this?');
      expect(result.systemPrompt).toContain('What do you think the first step is?');
    });

    it('should truncate very long messages in history', () => {
      const longMessage = 'A'.repeat(300);
      const input = mockInput({
        conversationHistory: [
          { role: 'user', content: longMessage },
        ],
      });

      const result = service.buildResponsePrompt(input, null);

      expect(result.systemPrompt).toContain('...');
      expect(result.systemPrompt).not.toContain(longMessage);
    });

    it('should pass the user message through to output', () => {
      const input = mockInput({ userMessage: 'I think the answer is 9' });

      const result = service.buildResponsePrompt(input, null);

      expect(result.userMessage).toBe('I think the answer is 9');
    });

    it('should include error-specific strategy for sign_error', () => {
      const input = mockInput({
        intent: 'attempting_answer',
        validation: mockValidation({
          isCorrect: false,
          expected: -3,
          studentAnswer: 3,
          errorType: 'sign_error',
        }),
      });

      const result = service.buildResponsePrompt(input, null);

      expect(result.systemPrompt).toContain('sign error');
      expect(result.systemPrompt).toContain('negative');
    });
  });
});

// ─── Test Helpers ─────────────────────────────────────────────────

function mockInput(overrides: Partial<PromptBuilderInput> = {}): PromptBuilderInput {
  return {
    intent: 'attempting_answer',
    equation: '3x + 5 = 14',
    problemType: 'algebra',
    studentAnswer: 9,
    validation: {
      isCorrect: false,
      expected: 3,
      studentAnswer: 9,
      errorType: 'wrong_value',
    },
    conversationHistory: [],
    studentProfile: null,
    step: 1,
    userMessage: 'I think the answer is 9',
    ...overrides,
  };
}

function mockValidation(
  overrides: Partial<ValidationResult> = {},
): ValidationResult {
  return {
    isCorrect: false,
    expected: 3,
    studentAnswer: 9,
    errorType: 'wrong_value',
    ...overrides,
  };
}
