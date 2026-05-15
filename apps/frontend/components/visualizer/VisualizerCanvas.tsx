"use client";

import { motion } from "framer-motion";
import { BalanceScaleVisualizer } from "./scenes/BalanceScaleVisualizer";
import { NumberLineVisualizer } from "./scenes/NumberLineVisualizer";
import { FractionBarVisualizer } from "./scenes/FractionBarVisualizer";
import { AreaModelVisualizer } from "./scenes/AreaModelVisualizer";
import { CoordinatePlaneVisualizer } from "./scenes/CoordinatePlaneVisualizer";
import { GeometryShapeVisualizer } from "./scenes/GeometryShapeVisualizer";
import { AngleDiagramVisualizer } from "./scenes/AngleDiagramVisualizer";
import { BarModelVisualizer } from "./scenes/BarModelVisualizer";
import { TablePatternVisualizer } from "./scenes/TablePatternVisualizer";
import { SolidShapeVisualizer } from "./scenes/SolidShapeVisualizer";
import { SimpleChartVisualizer } from "./scenes/SimpleChartVisualizer";
import { useState } from "react";

/* ─── Types ─────────────────────────────────────────────────────────── */

export interface VisualStepInput {
  topic: string;
  step_number: number;
  socratic_question: string;
  math_state: string;
  target_concept: string;
  expected_student_focus: string;
  visual_type_expected: string;
  visual_goal: string;
}

export interface SimpleScenePlan {
  component: string;
  scene_intent: string;
  highlight_focus: string;
  interaction_mode: string;
  student_instruction: string;
  correct_target: string;
  hint: string;
  success_feedback: string;
}

export interface VisualizerProps {
  input: VisualStepInput;
  scene: SimpleScenePlan;
  onCorrect: () => void;
  onWrong: () => void;
}

/* ─── Component Map ─────────────────────────────────────────────────── */

const COMPONENT_MAP: Record<
  string,
  React.ComponentType<VisualizerProps>
> = {
  BalanceScaleVisualizer,
  NumberLineVisualizer,
  FractionBarVisualizer,
  AreaModelVisualizer,
  CoordinatePlaneVisualizer,
  GeometryShapeVisualizer,
  AngleDiagramVisualizer,
  BarModelVisualizer,
  TablePatternVisualizer,
  SolidShapeVisualizer,
  SimpleChartVisualizer,
};

/* ─── Canvas Wrapper ────────────────────────────────────────────────── */

export function VisualizerCanvas({
  input,
  scene,
}: {
  input: VisualStepInput;
  scene: SimpleScenePlan;
}) {
  const [feedback, setFeedback] = useState<{
    type: "correct" | "wrong" | "hint" | null;
    message: string;
  }>({ type: null, message: "" });
  const [showHint, setShowHint] = useState(false);

  const Component = COMPONENT_MAP[scene.component];

  const handleCorrect = () => {
    setFeedback({ type: "correct", message: scene.success_feedback });
    setTimeout(() => setFeedback({ type: null, message: "" }), 4000);
  };

  const handleWrong = () => {
    setFeedback({ type: "wrong", message: "Coba lagi! " + scene.hint });
    setTimeout(() => setFeedback({ type: null, message: "" }), 4000);
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Socratic Question Card */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 border border-violet-500/20 p-5"
      >
        <p className="text-[11px] uppercase tracking-widest text-violet-400/60 mb-1 font-semibold">
          Pertanyaan Socratic
        </p>
        <p className="text-base font-medium text-white/90 leading-relaxed">
          {input.socratic_question}
        </p>
        <p className="text-xs text-white/40 mt-2">
          <span className="text-violet-400/80 font-mono">{input.math_state}</span>
          {" · "}
          {scene.scene_intent}
        </p>
      </motion.div>

      {/* Student Instruction */}
      <div className="flex items-center gap-3 px-1">
        <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 text-xs">
          👆
        </div>
        <p className="text-sm text-amber-300/80">{scene.student_instruction}</p>
        <button
          onClick={() => setShowHint(!showHint)}
          className="ml-auto px-3 py-1 text-[11px] rounded-lg bg-white/5 hover:bg-amber-500/20 text-white/40 hover:text-amber-300 transition-all border border-white/5 hover:border-amber-500/30"
        >
          💡 Hint
        </button>
      </div>

      {/* Hint */}
      {showHint && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-3 text-sm text-amber-200/80"
        >
          💡 {scene.hint}
        </motion.div>
      )}

      {/* SVG Visualization Area */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="flex-1 rounded-2xl bg-[#1a1a2e] border border-white/10 overflow-hidden flex items-center justify-center min-h-[350px] relative"
      >
        {Component ? (
          <Component
            input={input}
            scene={scene}
            onCorrect={handleCorrect}
            onWrong={handleWrong}
          />
        ) : (
          <div className="text-white/30 text-sm">
            Komponen <code className="text-violet-400">{scene.component}</code> tidak ditemukan.
          </div>
        )}
      </motion.div>

      {/* Feedback */}
      {feedback.type && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className={`rounded-xl px-5 py-4 text-sm font-medium border ${
            feedback.type === "correct"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-red-500/10 border-red-500/30 text-red-300"
          }`}
        >
          {feedback.type === "correct" ? "✅ " : "❌ "}
          {feedback.message}
        </motion.div>
      )}
    </div>
  );
}
