import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { RouterService } from '../src/agents/router/router.service';

describe('RouterService (e2e)', () => {
  let service: RouterService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env', // Automatically loads the keys from apps/backend/.env
        }),
      ],
      providers: [RouterService],
    }).compile();

    service = module.get<RouterService>(RouterService);
  });

  // Since E2E tests hit a real external API, we give them a higher timeout (15 seconds)
  jest.setTimeout(15000);

  describe('Live Groq LLM Fallback', () => {
    it('should correctly classify an ambiguous conceptual question via Groq LLM', async () => {
      // This input deliberately avoids regex keywords like 'explain', 'help', 'why'
      // but semantically means the user is stuck conceptually.
      const result = await service.classify("I'm totally lost, I'm just staring at the formula blankly");
      
      expect(result.intent).toBe('conceptual_help');
      expect(result.plannerRequired).toBe(true);
      expect(result.validatorRequired).toBe(false);
    });

    it('should correctly classify an ambiguous attempt via Groq LLM', async () => {
      // Avoids regex like 'answer is', 'i got'
      const result = await service.classify("I'm pretty sure it comes out to x = 5");
      
      expect(result.intent).toBe('attempting_answer');
      expect(result.plannerRequired).toBe(true);
      expect(result.validatorRequired).toBe(true);
    });

    it('should correctly classify small talk as just_chatting via Groq LLM', async () => {
      const result = await service.classify("hello there, nice weather today");
      
      expect(result.intent).toBe('just_chatting');
      expect(result.plannerRequired).toBe(false);
      expect(result.validatorRequired).toBe(false);
    });
  });
});
