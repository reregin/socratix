import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Groq } from 'groq-sdk';
import {
  VisualizerSceneDescriptor,
  SceneDescriptorSchema,
} from './visualizer.schema.js';
import type { VisualizerPromptOutput } from '../prompt-builder/prompt-builder.types.js';

/**
 * Agent #4 — Dynamic Visualizer Service
 *
 * Uses Groq (Llama 3.3 70B or similar) in JSON structured mode to generate
 * a 3D scene descriptor based on the mathematical context.
 */
@Injectable()
export class VisualizerService {
  private readonly logger = new Logger(VisualizerService.name);

  constructor(private readonly configService: ConfigService) { }

  /**
   * Generate a 3D scene descriptor from the pipeline's visualizer prompt.
   *
   * @param prompt - Context and system prompt from Prompt Builder
   * @returns SceneDescriptor
   */
  async generateScene(
    prompt: VisualizerPromptOutput,
  ): Promise<VisualizerSceneDescriptor> {
    this.logger.debug(
      `Generating scene for equation="${prompt.context.equation}" step=${prompt.context.step}`,
    );

    return this.callLLM(prompt.systemPrompt);
  }

  /**
   * Standalone mode — generate a scene directly from a free-text prompt.
   * Useful for testing the visualizer capabilities independently.
   *
   * @param userPrompt - Free text request
   * @returns SceneDescriptor
   */
  async generateFromPrompt(
    userPrompt: string,
  ): Promise<VisualizerSceneDescriptor> {
    this.logger.debug(`Generating standalone scene from prompt: "${userPrompt}"`);

    const systemInstruction = `
You are a visualization engine for a 3D math tutoring app.
Generate a JSON scene descriptor that visually represents the user's request.

Available components:
- BalanceScale
- NumberLine
- Equation
- CountingBlocks
- Annotation
- Highlight
- StepByStep
- BarChart
- ShapeCanvas
- Grid

Requirements:
- Output MUST be valid JSON.
- The root must have a "scene" array.
- Each item in the "scene" array MUST have a "component" string property matching one of the available components above. Do not use "name" or "type".
- Each item MUST have a "props" object that matches what a 3D renderer would expect to visualize the math.
- "animation" string (optional).
- "camera" and "lighting" config (optional).
`.trim();

    return this.callLLM(`${systemInstruction}\n\nUser Request: ${userPrompt}`);
  }

  /**
   * Reusable LLM call for JSON generation.
   */
  private async callLLM(systemPrompt: string): Promise<VisualizerSceneDescriptor> {
    const apiKey = this.configService.get<string>('GROQ_API_KEY');
    if (!apiKey) {
      this.logger.warn('GROQ_API_KEY not set — returning empty scene');
      return this.emptyOutput();
    }

    const groq = new Groq({ apiKey });
    const modelStr = this.configService.get<string>('GROQ_MODEL') ?? 'llama-3.3-70b-versatile';

    try {
      // Use Groq SDK directly for JSON mode
      const chatCompletion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: systemPrompt }],
        model: modelStr,
        temperature: 0.7,
        max_tokens: 1024,
        response_format: { type: 'json_object' }
      });

      const content = chatCompletion.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(content);

      // Validate with Zod
      const result = SceneDescriptorSchema.safeParse(parsed);

      if (result.success) {
        this.logger.debug(
          `Visualizer output generated: ${result.data.scene.length} components, anim=${result.data.animation}`,
        );
        return result.data as unknown as VisualizerSceneDescriptor;
      } else {
        this.logger.warn(
          'LLM output did not perfectly match Zod schema. Salvaging data...',
        );
        
        // Salvage data: map "name" or "type" to "component" (common LLM mistake)
        const scene = Array.isArray(parsed.scene) ? parsed.scene : [];
        const animation = typeof parsed.animation === 'string' ? parsed.animation : null;
        
        const sanitizedScene = scene.map((item: any) => {
          let compName = item.component || item.type || item.name || 'Unknown';
          if (typeof compName === 'object') {
             compName = compName.type || compName.name || compName.component || 'Unknown';
          }
          return {
            component: String(compName),
            props: item.props || {},
            position: item.position,
            rotation: item.rotation,
            scale: item.scale
          };
        });

        this.logger.debug(
          `Visualizer output salvaged: ${sanitizedScene.length} components, anim=${animation}`,
        );

        return {
          scene: sanitizedScene,
          animation: animation,
          camera: parsed.camera,
          lighting: parsed.lighting
        } as unknown as VisualizerSceneDescriptor;
      }
    } catch (error) {
      console.log(error);
      this.logger.error('Failed to generate scene JSON', error);
      return this.emptyOutput();
    }
  }

  private emptyOutput(): VisualizerSceneDescriptor {
    return {
      scene: [],
      animation: null,
    };
  }
}
