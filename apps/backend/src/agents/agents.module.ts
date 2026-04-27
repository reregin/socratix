import { Module } from '@nestjs/common';
import { RouterService } from './router/router.service.js';
import { PlannerService } from './planner/planner.service.js';
import { PromptBuilderService } from './prompt-builder/prompt-builder.service.js';
import { ResponseGeneratorService } from './response-generator/response-generator.service.js';
import { VisualizerService } from './visualizer/visualizer.service.js';
import { VisualizerController } from './visualizer/visualizer.controller.js';

@Module({
  imports: [],
  controllers: [VisualizerController],
  providers: [RouterService, PlannerService, PromptBuilderService, ResponseGeneratorService, VisualizerService],
  exports: [RouterService, PlannerService, PromptBuilderService, ResponseGeneratorService, VisualizerService],
})
export class AgentsModule { }