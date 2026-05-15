"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { VisualizerProps } from "../VisualizerCanvas";

/**
 * SimpleChartVisualizer — Menunjukkan diagram batang sederhana untuk statistika
 */
export function SimpleChartVisualizer({ input, scene, onCorrect, onWrong }: VisualizerProps) {
  const [selectedBar, setSelectedBar] = useState<number | null>(null);

  // Parse data: "data: 3, 5, 5, 7, 5, 8" → count frequency
  const dataMatch = input.math_state.match(/[\d.]+/g);
  const rawNums = dataMatch ? dataMatch.map(Number) : [3, 5, 5, 7, 5, 8];

  // Build frequency map
  const freq: Record<number, number> = {};
  for (const n of rawNums) {
    freq[n] = (freq[n] || 0) + 1;
  }
  const labels = Object.keys(freq).map(Number).sort((a, b) => a - b);
  const values = labels.map((l) => freq[l]);
  const maxVal = Math.max(...values, 1);

  const chartLeft = 120;
  const chartBottom = 270;
  const chartWidth = 360;
  const chartHeight = 180;
  const barW = Math.min(45, chartWidth / labels.length - 10);

  const handleBarClick = (idx: number) => {
    if (scene.interaction_mode === "none" || scene.interaction_mode === "highlight") return;
    setSelectedBar(idx);
    // The correct target is usually the mode (highest bar)
    const maxFreq = Math.max(...values);
    if (values[idx] === maxFreq) {
      onCorrect();
    } else {
      onWrong();
    }
  };

  const colors = ["#7c3aed", "#8b5cf6", "#a78bfa", "#ec4899", "#f59e0b", "#10b981", "#3b82f6", "#ef4444"];

  return (
    <svg viewBox="0 0 600 340" className="w-full h-full max-w-[600px]">
      {/* Title */}
      <motion.text x={300} y={40} textAnchor="middle" className="fill-white/60 text-xs font-bold uppercase tracking-widest"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        Diagram Frekuensi
      </motion.text>

      {/* Y axis */}
      <line x1={chartLeft} y1={chartBottom - chartHeight} x2={chartLeft} y2={chartBottom}
        stroke="#ffffff20" strokeWidth={1.5} />
      {/* X axis */}
      <line x1={chartLeft} y1={chartBottom} x2={chartLeft + chartWidth} y2={chartBottom}
        stroke="#ffffff20" strokeWidth={1.5} />

      {/* Y axis labels */}
      {Array.from({ length: maxVal + 1 }).map((_, i) => {
        const y = chartBottom - (i / maxVal) * chartHeight;
        return (
          <g key={`y-${i}`}>
            <line x1={chartLeft - 4} y1={y} x2={chartLeft} y2={y} stroke="#ffffff20" strokeWidth={1} />
            <text x={chartLeft - 10} y={y + 4} textAnchor="end" className="fill-white/25 text-[10px] font-mono">{i}</text>
            {i > 0 && <line x1={chartLeft} y1={y} x2={chartLeft + chartWidth} y2={y} stroke="#ffffff06" strokeWidth={0.5} />}
          </g>
        );
      })}

      {/* Bars */}
      {labels.map((label, i) => {
        const barH = (values[i] / maxVal) * chartHeight;
        const x = chartLeft + 20 + i * (chartWidth / labels.length);
        const y = chartBottom - barH;
        const isMax = values[i] === Math.max(...values);
        const isSelected = selectedBar === i;
        const color = colors[i % colors.length];

        return (
          <motion.g key={`bar-${i}`}
            onClick={() => handleBarClick(i)}
            style={{ cursor: scene.interaction_mode !== "none" ? "pointer" : "default" }}>
            <motion.rect
              x={x} y={y} width={barW} height={barH} rx={4}
              fill={isSelected ? (isMax ? "#10b981" : "#ef4444") + "60" : color + "40"}
              stroke={isSelected ? (isMax ? "#10b981" : "#ef4444") : color}
              strokeWidth={isMax && scene.interaction_mode === "highlight" ? 2.5 : 1.5}
              initial={{ height: 0, y: chartBottom }}
              animate={{ height: barH, y }}
              transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
            />
            {/* Value on top */}
            <motion.text x={x + barW / 2} y={y - 8} textAnchor="middle"
              className={`text-[11px] font-bold ${isMax ? "fill-amber-400" : "fill-white/40"}`}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 + i * 0.1 }}>
              {values[i]}
            </motion.text>
            {/* X label */}
            <text x={x + barW / 2} y={chartBottom + 18} textAnchor="middle" className="fill-white/40 text-[11px] font-mono">
              {label}
            </text>
            {/* Highlight pulse for max */}
            {isMax && scene.interaction_mode === "highlight" && (
              <motion.rect x={x - 2} y={y - 2} width={barW + 4} height={barH + 4} rx={5}
                fill="none" stroke="#f59e0b" strokeWidth={2}
                animate={{ opacity: [0, 1, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }} />
            )}
          </motion.g>
        );
      })}

      {/* Axis labels */}
      <text x={chartLeft - 5} y={chartBottom - chartHeight - 10} textAnchor="middle" className="fill-white/25 text-[10px]">Frekuensi</text>
      <text x={chartLeft + chartWidth / 2} y={chartBottom + 35} textAnchor="middle" className="fill-white/25 text-[10px]">Nilai</text>
    </svg>
  );
}
