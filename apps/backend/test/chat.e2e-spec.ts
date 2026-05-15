import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { ChatController } from '../src/chat/chat.controller';
import { RouterService } from '../src/agents/router/router.service';
import { PlannerService } from '../src/agents/planner/planner.service';
import { PromptBuilderService } from '../src/agents/prompt-builder/prompt-builder.service';
import { ResponseGeneratorService } from '../src/agents/response-generator/response-generator.service';
import { VisualizerService } from '../src/agents/visualizer/visualizer.service';
import { VALIDATOR } from '../src/services/validator/validator.interface';

describe('ChatController SSE (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ChatController],
      providers: [
        {
          provide: RouterService,
          useValue: {
            classify: jest.fn().mockResolvedValue({
              intent: 'attempting_answer',
              plannerRequired: true,
              validatorRequired: true,
            }),
          },
        },
        {
          provide: PlannerService,
          useValue: {
            extract: jest.fn().mockResolvedValue({
              equation: null,
              studentAnswer: null,
              problemType: null,
              extractedParams: null,
            }),
          },
        },
        {
          provide: PromptBuilderService,
          useValue: {},
        },
        {
          provide: ResponseGeneratorService,
          useValue: {
            generateStream: jest.fn(),
          },
        },
        {
          provide: VisualizerService,
          useValue: {
            generateScene: jest.fn(),
          },
        },
        {
          provide: VALIDATOR,
          useValue: {
            validate: jest.fn(),
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('skips scene generation and still streams clarification tokens when math context is unresolved', async () => {
    const response = await request(app.getHttpServer())
      .post('/chat')
      .set('Accept', 'text/event-stream')
      .send({ message: 'I think the answer is 9 for 3x + 5 = 14' })
      .expect(201);

    expect(response.headers['content-type']).toContain('text/event-stream');

    const events = response.text
      .trim()
      .split('\n\n')
      .filter(Boolean)
      .map((chunk) => {
        const line = chunk
          .split('\n')
          .find((value) => value.startsWith('data: '));

        if (!line) {
          throw new Error(`Missing data line in SSE chunk: ${chunk}`);
        }

        return JSON.parse(line.slice(6)) as Record<string, unknown>;
      });

    expect(events.some((event) => event.type === 'progress')).toBe(true);
    expect(events.some((event) => event.type === 'scene')).toBe(false);
    expect(events.some((event) => event.type === 'token')).toBe(true);
    expect(events.at(-1)).toEqual(
      expect.objectContaining({
        type: 'done',
      }),
    );

    expect(events).toContainEqual(
      expect.objectContaining({
        type: 'progress',
        step: 'visualizing',
        label: 'Skipping scene generation until an equation is resolved.',
      }),
    );

    const tokenPayload = events
      .filter((event) => event.type === 'token')
      .map((event) => String(event.text))
      .join('');
    expect(tokenPayload).toContain(
      'Send me the problem or your current attempt',
    );
  });

  afterEach(async () => {
    await app.close();
  });
});
