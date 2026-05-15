"use client";

import { motion } from "framer-motion";
import type { VisualizerProps } from "../VisualizerCanvas";

/**
 * BarModelVisualizer — Menunjukkan perbandingan dengan model batang
 */
export function BarModelVisualizer({ input, scene }: VisualizerProps) {
  // Parse ratio "2:3" or "2 : 3"
  const ratioMatch = input.math_state.match(/(\d+)\s*:\s*(\d+)/);
  const a = ratioMatch ? parseInt(ratioMatch[1]) : 2;
  const b = ratioMatch ? parseInt(ratioMatch[2]) : 3;
  const maxVal = Math.max(a, b);
  const barMaxW = 380;
  const barH = 50;
  const startX = 110;

  const barWidthA = (a / maxVal) * barMaxW;
  const barWidthB = (b / maxVal) * barMaxW;

  return (
    <svg viewBox="0 0 600 320" className="w-full h-full max-w-[600px]">
      <motion.text x={300} y={50} textAnchor="middle" className="fill-white/70 text-lg font-bold"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        Perbandingan <tspan className="fill-violet-400">{a}</tspan> : <tspan className="fill-pink-400">{b}</tspan>
      </motion.text>

      {/* Bar A */}
      <motion.rect x={startX} y={100} width={barWidthA} height={barH} rx={8}
        fill="#7c3aed30" stroke="#7c3aed" strokeWidth={2}
        initial={{ width: 0 }} animate={{ width: barWidthA }} transition={{ duration: 0.6, delay: 0.2 }} />
      {/* Segments A */}
      {Array.from({ length: a }).map((_, i) => (
        <motion.rect key={`a-${i}`}
          x={startX + (barWidthA / a) * i + 2} y={102}
          width={barWidthA / a - 4} height={barH - 4} rx={5}
          fill="#7c3aed25"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 + i * 0.1 }} />
      ))}
      <text x={startX - 10} y={130} textAnchor="end" className="fill-violet-300 text-xs font-bold">A</text>
      <text x={startX + barWidthA + 10} y={130} className="fill-violet-400 text-xs font-bold">{a}</text>

      {/* Bar B */}
      <motion.rect x={startX} y={180} width={barWidthB} height={barH} rx={8}
        fill="#ec489930" stroke="#ec4899" strokeWidth={2}
        initial={{ width: 0 }} animate={{ width: barWidthB }} transition={{ duration: 0.6, delay: 0.4 }} />
      {/* Segments B */}
      {Array.from({ length: b }).map((_, i) => (
        <motion.rect key={`b-${i}`}
          x={startX + (barWidthB / b) * i + 2} y={182}
          width={barWidthB / b - 4} height={barH - 4} rx={5}
          fill="#ec489925"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 + i * 0.1 }} />
      ))}
      <text x={startX - 10} y={210} textAnchor="end" className="fill-pink-300 text-xs font-bold">B</text>
      <text x={startX + barWidthB + 10} y={210} className="fill-pink-400 text-xs font-bold">{b}</text>

      <text x={300} y={280} textAnchor="middle" className="fill-white/20 text-[10px]">
        Model Batang Perbandingan
      </text>
    </svg>
  );
}
