import { z } from 'zod';
import { SceneComponent, SceneDescriptor } from '../prompt-builder/prompt-builder.types.js';

export const SceneComponentSchema = z.object({
  component: z.string().describe('The name of the visual component (e.g., BalanceScale, Equation, NumberLine).'),
  props: z.record(z.string(), z.unknown()).describe('Component-specific properties to configure its state.'),
  position: z.object({
    x: z.number(),
    y: z.number(),
    z: z.number(),
  }).optional().describe('Optional 3D position offset.'),
  rotation: z.object({
    x: z.number(),
    y: z.number(),
    z: z.number(),
  }).optional().describe('Optional 3D rotation in radians.'),
  scale: z.object({
    x: z.number(),
    y: z.number(),
    z: z.number(),
  }).optional().describe('Optional 3D scale multipliers.'),
});

export const SceneDescriptorSchema = z.object({
  scene: z.array(SceneComponentSchema).describe('List of visual components to render.'),
  animation: z.string().nullable().describe('Optional animation instruction to play.'),
  camera: z.object({
    position: z.object({ x: z.number(), y: z.number(), z: z.number() }),
    lookAt: z.object({ x: z.number(), y: z.number(), z: z.number() }),
  }).optional().describe('Optional camera configuration.'),
  lighting: z.object({
    ambientIntensity: z.number().optional(),
    directionalIntensity: z.number().optional(),
  }).optional().describe('Optional lighting configuration.'),
});

// We cast it back to SceneDescriptor from prompt-builder.types to ensure compatibility
export type VisualizerSceneDescriptor = z.infer<typeof SceneDescriptorSchema> & SceneDescriptor;
