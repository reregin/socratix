/**
 * Interactive test script for Agent #0 (Router) + Agent #1 (Planner).
 *
 * Usage (from apps/backend):
 *   npm run build; node dist/agents/test-agents.js
 *
 * Type any message and see how the Router classifies it,
 * then (if plannerRequired) how the Planner extracts math context.
 * Type "exit" to quit.
 */

import 'dotenv/config';
import * as readline from 'readline';
import { ConfigService } from '@nestjs/config';
import { RouterService } from './router/router.service.js';
import { PlannerService } from './planner/planner.service.js';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Bootstrap services manually (outside NestJS DI for quick testing)
const configService = new ConfigService();
const router = new RouterService(configService);
const planner = new PlannerService(configService);

const conversationHistory: { role: 'user' | 'assistant'; content: string }[] = [];

console.log('═══════════════════════════════════════════════════');
console.log('  Socratix Agent Tester — Router (#0) + Planner (#1)');
console.log('═══════════════════════════════════════════════════');
console.log('Type a student message and press Enter.');
console.log('Type "exit" to quit.\n');

function prompt() {
  rl.question('You: ', async (input: string) => {
    const message = input.trim();
    if (message.toLowerCase() === 'exit') {
      console.log('\nBye!');
      rl.close();
      return;
    }

    if (!message) {
      prompt();
      return;
    }

    try {
      // --- Agent #0: Router ---
      console.log('\n[Agent #0 - Router]');
      const routerResult = await router.classify(message, conversationHistory);
      console.log(`   Intent:             ${routerResult.intent}`);
      console.log(`   Planner required:   ${routerResult.plannerRequired}`);
      console.log(`   Validator required: ${routerResult.validatorRequired}`);

      // --- Agent #1: Planner (only if required) ---
      if (routerResult.plannerRequired) {
        console.log('\n[Agent #1 - Planner]');
        const plannerResult = await planner.extract(
          message,
          conversationHistory,
          routerResult.intent,
        );
        console.log(`   Equation:          ${plannerResult.equation ?? '(none)'}`);
        console.log(`   Student answer:    ${plannerResult.studentAnswer ?? '(none)'}`);
        console.log(`   Problem type:      ${plannerResult.problemType ?? '(none)'}`);
        console.log(`   Extracted params:  ${plannerResult.extractedParams ? JSON.stringify(plannerResult.extractedParams) : '(none)'}`);
      } else {
        console.log('\n   Planner skipped (just_chatting)');
      }

      // Add to conversation history
      conversationHistory.push({ role: 'user', content: message });

    } catch (err: any) {
      console.error(`\nError: ${err.message}`);
    }

    console.log('\n---------------------------------------------------');
    prompt();
  });
}

prompt();
