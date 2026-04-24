import { Module } from '@nestjs/common';
import { RouterService } from './router/router.service.js';
import { PlannerService } from './planner/planner.service.js';
import { PromptBuilderService } from './prompt-builder/prompt-builder.service.js';

@Module({
  imports: [],
  providers: [RouterService, PlannerService, PromptBuilderService],
  exports: [RouterService, PlannerService, PromptBuilderService],
})
export class AgentsModule {}
