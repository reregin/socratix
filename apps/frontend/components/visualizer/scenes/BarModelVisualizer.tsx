"use client";

import { motion } from "framer-motion";
import type { VisualizerProps } from "../VisualizerCanvas";

export function BarModelVisualizer({ input, scene }: VisualizerProps) {
  const ratioMatch = input.math_state.match(/(\d+)\s*:\s*(\d+)/);
  const a = ratioMatch ? parseInt(ratioMatch[1]) : 2;
  const b = ratioMatch ? parseInt(ratioMatch[2]) : 3;
  const maxVal = Math.max(a, b);
  const barMaxW = 380, barH = 55, startX = 120;
  const barWidthA = (a / maxVal) * barMaxW;
  const barWidthB = (b / maxVal) * barMaxW;

  return (
    <svg viewBox="0 0 600 310" className="w-full h-full max-w-[600px]">
      <defs>
        <linearGradient id="barA" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#7C5CFC" /><stop offset="100%" stopColor="#A78BFA" /></linearGradient>
        <linearGradient id="barB" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#FF6B8A" /><stop offset="100%" stopColor="#F9A8D4" /></linearGradient>
        <filter id="barShadow"><feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.08" /></filter>
      </defs>

      <motion.text x={300} y={48} textAnchor="middle" className="text-lg font-extrabold" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <tspan fill="#475569">Perbandingan </tspan>
        <tspan fill="#7C5CFC">{a}</tspan><tspan fill="#CBD5E1"> : </tspan><tspan fill="#FF6B8A">{b}</tspan>
      </motion.text>

      {/* Bar A */}
      <text x={startX - 12} y={120} textAnchor="end" fill="#7C5CFC" className="text-xs font-extrabold">A</text>
      <motion.rect x={startX} y={95} width={barWidthA} height={barH} rx={12} fill="url(#barA)" filter="url(#barShadow)"
        initial={{ width: 0 }} animate={{ width: barWidthA }} transition={{ duration: 0.6, delay: 0.2 }} />
      {Array.from({ length: a }).map((_, i) => (
        <motion.rect key={`a-${i}`} x={startX + (barWidthA / a) * i + 3} y={98} width={barWidthA / a - 6} height={barH - 6} rx={9}
          fill="rgba(255,255,255,0.15)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 + i * 0.1 }} />
      ))}
      <motion.text x={startX + barWidthA + 12} y={128} fill="#7C5CFC" className="text-sm font-extrabold"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>{a}</motion.text>

      {/* Bar B */}
      <text x={startX - 12} y={200} textAnchor="end" fill="#FF6B8A" className="text-xs font-extrabold">B</text>
      <motion.rect x={startX} y={175} width={barWidthB} height={barH} rx={12} fill="url(#barB)" filter="url(#barShadow)"
        initial={{ width: 0 }} animate={{ width: barWidthB }} transition={{ duration: 0.6, delay: 0.4 }} />
      {Array.from({ length: b }).map((_, i) => (
        <motion.rect key={`b-${i}`} x={startX + (barWidthB / b) * i + 3} y={178} width={barWidthB / b - 6} height={barH - 6} rx={9}
          fill="rgba(255,255,255,0.15)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 + i * 0.1 }} />
      ))}
      <motion.text x={startX + barWidthB + 12} y={208} fill="#FF6B8A" className="text-sm font-extrabold"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>{b}</motion.text>

      <text x={300} y={275} textAnchor="middle" fill="#94A3B8" className="text-[10px] font-bold">Model Batang Perbandingan</text>
    </svg>
  );
}
