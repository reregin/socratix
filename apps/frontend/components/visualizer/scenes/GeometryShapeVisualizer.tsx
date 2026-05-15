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
      <defs>
        <linearGradient id="triFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7C5CFC" stopOpacity={0.12} />
          <stop offset="100%" stopColor="#7C5CFC" stopOpacity={0.04} />
        </linearGradient>
        <filter id="shapeShadow"><feDropShadow dx="0" dy="3" stdDeviation="6" floodOpacity="0.08" /></filter>
      </defs>

      {/* Triangle */}
      <motion.polygon points={points} fill="url(#triFill)" stroke="#7C5CFC" strokeWidth={3} strokeLinejoin="round" filter="url(#shapeShadow)"
        initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, type: "spring" }} />

      {/* Base */}
      <motion.line x1={cx - halfBase} y1={baseY} x2={cx + halfBase} y2={baseY}
        stroke={hlBase ? "#FFB946" : "#7C5CFC"} strokeWidth={hlBase ? 5 : 3} strokeLinecap="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4, delay: 0.3 }} />

      {/* Height dashed */}
      <motion.line x1={cx} y1={baseY} x2={cx} y2={baseY - h}
        stroke={hlHeight ? "#FFB946" : "#FF6B8A"} strokeWidth={hlHeight ? 3.5 : 2} strokeDasharray="8 5" strokeLinecap="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4, delay: 0.5 }} />

      {/* Right angle marker */}
      <motion.path d={`M ${cx + 12},${baseY} L ${cx + 12},${baseY - 12} L ${cx},${baseY - 12}`}
        fill="none" stroke="#94A3B8" strokeWidth={1.5} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} />

      {/* Labels */}
      <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
        <rect x={cx - 42} y={baseY + 8} width={84} height={24} rx={8} fill={hlBase ? "#FFF8EB" : "#F0ECFF"} stroke={hlBase ? "#FFB946" : "#C4B5FD"} strokeWidth={1.5} />
        <text x={cx} y={baseY + 25} textAnchor="middle" fill={hlBase ? "#B45309" : "#7C5CFC"} className="text-[11px] font-extrabold">
          alas = {alas} cm
        </text>
        <rect x={cx + 18} y={baseY - h / 2 - 12} width={94} height={24} rx={8} fill={hlHeight ? "#FFF8EB" : "#FFF0F3"} stroke={hlHeight ? "#FFB946" : "#FDA4AF"} strokeWidth={1.5} />
        <text x={cx + 65} y={baseY - h / 2 + 5} textAnchor="middle" fill={hlHeight ? "#B45309" : "#FF6B8A"} className="text-[11px] font-extrabold">
          tinggi = {tinggi} cm
        </text>
      </motion.g>

      {/* Formula */}
      <text x={300} y={345} textAnchor="middle" fill="#CBD5E1" className="text-[10px] font-bold">
        L = ½ × {alas} × {tinggi} = {(alas * tinggi) / 2} cm²
      </text>
    </svg>
  );
}
