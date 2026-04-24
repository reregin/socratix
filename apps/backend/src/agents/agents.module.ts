import { Module } from '@nestjs/common';
import { RouterService } from './router/router.service.js';
import { PlannerService } from './planner/planner.service.js';
import { PromptBuilderService } from './prompt-builder/prompt-builder.service.js';
import { ResponseGeneratorService } from './response-generator/response-generator.service.js';

@Module({
  imports: [],
  providers: [RouterService, PlannerService, PromptBuilderService, ResponseGeneratorService],
  exports: [RouterService, PlannerService, PromptBuilderService, ResponseGeneratorService],
})
export class AgentsModule { }