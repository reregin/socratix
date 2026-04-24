import { Controller, Post, Sse, MessageEvent, Body } from '@nestjs/common';
import { Observable } from 'rxjs';

@Controller('chat')
export class ChatController {
  
  @Post()
  @Sse()
  streamChat(@Body() body: any): Observable<MessageEvent> {
    // TODO: Integrate with Multi-Agent Pipeline to stream SSE responses
    return new Observable((subscriber) => {
      // Skeleton: Emitting a simple initial progress event
      subscriber.next({
        data: { type: 'pipeline_progress', step: 'routing', status: 'started', label: 'Connecting to pipeline...' },
      });
      subscriber.complete();
    });
  }
}
