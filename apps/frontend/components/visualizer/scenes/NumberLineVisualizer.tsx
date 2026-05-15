"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { VisualizerProps } from "../VisualizerCanvas";

export function NumberLineVisualizer({ input, scene, onCorrect, onWrong }: VisualizerProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const targetNum = parseFloat(input.math_state.replace(/[^-\d.]/g, "")) || 0;
  const rangeMin = Math.min(-5, targetNum - 2);
  const rangeMax = Math.max(5, targetNum + 2);
  const ticks: number[] = [];
  for (let i = rangeMin; i <= rangeMax; i++) ticks.push(i);

  const lineY = 200, lineLeft = 60, lineRight = 540;
  const numToX = (n: number) => lineLeft + ((n - rangeMin) / (rangeMax - rangeMin)) * (lineRight - lineLeft);

  const handleClick = (n: number) => {
    if (scene.interaction_mode === "none" || scene.interaction_mode === "highlight") return;
    setSelected(n);
    n === targetNum ? onCorrect() : onWrong();
  };

  return (
    <svg viewBox="0 0 600 340" className="w-full h-full max-w-[600px]">
      <defs>
        <linearGradient id="nlLine" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#7C5CFC" /><stop offset="50%" stopColor="#FF6B8A" /><stop offset="100%" stopColor="#FFB946" />
        </linearGradient>
        <filter id="dotShadow"><feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.12" /></filter>
        <filter id="dotGlow"><feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#7C5CFC" floodOpacity="0.4" /></filter>
      </defs>

      {/* Title */}
      <text x={300} y={60} textAnchor="middle" fill="#94A3B8" className="text-[10px] font-extrabold uppercase tracking-[0.2em]">Garis Bilangan</text>

      {/* Main line */}
      <motion.line x1={lineLeft} y1={lineY} x2={lineRight} y2={lineY} stroke="url(#nlLine)" strokeWidth={4} strokeLinecap="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6 }} />

      {/* Arrows */}
      <polygon points={`${lineLeft - 10},${lineY} ${lineLeft + 5},${lineY - 7} ${lineLeft + 5},${lineY + 7}`} fill="#7C5CFC" opacity={0.6} />
      <polygon points={`${lineRight + 10},${lineY} ${lineRight - 5},${lineY - 7} ${lineRight - 5},${lineY + 7}`} fill="#FFB946" opacity={0.6} />

      {/* Ticks */}
      {ticks.map((n, i) => {
        const x = numToX(n);
        const isZero = n === 0;
        const isTarget = n === targetNum;
        const isSel = selected === n;
        return (
          <motion.g key={n} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.04, type: "spring" }}
            onClick={() => handleClick(n)} style={{ cursor: scene.interaction_mode !== "none" ? "pointer" : "default" }}>
            <line x1={x} y1={lineY - (isZero ? 14 : 8)} x2={x} y2={lineY + (isZero ? 14 : 8)}
              stroke={isZero ? "#475569" : "#CBD5E1"} strokeWidth={isZero ? 2.5 : 1.5} />
            <text x={x} y={lineY + 32} textAnchor="middle" fill={isZero ? "#1E293B" : isSel ? "#7C5CFC" : "#94A3B8"} className={`text-xs font-bold ${isZero ? "font-extrabold" : ""}`}>
              {n}
            </text>
            {/* Clickable area */}
            {scene.interaction_mode !== "none" && scene.interaction_mode !== "highlight" && (
              <circle cx={x} cy={lineY} r={12} fill="transparent" style={{ cursor: "pointer" }} />
            )}
            {/* Target marker */}
            {isTarget && (scene.interaction_mode === "highlight" || isSel) && (
              <motion.g initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300 }}>
                <circle cx={x} cy={lineY} r={10} fill="#7C5CFC" filter="url(#dotShadow)" />
                <circle cx={x} cy={lineY} r={4} fill="white" />
                <motion.circle cx={x} cy={lineY} r={16} fill="none" stroke="#7C5CFC" strokeWidth={2.5}
                  animate={{ scale: [1, 1.4, 1], opacity: [0.8, 0.2, 0.8] }} transition={{ repeat: Infinity, duration: 2 }} filter="url(#dotGlow)" />
                <text x={x} y={lineY - 25} textAnchor="middle" fill="#7C5CFC" className="text-xs font-extrabold">{input.math_state}</text>
              </motion.g>
            )}
            {/* Wrong selection */}
            {isSel && !isTarget && (
              <motion.circle cx={x} cy={lineY} r={8} fill="#FF6B8A" initial={{ scale: 0 }} animate={{ scale: [1, 0.5] }} transition={{ duration: 0.4 }} />
            )}
          </motion.g>
        );
      })}
    </svg>
  );
}
