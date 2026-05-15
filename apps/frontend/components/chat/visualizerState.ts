import type {
  StreamSceneDescriptor,
  StreamSceneComponent,
} from "@/../../packages/shared-types/src/chat-stream";
import {
  DEFAULT_VISUALIZER_SAMPLE_KEY,
  VISUALIZER_SAMPLES,
} from "@/components/visualizer/sampleScenes";
import type {
  SimpleScenePlan,
  VisualStepInput,
} from "@/components/visualizer/VisualizerCanvas";

export type VisualizerSource = "sample" | "inferred" | "stream";

export interface ChatVisualizerState {
  sampleKey: string;
  input: VisualStepInput;
  scene: SimpleScenePlan;
  source: VisualizerSource;
}

const COMPONENT_TO_SAMPLE_KEY: Record<string, string> = {
  BalanceScaleVisualizer: "balance_scale",
  NumberLineVisualizer: "number_line",
  FractionBarVisualizer: "fraction_bar",
  AreaModelVisualizer: "area_model",
  CoordinatePlaneVisualizer: "coordinate_plane",
  GeometryShapeVisualizer: "geometry_shape",
  AngleDiagramVisualizer: "angle_diagram",
  BarModelVisualizer: "bar_model",
  TablePatternVisualizer: "table_pattern",
  SolidShapeVisualizer: "solid_shape",
  SimpleChartVisualizer: "simple_chart",
};

const COMPONENT_TO_VISUAL_TYPE: Record<string, VisualStepInput["visual_type_expected"]> = {
  BalanceScaleVisualizer: "balance_scale",
  NumberLineVisualizer: "number_line",
  FractionBarVisualizer: "fraction_bar",
  AreaModelVisualizer: "area_model",
  CoordinatePlaneVisualizer: "coordinate_plane",
  GeometryShapeVisualizer: "geometry_shape",
  AngleDiagramVisualizer: "angle_diagram",
  BarModelVisualizer: "bar_model",
  TablePatternVisualizer: "table_pattern",
  SolidShapeVisualizer: "solid_shape",
  SimpleChartVisualizer: "simple_chart",
};

const VALID_VISUAL_TYPES = new Set<VisualStepInput["visual_type_expected"]>([
  "balance_scale",
  "number_line",
  "fraction_bar",
  "area_model",
  "coordinate_plane",
  "geometry_shape",
  "angle_diagram",
  "bar_model",
  "table_pattern",
  "solid_shape",
  "simple_chart",
]);

const VALID_INTERACTION_MODES = new Set<SimpleScenePlan["interaction_mode"]>([
  "none",
  "highlight",
  "select",
  "drag",
  "slider",
  "construct",
]);

export function visualizerStateFromSample(
  sampleKey: string = DEFAULT_VISUALIZER_SAMPLE_KEY,
  source: VisualizerSource = "sample",
): ChatVisualizerState {
  const sample =
    VISUALIZER_SAMPLES[sampleKey] ??
    VISUALIZER_SAMPLES[DEFAULT_VISUALIZER_SAMPLE_KEY];

  return {
    sampleKey,
    input: { ...sample.input },
    scene: { ...sample.scene },
    source,
  };
}

export function visualizerStateFromMessage(message: string): ChatVisualizerState {
  const sampleKey = inferSampleKeyFromMessage(message);
  const state = visualizerStateFromSample(sampleKey, "inferred");
  const mathState = extractMathStateFromMessage(message);

  return {
    ...state,
    input: {
      ...state.input,
      math_state: mathState ?? state.input.math_state,
    },
  };
}

export function visualizerStateFromStreamScene(
  descriptor: StreamSceneDescriptor,
  fallback: ChatVisualizerState,
  userMessage: string,
): ChatVisualizerState | null {
  const component = descriptor.scene[0];

  if (!component) {
    return null;
  }

  const props = toRecord(component.props);
  const embeddedScene = toRecord(props.scenePlan);
  const embeddedInput = toRecord(props.visualInput);
  const componentName = asString(component.component) ?? fallback.scene.component;
  const sampleKey =
    COMPONENT_TO_SAMPLE_KEY[componentName] ??
    COMPONENT_TO_SAMPLE_KEY[fallback.scene.component] ??
    fallback.sampleKey;
  const sample = visualizerStateFromSample(sampleKey);
  const scene = buildScenePlan(component, props, embeddedScene, fallback);
  const input = buildVisualInput(
    props,
    embeddedInput,
    scene,
    fallback,
    sample.input,
    userMessage,
  );

  return {
    sampleKey,
    input,
    scene,
    source: "stream",
  };
}

function buildScenePlan(
  component: StreamSceneComponent,
  props: Record<string, unknown>,
  embeddedScene: Record<string, unknown>,
  fallback: ChatVisualizerState,
): SimpleScenePlan {
  const componentName =
    asString(embeddedScene.component) ??
    asString(component.component) ??
    fallback.scene.component;
  const interactionMode =
    asInteractionMode(embeddedScene.interaction_mode) ??
    asInteractionMode(props.interactionMode) ??
    fallback.scene.interaction_mode;

  return {
    component: componentName,
    scene_intent:
      asString(embeddedScene.scene_intent) ??
      asString(props.sceneIntent) ??
      fallback.scene.scene_intent,
    highlight_focus:
      asString(embeddedScene.highlight_focus) ??
      asString(props.highlightFocus) ??
      fallback.scene.highlight_focus,
    interaction_mode: interactionMode,
    student_instruction:
      asString(embeddedScene.student_instruction) ??
      asString(props.studentInstruction) ??
      fallback.scene.student_instruction,
    correct_target:
      asString(embeddedScene.correct_target) ??
      asString(props.correctTarget) ??
      fallback.scene.correct_target,
    hint:
      asString(embeddedScene.hint) ??
      asString(props.hint) ??
      fallback.scene.hint,
    success_feedback:
      asString(embeddedScene.success_feedback) ??
      asString(props.successFeedback) ??
      fallback.scene.success_feedback,
  };
}

function buildVisualInput(
  props: Record<string, unknown>,
  embeddedInput: Record<string, unknown>,
  scene: SimpleScenePlan,
  fallback: ChatVisualizerState,
  sampleInput: VisualStepInput,
  userMessage: string,
): VisualStepInput {
  const visualType =
    asVisualType(embeddedInput.visual_type_expected) ??
    asVisualType(props.visualTypeExpected) ??
    COMPONENT_TO_VISUAL_TYPE[scene.component] ??
    sampleInput.visual_type_expected;

  return {
    topic:
      asString(embeddedInput.topic) ??
      asString(props.topic) ??
      sampleInput.topic,
    step_number:
      asNumber(embeddedInput.step_number) ??
      asNumber(props.stepNumber) ??
      fallback.input.step_number,
    socratic_question:
      asString(embeddedInput.socratic_question) ??
      asString(props.socraticQuestion) ??
      fallback.input.socratic_question,
    math_state:
      asString(embeddedInput.math_state) ??
      asString(props.mathState) ??
      extractMathStateFromMessage(userMessage) ??
      fallback.input.math_state,
    target_concept:
      asString(embeddedInput.target_concept) ??
      asString(props.targetConcept) ??
      sampleInput.target_concept,
    expected_student_focus:
      asString(embeddedInput.expected_student_focus) ??
      asString(props.expectedStudentFocus) ??
      scene.highlight_focus,
    visual_type_expected: visualType,
    visual_goal:
      asString(embeddedInput.visual_goal) ??
      asString(props.visualGoal) ??
      scene.scene_intent,
  };
}

function inferSampleKeyFromMessage(message: string): string {
  const text = message.toLowerCase();

  if (/\b(balok|kubus|rusuk|volume|bangun ruang)\b/.test(text)) {
    return "solid_shape";
  }

  if (/\b(segitiga|persegi|lingkaran|alas|tinggi|luas|bangun datar)\b/.test(text)) {
    return "geometry_shape";
  }

  if (/\b(sudut|derajat|degree|angle)\b|[0-9]\s*\u00b0/.test(text)) {
    return "angle_diagram";
  }

  if (/\d+\s*\/\s*\d+|\b(pecahan|pembilang|penyebut)\b/.test(text)) {
    return "fraction_bar";
  }

  if (/\(\s*-?\d+(?:\.\d+)?\s*,\s*-?\d+(?:\.\d+)?\s*\)|\b(koordinat|cartesius|titik)\b/.test(text)) {
    return "coordinate_plane";
  }

  if (/\d+\s*:\s*\d+|\b(rasio|perbandingan)\b/.test(text)) {
    return "bar_model";
  }

  if (/\b(data|modus|median|mean|statistika|diagram|grafik)\b/.test(text)) {
    return "simple_chart";
  }

  if (/\b(pola|barisan|sequence)\b|(?:-?\d+\s*,\s*){3,}/.test(text)) {
    return "table_pattern";
  }

  if (/\d+\s*(x|\u00d7|\*)\s*\d+|\b(perkalian|multiply)\b/.test(text)) {
    return "area_model";
  }

  if (/[a-z]\s*(?:[+-]\s*\d+)?\s*=|=\s*[-+]?\d+(?:\.\d+)?/.test(text)) {
    return "balance_scale";
  }

  return "number_line";
}

function extractMathStateFromMessage(message: string): string | null {
  const patterns = [
    /[-+]?\d*\s*[a-zA-Z]\s*(?:[-+]\s*\d+)?\s*=\s*[-+]?\d+(?:\.\d+)?/,
    /\d+\s*\/\s*\d+/,
    /\(\s*-?\d+(?:\.\d+)?\s*,\s*-?\d+(?:\.\d+)?\s*\)/,
    /(?:sudut\s*)?\d+\s*(?:\u00b0|derajat|degrees?)/i,
    /\d+\s*:\s*\d+/,
    /\d+\s*(?:x|\u00d7|\*)\s*\d+/i,
    /(?:data\s*:?\s*)?-?\d+(?:\s*,\s*-?\d+){2,}(?:\s*,?\s*\.{3})?/i,
    /(?:segitiga|balok|kubus)[^.?!]*/i,
    /-?\d+(?:\.\d+)?/,
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    const value = match?.[0]?.replace(/\s+/g, " ").trim();

    if (value) {
      return value;
    }
  }

  return null;
}

function toRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0
    ? value
    : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asVisualType(value: unknown): VisualStepInput["visual_type_expected"] | null {
  return typeof value === "string" &&
    VALID_VISUAL_TYPES.has(value as VisualStepInput["visual_type_expected"])
    ? (value as VisualStepInput["visual_type_expected"])
    : null;
}

function asInteractionMode(value: unknown): SimpleScenePlan["interaction_mode"] | null {
  return typeof value === "string" &&
    VALID_INTERACTION_MODES.has(value as SimpleScenePlan["interaction_mode"])
    ? (value as SimpleScenePlan["interaction_mode"])
    : null;
}
