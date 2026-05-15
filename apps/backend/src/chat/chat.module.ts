import { Module } from '@nestjs/common';
import { AgentsModule } from '../agents/agents.module.js';
import { ServicesModule } from '../services/services.module.js';
import { ChatController } from './chat.controller';

@Module({
  imports: [AgentsModule, ServicesModule],
  controllers: [ChatController],
  providers: [],
})
export class ChatModule {}
