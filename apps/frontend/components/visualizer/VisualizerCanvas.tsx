"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { HelpCircle, Lightbulb, MousePointer2, Search } from "lucide-react";
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
    setConfettiKey((key) => key + 1);
    setTimeout(() => setFeedback({ type: null, message: "" }), 5000);
  };

  const handleWrong = () => {
    setFeedback({ type: "wrong", message: `Hmm, coba lagi ya! ${scene.hint}` });
    setTimeout(() => setFeedback({ type: null, message: "" }), 5000);
  };

  return (
    <div className="relative flex h-full flex-col gap-5">
      <ConfettiEffect trigger={confettiKey > 0} key={confettiKey} />

      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 200 }}
        className="speech-bubble"
      >
        <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: "var(--primary)" }}>
          Pertanyaan Socratic
        </p>
        <p className="text-base font-bold leading-relaxed" style={{ color: "var(--text-primary)" }}>
          {input.socratic_question}
        </p>
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <span
            className="rounded-lg px-2.5 py-0.5 font-mono text-xs font-bold"
            style={{ background: "var(--primary-bg)", color: "var(--primary)" }}
          >
            {input.math_state}
          </span>
          <span className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
            {scene.scene_intent}
          </span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.15 }}
        className="flex flex-wrap items-center gap-3 px-1"
      >
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg shadow-sm"
          style={{ background: "var(--amber-bg)" }}
        >
          <MousePointer2 size={17} style={{ color: "var(--amber)" }} />
        </div>
        <p className="min-w-[180px] flex-1 text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
          {scene.student_instruction}
        </p>
        <button
          onClick={() => setShowHint((value) => !value)}
          className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all hover:scale-[1.02]"
          style={{
            background: showHint ? "var(--amber)" : "var(--amber-bg)",
            color: showHint ? "white" : "#B45309",
            boxShadow: showHint ? "0 4px 12px rgba(255,185,70,0.3)" : "none",
          }}
        >
          <Lightbulb size={15} />
          {showHint ? "Sembunyikan" : "Butuh bantuan?"}
        </button>
      </motion.div>

      <AnimatePresence>
        {showHint && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -5 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -5 }}
            className="rounded-lg px-5 py-3.5 text-sm font-medium"
            style={{
              background: "linear-gradient(135deg, var(--amber-bg), #FEF3C7)",
              color: "#92400E",
              border: "1.5px solid rgba(255, 185, 70, 0.2)",
            }}
          >
            {scene.hint}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 150 }}
        className="viz-canvas flex min-h-[380px] flex-1 items-center justify-center p-4"
      >
        {Component ? (
          <Component input={input} scene={scene} onCorrect={handleCorrect} onWrong={handleWrong} />
        ) : (
          <div className="text-center" style={{ color: "var(--text-muted)" }}>
            <Search size={38} className="mx-auto mb-2" />
            <p className="text-sm font-semibold">
              Komponen{" "}
              <code className="font-mono" style={{ color: "var(--primary)" }}>
                {scene.component}
              </code>{" "}
              tidak ditemukan.
            </p>
            <p className="mt-2 flex items-center justify-center gap-1 text-xs">
              <HelpCircle size={13} />
              Cek field component di scene plan.
            </p>
          </div>
        )}
      </motion.div>

      <AnimatePresence mode="wait">
        {feedback.type === "correct" && <SuccessBadge key="success" message={feedback.message} />}
        {feedback.type === "wrong" && <ErrorBadge key="error" message={feedback.message} />}
      </AnimatePresence>
    </div>
  );
}
