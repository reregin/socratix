import {
  Body,
  Controller,
  Inject,
  Logger,
  Post,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { randomUUID } from 'node:crypto';
import { RouterService } from '../agents/router/router.service.js';
import { PlannerService } from '../agents/planner/planner.service.js';
import { PromptBuilderService } from '../agents/prompt-builder/prompt-builder.service.js';
import { ResponseGeneratorService } from '../agents/response-generator/response-generator.service.js';
import { VisualizerService } from '../agents/visualizer/visualizer.service.js';
import type { PlannerOutput } from '../agents/planner/planner.schema.js';
import type {
  PromptBuilderInput,
  SceneDescriptor,
  ValidationResult,
} from '../agents/prompt-builder/prompt-builder.types.js';
import { VALIDATOR } from '../services/validator/validator.interface.js';
import type { IValidator } from '../services/validator/validator.interface.js';
import type {
  ChatStreamDoneEvent,
  ChatStreamErrorEvent,
  ChatStreamProgressEvent,
  ChatStreamRequest,
  ChatStreamSceneEvent,
  ChatStreamTokenEvent,
} from '../../../../packages/shared-types/src/chat-stream.js';

@Controller('chat')
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(
    private readonly routerService: RouterService,
    private readonly plannerService: PlannerService,
    private readonly promptBuilderService: PromptBuilderService,
    private readonly responseGeneratorService: ResponseGeneratorService,
    private readonly visualizerService: VisualizerService,
    @Inject(VALIDATOR) private readonly validator: IValidator,
  ) {}

  @Post()
  async streamChat(
    @Body() body: ChatStreamRequest,
    @Res() res: Response,
  ): Promise<void> {
    this.configureSseHeaders(res);

    const message = body.message?.trim();
    if (!message) {
      this.writeEvent<ChatStreamErrorEvent>(res, {
        type: 'error',
        message: 'Request body must include a non-empty message.',
      });
      res.end();
      return;
    }

    const messageId = randomUUID();
    this.logger.log(
      `SSE chat request accepted: messageId=${messageId} sessionId=${body.sessionId ?? 'none'} messageLength=${message.length}`,
    );

    try {
      await this.emitProgress(res, {
        type: 'progress',
        step: 'routing',
        status: 'started',
        label: 'Classifying student intent...',
      });
      const routerOutput = await this.routerService.classify(message);
      this.logger.log(
        `Router output: intent=${routerOutput.intent} plannerRequired=${routerOutput.plannerRequired} validatorRequired=${routerOutput.validatorRequired}`,
      );
      await this.emitProgress(res, {
        type: 'progress',
        step: 'routing',
        status: 'completed',
        label: `Intent classified as ${routerOutput.intent}.`,
      });

      let plannerOutput: PlannerOutput = {
        equation: null,
        studentAnswer: null,
        problemType: null,
        extractedParams: null,
      };

      if (routerOutput.plannerRequired) {
        await this.emitProgress(res, {
          type: 'progress',
          step: 'planning',
          status: 'started',
          label: 'Extracting equation and student attempt...',
        });
        try {
          plannerOutput = await this.plannerService.extract(
            message,
            [],
            routerOutput.intent,
          );
          this.logger.log(
            `Planner output: equation=${plannerOutput.equation ?? 'null'} studentAnswer=${plannerOutput.studentAnswer ?? 'null'} problemType=${plannerOutput.problemType ?? 'null'} hasParams=${plannerOutput.extractedParams !== null}`,
          );
          if (!plannerOutput.equation) {
            this.logger.warn(
              `Planner did not extract an equation for messageId=${messageId}.`,
            );
          }
          await this.emitProgress(res, {
            type: 'progress',
            step: 'planning',
            status: 'completed',
            label: 'Math context extracted.',
          });
        } catch (error) {
          this.logger.warn(
            `Planner failed for messageId=${messageId}; continuing with fallback path.`,
            error instanceof Error ? error.stack : undefined,
          );
          await this.emitProgress(res, {
            type: 'progress',
            step: 'planning',
            status: 'failed',
            label: 'Could not resolve the equation automatically. Continuing with fallback guidance.',
          });
        }
      }

      let validation: ValidationResult | null = null;
      if (
        routerOutput.validatorRequired &&
        plannerOutput.equation &&
        plannerOutput.studentAnswer !== null
      ) {
        await this.emitProgress(res, {
          type: 'progress',
          step: 'validation',
          status: 'started',
          label: 'Checking the proposed answer...',
        });
        validation = await this.validator.validate({
          equation: plannerOutput.equation,
          studentAnswer: plannerOutput.studentAnswer,
          problemType: plannerOutput.problemType,
        });
        this.logger.log(
          `Validator output: isCorrect=${validation?.isCorrect ?? 'null'} expected=${validation?.expected ?? 'null'} errorType=${validation?.errorType ?? 'null'}`,
        );
        await this.emitProgress(res, {
          type: 'progress',
          step: 'validation',
          status: 'completed',
          label: validation?.isCorrect
            ? 'Answer validation complete.'
            : 'Validation complete with follow-up guidance.',
        });
      }

      const promptInput = this.buildPromptInput(
        body,
        routerOutput.intent,
        plannerOutput,
        validation,
      );
      const hasMathContext = this.hasMathContext(promptInput);

      if (!hasMathContext) {
        this.logger.warn(
          `No resolved math context for messageId=${messageId}; skipping visualizer and response LLM.`,
        );
      }

      let scene: SceneDescriptor = {
        scene: [],
        animation: null,
      };

      if (hasMathContext) {
        await this.emitProgress(res, {
          type: 'progress',
          step: 'visualizing',
          status: 'started',
          label: 'Building scene annotation...',
        });
        try {
          const visualizerPrompt =
            this.promptBuilderService.buildVisualizerPrompt(promptInput);
          this.logger.log(
            `Visualizer prompt prepared: equation=${visualizerPrompt.context.equation ?? 'null'} problemType=${visualizerPrompt.context.problemType ?? 'null'} components=${visualizerPrompt.availableComponents.join(',')}`,
          );
          scene = await this.visualizerService.generateScene(visualizerPrompt);
          this.logger.log(
            `Visualizer output: componentCount=${scene.scene.length} animation=${scene.animation ?? 'null'}`,
          );
          if (scene.scene.length === 0) {
            this.logger.warn(
              `Visualizer returned an empty scene for messageId=${messageId}.`,
            );
          }
          this.writeEvent<ChatStreamSceneEvent>(res, {
            type: 'scene',
            messageId,
            scene,
          });
          await this.emitProgress(res, {
            type: 'progress',
            step: 'visualizing',
            status: 'completed',
            label: `Scene ready with ${scene.scene.length} component(s).`,
          });
        } catch (error) {
          this.logger.warn(
            `Visualizer failed for messageId=${messageId}; continuing without scene.`,
            error instanceof Error ? error.stack : undefined,
          );
          await this.emitProgress(res, {
            type: 'progress',
            step: 'visualizing',
            status: 'failed',
            label: 'Scene generation failed. Continuing without visualization.',
          });
        }
      } else {
        await this.emitProgress(res, {
          type: 'progress',
          step: 'visualizing',
          status: 'completed',
          label: 'Skipping scene generation until an equation is resolved.',
        });
      }

      await this.emitProgress(res, {
        type: 'progress',
        step: 'responding',
        status: 'started',
        label: 'Streaming Socratic response...',
      });

      let stream: { textStream?: AsyncIterable<string> } | null = null;
      if (hasMathContext) {
        try {
          stream = await this.responseGeneratorService.generateStream(
            this.promptBuilderService.buildResponsePrompt(promptInput, scene),
          );
        } catch (error) {
          this.logger.warn(
            `Response generator failed for messageId=${messageId}; using backend fallback response.`,
            error instanceof Error ? error.stack : undefined,
          );
          await this.emitProgress(res, {
            type: 'progress',
            step: 'responding',
            status: 'failed',
            label: 'LLM response generation failed. Falling back to deterministic guidance.',
          });
        }
      }

      if (stream?.textStream) {
        this.logger.log(`Response generator stream ready for messageId=${messageId}.`);
        for await (const chunk of stream.textStream as AsyncIterable<string>) {
          this.writeEvent<ChatStreamTokenEvent>(res, {
            type: 'token',
            messageId,
            text: chunk,
          });
        }
      } else {
        this.logger.warn(
          `Response generator returned null stream for messageId=${messageId}; using backend fallback response.`,
        );
        for (const chunk of this.chunkText(
          this.buildFallbackResponse(promptInput, validation, scene),
        )) {
          this.writeEvent<ChatStreamTokenEvent>(res, {
            type: 'token',
            messageId,
            text: chunk,
          });
        }
      }

      await this.emitProgress(res, {
        type: 'progress',
        step: 'responding',
        status: 'completed',
        label: 'Response stream complete.',
      });

      this.writeEvent<ChatStreamDoneEvent>(res, {
        type: 'done',
        messageId,
      });
    } catch (error) {
      this.logger.error(
        'Chat SSE pipeline failed.',
        error instanceof Error ? error.stack : undefined,
      );
      this.writeEvent<ChatStreamErrorEvent>(res, {
        type: 'error',
        message: 'Chat streaming failed.',
      });
    } finally {
      res.end();
    }
  }

  private configureSseHeaders(res: Response): void {
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();
  }

  private writeEvent<T>(res: Response, payload: T): void {
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  }

  private async emitProgress(
    res: Response,
    payload: ChatStreamProgressEvent,
  ): Promise<void> {
    this.writeEvent(res, payload);
    await Promise.resolve();
  }

  private buildPromptInput(
    body: ChatStreamRequest,
    intent: PromptBuilderInput['intent'],
    plannerOutput: {
      equation: string | null;
      studentAnswer: number | null;
      problemType: PromptBuilderInput['problemType'];
    },
    validation: ValidationResult | null,
  ): PromptBuilderInput {
    return {
      intent,
      equation: plannerOutput.equation,
      problemType: plannerOutput.problemType,
      studentAnswer: plannerOutput.studentAnswer,
      validation,
      conversationHistory: [],
      studentProfile: null,
      step: 1,
      userMessage: body.message,
    };
  }

  private buildFallbackResponse(
    input: PromptBuilderInput,
    validation: ValidationResult | null,
    scene: SceneDescriptor,
  ): string {
    if (input.intent === 'attempting_answer') {
      if (validation?.isCorrect) {
        return `Nice work. Your answer looks consistent with ${input.equation ?? 'the equation'}. Can you explain why that value works?`;
      }

      if (input.equation && input.studentAnswer !== null) {
        return `Let's test your answer step by step. What happens when you substitute ${input.studentAnswer} into ${input.equation}?`;
      }
    }

    if (input.intent === 'conceptual_help') {
      return 'Let’s break the problem into smaller steps. What part feels most confusing right now?';
    }

    if (input.intent === 'new_problem') {
      return 'Sure, we can start a fresh problem next. Before that, what kind of math would you like to practice?';
    }

    if (scene.scene.length > 0) {
      return 'I have a scene ready to support the explanation. Tell me which part of the problem you want to examine first.';
    }

    return 'I’m ready to help with the next math step. Send me the problem or your current attempt and we’ll work through it together.';
  }

  private chunkText(text: string): string[] {
    return text.match(/\S+\s*/g) ?? [text];
  }

  private hasMathContext(input: PromptBuilderInput): boolean {
    return input.equation !== null && input.equation.trim().length > 0;
  }
}
