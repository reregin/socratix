"use client";

import { motion } from "framer-motion";
import type { VisualizerProps } from "../VisualizerCanvas";

export function GeometryShapeVisualizer({ input, scene }: VisualizerProps) {
  const ms = input.math_state.toLowerCase();
  const alasMatch = ms.match(/alas\s*[=:]?\s*(\d+)/);
  const tinggiMatch = ms.match(/tinggi\s*[=:]?\s*(\d+)/);
  const alas = alasMatch ? parseInt(alasMatch[1]) : 8;
  const tinggi = tinggiMatch ? parseInt(tinggiMatch[1]) : 5;
  const cx = 300, baseY = 280, scale = 20;
  const halfBase = (alas * scale) / 2;
  const h = tinggi * scale;
  const points = `${cx},${baseY - h} ${cx - halfBase},${baseY} ${cx + halfBase},${baseY}`;
  const hlBase = scene.highlight_focus?.toLowerCase().includes("alas");
  const hlHeight = scene.highlight_focus?.toLowerCase().includes("tinggi");

  return (
    <svg viewBox="0 0 600 380" className="w-full h-full max-w-[600px]">
      <motion.polygon points={points} fill="#7c3aed15" stroke="#7c3aed" strokeWidth={2.5} strokeLinejoin="round"
        initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} />
      <motion.line x1={cx - halfBase} y1={baseY} x2={cx + halfBase} y2={baseY}
        stroke={hlBase ? "#f59e0b" : "#7c3aed"} strokeWidth={hlBase ? 4 : 2.5}
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4, delay: 0.3 }} />
      <motion.line x1={cx} y1={baseY} x2={cx} y2={baseY - h}
        stroke={hlHeight ? "#f59e0b" : "#ec4899"} strokeWidth={hlHeight ? 3 : 1.5} strokeDasharray="6 4"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4, delay: 0.5 }} />
      <motion.rect x={cx} y={baseY - 10} width={10} height={10} fill="none" stroke="#ffffff30" strokeWidth={1}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} />
      <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
        <text x={cx} y={baseY + 25} textAnchor="middle" className={`text-xs font-bold ${hlBase ? "fill-amber-400" : "fill-violet-300"}`}>
          alas = {alas} cm
        </text>
        <text x={cx + 20} y={baseY - h / 2} textAnchor="start" className={`text-xs font-bold ${hlHeight ? "fill-amber-400" : "fill-pink-300"}`}>
          tinggi = {tinggi} cm
        </text>
      </motion.g>
      <text x={300} y={340} textAnchor="middle" className="fill-white/15 text-[10px]">
        L = ½ × {alas} × {tinggi} = {(alas * tinggi) / 2} cm²
      </text>
    </svg>
  );
}
