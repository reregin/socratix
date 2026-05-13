import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('ChatController SSE (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('streams progress, token, scene, and done events for a prompt', async () => {
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
    expect(events.some((event) => event.type === 'scene')).toBe(true);
    expect(events.some((event) => event.type === 'token')).toBe(true);
    expect(events.at(-1)).toEqual(
      expect.objectContaining({
        type: 'done',
      }),
    );

    const sceneEvent = events.find((event) => event.type === 'scene');
    expect(sceneEvent).toEqual(
      expect.objectContaining({
        type: 'scene',
        scene: expect.objectContaining({
          scene: expect.any(Array),
          animation: null,
        }),
      }),
    );

    const tokenPayload = events
      .filter((event) => event.type === 'token')
      .map((event) => String(event.text))
      .join('');
    expect(tokenPayload.length).toBeGreaterThan(0);
  });

  afterEach(async () => {
    await app.close();
  });
});
