import { Logger } from '@nestjs/common';
import { ChatController } from './chat.controller';

describe('ChatController', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('skips visualizer and response generator when planner does not resolve an equation', async () => {
    const routerService = {
      classify: jest.fn().mockResolvedValue({
        intent: 'attempting_answer',
        plannerRequired: true,
        validatorRequired: true,
      }),
    };
    const plannerService = {
      extract: jest.fn().mockResolvedValue({
        equation: null,
        studentAnswer: null,
        problemType: null,
        extractedParams: null,
      }),
    };
    const promptBuilderService = {
      buildPromptInput: jest.fn(),
      buildVisualizerPrompt: jest.fn(),
      buildResponsePrompt: jest.fn(),
    };
    const responseGeneratorService = {
      generateStream: jest.fn(),
    };
    const visualizerService = {
      generateScene: jest.fn(),
    };
    const validator = {
      validate: jest.fn(),
    };

    const controller = new ChatController(
      routerService as never,
      plannerService as never,
      promptBuilderService as never,
      responseGeneratorService as never,
      visualizerService as never,
      validator as never,
    );

    const writes: string[] = [];
    const response = {
      setHeader: jest.fn(),
      flushHeaders: jest.fn(),
      write: jest.fn((chunk: string) => {
        writes.push(chunk);
      }),
      end: jest.fn(),
    };

    jest.spyOn(Logger.prototype, 'warn').mockImplementation();

    await controller.streamChat(
      { message: 'I think the answer is 9' },
      response as never,
    );

    expect(visualizerService.generateScene).not.toHaveBeenCalled();
    expect(responseGeneratorService.generateStream).not.toHaveBeenCalled();
    expect(validator.validate).not.toHaveBeenCalled();
    expect(writes.join('')).toContain(
      'Skipping scene generation until an equation is resolved.',
    );
    const tokenText = writes
      .filter((chunk) => chunk.includes('"type":"token"'))
      .map((chunk) => {
        const payload = JSON.parse(chunk.replace(/^data:\s*/, '').trim());
        return String(payload.text);
      })
      .join('');
    expect(tokenText).toContain(
      'Send me the problem or your current attempt',
    );
    expect(response.end).toHaveBeenCalled();
  });

  it('continues with fallback tokens when planner throws', async () => {
    const routerService = {
      classify: jest.fn().mockResolvedValue({
        intent: 'attempting_answer',
        plannerRequired: true,
        validatorRequired: true,
      }),
    };
    const plannerService = {
      extract: jest.fn().mockRejectedValue(new Error('planner timeout')),
    };
    const promptBuilderService = {
      buildVisualizerPrompt: jest.fn(),
      buildResponsePrompt: jest.fn(),
    };
    const responseGeneratorService = {
      generateStream: jest.fn(),
    };
    const visualizerService = {
      generateScene: jest.fn(),
    };
    const validator = {
      validate: jest.fn(),
    };

    const controller = new ChatController(
      routerService as never,
      plannerService as never,
      promptBuilderService as never,
      responseGeneratorService as never,
      visualizerService as never,
      validator as never,
    );

    const writes: string[] = [];
    const response = {
      setHeader: jest.fn(),
      flushHeaders: jest.fn(),
      write: jest.fn((chunk: string) => {
        writes.push(chunk);
      }),
      end: jest.fn(),
    };

    jest.spyOn(Logger.prototype, 'warn').mockImplementation();

    await controller.streamChat(
      { message: 'I think the answer is 9' },
      response as never,
    );

    expect(visualizerService.generateScene).not.toHaveBeenCalled();
    expect(responseGeneratorService.generateStream).not.toHaveBeenCalled();
    expect(validator.validate).not.toHaveBeenCalled();
    expect(writes.join('')).toContain(
      'Could not resolve the equation automatically. Continuing with fallback guidance.',
    );
    expect(writes.join('')).toContain('"type":"done"');
    expect(writes.join('')).not.toContain('"type":"error"');
  });
});
