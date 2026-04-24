import { Injectable, Logger } from '@nestjs/common';

import type {
  PromptBuilderInput,
  VisualizerPromptOutput,
  SceneDescriptor,
  ResponsePromptOutput,
} from './prompt-builder.types.js';

import {
  AVAILABLE_COMPONENTS,
  buildAttemptingAnswerIncorrectPrompt,
  buildAttemptingAnswerCorrectPrompt,
  buildConceptualHelpPrompt,
  buildNewProblemPrompt,
  buildJustChattingPrompt,
  buildVisualizerSystemPrompt,
  buildSceneContextBlock,
} from './prompt-templates.js';

/**
 * Agent #2 — Prompt Builder Service
 *
 * The "merge point" of the pipeline (Phase 4 in PIPELINE.md).
 * Receives data from Router, Planner, State Manager, and Validator,
 * then assembles structured prompts for:
 *
 *   1. The Dynamic Visualizer (P3 — Agent #4)    → buildVisualizerPrompt()
 *   2. The Response Generator (Agent #3)          → buildResponsePrompt()
 *
 * This service does NOT call any LLM — it is pure deterministic code
 * (string templating + conditional logic). Timing: ~5-10ms.
 */
@Injectable()
export class PromptBuilderService {
  private readonly logger = new Logger(PromptBuilderService.name);

  /**
   * Phase 4 → 5a: Build the prompt sent to the Visualizer (Agent #4 / P3).
   *
   * Called BEFORE the Response Generator. The Visualizer will use this prompt
   * to generate a scene JSON, which is then fed back into buildResponsePrompt().
   *
   * @param input - Merged pipeline context from Router, Planner, State Manager, and Validator
   * @returns VisualizerPromptOutput ready to be sent to Agent #4
   */
  buildVisualizerPrompt(input: PromptBuilderInput): VisualizerPromptOutput {
    this.logger.debug(
      `Building visualizer prompt: intent="${input.intent}" equation="${input.equation}" type="${input.problemType}"`,
    );

    const components = this.resolveAvailableComponents(input.problemType);

    const systemPrompt = buildVisualizerSystemPrompt({
      equation: input.equation ?? 'No equation',
      problemType: input.problemType ?? 'arithmetic',
      studentAnswer: input.studentAnswer,
      isCorrect: input.validation?.isCorrect ?? null,
      expected: input.validation?.expected ?? null,
      errorType: input.validation?.errorType ?? null,
      step: input.step,
      availableComponents: components,
    });

    return {
      systemPrompt,
      availableComponents: components,
      context: {
        equation: input.equation,
        problemType: input.problemType,
        studentAnswer: input.studentAnswer,
        isCorrect: input.validation?.isCorrect ?? null,
        expected: input.validation?.expected ?? null,
        step: input.step,
        errorType: input.validation?.errorType ?? null,
      },
    };
  }

  /**
   * Phase 5a → 5b: Build the final prompt for the Response Generator (Agent #3).
   *
   * This is called AFTER the Visualizer has produced its scene JSON. The scene
   * is injected into the prompt so the AI tutor can reference visual elements
   * that the student is currently looking at on screen.
   *
   * @param input - Same merged pipeline context
   * @param scene - Scene descriptor returned by the Visualizer (null if no visualization)
   * @returns ResponsePromptOutput ready to be sent to Agent #3
   */
  buildResponsePrompt(
    input: PromptBuilderInput,
    scene: SceneDescriptor | null,
  ): ResponsePromptOutput {
    this.logger.debug(
      `Building response prompt: intent="${input.intent}" hasScene=${scene !== null}`,
    );

    // Step 1: Build the base system prompt based on intent + validation
    let systemPrompt = this.buildBasePromptByIntent(input);

    // Step 2: Inject scene context if visualization is available
    if (scene && scene.scene.length > 0) {
      const sceneContext = buildSceneContextBlock(
        scene.scene,
        scene.animation,
      );
      systemPrompt = `${systemPrompt}\n\n${sceneContext}`;
    }

    // Step 3: Inject conversation history summary (if any)
    if (input.conversationHistory.length > 0) {
      const historySummary = this.summarizeHistory(input.conversationHistory);
      systemPrompt = `${systemPrompt}\n\n${historySummary}`;
    }

    return {
      systemPrompt,
      userMessage: input.userMessage,
    };
  }

  /**
   * Selects the correct prompt template based on the student's intent
   * and validation result.
   */
  private buildBasePromptByIntent(input: PromptBuilderInput): string {
    switch (input.intent) {
      case 'attempting_answer': {
        if (input.validation?.isCorrect) {
          return buildAttemptingAnswerCorrectPrompt({
            equation: input.equation ?? 'Unknown equation',
            studentAnswer: input.studentAnswer ?? 'Unknown',
            step: input.step,
          });
        }

        return buildAttemptingAnswerIncorrectPrompt({
          equation: input.equation ?? 'Unknown equation',
          studentAnswer: input.studentAnswer ?? 'Unknown',
          expected: input.validation?.expected ?? 'Unknown',
          errorType: input.validation?.errorType ?? 'wrong_value',
          step: input.step,
          problemType: input.problemType ?? 'arithmetic',
        });
      }

      case 'conceptual_help':
        return buildConceptualHelpPrompt({
          equation: input.equation,
          problemType: input.problemType,
          step: input.step,
        });

      case 'new_problem':
        return buildNewProblemPrompt({
          equation: input.equation ?? 'New problem',
          problemType: input.problemType ?? 'arithmetic',
        });

      case 'just_chatting':
        return buildJustChattingPrompt();

      default:
        return buildJustChattingPrompt();
    }
  }

  /**
   * Determines which visualization components are available based on
   * the current problem type (algebra → BalanceScale, geometry → ShapeCanvas, etc.)
   */
  private resolveAvailableComponents(problemType: string | null): string[] {
    const type = problemType ?? 'arithmetic';
    return AVAILABLE_COMPONENTS[type] ?? AVAILABLE_COMPONENTS['arithmetic'];
  }

  /**
   * Creates a brief summary of recent conversation history to inject into the prompt.
   * Only includes the last 6 messages to keep the prompt concise and avoid token waste.
   */
  private summarizeHistory(
    history: { role: string; content: string }[],
  ): string {
    const recentHistory = history.slice(-6);

    const formatted = recentHistory
      .map((msg) => {
        const role = msg.role === 'user' ? 'Student' : 'Tutor';
        const content =
          msg.content.length > 200
            ? msg.content.substring(0, 200) + '...'
            : msg.content;
        return `${role}: ${content}`;
      })
      .join('\n');

    return `
## RECENT CONVERSATION HISTORY:
${formatted}

Note: Use the conversation history to maintain continuity. Don't repeat questions you've already asked.
`.trim();
  }
}
