import { Controller, Post, Body, Logger } from '@nestjs/common';
import { VisualizerService } from './visualizer.service.js';
import {
  VisualStepInputSchema,
  type VisualStepInput,
  FALLBACK_SCENE_PLAN,
} from './visualizer.schema.js';

@Controller('api/visualizer')
export class VisualizerController {
  private readonly logger = new Logger(VisualizerController.name);

  constructor(private readonly visualizerService: VisualizerService) {}

  /**
   * POST /api/visualizer/generate
   *
   * Receives a Visual Step JSON (from Socratic Agent) and returns
   * a Simple Scene Plan JSON (from Math Visualizer Agent).
   */
  @Post('generate')
  async generate(@Body() body: VisualStepInput) {
    this.logger.log(
      `Received visual step: topic="${body.topic}" step=${body.step_number}`,
    );

    // Validate input
    const parsed = VisualStepInputSchema.safeParse(body);
    if (!parsed.success) {
      this.logger.warn('Invalid input — returning fallback', parsed.error.issues);
      return FALLBACK_SCENE_PLAN;
    }

    const result = await this.visualizerService.generateScenePlan(parsed.data);
    return result;
  }
}
