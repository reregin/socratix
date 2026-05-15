"use client";

import { Activity, FlaskConical, Sparkles } from "lucide-react";
import { VisualizerCanvas } from "@/components/visualizer/VisualizerCanvas";
import { VISUALIZER_SAMPLES } from "@/components/visualizer/sampleScenes";
import type {
  SimpleScenePlan,
  VisualStepInput,
} from "@/components/visualizer/VisualizerCanvas";

interface VisualizationCanvasProps {
  activeKey: string;
  input: VisualStepInput;
  scene: SimpleScenePlan;
  statusLabel: string;
  sourceLabel: string;
  onSampleChange: (key: string) => void;
}

export default function VisualizationCanvas({
  activeKey,
  input,
  scene,
  statusLabel,
  sourceLabel,
  onSampleChange,
}: VisualizationCanvasProps) {
  return (
    <div className="flex h-full min-h-0 flex-col bg-[#FAFBFF]">
      <header className="border-b border-[#E8E8F0] bg-white px-4 py-3">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#7C5CFC] text-white shadow-sm">
            <Sparkles size={18} />
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-sm font-extrabold text-[#1E1B4B]">
              Visualizer Agent
            </h2>
            <p className="truncate text-xs font-semibold text-[#64748B]">
              {statusLabel}
            </p>
          </div>
          <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-[#E6FFF9] px-2.5 py-1 text-[10px] font-extrabold text-[#008F77]">
            <Activity size={12} />
            {sourceLabel}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <FlaskConical size={15} className="shrink-0 text-[#00A88B]" />
          <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto pb-1">
            {Object.entries(VISUALIZER_SAMPLES).map(([key, sample]) => (
              <button
                key={key}
                onClick={() => onSampleChange(key)}
                className="shrink-0 rounded-lg border px-2.5 py-1.5 text-xs font-bold transition hover:bg-[#F0ECFF]"
                style={{
                  background: activeKey === key ? "#7C5CFC" : "#FFFFFF",
                  borderColor: activeKey === key ? "#7C5CFC" : "#E8E8F0",
                  color: activeKey === key ? "#FFFFFF" : "#475569",
                }}
              >
                {sample.shortLabel}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <div className="min-h-[640px]">
          <VisualizerCanvas input={input} scene={scene} />
        </div>
      </div>
    </div>
  );
}
