import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PlannerService } from './planner.service';
import { PlannerOutputSchema } from './planner.schema';

describe('PlannerService', () => {
  let service: PlannerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlannerService,
        {
          provide: ConfigService,
          useValue: {
            // No API key — test graceful fallback
            get: jest.fn().mockReturnValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<PlannerService>(PlannerService);
  });

  // ─── Schema Validation Tests ───────────────────────────────────

  describe('PlannerOutputSchema', () => {
    it('should validate a complete extraction result', () => {
      const valid = {
        equation: '3x + 5 = 14',
        studentAnswer: 9,
        problemType: 'algebra',
        extractedParams: { a: 3, b: 5, c: 14 },
      };
      expect(() => PlannerOutputSchema.parse(valid)).not.toThrow();
    });

    it('should validate an all-null result (no math context)', () => {
      const valid = {
        equation: null,
        studentAnswer: null,
        problemType: null,
        extractedParams: null,
      };
      expect(() => PlannerOutputSchema.parse(valid)).not.toThrow();
    });

    it('should reject an invalid problem type', () => {
      const invalid = {
        equation: '2 + 2',
        studentAnswer: 4,
        problemType: 'calculus', // not in enum
        extractedParams: null,
      };
      expect(() => PlannerOutputSchema.parse(invalid)).toThrow();
    });

    it('should reject non-numeric studentAnswer', () => {
      const invalid = {
        equation: '3x + 5 = 14',
        studentAnswer: 'nine', // not a number
        problemType: 'algebra',
        extractedParams: null,
      };
      expect(() => PlannerOutputSchema.parse(invalid)).toThrow();
    });

    it('should validate arithmetic problem types', () => {
      const valid = {
        equation: '15 + 27 = ?',
        studentAnswer: 42,
        problemType: 'arithmetic',
        extractedParams: { a: 15, b: 27 },
      };
      expect(() => PlannerOutputSchema.parse(valid)).not.toThrow();
    });

    it('should validate geometry problem types', () => {
      const valid = {
        equation: 'A = π * r^2',
        studentAnswer: 28.27,
        problemType: 'geometry',
        extractedParams: { r: 3 },
      };
      expect(() => PlannerOutputSchema.parse(valid)).not.toThrow();
    });

    it('should validate statistics problem types', () => {
      const valid = {
        equation: 'mean of [2, 4, 6, 8]',
        studentAnswer: 5,
        problemType: 'statistics',
        extractedParams: null,
      };
      expect(() => PlannerOutputSchema.parse(valid)).not.toThrow();
    });
  });

  // ─── Graceful Fallback Tests ───────────────────────────────────

  describe('extract — graceful fallback', () => {
    it('should return all-null output when no API key is set', async () => {
      const result = await service.extract('I think the answer is 9');
      expect(result).toEqual({
        equation: null,
        studentAnswer: null,
        problemType: null,
        extractedParams: null,
      });
    });

    it('should return all-null output with conversation history', async () => {
      const result = await service.extract(
        'I got 5',
        [
          { role: 'assistant', content: 'Solve 3x + 5 = 14' },
          { role: 'user', content: 'I got 5' },
        ],
        'attempting_answer',
      );
      expect(result).toEqual({
        equation: null,
        studentAnswer: null,
        problemType: null,
        extractedParams: null,
      });
    });
  });
});
