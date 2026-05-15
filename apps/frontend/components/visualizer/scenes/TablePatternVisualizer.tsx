"use client";

import { motion } from "framer-motion";
import type { VisualizerProps } from "../VisualizerCanvas";

export function TablePatternVisualizer({ input }: VisualizerProps) {
  const nums = input.math_state.replace(/\.\.\./g, "").split(",").map(s => s.trim()).filter(Boolean).map(Number).filter(n => !isNaN(n));
  const values = nums.length > 0 ? nums : [2, 4, 6, 8];
  const diffs: number[] = [];
  for (let i = 1; i < values.length; i++) diffs.push(values[i] - values[i - 1]);
  const cellW = 72, startX = 300 - (values.length * cellW) / 2, rowY = 130, diffY = 225;

  const COLORS = ["#7C5CFC", "#FF6B8A", "#00C9A7", "#FFB946", "#38BDF8"];

  return (
    <svg viewBox="0 0 600 330" className="w-full h-full max-w-[600px]">
      <defs><filter id="patShadow"><feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.08" /></filter></defs>

      <motion.text x={300} y={50} textAnchor="middle" fill="#94A3B8" className="text-[10px] font-extrabold uppercase tracking-[0.2em]"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Pola Bilangan</motion.text>

      {/* Header */}
      {values.map((_, i) => (
        <motion.text key={`h-${i}`} x={startX + i * cellW + cellW / 2} y={rowY - 18} textAnchor="middle" fill="#94A3B8" className="text-[10px] font-bold"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 + i * 0.06 }}>n={i + 1}</motion.text>
      ))}

      {/* Value cells */}
      {values.map((v, i) => (
        <motion.g key={`v-${i}`} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 + i * 0.1, type: "spring", stiffness: 250 }}>
          <rect x={startX + i * cellW + 5} y={rowY} width={cellW - 10} height={55} rx={14}
            fill={COLORS[i % COLORS.length] + "15"} stroke={COLORS[i % COLORS.length] + "40"} strokeWidth={2} filter="url(#patShadow)" />
          <text x={startX + i * cellW + cellW / 2} y={rowY + 35} textAnchor="middle" fill={COLORS[i % COLORS.length]} className="text-xl font-extrabold">
            {v}
          </text>
        </motion.g>
      ))}

      {/* Difference badges */}
      {diffs.map((d, i) => {
        const x1 = startX + i * cellW + cellW - 5;
        const x2 = startX + (i + 1) * cellW + 5;
        const midX = (x1 + x2) / 2;
        return (
          <motion.g key={`d-${i}`} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.12, type: "spring" }}>
            <path d={`M ${x1},${rowY + 28} Q ${midX},${diffY + 5} ${x2},${rowY + 28}`}
              fill="none" stroke="#FFB94660" strokeWidth={2} strokeDasharray="5 3" />
            <rect x={midX - 18} y={diffY - 14} width={36} height={26} rx={10}
              fill="#FFF8EB" stroke="#FFB946" strokeWidth={1.5} filter="url(#patShadow)" />
            <text x={midX} y={diffY + 5} textAnchor="middle" fill="#B45309" className="text-xs font-extrabold">+{d}</text>
          </motion.g>
        );
      })}

      {/* Next value hint */}
      <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}>
        <rect x={startX + values.length * cellW + 5} y={rowY} width={cellW - 10} height={55} rx={14}
          fill="none" stroke="#E2E8F0" strokeWidth={2} strokeDasharray="6 4" />
        <text x={startX + values.length * cellW + cellW / 2} y={rowY + 37} textAnchor="middle" fill="#CBD5E1" className="text-xl font-extrabold">?</text>
      </motion.g>

      <text x={300} y={300} textAnchor="middle" fill="#94A3B8" className="text-[10px] font-bold">
        Selisih tetap: +{diffs[0] ?? "?"} (pola linear)
      </text>
    </svg>
  );
}
