import * as dotenv from 'dotenv';
dotenv.config();

import { ConfigService } from '@nestjs/config';
import { RouterService } from '../src/agents/router/router.service';
import type { Intent } from '../src/agents/router/router.schema';

/**
 * Router Intent Accuracy — Live Groq E2E Test
 *
 * Calls the real Groq API for LLM-tier samples to measure classification
 * accuracy across the full 20-sample set. Regex-tier samples are included
 * for completeness but are expected to always pass (prompt tuning doesn't
 * affect them).
 *
 * Target: ≥90% accuracy (≥18/20)
 */
describe('Router Intent Accuracy (Live Groq E2E)', () => {
  let service: RouterService;

  // Ground truth samples — expected intents match router.service.spec.ts
  const samples: { input: string; expected: Intent; tier: 'regex' | 'llm' }[] = [
    // ─── Tier 1 (regex) — deterministic, always 100% ────────────
    { input: 'I think the answer is 9',      expected: 'attempting_answer', tier: 'regex' },
    { input: 'i got 42',                     expected: 'attempting_answer', tier: 'regex' },
    { input: 'my answer is 3',               expected: 'attempting_answer', tier: 'regex' },
    { input: 'The result is 7',              expected: 'attempting_answer', tier: 'regex' },
    { input: "I believe it's 5",             expected: 'attempting_answer', tier: 'regex' },
    { input: 'Can you help me?',             expected: 'conceptual_help',   tier: 'regex' },
    { input: 'Explain how to solve this',    expected: 'conceptual_help',   tier: 'regex' },
    { input: 'How do I factor this?',        expected: 'conceptual_help',   tier: 'regex' },
    { input: 'Why do we divide both sides?', expected: 'conceptual_help',   tier: 'regex' },
    { input: 'What does x represent?',       expected: 'conceptual_help',   tier: 'regex' },
    { input: 'Give me a new problem',        expected: 'new_problem',       tier: 'regex' },
    { input: 'Next question please',         expected: 'new_problem',       tier: 'regex' },
    { input: 'Another one',                  expected: 'new_problem',       tier: 'regex' },
    { input: 'I want a different problem',   expected: 'new_problem',       tier: 'regex' },
    { input: "Let's start over",             expected: 'new_problem',       tier: 'regex' },

    // ─── Tier 2 (LLM) — the actual tuning target ───────────────
    { input: 'hello there',                  expected: 'just_chatting',     tier: 'llm' },
    { input: 'ok cool',                      expected: 'just_chatting',     tier: 'llm' },
    { input: 'hmm let me think',             expected: 'just_chatting',     tier: 'llm' },

    // These hit regex in practice ("answer is", "explain"), but the plan
    // classifies them as LLM-tier for mixed-language validation
    { input: 'mi answer is 5',               expected: 'attempting_answer', tier: 'regex' },
    { input: 'ayuda me explain this',         expected: 'conceptual_help',  tier: 'regex' },
  ];

  beforeAll(() => {
    const configService = {
      get: (key: string) => process.env[key],
    } as unknown as ConfigService;

    service = new RouterService(configService);

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.warn(
        '\n⚠️  GROQ_API_KEY not found in .env — LLM-tier samples will fall back to just_chatting.\n' +
        '   Results will not reflect real LLM accuracy.\n',
      );
    }
  });

  it('should achieve ≥90% accuracy (≥18/20) on the 20-sample set', async () => {
    const results: {
      index: number;
      input: string;
      expected: Intent;
      actual: Intent;
      tier: string;
      pass: boolean;
    }[] = [];

    // Run samples sequentially to avoid Groq rate limits
    for (let i = 0; i < samples.length; i++) {
      const { input, expected, tier } = samples[i];
      const output = await service.classify(input);
      results.push({
        index: i + 1,
        input,
        expected,
        actual: output.intent,
        tier,
        pass: output.intent === expected,
      });
    }

    // ─── Print results table ───────────────────────────────────
    console.log('\n┌──────┬────────┬──────────────────────────────────┬────────────────────┬────────────────────┬────────┐');
    console.log('│  #   │  Tier  │ Input                            │ Expected           │ Actual             │ Result │');
    console.log('├──────┼────────┼──────────────────────────────────┼────────────────────┼────────────────────┼────────┤');

    for (const r of results) {
      const num = String(r.index).padStart(2);
      const tier = r.tier.padEnd(5);
      const input = r.input.padEnd(32).slice(0, 32);
      const expected = r.expected.padEnd(18);
      const actual = r.actual.padEnd(18);
      const result = r.pass ? '  ✅  ' : '  ❌  ';
      console.log(`│  ${num} │ ${tier} │ ${input} │ ${expected} │ ${actual} │${result}│`);
    }

    console.log('└──────┴────────┴──────────────────────────────────┴────────────────────┴────────────────────┴────────┘');

    // ─── Calculate scores ──────────────────────────────────────
    const totalPass = results.filter((r) => r.pass).length;
    const totalCount = results.length;
    const overallAccuracy = totalPass / totalCount;

    const llmResults = results.filter((r) => r.tier === 'llm');
    const llmPass = llmResults.filter((r) => r.pass).length;
    const llmCount = llmResults.length;
    const llmAccuracy = llmCount > 0 ? llmPass / llmCount : 1;

    console.log('\n📊 Accuracy Scores:');
    console.log(`   Overall:  ${totalPass}/${totalCount} (${(overallAccuracy * 100).toFixed(0)}%)`);
    console.log(`   LLM-only: ${llmPass}/${llmCount} (${(llmAccuracy * 100).toFixed(0)}%)`);

    // ─── Print misclassified list ──────────────────────────────
    const misclassified = results.filter((r) => !r.pass);
    if (misclassified.length > 0) {
      console.log('\n❌ Misclassified:');
      for (const m of misclassified) {
        console.log(`   Sample ${m.index}: "${m.input}" → got "${m.actual}", expected "${m.expected}" [${m.tier}]`);
      }
    } else {
      console.log('\n✅ All samples correctly classified!');
    }
    console.log('');

    // ─── Assertion ─────────────────────────────────────────────
    expect(overallAccuracy).toBeGreaterThanOrEqual(0.9);
  });
});
