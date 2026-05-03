import { Injectable, Logger } from '@nestjs/common';
import { parse } from 'mathjs';
import type { MathNode } from 'mathjs';
import type { IValidator } from './validator.interface.js';
import {
  ValidationInput,
  ValidationInputSchema,
  ValidationResult,
} from './validator.schema.js';

const NUMERIC_TOLERANCE = 1e-9;
const ALLOWED_EXPRESSION_PATTERN = /^[0-9a-zA-Z+\-*/^().,\s?]+$/;
const SUPPORTED_AST_NODE_TYPES = new Set([
  'ConstantNode',
  'FunctionNode',
  'OperatorNode',
  'ParenthesisNode',
  'SymbolNode',
]);
const KNOWN_SYMBOLS = new Set([
  'abs',
  'acos',
  'asin',
  'atan',
  'cos',
  'e',
  'log',
  'ln',
  'pi',
  'sin',
  'sqrt',
  'tan',
]);
const SAFE_FUNCTIONS = new Set([
  'abs',
  'acos',
  'asin',
  'atan',
  'cos',
  'log',
  'sin',
  'sqrt',
  'tan',
]);

@Injectable()
export class MathValidatorService implements IValidator {
  private readonly logger = new Logger(MathValidatorService.name);

  async validate(input: ValidationInput): Promise<ValidationResult | null> {
    const parsedInput = ValidationInputSchema.safeParse(input);

    if (!parsedInput.success) {
      return null;
    }

    const validationInput = parsedInput.data;
    const numericAnswer = this.toFiniteNumber(validationInput.studentAnswer);

    if (numericAnswer === null) {
      return null;
    }

    try {
      if (this.shouldValidateAsAlgebra(validationInput)) {
        return this.validateAlgebra(validationInput, numericAnswer);
      }

      if (this.shouldValidateAsArithmetic(validationInput)) {
        return this.validateArithmetic(validationInput, numericAnswer);
      }
    } catch (error) {
      this.logger.warn(
        `Math validation failed for equation "${validationInput.equation}".`,
        error instanceof Error ? error.stack : undefined,
      );
    }

    return null;
  }

  private validateAlgebra(
    input: ValidationInput,
    numericAnswer: number,
  ): ValidationResult | null {
    const equationParts = this.splitEquation(input.equation);

    if (!equationParts) {
      return null;
    }

    const variableName = this.extractVariableName(input.equation);

    if (!variableName) {
      return this.validateArithmetic(input, numericAnswer);
    }

    const scope = { [variableName]: numericAnswer };
    const leftValue = this.evaluateNumericExpression(equationParts.left, scope);
    const rightValue = this.evaluateNumericExpression(equationParts.right, scope);

    if (leftValue === null || rightValue === null) {
      return null;
    }

    const isCorrect = this.nearlyEqual(leftValue, rightValue);
    const expected = this.solveLinearExpectedValue(equationParts, variableName);

    return this.buildResult(input, isCorrect, expected ?? 'unknown');
  }

  private validateArithmetic(
    input: ValidationInput,
    numericAnswer: number,
  ): ValidationResult | null {
    const equalityResult = this.validateConcreteEquation(input);

    if (equalityResult) {
      return equalityResult;
    }

    const expected = this.resolveArithmeticExpectedValue(input.equation);

    if (expected === null) {
      return null;
    }

    return this.buildResult(
      input,
      this.nearlyEqual(numericAnswer, expected),
      expected,
    );
  }

  private validateConcreteEquation(input: ValidationInput): ValidationResult | null {
    const equationParts = this.splitEquation(input.equation);

    if (!equationParts) {
      return null;
    }

    if (
      this.extractVariableName(equationParts.left) ||
      this.extractVariableName(equationParts.right)
    ) {
      return null;
    }

    const leftValue = this.evaluateNumericExpression(equationParts.left);
    const rightValue = this.evaluateNumericExpression(equationParts.right);

    if (leftValue === null || rightValue === null) {
      return null;
    }

    return this.buildResult(
      input,
      this.nearlyEqual(leftValue, rightValue),
      this.roundForDisplay(rightValue),
    );
  }

  private resolveArithmeticExpectedValue(equation: string): number | null {
    const equationParts = this.splitEquation(equation);

    if (!equationParts) {
      return this.evaluateNumericExpression(equation);
    }

    if (equationParts.left.includes('?')) {
      return this.evaluateNumericExpression(equationParts.right);
    }

    if (equationParts.right.includes('?')) {
      return this.evaluateNumericExpression(equationParts.left);
    }

    const rightValue = this.evaluateNumericExpression(equationParts.right);

    if (rightValue !== null) {
      return rightValue;
    }

    return this.evaluateNumericExpression(equationParts.left);
  }

  private solveLinearExpectedValue(
    equationParts: { left: string; right: string },
    variableName: string,
  ): number | null {
    const differenceExpression = `(${equationParts.left})-(${equationParts.right})`;
    const intercept = this.evaluateNumericExpression(differenceExpression, {
      [variableName]: 0,
    });
    const sampleAtOne = this.evaluateNumericExpression(differenceExpression, {
      [variableName]: 1,
    });
    const sampleAtTwo = this.evaluateNumericExpression(differenceExpression, {
      [variableName]: 2,
    });

    if (intercept === null || sampleAtOne === null || sampleAtTwo === null) {
      return null;
    }

    const coefficient = sampleAtOne - intercept;

    if (this.nearlyEqual(coefficient, 0)) {
      return null;
    }

    const expected = -intercept / coefficient;
    const expectedResidual = this.evaluateNumericExpression(differenceExpression, {
      [variableName]: expected,
    });
    const linearityCheck = intercept + coefficient * 2;

    if (
      expectedResidual === null ||
      !this.nearlyEqual(expectedResidual, 0) ||
      !this.nearlyEqual(sampleAtTwo, linearityCheck)
    ) {
      return null;
    }

    return this.roundForDisplay(expected);
  }

  private shouldValidateAsAlgebra(input: ValidationInput): boolean {
    return (
      input.problemType === 'algebra' ||
      (!input.problemType &&
        input.equation.includes('=') &&
        this.extractVariableName(input.equation) !== null)
    );
  }

  private shouldValidateAsArithmetic(input: ValidationInput): boolean {
    return (
      input.problemType === 'arithmetic' ||
      this.extractVariableName(input.equation) === null
    );
  }

  private splitEquation(equation: string): { left: string; right: string } | null {
    const parts = equation.split('=');

    if (parts.length !== 2) {
      return null;
    }

    const [left, right] = parts.map((part) => part.trim());

    if (!left || !right) {
      return null;
    }

    return { left, right };
  }

  private extractVariableName(equation: string): string | null {
    const matches: string[] = equation.match(/[a-zA-Z]+/g) ?? [];
    const variableName = matches.find(
      (match) => !KNOWN_SYMBOLS.has(match.toLowerCase()),
    );

    return variableName ?? null;
  }

  private evaluateNumericExpression(
    expression: string,
    scope: Record<string, number> = {},
  ): number | null {
    const trimmedExpression = expression.replace(/\?/g, '').trim();

    if (
      !trimmedExpression ||
      !ALLOWED_EXPRESSION_PATTERN.test(trimmedExpression)
    ) {
      return null;
    }

    const ast = parse(trimmedExpression);
    this.assertSupportedAst(ast);

    const value = ast.compile().evaluate(scope);
    const numericValue = Number(value);

    return Number.isFinite(numericValue) ? numericValue : null;
  }

  private assertSupportedAst(ast: MathNode): void {
    ast.traverse((node) => {
      const nodeType = node.type;

      if (!SUPPORTED_AST_NODE_TYPES.has(nodeType)) {
        throw new Error(`Unsupported Math.js AST node type: ${nodeType}`);
      }

      if (nodeType === 'FunctionNode') {
        const functionName = this.getNodeProperty(node, 'name');

        if (
          typeof functionName !== 'string' ||
          !SAFE_FUNCTIONS.has(functionName.toLowerCase())
        ) {
          throw new Error(`Unsupported Math.js function: ${functionName}`);
        }
      }
    });
  }

  private getNodeProperty(node: MathNode, property: string): unknown {
    return (node as unknown as Record<string, unknown>)[property];
  }

  private toFiniteNumber(value: number | string): number | null {
    const numericValue =
      typeof value === 'number' ? value : Number(value.trim());

    return Number.isFinite(numericValue) ? numericValue : null;
  }

  private buildResult(
    input: ValidationInput,
    isCorrect: boolean,
    expected: number | string,
  ): ValidationResult {
    return {
      isCorrect,
      expected,
      studentAnswer: input.studentAnswer,
      errorType: isCorrect ? 'none' : 'wrong_value',
    };
  }

  private nearlyEqual(left: number, right: number): boolean {
    return Math.abs(left - right) <= NUMERIC_TOLERANCE;
  }

  private roundForDisplay(value: number): number {
    return Number(value.toFixed(12));
  }
}
