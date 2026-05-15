"use client";

import { motion, AnimatePresence } from "framer-motion";
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
import { ConfettiEffect } from "./decorations/ConfettiEffect";
import { SuccessBadge, ErrorBadge } from "./decorations/FeedbackBadge";
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

const COMPONENT_MAP: Record<string, React.ComponentType<VisualizerProps>> = {
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

/* ─── Canvas Wrapper v2 ─────────────────────────────────────────────── */

export function VisualizerCanvas({
  input,
  scene,
}: {
  input: VisualStepInput;
  scene: SimpleScenePlan;
}) {
  const [feedback, setFeedback] = useState<{
    type: "correct" | "wrong" | null;
    message: string;
  }>({ type: null, message: "" });
  const [showHint, setShowHint] = useState(false);
  const [confettiKey, setConfettiKey] = useState(0);

  const Component = COMPONENT_MAP[scene.component];

  const handleCorrect = () => {
    setFeedback({ type: "correct", message: scene.success_feedback });
    setConfettiKey((k) => k + 1);
    setTimeout(() => setFeedback({ type: null, message: "" }), 5000);
  };

  const handleWrong = () => {
    setFeedback({ type: "wrong", message: "Hmm, coba lagi ya! " + scene.hint });
    setTimeout(() => setFeedback({ type: null, message: "" }), 5000);
  };

  return (
    <div className="flex flex-col gap-5 h-full relative">
      {/* Confetti overlay */}
      <ConfettiEffect trigger={confettiKey > 0} key={confettiKey} />

      {/* Socratic Question — Speech Bubble */}
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 200 }}
        className="speech-bubble"
      >
        <p className="text-[10px] uppercase tracking-[0.15em] font-bold mb-1.5" style={{ color: "var(--primary)" }}>
          🧠 Pertanyaan Socratic
        </p>
        <p className="text-base font-bold leading-relaxed" style={{ color: "var(--text-primary)" }}>
          {input.socratic_question}
        </p>
        <div className="flex items-center gap-2 mt-2.5">
          <span
            className="px-2.5 py-0.5 rounded-lg text-xs font-bold font-mono"
            style={{ background: "var(--primary-bg)", color: "var(--primary)" }}
          >
            {input.math_state}
          </span>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            {scene.scene_intent}
          </span>
        </div>
      </motion.div>

      {/* Student Instruction */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.15 }}
        className="flex items-center gap-3 px-2"
      >
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center text-lg shadow-sm"
          style={{ background: "var(--amber-bg)" }}
        >
          👆
        </div>
        <p className="text-sm font-semibold flex-1" style={{ color: "var(--text-secondary)" }}>
          {scene.student_instruction}
        </p>
        <button
          onClick={() => setShowHint(!showHint)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all hover:scale-105"
          style={{
            background: showHint ? "var(--amber)" : "var(--amber-bg)",
            color: showHint ? "white" : "#B45309",
            boxShadow: showHint ? "0 4px 12px rgba(255,185,70,0.3)" : "none",
          }}
        >
          💡 {showHint ? "Sembunyikan" : "Butuh bantuan?"}
        </button>
      </motion.div>

      {/* Hint Bubble */}
      <AnimatePresence>
        {showHint && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -5 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -5 }}
            className="rounded-2xl px-5 py-3.5 text-sm font-medium"
            style={{
              background: "linear-gradient(135deg, var(--amber-bg), #FEF3C7)",
              color: "#92400E",
              border: "1.5px solid rgba(255, 185, 70, 0.2)",
            }}
          >
            💡 {scene.hint}
          </motion.div>
        )}
      </AnimatePresence>

      {/* SVG Visualization Area */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 150 }}
        className="flex-1 viz-canvas flex items-center justify-center min-h-[380px] p-4"
      >
        {Component ? (
          <Component
            input={input}
            scene={scene}
            onCorrect={handleCorrect}
            onWrong={handleWrong}
          />
        ) : (
          <div className="text-center" style={{ color: "var(--text-muted)" }}>
            <p className="text-4xl mb-2">🔍</p>
            <p className="text-sm font-semibold">
              Komponen <code className="font-mono" style={{ color: "var(--primary)" }}>{scene.component}</code> tidak ditemukan.
            </p>
          </div>
        )}
      </motion.div>

      {/* Feedback Area */}
      <AnimatePresence mode="wait">
        {feedback.type === "correct" && (
          <SuccessBadge key="success" message={feedback.message} />
        )}
        {feedback.type === "wrong" && (
          <ErrorBadge key="error" message={feedback.message} />
        )}
      </AnimatePresence>
    </div>
  );
}
