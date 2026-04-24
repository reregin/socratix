import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AgentsModule } from './agents/agents.module';
import { ChatModule } from './chat/chat.module';
import { ServicesModule } from './services/services.module';
import { DbModule } from './db/db.module';

@Module({
  imports: [AgentsModule, ChatModule, ServicesModule, DbModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
