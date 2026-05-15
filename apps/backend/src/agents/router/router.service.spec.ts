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
            get: jest.fn().mockReturnValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<RouterService>(RouterService);
  });

  describe('classifyByRegex - Tier 1', () => {
    it('should return null for ambiguous or casual messages', () => {
      expect(service.classifyByRegex('hello there')).toBeNull();
      expect(service.classifyByRegex('ok cool')).toBeNull();
      expect(service.classifyByRegex('thanks')).toBeNull();
      expect(service.classifyByRegex('hmm let me think')).toBeNull();
    });

    it('should not treat plain "next" as a new problem request', () => {
      expect(service.classifyByRegex('what comes next')).toBeNull();
    });
  });

  describe('buildOutput - flag logic', () => {
    it('attempting_answer -> planner ON, validator ON', () => {
      expect(service.buildOutput('attempting_answer')).toEqual({
        intent: 'attempting_answer',
        plannerRequired: true,
        validatorRequired: true,
      });
    });

    it('conceptual_help -> planner ON, validator OFF', () => {
      expect(service.buildOutput('conceptual_help')).toEqual({
        intent: 'conceptual_help',
        plannerRequired: true,
        validatorRequired: false,
      });
    });

    it('new_problem -> planner ON, validator OFF', () => {
      expect(service.buildOutput('new_problem')).toEqual({
        intent: 'new_problem',
        plannerRequired: true,
        validatorRequired: false,
      });
    });

    it('just_chatting -> planner OFF, validator OFF', () => {
      expect(service.buildOutput('just_chatting')).toEqual({
        intent: 'just_chatting',
        plannerRequired: false,
        validatorRequired: false,
      });
    });
  });

  describe('classify - full flow', () => {
    const samples: { input: string; expected: Intent }[] = [
      { input: 'I think the answer is 9', expected: 'attempting_answer' },
      { input: 'x is 1 right?', expected: 'attempting_answer' },
      { input: 'x = 3', expected: 'attempting_answer' },
      {
        input: 'if the sequence is 2, 4, 6, 8, the next number is 10 right?',
        expected: 'attempting_answer',
      },
      { input: 'the next number is 10 right?', expected: 'attempting_answer' },

      { input: 'next problem please', expected: 'new_problem' },
      { input: 'Give me another problem', expected: 'new_problem' },
      { input: 'new question please', expected: 'new_problem' },

      { input: 'what is 10 times 100 divided by 12', expected: 'conceptual_help' },
      {
        input: 'Find the area of a square with side length 5 cm.',
        expected: 'conceptual_help',
      },
      { input: 'explain how mean works', expected: 'conceptual_help' },
      { input: 'solve 5x + 2 = 12', expected: 'conceptual_help' },
      { input: 'Can you help me?', expected: 'conceptual_help' },

      { input: 'hello there', expected: 'just_chatting' },
      { input: 'ok cool', expected: 'just_chatting' },
      { input: 'hmm let me think', expected: 'just_chatting' },
    ];

    samples.forEach(({ input, expected }, index) => {
      it(`Sample ${index + 1}: should classify "${input}" -> ${expected}`, async () => {
        const result = await service.classify(input);
        expect(result.intent).toBe(expected);

        const expectedFlags = service.buildOutput(expected);
        expect(result.validatorRequired).toBe(expectedFlags.validatorRequired);
        expect(result.plannerRequired).toBe(expectedFlags.plannerRequired);
      });
    });
  });
});
