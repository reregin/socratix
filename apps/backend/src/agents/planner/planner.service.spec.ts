import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { generateText } from 'ai';
import { PlannerService, EMPTY_PLANNER_OUTPUT } from './planner.service';
import { PlannerOutputSchema } from './planner.schema';

jest.mock('ai', () => ({
  generateText: jest.fn(),
}));

jest.mock('@ai-sdk/groq', () => ({
  createGroq: jest.fn().mockReturnValue(
    jest.fn().mockReturnValue('mocked-groq-model'),
  ),
}));

describe('PlannerService', () => {
  describe('PlannerOutputSchema', () => {
    it('should validate a complete algebra extraction result', () => {
      const valid = {
        problemText: 'if 5x + 5 = 10, x is 1 right?',
        problemType: 'algebra',
        subtype: 'linear_equation',
        equation: '5x + 5 = 10',
        normalizedExpression: null,
        studentAnswer: 1,
        target: 'solve_for_x',
        extractedParams: { left: '5x + 5', right: '10', variable: 'x' },
        confidence: 0.95,
        imageContext: null,
      };

      expect(() => PlannerOutputSchema.parse(valid)).not.toThrow();
    });

    it('should validate arithmetic extraction with normalized expression', () => {
      const valid = {
        problemText: 'what is 10 times 100 divided by 12',
        problemType: 'arithmetic',
        subtype: 'expression_evaluation',
        equation: null,
        normalizedExpression: '10 * 100 / 12',
        studentAnswer: null,
        target: 'evaluate_expression',
        extractedParams: {
          numbers: [10, 100, 12],
          operations: ['multiply', 'divide'],
        },
        confidence: 0.95,
        imageContext: null,
      };

      expect(() => PlannerOutputSchema.parse(valid)).not.toThrow();
    });

    it('should validate geometry extraction with flexible params', () => {
      const valid = {
        problemText: 'Find the area of a square with a side length of 5 cm.',
        problemType: 'geometry',
        subtype: 'square_area',
        equation: null,
        normalizedExpression: null,
        studentAnswer: null,
        target: 'calculate_area',
        extractedParams: { shape: 'square', sideLength: 5, unit: 'cm' },
        confidence: 0.9,
        imageContext: null,
      };

      expect(() => PlannerOutputSchema.parse(valid)).not.toThrow();
    });

    it('should validate statistics extraction with data array', () => {
      const valid = {
        problemText: 'find the mean of this data: 2, 5, 6, 7, 890, 1',
        problemType: 'statistics',
        subtype: 'mean',
        equation: null,
        normalizedExpression: null,
        studentAnswer: null,
        target: 'calculate_mean',
        extractedParams: { data: [2, 5, 6, 7, 890, 1] },
        confidence: 0.95,
        imageContext: null,
      };

      expect(() => PlannerOutputSchema.parse(valid)).not.toThrow();
    });

    it('should validate an all-null fallback result', () => {
      expect(() => PlannerOutputSchema.parse(EMPTY_PLANNER_OUTPUT)).not.toThrow();
    });

    it('should reject an invalid problem type', () => {
      const invalid = {
        ...EMPTY_PLANNER_OUTPUT,
        problemType: 'calculus',
      };

      expect(() => PlannerOutputSchema.parse(invalid)).toThrow();
    });

    it('should allow omitted additive fields for backward compatibility', () => {
      const parsed = PlannerOutputSchema.parse({
        equation: '3x + 5 = 14',
        studentAnswer: 3,
        problemType: 'algebra',
      });

      expect(parsed).toMatchObject({
        problemType: 'algebra',
        equation: '3x + 5 = 14',
        studentAnswer: 3,
      });
      expect(parsed.problemText).toBeUndefined();
      expect(parsed.subtype).toBeUndefined();
      expect(parsed.normalizedExpression).toBeUndefined();
      expect(parsed.target).toBeUndefined();
      expect(parsed.confidence).toBeUndefined();
      expect(parsed.imageContext).toBeNull();
    });
  });

  describe('extract - graceful fallback', () => {
    let service: PlannerService;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          PlannerService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn().mockReturnValue(undefined),
            },
          },
        ],
      }).compile();

      service = module.get<PlannerService>(PlannerService);
    });

    it('should return the expanded empty output when no API key is set', async () => {
      await expect(service.extract('I think the answer is 9')).resolves.toEqual(
        EMPTY_PLANNER_OUTPUT,
      );
    });
  });

  describe('extract - LLM JSON parsing', () => {
    let service: PlannerService;

    beforeEach(async () => {
      jest.clearAllMocks();

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          PlannerService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn().mockImplementation((key: string) => {
                if (key === 'GROQ_API_KEY') {
                  return 'test-groq-api-key';
                }
                return undefined;
              }),
            },
          },
        ],
      }).compile();

      service = module.get<PlannerService>(PlannerService);
    });

    it('should parse the expanded JSON planner output', async () => {
      (generateText as jest.Mock).mockResolvedValue({
        text: JSON.stringify({
          problemText: 'what is 10 times 100 divided by 12',
          problemType: 'arithmetic',
          subtype: 'expression_evaluation',
          equation: null,
          normalizedExpression: '10 * 100 / 12',
          studentAnswer: null,
          target: 'evaluate_expression',
          extractedParams: {
            numbers: [10, 100, 12],
            operations: ['multiply', 'divide'],
          },
          confidence: 0.95,
          imageContext: null,
        }),
      });

      const result = await service.extract(
        'what is 10 times 100 divided by 12',
        [],
        'conceptual_help',
      );

      expect(result.problemType).toBe('arithmetic');
      expect(result.normalizedExpression).toBe('10 * 100 / 12');
      expect(result.extractedParams).toEqual({
        numbers: [10, 100, 12],
        operations: ['multiply', 'divide'],
      });
    });

    it('should preserve the latest-message equation instead of reusing an older one', async () => {
      (generateText as jest.Mock).mockResolvedValue({
        text: JSON.stringify({
          problemText: 'if 5x + 5 = 10, x is 1 right?',
          problemType: 'algebra',
          subtype: 'linear_equation',
          equation: '5x + 5 = 10',
          normalizedExpression: null,
          studentAnswer: 1,
          target: 'solve_for_x',
          extractedParams: {
            left: '5x + 5',
            right: '10',
            variable: 'x',
          },
          confidence: 0.95,
          imageContext: null,
        }),
      });

      const result = await service.extract(
        'if 5x + 5 = 10, x is 1 right?',
        [{ role: 'user', content: '5x + 2 = 12, find x' }],
        'attempting_answer',
      );

      expect(result.equation).toBe('5x + 5 = 10');
      expect(result.studentAnswer).toBe(1);
      expect(result.problemType).toBe('algebra');
      expect(result.extractedParams).toEqual({
        left: '5x + 5',
        right: '10',
        variable: 'x',
      });
    });
  });
});
