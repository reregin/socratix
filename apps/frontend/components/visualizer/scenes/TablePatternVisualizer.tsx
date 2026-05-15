"use client";

import { motion } from "framer-motion";
import type { VisualizerProps } from "../VisualizerCanvas";

/**
 * TablePatternVisualizer — Menunjukkan pola bilangan dalam tabel
 */
export function TablePatternVisualizer({ input, scene }: VisualizerProps) {
  // Parse number sequence "2, 4, 6, 8, ..."
  const nums = input.math_state.replace(/\.\.\./g, "").split(",").map(s => s.trim()).filter(Boolean).map(Number).filter(n => !isNaN(n));
  const values = nums.length > 0 ? nums : [2, 4, 6, 8];

  // Calculate differences
  const diffs: number[] = [];
  for (let i = 1; i < values.length; i++) {
    diffs.push(values[i] - values[i - 1]);
  }

  const cellW = 70;
  const cellH = 50;
  const startX = 300 - (values.length * cellW) / 2;
  const rowY = 140;
  const diffY = 230;

  return (
    <svg viewBox="0 0 600 340" className="w-full h-full max-w-[600px]">
      <motion.text x={300} y={50} textAnchor="middle" className="fill-white/60 text-xs font-bold uppercase tracking-widest"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        Pola Bilangan
      </motion.text>

      {/* Header row */}
      {values.map((_, i) => (
        <motion.g key={`h-${i}`} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.08 }}>
          <text x={startX + i * cellW + cellW / 2} y={rowY - 18} textAnchor="middle" className="fill-white/30 text-[10px]">
            n={i + 1}
          </text>
        </motion.g>
      ))}

      {/* Value cells */}
      {values.map((v, i) => (
        <motion.g key={`v-${i}`} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 + i * 0.1, type: "spring" }}>
          <rect x={startX + i * cellW + 4} y={rowY} width={cellW - 8} height={cellH} rx={10}
            fill="#7c3aed20" stroke="#7c3aed60" strokeWidth={1.5} />
          <text x={startX + i * cellW + cellW / 2} y={rowY + cellH / 2 + 6} textAnchor="middle" className="fill-violet-300 text-lg font-bold">
            {v}
          </text>
        </motion.g>
      ))}

      {/* Difference arrows */}
      {diffs.map((d, i) => {
        const x1 = startX + i * cellW + cellW - 4;
        const x2 = startX + (i + 1) * cellW + 4;
        const midX = (x1 + x2) / 2;
        return (
          <motion.g key={`d-${i}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 + i * 0.12 }}>
            {/* Arrow curve */}
            <path d={`M ${x1},${rowY + cellH / 2} Q ${midX},${diffY} ${x2},${rowY + cellH / 2}`}
              fill="none" stroke="#f59e0b60" strokeWidth={1.5} strokeDasharray="4 3" />
            {/* Diff label */}
            <rect x={midX - 14} y={diffY - 12} width={28} height={22} rx={6} fill="#f59e0b20" stroke="#f59e0b50" strokeWidth={1} />
            <text x={midX} y={diffY + 4} textAnchor="middle" className="fill-amber-400 text-[11px] font-bold">
              +{d}
            </text>
          </motion.g>
        );
      })}

      {/* Next value hint */}
      <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
        <rect x={startX + values.length * cellW + 4} y={rowY} width={cellW - 8} height={cellH} rx={10}
          fill="none" stroke="#ffffff15" strokeWidth={1.5} strokeDasharray="4 3" />
        <text x={startX + values.length * cellW + cellW / 2} y={rowY + cellH / 2 + 6} textAnchor="middle" className="fill-white/20 text-lg">
          ?
        </text>
      </motion.g>

      <text x={300} y={310} textAnchor="middle" className="fill-white/15 text-[10px]">
        Selisih tetap: +{diffs[0] ?? "?"} (pola linear)
      </text>
    </svg>
  );
}
