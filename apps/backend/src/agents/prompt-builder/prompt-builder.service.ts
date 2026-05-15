import { Injectable, Logger } from '@nestjs/common';

import type {
  PromptBuilderInput,
  VisualLearningIntent,
  SceneDescriptor,
  ResponsePromptOutput,
} from './prompt-builder.types.js';

import {
  buildAttemptingAnswerIncorrectPrompt,
  buildAttemptingAnswerCorrectPrompt,
  buildConceptualHelpPrompt,
  buildNewProblemPrompt,
  buildJustChattingPrompt,
  buildSceneContextBlock,
} from './prompt-templates.js';


@Injectable()
export class PromptBuilderService {
  private readonly logger = new Logger(PromptBuilderService.name);

  buildVisualIntent(input: PromptBuilderInput): VisualLearningIntent {
    this.logger.debug(
      `Building visual intent: intent="${input.intent}" equation="${input.equation}" type="${input.problemType}"`,
    );

    const mathState =
      input.equation ?? this.extractMathStateFromMessage(input.userMessage);

    const topic = this.resolveTopic(input.problemType, mathState);
    const targetConcept = this.resolveTargetConcept(input);
    const expectedStudentFocus = this.resolveExpectedStudentFocus(
      input,
      mathState,
    );
    const visualTypeExpected = this.resolveVisualTypeExpected(
      input.problemType,
      topic,
    );

    return {
      topic,
      step_number: input.step ?? 1,
      socratic_question: this.buildSocraticQuestion(
        input,
        expectedStudentFocus,
      ),
      math_state: mathState,
      target_concept: targetConcept,
      expected_student_focus: expectedStudentFocus,
      visual_type_expected: visualTypeExpected,
      visual_goal: this.buildVisualGoal(
        visualTypeExpected,
        mathState,
        targetConcept,
        expectedStudentFocus,
      ),
    };
  }

  /**
   * Temporary compatibility wrapper.
   *
   * Kalau file lain di project kamu masih memanggil buildVisualizerPrompt(),
   * method ini mencegah error dulu.
   *
   * Nanti kalau semua caller sudah diganti ke buildVisualIntent(),
   * method ini boleh dihapus.
   */
  buildVisualizerPrompt(input: PromptBuilderInput): VisualLearningIntent {
    return this.buildVisualIntent(input);
  }

  /**
   * Phase 5a → 5b: Build the final prompt for the Response Generator.
   *
   * This is called AFTER the Visualizer has produced its scene JSON.
   */
  buildResponsePrompt(
    input: PromptBuilderInput,
    scene: SceneDescriptor | null,
  ): ResponsePromptOutput {
    this.logger.debug(
      `Building response prompt: intent="${input.intent}" hasScene=${scene !== null}`,
    );

    let systemPrompt = this.buildBasePromptByIntent(input);

    if (scene && scene.scene.length > 0) {
      const sceneContext = buildSceneContextBlock(
        scene.scene,
        scene.animation,
      );
      systemPrompt = `${systemPrompt}\n\n${sceneContext}`;
    }

    if (input.conversationHistory.length > 0) {
      const historySummary = this.summarizeHistory(input.conversationHistory);
      systemPrompt = `${systemPrompt}\n\n${historySummary}`;
    }

    return {
      systemPrompt,
      userMessage: input.userMessage,
    };
  }

  private extractMathStateFromMessage(userMessage: string): string {
    const equationMatch = userMessage.match(
      /[-+]?\d*\s*[a-zA-Z]\s*(?:[-+]\s*\d+)?\s*=\s*[-+]?\d+(?:\.\d+)?/,
    );

    return equationMatch?.[0]?.replace(/\s+/g, ' ').trim() ?? userMessage.trim();
  }

  private resolveTopic(
    problemType: PromptBuilderInput['problemType'],
    mathState: string,
  ): string {
    const normalized = mathState.replace(/\s+/g, '').toLowerCase();

    if (
      problemType === 'algebra' &&
      /^[+-]?\d*[a-z][-+]?\d*=/.test(normalized)
    ) {
      return 'persamaan_linear_satu_variabel';
    }

    if (problemType === 'algebra') {
      return 'aljabar';
    }

    if (problemType === 'geometry') {
      return 'geometri';
    }

    if (problemType === 'statistics') {
      return 'statistika';
    }

    return 'aritmetika';
  }

  private resolveTargetConcept(input: PromptBuilderInput): string {
    if (input.intent === 'attempting_answer') {
      return 'memeriksa jawaban dengan substitusi';
    }

    if (input.problemType === 'algebra') {
      return 'mengisolasi variabel';
    }

    if (input.problemType === 'geometry') {
      return 'memahami hubungan bentuk dan ukuran';
    }

    if (input.problemType === 'statistics') {
      return 'membaca dan membandingkan data';
    }

    return 'memahami operasi hitung';
  }

  private resolveExpectedStudentFocus(
    input: PromptBuilderInput,
    mathState: string,
  ): string {
    if (input.intent === 'attempting_answer' && input.studentAnswer !== null) {
      return `x = ${input.studentAnswer} saat disubstitusikan ke persamaan awal`;
    }

    const linearMatch = mathState.match(
      /^\s*[-+]?\d*\s*[a-zA-Z]\s*([+-]\s*\d+)\s*=\s*[-+]?\d+(?:\.\d+)?\s*$/,
    );

    if (linearMatch?.[1]) {
      const constantTerm = linearMatch[1].replace(/\s+/g, '');
      return `${constantTerm} di ruas kiri`;
    }

    if (input.problemType === 'algebra') {
      return 'bagian yang menghalangi variabel agar berdiri sendiri';
    }

    return 'bagian penting dari soal yang perlu diperhatikan dulu';
  }

  private resolveVisualTypeExpected(
    problemType: PromptBuilderInput['problemType'],
    topic: string,
  ): VisualLearningIntent['visual_type_expected'] {
    if (topic === 'persamaan_linear_satu_variabel') {
      return 'balance_scale';
    }

    if (problemType === 'geometry') {
      return 'geometry_shape';
    }

    if (problemType === 'statistics') {
      return 'simple_chart';
    }

    return 'number_line';
  }

  private buildSocraticQuestion(
    input: PromptBuilderInput,
    expectedStudentFocus: string,
  ): string {
    if (input.intent === 'attempting_answer' && input.studentAnswer !== null) {
      return `Kalau ${expectedStudentFocus}, apakah kedua ruas persamaan tetap seimbang?`;
    }

    if (input.problemType === 'algebra') {
      return 'Bagian mana yang harus kita hilangkan dulu agar x lebih mudah ditemukan?';
    }

    if (input.problemType === 'geometry') {
      return 'Bagian mana dari gambar yang paling membantu untuk mulai menyelesaikan soal ini?';
    }

    if (input.problemType === 'statistics') {
      return 'Data mana yang perlu kita bandingkan terlebih dahulu?';
    }

    return 'Langkah kecil apa yang bisa kita coba terlebih dahulu?';
  }

  private buildVisualGoal(
    visualTypeExpected: string,
    mathState: string,
    targetConcept: string,
    expectedStudentFocus: string,
  ): string {
    if (visualTypeExpected === 'balance_scale') {
      return `Menunjukkan bahwa persamaan ${mathState} adalah dua sisi yang seimbang, dan siswa perlu memperhatikan ${expectedStudentFocus} untuk ${targetConcept}.`;
    }

    return `Menunjukkan representasi visual dari ${mathState} agar siswa fokus pada ${expectedStudentFocus} untuk ${targetConcept}.`;
  }

  private buildBasePromptByIntent(input: PromptBuilderInput): string {
    switch (input.intent) {
      case 'attempting_answer': {
        if (input.validation?.isCorrect) {
          return buildAttemptingAnswerCorrectPrompt({
            equation: input.equation ?? 'Unknown equation',
            studentAnswer: input.studentAnswer ?? 'Unknown',
            step: input.step,
          });
        }

        return buildAttemptingAnswerIncorrectPrompt({
          equation: input.equation ?? 'Unknown equation',
          studentAnswer: input.studentAnswer ?? 'Unknown',
          expected: input.validation?.expected ?? 'Unknown',
          errorType: input.validation?.errorType ?? 'wrong_value',
          step: input.step,
          problemType: input.problemType ?? 'arithmetic',
        });
      }

      case 'conceptual_help':
        return buildConceptualHelpPrompt({
          equation: input.equation,
          problemType: input.problemType,
          step: input.step,
        });

      case 'new_problem':
        return buildNewProblemPrompt({
          equation: input.equation ?? 'New problem',
          problemType: input.problemType ?? 'arithmetic',
        });

      case 'just_chatting':
        return buildJustChattingPrompt();

      default:
        return buildJustChattingPrompt();
    }
  }

  private summarizeHistory(
    history: { role: string; content: string }[],
  ): string {
    const recentHistory = history.slice(-6);

    const formatted = recentHistory
      .map((msg) => {
        const role = msg.role === 'user' ? 'Student' : 'Tutor';
        const content =
          msg.content.length > 200
            ? msg.content.substring(0, 200) + '...'
            : msg.content;

        return `${role}: ${content}`;
      })
      .join('\n');

    return `
## RECENT CONVERSATION HISTORY:
${formatted}

Note: Use the conversation history to maintain continuity. Don't repeat questions you've already asked.
`.trim();
  }
}
