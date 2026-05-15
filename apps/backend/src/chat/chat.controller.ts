import {
  Body,
  Controller,
  Inject,
  Logger,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
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
  VisualLearningIntent,
} from '../agents/prompt-builder/prompt-builder.types.js';
import type { SimpleScenePlan } from '../agents/visualizer/visualizer.schema.js';
import { VALIDATOR } from '../services/validator/validator.interface.js';
import type { IValidator } from '../services/validator/validator.interface.js';
import type {
  ChatStreamDoneEvent,
  ChatStreamDebugEvent,
  ChatStreamErrorEvent,
  ChatStreamProgressEvent,
  ChatStreamRequest,
  ChatStreamSceneEvent,
  ChatStreamTokenEvent,
} from '@socratix/shared-types/chat-stream';

type AgentTracePayload = Omit<
  ChatStreamDebugEvent,
  'type' | 'messageId' | 'timestamp'
>;
type AgentTraceEmitter = (payload: AgentTracePayload) => void;

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
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    this.configureSseHeaders(res);
    const streamState = this.createStreamState(req, res);

    const message = body.message?.trim();
    if (!message) {
      this.writeEvent<ChatStreamErrorEvent>(res, streamState, {
        type: 'error',
        message: 'Request body must include a non-empty message.',
      });
      this.endStream(res, streamState);
      return;
    }

    const messageId = randomUUID();
    this.logger.log(
      `SSE chat request accepted: messageId=${messageId} sessionId=${body.sessionId ?? 'none'} messageLength=${message.length}`,
    );
    const emitTrace: AgentTraceEmitter = (payload) => {
      this.writeEvent<ChatStreamDebugEvent>(res, streamState, {
        type: 'debug',
        messageId,
        timestamp: new Date().toISOString(),
        ...payload,
      });
    };

    try {
      await this.emitProgress(res, streamState, {
        type: 'progress',
        step: 'routing',
        status: 'started',
        label: 'Classifying student intent...',
      });
      if (streamState.closed) {
        return;
      }
      const routerOutput = await this.runAsyncAgentStep(
        'Router',
        messageId,
        { message },
        () => this.routerService.classify(message),
        (output) => ({
          intent: output.intent,
          plannerRequired: output.plannerRequired,
          validatorRequired: output.validatorRequired,
        }),
        emitTrace,
      );
      if (streamState.closed) {
        this.logger.warn(
          `Client disconnected after routing for messageId=${messageId}; aborting remaining work.`,
        );
        return;
      }
      this.logger.log(
        `Router output: intent=${routerOutput.intent} plannerRequired=${routerOutput.plannerRequired} validatorRequired=${routerOutput.validatorRequired}`,
      );
      await this.emitProgress(res, streamState, {
        type: 'progress',
        step: 'routing',
        status: 'completed',
        label: `Intent classified as ${routerOutput.intent}.`,
      });
      if (streamState.closed) {
        return;
      }

      let plannerOutput: PlannerOutput = {
        equation: null,
        studentAnswer: null,
        problemType: null,
        extractedParams: null,
        imageContext: null,
      };

      if (routerOutput.plannerRequired) {
        await this.emitProgress(res, streamState, {
          type: 'progress',
          step: 'planning',
          status: 'started',
          label: 'Extracting equation and student attempt...',
        });
        if (streamState.closed) {
          return;
        }
        try {
          plannerOutput = await this.runAsyncAgentStep(
            'Planner',
            messageId,
            { message, history: [], intent: routerOutput.intent },
            () => this.plannerService.extract(message, [], routerOutput.intent),
            (output) => ({
              equation: output.equation ?? 'null',
              studentAnswer: output.studentAnswer ?? 'null',
              problemType: output.problemType ?? 'null',
              hasParams: output.extractedParams !== null,
              extractedParams: output.extractedParams,
              hasImageContext: output.imageContext !== null,
              imageContext: output.imageContext,
            }),
            emitTrace,
          );
          if (streamState.closed) {
            this.logger.warn(
              `Client disconnected during planning for messageId=${messageId}; aborting remaining work.`,
            );
            return;
          }
          this.logger.log(
            `Planner output: equation=${plannerOutput.equation ?? 'null'} studentAnswer=${plannerOutput.studentAnswer ?? 'null'} problemType=${plannerOutput.problemType ?? 'null'} hasParams=${plannerOutput.extractedParams !== null}`,
          );
          if (!plannerOutput.equation) {
            this.logAgentInvalid('Planner', messageId, 'missing_equation', {
              intent: routerOutput.intent,
              problemType: plannerOutput.problemType ?? 'null',
            }, emitTrace);
            this.logger.warn(
              `Planner did not extract an equation for messageId=${messageId}.`,
            );
          }
          await this.emitProgress(res, streamState, {
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
          await this.emitProgress(res, streamState, {
            type: 'progress',
            step: 'planning',
            status: 'failed',
            label: 'Could not resolve the equation automatically. Continuing with fallback guidance.',
          });
        }
        if (streamState.closed) {
          return;
        }
      } else {
        this.logAgentSkipped(
          'Planner',
          messageId,
          'router_output_planner_not_required',
          { intent: routerOutput.intent },
          emitTrace,
        );
      }

      let validation: ValidationResult | null = null;
      const equationForValidation = plannerOutput.equation;
      const studentAnswerForValidation = plannerOutput.studentAnswer;
      if (
        routerOutput.validatorRequired &&
        equationForValidation &&
        studentAnswerForValidation !== null
      ) {
        await this.emitProgress(res, streamState, {
          type: 'progress',
          step: 'validation',
          status: 'started',
          label: 'Checking the proposed answer...',
        });
        if (streamState.closed) {
          return;
        }
        validation = await this.runAsyncAgentStep(
          'Validator',
          messageId,
          {
            equation: equationForValidation,
            studentAnswer: studentAnswerForValidation,
            problemType: plannerOutput.problemType ?? 'null',
          },
          () =>
            this.validator.validate({
              equation: equationForValidation,
              studentAnswer: studentAnswerForValidation,
              problemType: plannerOutput.problemType,
            }),
          (output) => ({
            isCorrect: output?.isCorrect ?? 'null',
            expected: output?.expected ?? 'null',
            studentAnswer: output?.studentAnswer ?? 'null',
            errorType: output?.errorType ?? 'null',
          }),
          emitTrace,
        );
        if (streamState.closed) {
          this.logger.warn(
            `Client disconnected during validation for messageId=${messageId}; aborting remaining work.`,
          );
          return;
        }
        this.logger.log(
          `Validator output: isCorrect=${validation?.isCorrect ?? 'null'} expected=${validation?.expected ?? 'null'} errorType=${validation?.errorType ?? 'null'}`,
        );
        await this.emitProgress(res, streamState, {
          type: 'progress',
          step: 'validation',
          status: 'completed',
          label: validation?.isCorrect
            ? 'Answer validation complete.'
            : 'Validation complete with follow-up guidance.',
        });
      } else {
        const validationSkipReason = !routerOutput.validatorRequired
          ? 'router_output_validator_not_required'
          : !plannerOutput.equation
            ? 'missing_equation'
            : 'missing_student_answer';
        this.logAgentSkipped(
          'Validator',
          messageId,
          validationSkipReason,
          {
            validatorRequired: routerOutput.validatorRequired,
            hasEquation: plannerOutput.equation !== null,
            hasStudentAnswer: plannerOutput.studentAnswer !== null,
          },
          emitTrace,
        );
      }

      const promptInput = this.runSyncAgentStep(
        'PromptBuilder.Context',
        messageId,
        {
          intent: routerOutput.intent,
          hasValidation: validation !== null,
        },
        () =>
          this.buildPromptInput(
            body,
            routerOutput.intent,
            plannerOutput,
            validation,
          ),
        (output) => ({
          intent: output.intent,
          equation: output.equation ?? 'null',
          problemType: output.problemType ?? 'null',
          studentAnswer: output.studentAnswer ?? 'null',
          validation: output.validation,
          step: output.step,
          userMessage: output.userMessage,
        }),
        emitTrace,
      );
      const hasMathContext = this.hasMathContext(promptInput);

      if (!hasMathContext) {
        this.logAgentInvalid(
          'PromptBuilder.Context',
          messageId,
          'missing_math_context',
          {
            intent: promptInput.intent,
            equation: promptInput.equation ?? 'null',
            problemType: promptInput.problemType ?? 'null',
          },
          emitTrace,
        );
        this.logger.warn(
          `No resolved math context for messageId=${messageId}; skipping visualizer and response LLM.`,
        );
      }
      if (streamState.closed) {
        return;
      }

      let scene: SceneDescriptor = {
        scene: [],
        animation: null,
      };

      if (hasMathContext) {
        await this.emitProgress(res, streamState, {
          type: 'progress',
          step: 'visualizing',
          status: 'started',
          label: 'Building scene annotation...',
        });
        if (streamState.closed) {
          return;
        }
        try {
          const visualizerPrompt = this.runSyncAgentStep(
            'PromptBuilder.VisualizerPrompt',
            messageId,
            {
              equation: promptInput.equation,
              problemType: promptInput.problemType ?? 'null',
            },
            () => this.promptBuilderService.buildVisualizerPrompt(promptInput),
            (output) => ({
              topic: output.topic,
              stepNumber: output.step_number,
              socraticQuestion: output.socratic_question,
              visualType: output.visual_type_expected,
              mathState: output.math_state,
              targetConcept: output.target_concept,
              expectedStudentFocus: output.expected_student_focus,
              visualGoal: output.visual_goal,
            }),
            emitTrace,
          );
          this.logger.log(
            `Visualizer intent prepared: topic=${visualizerPrompt.topic} step=${visualizerPrompt.step_number} visualType=${visualizerPrompt.visual_type_expected}`,
          );
          const scenePlan = await this.runAsyncAgentStep(
            'Visualizer',
            messageId,
            {
              topic: visualizerPrompt.topic,
              visualType: visualizerPrompt.visual_type_expected,
            },
            () => this.visualizerService.generateScenePlan(visualizerPrompt),
            (output) => ({
              component: output.component,
              sceneIntent: output.scene_intent,
              highlightFocus: output.highlight_focus,
              mode: output.interaction_mode,
              target: output.correct_target,
              instruction: output.student_instruction,
              hint: output.hint,
              successFeedback: output.success_feedback,
            }),
            emitTrace,
          );
          scene = this.mapScenePlanToSceneDescriptor(
            scenePlan,
            visualizerPrompt,
          );
          if (streamState.closed) {
            this.logger.warn(
              `Client disconnected during visualization for messageId=${messageId}; aborting remaining work.`,
            );
            return;
          }
          this.logger.log(
            `Visualizer output: component=${scenePlan.component} mode=${scenePlan.interaction_mode}`,
          );
          if (scene.scene.length === 0) {
            this.logAgentInvalid('Visualizer', messageId, 'empty_scene', {
              component: scenePlan.component,
            }, emitTrace);
            this.logger.warn(
              `Visualizer returned an empty scene for messageId=${messageId}.`,
            );
          }
          this.writeEvent<ChatStreamSceneEvent>(res, streamState, {
            type: 'scene',
            messageId,
            scene,
          });
          await this.emitProgress(res, streamState, {
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
          await this.emitProgress(res, streamState, {
            type: 'progress',
            step: 'visualizing',
            status: 'failed',
            label: 'Scene generation failed. Continuing without visualization.',
          });
        }
      } else {
        await this.emitProgress(res, streamState, {
          type: 'progress',
          step: 'visualizing',
          status: 'completed',
          label: 'Skipping scene generation until an equation is resolved.',
        });
        this.logAgentSkipped(
          'Visualizer',
          messageId,
          'missing_math_context',
          { hasMathContext },
          emitTrace,
        );
      }
      if (streamState.closed) {
        return;
      }

      await this.emitProgress(res, streamState, {
        type: 'progress',
        step: 'responding',
        status: 'started',
        label: 'Streaming Socratic response...',
      });
      if (streamState.closed) {
        return;
      }

      let stream: { textStream?: AsyncIterable<string> } | null = null;
      if (hasMathContext) {
        try {
          const responsePrompt = this.runSyncAgentStep(
            'PromptBuilder.ResponsePrompt',
            messageId,
            {
              intent: promptInput.intent,
              sceneComponents: scene.scene.length,
            },
            () =>
              this.promptBuilderService.buildResponsePrompt(promptInput, scene),
            (output) => ({
              systemPrompt: output.systemPrompt,
              userMessage: output.userMessage,
            }),
            emitTrace,
          );
          stream = await this.runAsyncAgentStep(
            'ResponseGenerator',
            messageId,
            {
              intent: promptInput.intent,
              sceneComponents: scene.scene.length,
            },
            () => this.responseGeneratorService.generateStream(responsePrompt),
            (output) => ({
              hasTextStream: output?.textStream !== undefined,
            }),
            emitTrace,
          );
          if (streamState.closed) {
            this.logger.warn(
              `Client disconnected before response streaming for messageId=${messageId}; aborting remaining work.`,
            );
            return;
          }
        } catch (error) {
          this.logger.warn(
            `Response generator failed for messageId=${messageId}; using backend fallback response.`,
            error instanceof Error ? error.stack : undefined,
          );
          await this.emitProgress(res, streamState, {
            type: 'progress',
            step: 'responding',
            status: 'failed',
            label: 'LLM response generation failed. Falling back to deterministic guidance.',
          });
        }
      } else {
        this.logAgentSkipped(
          'ResponseGenerator',
          messageId,
          'missing_math_context',
          { hasMathContext },
          emitTrace,
        );
      }

      if (stream?.textStream) {
        this.logger.log(`Response generator stream ready for messageId=${messageId}.`);
        let emittedTokenChunks = 0;
        for await (const chunk of stream.textStream as AsyncIterable<string>) {
          if (streamState.closed) {
            this.logger.warn(
              `Client disconnected mid-token-stream for messageId=${messageId}; stopping token writes.`,
            );
            return;
          }
          this.writeEvent<ChatStreamTokenEvent>(res, streamState, {
            type: 'token',
            messageId,
            text: chunk,
          });
          emittedTokenChunks += 1;
        }
        if (emittedTokenChunks === 0) {
          this.logAgentInvalid(
            'ResponseGenerator',
            messageId,
            'empty_text_stream',
            {},
            emitTrace,
          );
        } else {
          this.logAgentCompleted(
            'ResponseGenerator.Stream',
            messageId,
            {
              emittedTokenChunks,
            },
            emitTrace,
          );
        }
      } else {
        if (hasMathContext) {
          this.logAgentInvalid('ResponseGenerator', messageId, 'null_stream', {
            usingFallback: true,
          }, emitTrace);
        } else {
          this.logAgentSkipped(
            'ResponseGenerator.Stream',
            messageId,
            'response_generator_not_started',
            { usingFallback: true },
            emitTrace,
          );
        }
        this.logger.warn(
          `Response generator returned null stream for messageId=${messageId}; using backend fallback response.`,
        );
        for (const chunk of this.chunkText(
          this.buildFallbackResponse(promptInput, validation, scene),
        )) {
          if (streamState.closed) {
            this.logger.warn(
              `Client disconnected during fallback stream for messageId=${messageId}; stopping token writes.`,
            );
            return;
          }
          this.writeEvent<ChatStreamTokenEvent>(res, streamState, {
            type: 'token',
            messageId,
            text: chunk,
          });
        }
      }

      await this.emitProgress(res, streamState, {
        type: 'progress',
        step: 'responding',
        status: 'completed',
        label: 'Response stream complete.',
      });
      if (streamState.closed) {
        return;
      }

      this.writeEvent<ChatStreamDoneEvent>(res, streamState, {
        type: 'done',
        messageId,
      });
    } catch (error) {
      if (!streamState.closed) {
        this.logger.error(
          'Chat SSE pipeline failed.',
          error instanceof Error ? error.stack : undefined,
        );
        this.writeEvent<ChatStreamErrorEvent>(res, streamState, {
          type: 'error',
          message: 'Chat streaming failed.',
        });
      }
    } finally {
      this.endStream(res, streamState);
    }
  }

  private configureSseHeaders(res: Response): void {
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();
  }

  private writeEvent<T>(
    res: Response,
    streamState: { closed: boolean },
    payload: T,
  ): void {
    if (streamState.closed) {
      return;
    }
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  }

  private async emitProgress(
    res: Response,
    streamState: { closed: boolean },
    payload: ChatStreamProgressEvent,
  ): Promise<void> {
    this.writeEvent(res, streamState, payload);
    await Promise.resolve();
  }

  private async runAsyncAgentStep<T>(
    agentName: string,
    messageId: string,
    details: Record<string, unknown>,
    action: () => Promise<T>,
    summarize?: (output: T) => Record<string, unknown>,
    emitTrace?: AgentTraceEmitter,
  ): Promise<T> {
    this.logAgentTriggered(agentName, messageId, details, emitTrace);

    try {
      const output = await action();
      this.logAgentCompleted(
        agentName,
        messageId,
        summarize ? summarize(output) : {},
        emitTrace,
      );
      return output;
    } catch (error) {
      this.logAgentFailed(agentName, messageId, error, emitTrace);
      throw error;
    }
  }

  private runSyncAgentStep<T>(
    agentName: string,
    messageId: string,
    details: Record<string, unknown>,
    action: () => T,
    summarize?: (output: T) => Record<string, unknown>,
    emitTrace?: AgentTraceEmitter,
  ): T {
    this.logAgentTriggered(agentName, messageId, details, emitTrace);

    try {
      const output = action();
      this.logAgentCompleted(
        agentName,
        messageId,
        summarize ? summarize(output) : {},
        emitTrace,
      );
      return output;
    } catch (error) {
      this.logAgentFailed(agentName, messageId, error, emitTrace);
      throw error;
    }
  }

  private logAgentTriggered(
    agentName: string,
    messageId: string,
    details: Record<string, unknown> = {},
    emitTrace?: AgentTraceEmitter,
  ): void {
    this.logger.log(
      `[AgentDebug] ${agentName} triggered messageId=${messageId}${this.formatAgentDetails(details)}`,
    );
    emitTrace?.({
      agent: agentName,
      status: 'triggered',
      label: `${agentName} started`,
      input: this.sanitizeTracePayload(details),
    });
  }

  private logAgentCompleted(
    agentName: string,
    messageId: string,
    details: Record<string, unknown> = {},
    emitTrace?: AgentTraceEmitter,
  ): void {
    this.logger.log(
      `[AgentDebug] ${agentName} completed messageId=${messageId}${this.formatAgentDetails(details)}`,
    );
    emitTrace?.({
      agent: agentName,
      status: 'completed',
      label: `${agentName} completed`,
      output: this.sanitizeTracePayload(details),
    });
  }

  private logAgentSkipped(
    agentName: string,
    messageId: string,
    reason: string,
    details: Record<string, unknown> = {},
    emitTrace?: AgentTraceEmitter,
  ): void {
    this.logger.log(
      `[AgentDebug] ${agentName} skipped messageId=${messageId} reason=${reason}${this.formatAgentDetails(details)}`,
    );
    emitTrace?.({
      agent: agentName,
      status: 'skipped',
      label: `${agentName} skipped`,
      reason,
      output: this.sanitizeTracePayload(details),
    });
  }

  private logAgentInvalid(
    agentName: string,
    messageId: string,
    reason: string,
    details: Record<string, unknown> = {},
    emitTrace?: AgentTraceEmitter,
  ): void {
    this.logger.warn(
      `[AgentDebug] ${agentName} invalid_output messageId=${messageId} reason=${reason}${this.formatAgentDetails(details)}`,
    );
    emitTrace?.({
      agent: agentName,
      status: 'invalid_output',
      label: `${agentName} returned incomplete output`,
      reason,
      output: this.sanitizeTracePayload(details),
    });
  }

  private logAgentFailed(
    agentName: string,
    messageId: string,
    error: unknown,
    emitTrace?: AgentTraceEmitter,
  ): void {
    const message = error instanceof Error ? error.message : String(error);

    this.logger.warn(
      `[AgentDebug] ${agentName} failed messageId=${messageId} error=${this.formatAgentValue(message)}`,
      error instanceof Error ? error.stack : undefined,
    );
    emitTrace?.({
      agent: agentName,
      status: 'failed',
      label: `${agentName} failed`,
      error: message,
    });
  }

  private sanitizeTracePayload(value: unknown): unknown {
    return this.sanitizeTraceValue(value, 0);
  }

  private sanitizeTraceValue(value: unknown, depth: number): unknown {
    if (value === null || value === undefined) {
      return value;
    }

    if (typeof value === 'string') {
      return value.length <= 8000 ? value : `${value.slice(0, 7997)}...`;
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'bigint') {
      return value.toString();
    }

    if (typeof value === 'function') {
      return '[function]';
    }

    if (depth >= 6) {
      return '[max-depth]';
    }

    if (Array.isArray(value)) {
      return value
        .slice(0, 30)
        .map((item) => this.sanitizeTraceValue(item, depth + 1));
    }

    if (typeof value === 'object') {
      const result: Record<string, unknown> = {};

      for (const [key, child] of Object.entries(
        value as Record<string, unknown>,
      )) {
        if (/api[_-]?key|secret|password|authorization|token/i.test(key)) {
          result[key] = '[redacted]';
          continue;
        }

        result[key] = this.sanitizeTraceValue(child, depth + 1);
      }

      return result;
    }

    return String(value);
  }

  private formatAgentDetails(details: Record<string, unknown>): string {
    const entries = Object.entries(details);

    if (entries.length === 0) {
      return '';
    }

    return ` ${entries
      .map(([key, value]) => `${key}=${this.formatAgentValue(value)}`)
      .join(' ')}`;
  }

  private formatAgentValue(value: unknown): string {
    if (value === null) {
      return 'null';
    }

    if (value === undefined) {
      return 'undefined';
    }

    const raw =
      typeof value === 'string'
        ? value
        : typeof value === 'number' || typeof value === 'boolean'
          ? String(value)
          : JSON.stringify(value);
    const normalized = raw.replace(/\s+/g, ' ').trim();

    if (normalized.length <= 160) {
      return normalized;
    }

    return `${normalized.slice(0, 157)}...`;
  }

  private buildPromptInput(
    body: ChatStreamRequest,
    intent: PromptBuilderInput['intent'],
    plannerOutput: {
      equation: string | null;
      studentAnswer: number | string | null;
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

  private mapScenePlanToSceneDescriptor(
    plan: SimpleScenePlan,
    visualInput: VisualLearningIntent,
  ): SceneDescriptor {
    return {
      scene: [
        {
          component: plan.component,
          props: {
            visualInput,
            scenePlan: plan,
            topic: visualInput.topic,
            stepNumber: visualInput.step_number,
            socraticQuestion: visualInput.socratic_question,
            mathState: visualInput.math_state,
            targetConcept: visualInput.target_concept,
            expectedStudentFocus: visualInput.expected_student_focus,
            visualTypeExpected: visualInput.visual_type_expected,
            visualGoal: visualInput.visual_goal,
            sceneIntent: plan.scene_intent,
            highlightFocus: plan.highlight_focus,
            interactionMode: plan.interaction_mode,
            studentInstruction: plan.student_instruction,
            correctTarget: plan.correct_target,
            hint: plan.hint,
            successFeedback: plan.success_feedback,
          },
        },
      ],
      animation: null,
    };
  }

  private hasMathContext(input: PromptBuilderInput): boolean {
    return input.equation !== null && input.equation.trim().length > 0;
  }

  private createStreamState(
    req: Request,
    res: Response,
  ): { closed: boolean } {
    const streamState = { closed: false };
    const markClosed = () => {
      streamState.closed = true;
    };

    req.on('close', markClosed);
    res.on('close', markClosed);
    res.on('finish', markClosed);

    return streamState;
  }

  private endStream(
    res: Response,
    streamState: { closed: boolean },
  ): void {
    if (streamState.closed) {
      return;
    }

    streamState.closed = true;
    res.end();
  }
}
