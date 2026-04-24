import { Module } from '@nestjs/common';
import { RouterService } from './router/router.service.js';
import { PlannerService } from './planner/planner.service.js';

@Module({
  imports: [],
  providers: [RouterService, PlannerService],
  exports: [RouterService, PlannerService],
})
export class AgentsModule { }
