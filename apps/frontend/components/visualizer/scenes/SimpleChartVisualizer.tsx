"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { VisualizerProps } from "../VisualizerCanvas";

export function SimpleChartVisualizer({ input, scene, onCorrect, onWrong }: VisualizerProps) {
  const [selectedBar, setSelectedBar] = useState<number | null>(null);
  const dataMatch = input.math_state.match(/[\d.]+/g);
  const rawNums = dataMatch ? dataMatch.map(Number) : [3, 5, 5, 7, 5, 8];
  const freq: Record<number, number> = {};
  for (const n of rawNums) freq[n] = (freq[n] || 0) + 1;
  const labels = Object.keys(freq).map(Number).sort((a, b) => a - b);
  const values = labels.map((l) => freq[l]);
  const maxVal = Math.max(...values, 1);

  const chartLeft = 120, chartBottom = 265, chartW = 360, chartH = 180;
  const barW = Math.min(48, chartW / labels.length - 12);
  const COLORS = ["#7C5CFC", "#FF6B8A", "#00C9A7", "#FFB946", "#38BDF8", "#F472B6", "#34D399", "#FB923C"];

  const handleClick = (idx: number) => {
    if (scene.interaction_mode === "none" || scene.interaction_mode === "highlight") return;
    setSelectedBar(idx);
    values[idx] === Math.max(...values) ? onCorrect() : onWrong();
  };

  return (
    <svg viewBox="0 0 600 330" className="w-full h-full max-w-[600px]">
      <defs>
        <filter id="chartShadow"><feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.08" /></filter>
      </defs>

      <text x={300} y={40} textAnchor="middle" fill="#94A3B8" className="text-[10px] font-extrabold uppercase tracking-[0.2em]">Diagram Frekuensi</text>

      {/* Y axis */}
      <line x1={chartLeft} y1={chartBottom - chartH} x2={chartLeft} y2={chartBottom} stroke="#E2E8F0" strokeWidth={2} />
      <line x1={chartLeft} y1={chartBottom} x2={chartLeft + chartW} y2={chartBottom} stroke="#E2E8F0" strokeWidth={2} />

      {/* Y labels + grid */}
      {Array.from({ length: maxVal + 1 }).map((_, i) => {
        const y = chartBottom - (i / maxVal) * chartH;
        return (
          <g key={`y-${i}`}>
            {i > 0 && <line x1={chartLeft} y1={y} x2={chartLeft + chartW} y2={y} stroke="#F1F5F9" strokeWidth={1} />}
            <text x={chartLeft - 10} y={y + 4} textAnchor="end" fill="#94A3B8" className="text-[10px] font-bold">{i}</text>
          </g>
        );
      })}

      {/* Bars */}
      {labels.map((label, i) => {
        const barH = (values[i] / maxVal) * chartH;
        const x = chartLeft + 20 + i * (chartW / labels.length);
        const y = chartBottom - barH;
        const isMax = values[i] === Math.max(...values);
        const isSel = selectedBar === i;
        const color = COLORS[i % COLORS.length];

        return (
          <motion.g key={i} onClick={() => handleClick(i)} style={{ cursor: scene.interaction_mode !== "none" ? "pointer" : "default" }}>
            <motion.rect x={x} y={y} width={barW} height={barH} rx={8}
              fill={isSel ? (isMax ? "#00C9A7" : "#FF6B8A") : color + "80"}
              stroke={isSel ? (isMax ? "#059669" : "#E11D48") : color} strokeWidth={2} filter="url(#chartShadow)"
              initial={{ height: 0, y: chartBottom }} animate={{ height: barH, y }} transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }} />
            <motion.text x={x + barW / 2} y={y - 10} textAnchor="middle" fill={isMax ? "#B45309" : "#475569"} className={`text-xs ${isMax ? "font-extrabold" : "font-bold"}`}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 + i * 0.1 }}>{values[i]}</motion.text>
            <text x={x + barW / 2} y={chartBottom + 18} textAnchor="middle" fill="#475569" className="text-xs font-bold">{label}</text>
            {isMax && scene.interaction_mode === "highlight" && (
              <motion.text x={x + barW / 2} y={y - 25} textAnchor="middle" fill="#FFB946" className="text-sm"
                animate={{ y: [y - 25, y - 30, y - 25] }} transition={{ repeat: Infinity, duration: 1.5 }}>⭐</motion.text>
            )}
          </motion.g>
        );
      })}

      <text x={chartLeft - 5} y={chartBottom - chartH - 10} textAnchor="middle" fill="#94A3B8" className="text-[10px] font-bold">Frekuensi</text>
      <text x={chartLeft + chartW / 2} y={chartBottom + 35} textAnchor="middle" fill="#94A3B8" className="text-[10px] font-bold">Nilai</text>
    </svg>
  );
}
