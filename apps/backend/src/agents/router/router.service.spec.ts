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
    const testCases: { input: string; expected: Intent }[] = [
      // attempting_answer
      { input: 'I think the answer is 9', expected: 'attempting_answer' },
      { input: 'i got 42', expected: 'attempting_answer' },
      { input: 'my answer is 3', expected: 'attempting_answer' },
      { input: 'The result is 7', expected: 'attempting_answer' },
      { input: 'I believe it\'s 5', expected: 'attempting_answer' },
      { input: 'it equals 12', expected: 'attempting_answer' },

      // conceptual_help
      { input: 'Can you help me?', expected: 'conceptual_help' },
      { input: 'Explain how to solve this', expected: 'conceptual_help' },
      { input: 'How do I factor this?', expected: 'conceptual_help' },
      { input: 'Why do we divide both sides?', expected: 'conceptual_help' },
      { input: 'What does x represent?', expected: 'conceptual_help' },
      { input: 'I don\'t understand this step', expected: 'conceptual_help' },
      { input: 'Can you show me?', expected: 'conceptual_help' },
      { input: 'What is a variable?', expected: 'conceptual_help' },

      // new_problem
      { input: 'Give me a new problem', expected: 'new_problem' },
      { input: 'Next question please', expected: 'new_problem' },
      { input: 'Another one', expected: 'new_problem' },
      { input: 'I want a different problem', expected: 'new_problem' },
      { input: 'Let\'s start over', expected: 'new_problem' },
    ];

    testCases.forEach(({ input, expected }) => {
      it(`should classify "${input}" → ${expected}`, () => {
        expect(service.classifyByRegex(input)).toBe(expected);
      });
    });

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

  // ─── classify() Integration Tests ──────────────────────────────

  describe('classify — full flow', () => {
    it('should use regex result without calling LLM', async () => {
      const result = await service.classify('I think the answer is 9');
      expect(result.intent).toBe('attempting_answer');
      expect(result.validatorRequired).toBe(true);
      expect(result.plannerRequired).toBe(true);
    });

    it('should fallback to just_chatting when no API key and regex misses', async () => {
      // "hello there" doesn't match any regex, and API key is undefined
      const result = await service.classify('hello there');
      expect(result.intent).toBe('just_chatting');
      expect(result.validatorRequired).toBe(false);
      expect(result.plannerRequired).toBe(false);
    });
  });
});
