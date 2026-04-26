import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { RouterService } from './router.service';
import type { Intent } from './router.schema';

describe('RouterService', () => {
  let service: RouterService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RouterService,
        {
          provide: ConfigService,
          useValue: {
            // No API key — LLM fallback won't fire in unit tests
            get: jest.fn().mockReturnValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<RouterService>(RouterService);
  });

  // ─── Regex Tier Tests ──────────────────────────────────────────

  describe('classifyByRegex — Tier 1', () => {
    it('should return null for ambiguous messages', () => {
      expect(service.classifyByRegex('hello there')).toBeNull();
      expect(service.classifyByRegex('ok cool')).toBeNull();
      expect(service.classifyByRegex('thanks')).toBeNull();
      expect(service.classifyByRegex('hmm let me think')).toBeNull();
    });
  });

  // ─── Flag Logic Tests ─────────────────────────────────────────

  describe('buildOutput — flag logic', () => {
    it('attempting_answer → planner ON, validator ON', () => {
      const result = service.buildOutput('attempting_answer');
      expect(result).toEqual({
        intent: 'attempting_answer',
        plannerRequired: true,
        validatorRequired: true,
      });
    });

    it('conceptual_help → planner ON, validator OFF', () => {
      const result = service.buildOutput('conceptual_help');
      expect(result).toEqual({
        intent: 'conceptual_help',
        plannerRequired: true,
        validatorRequired: false,
      });
    });

    it('new_problem → planner ON, validator OFF', () => {
      const result = service.buildOutput('new_problem');
      expect(result).toEqual({
        intent: 'new_problem',
        plannerRequired: true,
        validatorRequired: false,
      });
    });

    it('just_chatting → planner OFF, validator OFF', () => {
      const result = service.buildOutput('just_chatting');
      expect(result).toEqual({
        intent: 'just_chatting',
        plannerRequired: false,
        validatorRequired: false,
      });
    });
  });

  // ─── classify() Integration Tests (20-Sample Set) ─────────────

  describe('classify — full flow (20-sample set)', () => {
    const samples: { input: string; expected: Intent }[] = [
      // Verifying deterministic regex-fast-path catches common submission patterns
      { input: 'I think the answer is 9', expected: 'attempting_answer' },
      { input: 'i got 42', expected: 'attempting_answer' },
      { input: 'my answer is 3', expected: 'attempting_answer' },
      { input: 'The result is 7', expected: 'attempting_answer' },
      { input: 'I believe it\'s 5', expected: 'attempting_answer' },
      
      // Verifying intent classifier properly routes requests for explanations to the conceptual layer
      { input: 'Can you help me?', expected: 'conceptual_help' },
      { input: 'Explain how to solve this', expected: 'conceptual_help' },
      { input: 'How do I factor this?', expected: 'conceptual_help' },
      { input: 'Why do we divide both sides?', expected: 'conceptual_help' },
      { input: 'What does x represent?', expected: 'conceptual_help' },
      
      // Verifying explicit requests for task transition trigger the planner's state reset
      { input: 'Give me a new problem', expected: 'new_problem' },
      { input: 'Next question please', expected: 'new_problem' },
      { input: 'Another one', expected: 'new_problem' },
      { input: 'I want a different problem', expected: 'new_problem' },
      { input: 'Let\'s start over', expected: 'new_problem' },

      // Testing LLM mock fallback behavior. When the API key is absent, the service safely defaults to 'just_chatting'
      // to avoid unhandled exceptions during unrecognized or ambiguous inputs.
      { input: 'hello there', expected: 'just_chatting' },
      { input: 'ok cool', expected: 'just_chatting' },
      { input: 'hmm let me think', expected: 'just_chatting' },

      // Verifying the regex tier handles multilingual edge cases by matching English keywords despite surrounding foreign text
      { input: 'mi answer is 5', expected: 'attempting_answer' },
      { input: 'ayuda me explain this', expected: 'conceptual_help' },
    ];

    samples.forEach(({ input, expected }, index) => {
      it(`Sample ${index + 1}: should classify "${input}" → ${expected}`, async () => {
        const result = await service.classify(input);
        expect(result.intent).toBe(expected);
        
        // Also verify the flags are correctly set based on the expected intent
        const expectedFlags = service.buildOutput(expected);
        expect(result.validatorRequired).toBe(expectedFlags.validatorRequired);
        expect(result.plannerRequired).toBe(expectedFlags.plannerRequired);
      });
    });
  });
});
