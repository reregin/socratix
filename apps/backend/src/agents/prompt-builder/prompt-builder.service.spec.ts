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

  // ─── buildVisualIntent ──────────────────────────────────────────

  describe('buildVisualIntent', () => {
    it('should build visual intent for one-variable linear equation', () => {
      const input = mockInput({
        intent: 'conceptual_help',
        equation: '2x + 3 = 11',
        problemType: 'algebra',
        studentAnswer: null,
        validation: null,
        step: 1,
        userMessage: 'Tolong bantu 2x + 3 = 11',
      });

      const result = service.buildVisualIntent(input);

      expect(result).toEqual({
        topic: 'persamaan_linear_satu_variabel',
        step_number: 1,
        socratic_question:
          'Bagian mana yang harus kita hilangkan dulu agar x lebih mudah ditemukan?',
        math_state: '2x + 3 = 11',
        target_concept: 'mengisolasi variabel',
        expected_student_focus: '+3 di ruas kiri',
        visual_type_expected: 'balance_scale',
        visual_goal:
          'Menunjukkan bahwa persamaan 2x + 3 = 11 adalah dua sisi yang seimbang, dan siswa perlu memperhatikan +3 di ruas kiri untuk mengisolasi variabel.',
      });
    });

    it('should use input equation as math_state', () => {
      const input = mockInput({
        equation: '3x + 5 = 14',
        problemType: 'algebra',
      });

      const result = service.buildVisualIntent(input);

      expect(result.math_state).toBe('3x + 5 = 14');
      expect(result.topic).toBe('persamaan_linear_satu_variabel');
      expect(result.visual_type_expected).toBe('balance_scale');
    });

    it('should extract math_state from userMessage when equation is null', () => {
      const input = mockInput({
        equation: null,
        userMessage: 'Saya butuh bantuan untuk 4x - 2 = 10',
        problemType: 'algebra',
      });

      const result = service.buildVisualIntent(input);

      expect(result.math_state).toBe('4x - 2 = 10');
      expect(result.topic).toBe('persamaan_linear_satu_variabel');
      expect(result.visual_type_expected).toBe('balance_scale');
    });

    it('should use student answer focus for attempting_answer intent', () => {
      const input = mockInput({
        intent: 'attempting_answer',
        equation: '3x + 5 = 14',
        problemType: 'algebra',
        studentAnswer: 9,
        validation: mockValidation({
          isCorrect: false,
          expected: 3,
          studentAnswer: 9,
          errorType: 'wrong_value',
        }),
      });

      const result = service.buildVisualIntent(input);

      expect(result).toEqual({
        topic: 'persamaan_linear_satu_variabel',
        step_number: 1,
        socratic_question:
          'Kalau x = 9 saat disubstitusikan ke persamaan awal, apakah kedua ruas persamaan tetap seimbang?',
        math_state: '3x + 5 = 14',
        target_concept: 'memeriksa jawaban dengan substitusi',
        expected_student_focus:
          'x = 9 saat disubstitusikan ke persamaan awal',
        visual_type_expected: 'balance_scale',
        visual_goal:
          'Menunjukkan bahwa persamaan 3x + 5 = 14 adalah dua sisi yang seimbang, dan siswa perlu memperhatikan x = 9 saat disubstitusikan ke persamaan awal untuk memeriksa jawaban dengan substitusi.',
      });
    });

    it('should resolve geometry visual intent', () => {
      const input = mockInput({
        intent: 'conceptual_help',
        equation: null,
        problemType: 'geometry',
        studentAnswer: null,
        validation: null,
        userMessage: 'Bagaimana mencari luas segitiga?',
      });

      const result = service.buildVisualIntent(input);

      expect(result.topic).toBe('geometri');
      expect(result.target_concept).toBe(
        'memahami hubungan bentuk dan ukuran',
      );
      expect(result.visual_type_expected).toBe('shape_diagram');
      expect(result.socratic_question).toBe(
        'Bagian mana dari gambar yang paling membantu untuk mulai menyelesaikan soal ini?',
      );
    });

    it('should resolve statistics visual intent', () => {
      const input = mockInput({
        intent: 'conceptual_help',
        equation: null,
        problemType: 'statistics',
        studentAnswer: null,
        validation: null,
        userMessage: 'Bagaimana membaca data rata-rata?',
      });

      const result = service.buildVisualIntent(input);

      expect(result.topic).toBe('statistika');
      expect(result.target_concept).toBe(
        'membaca dan membandingkan data',
      );
      expect(result.visual_type_expected).toBe('data_chart');
      expect(result.socratic_question).toBe(
        'Data mana yang perlu kita bandingkan terlebih dahulu?',
      );
    });

    it('should fall back to arithmetic visual intent for null problemType', () => {
      const input = mockInput({
        intent: 'conceptual_help',
        equation: null,
        problemType: null,
        studentAnswer: null,
        validation: null,
        userMessage: 'Berapa 8 + 5?',
      });

      const result = service.buildVisualIntent(input);

      expect(result.topic).toBe('aritmetika');
      expect(result.target_concept).toBe('memahami operasi hitung');
      expect(result.visual_type_expected).toBe('number_line');
      expect(result.socratic_question).toBe(
        'Langkah kecil apa yang bisa kita coba terlebih dahulu?',
      );
    });
  });

  // ─── buildResponsePrompt ────────────────────────────────────────

  describe('buildResponsePrompt', () => {
    it('should include Socratic guardrails for incorrect answer', () => {
      const input = mockInput({
        intent: 'attempting_answer',
        equation: '3x + 5 = 14',
        studentAnswer: 9,
        validation: mockValidation({
          isCorrect: false,
          expected: 3,
          studentAnswer: 9,
        }),
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
          {
            role: 'assistant',
            content: 'What do you think the first step is?',
          },
        ],
      });

      const result = service.buildResponsePrompt(input, null);

      expect(result.systemPrompt).toContain('CONVERSATION HISTORY');
      expect(result.systemPrompt).toContain('How do I solve this?');
      expect(result.systemPrompt).toContain(
        'What do you think the first step is?',
      );
    });

    it('should truncate very long messages in history', () => {
      const longMessage = 'A'.repeat(300);
      const input = mockInput({
        conversationHistory: [{ role: 'user', content: longMessage }],
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

function mockInput(
  overrides: Partial<PromptBuilderInput> = {},
): PromptBuilderInput {
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