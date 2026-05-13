import { MathValidatorService } from './math-validator.service';

describe('MathValidatorService', () => {
  let service: MathValidatorService;

  beforeEach(() => {
    service = new MathValidatorService();
  });

  it.each([
    {
      name: 'rejects incorrect substitution in 3x + 5 = 14',
      equation: '3x + 5 = 14',
      studentAnswer: 9,
      problemType: 'algebra' as const,
      expectedCorrectness: false,
      expectedValue: 3,
    },
    {
      name: 'accepts correct substitution in 3x + 5 = 14',
      equation: '3x + 5 = 14',
      studentAnswer: 3,
      problemType: 'algebra' as const,
      expectedCorrectness: true,
      expectedValue: 3,
    },
    {
      name: 'handles implicit multiplication in 3x',
      equation: '3x=9',
      studentAnswer: 3,
      problemType: 'algebra' as const,
      expectedCorrectness: true,
      expectedValue: 3,
    },
    {
      name: 'handles parenthesized multiplication',
      equation: '2(x + 4) = 14',
      studentAnswer: 3,
      problemType: 'algebra' as const,
      expectedCorrectness: true,
      expectedValue: 3,
    },
    {
      name: 'handles negative linear solutions',
      equation: 'x - 4 = -7',
      studentAnswer: -3,
      problemType: 'algebra' as const,
      expectedCorrectness: true,
      expectedValue: -3,
    },
    {
      name: 'handles division in linear equations',
      equation: 'x / 2 + 1 = 5',
      studentAnswer: 8,
      problemType: 'algebra' as const,
      expectedCorrectness: true,
      expectedValue: 8,
    },
    {
      name: 'handles decimals',
      equation: '0.5x + 1 = 2',
      studentAnswer: 2,
      problemType: 'algebra' as const,
      expectedCorrectness: true,
      expectedValue: 2,
    },
    {
      name: 'rejects a false concrete equation from substituted work',
      equation: '3(9) + 5 = 14',
      studentAnswer: 9,
      problemType: 'arithmetic' as const,
      expectedCorrectness: false,
      expectedValue: 14,
    },
    {
      name: 'accepts a true concrete equation from substituted work',
      equation: '3(3) + 5 = 14',
      studentAnswer: 3,
      problemType: null,
      expectedCorrectness: true,
      expectedValue: 14,
    },
    {
      name: 'validates arithmetic expression answers',
      equation: '15 + 27',
      studentAnswer: 42,
      problemType: 'arithmetic' as const,
      expectedCorrectness: true,
      expectedValue: 42,
    },
    {
      name: 'validates arithmetic equations with placeholder on the right',
      equation: '15 + 27 = ?',
      studentAnswer: 41,
      problemType: 'arithmetic' as const,
      expectedCorrectness: false,
      expectedValue: 42,
    },
    {
      name: 'supports safe Math.js functions',
      equation: 'sqrt(16) + x = 10',
      studentAnswer: 6,
      problemType: 'algebra' as const,
      expectedCorrectness: true,
      expectedValue: 6,
    },
  ])(
    '$name',
    async ({
      equation,
      studentAnswer,
      problemType,
      expectedCorrectness,
      expectedValue,
    }) => {
      const result = await service.validate({
        equation,
        studentAnswer,
        problemType,
      });

      expect(result).not.toBeNull();
      expect(result?.isCorrect).toBe(expectedCorrectness);
      expect(result?.expected).toBe(expectedValue);
      expect(result?.errorType).toBe(expectedCorrectness ? 'none' : 'wrong_value');
    },
  );

  it('returns null for unsupported geometry validation', async () => {
    const result = await service.validate({
      equation: 'A = pi * r^2',
      studentAnswer: 12.56,
      problemType: 'geometry',
    });

    expect(result).toBeNull();
  });

  it('returns null for unsafe expressions outside the deterministic subset', async () => {
    const result = await service.validate({
      equation: 'random() = 1',
      studentAnswer: 1,
      problemType: 'algebra',
    });

    expect(result).toBeNull();
  });
});
