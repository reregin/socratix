import { Controller, Post, Body, Logger } from '@nestjs/common';
import { VisualizerService } from './visualizer.service.js';

@Controller('api/visualizer')
export class VisualizerController {
  private readonly logger = new Logger(VisualizerController.name);

  constructor(private readonly visualizerService: VisualizerService) {}

  /**
   * POST /api/visualizer/generate
   * 
   * Standalone endpoint for testing the 3D visualizer without needing
   * the full pipeline. Receives a free-text prompt and returns a 
   * 3D scene descriptor JSON.
   */
  @Post('generate')
  async generate(@Body() body: { prompt: string }) {
    this.logger.log(`Received test prompt: "${body.prompt}"`);
    
    if (!body.prompt) {
      return { scene: [], animation: null };
    }

    const result = await this.visualizerService.generateFromPrompt(body.prompt);
    return result;
  }
}
