"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { VisualizerProps } from "../VisualizerCanvas";

export function FractionBarVisualizer({ input, scene, onCorrect }: VisualizerProps) {
  const [selectedParts, setSelectedParts] = useState<Set<number>>(new Set());
  const match = input.math_state.match(/(\d+)\s*\/\s*(\d+)/);
  const num = match ? parseInt(match[1]) : 3;
  const den = match ? parseInt(match[2]) : 4;
  const barW = 420, barH = 65, barX = 90, barY = 145;
  const segW = barW / den;

  const COLORS = ["#7C5CFC", "#9F7AFA", "#A78BFA", "#C4B5FD", "#8B5CF6", "#6D28D9", "#5B21B6", "#DDD6FE"];

  const handleClick = (i: number) => {
    if (scene.interaction_mode === "none" || scene.interaction_mode === "highlight") return;
    const next = new Set(selectedParts);
    if (next.has(i)) {
      next.delete(i);
    } else {
      next.add(i);
    }
    setSelectedParts(next);
    if (next.size === num) onCorrect();
  };

  return (
    <svg viewBox="0 0 600 340" className="w-full h-full max-w-[600px]">
      <defs>
        <filter id="segShadow"><feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.08" /></filter>
      </defs>

      {/* Fraction display */}
      <motion.g initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring" }}>
        <text x={300} y={55} textAnchor="middle" className="text-3xl font-extrabold">
          <tspan fill="#7C5CFC">{num}</tspan>
          <tspan fill="#CBD5E1"> / </tspan>
          <tspan fill="#FF6B8A">{den}</tspan>
        </text>
        <text x={300} y={80} textAnchor="middle" fill="#94A3B8" className="text-xs font-bold">
          {num} bagian dari {den} bagian yang sama besar
        </text>
      </motion.g>

      {/* Bar segments */}
      {Array.from({ length: den }).map((_, i) => {
        const isFilled = i < num;
        const isSel = selectedParts.has(i);
        const isInteractive = scene.interaction_mode !== "none" && scene.interaction_mode !== "highlight";
        const color = COLORS[i % COLORS.length];
        return (
          <motion.g key={i} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 + i * 0.08, type: "spring", stiffness: 250 }}
            onClick={() => handleClick(i)} style={{ cursor: isInteractive ? "pointer" : "default" }}>
            <rect x={barX + i * segW + 3} y={barY} width={segW - 6} height={barH} rx={10}
              fill={isSel ? color : isFilled && scene.interaction_mode === "highlight" ? color + "30" : "#F8FAFC"}
              stroke={isSel ? color : isFilled && scene.interaction_mode === "highlight" ? color : "#E2E8F0"}
              strokeWidth={isSel || (isFilled && scene.interaction_mode === "highlight") ? 2.5 : 1.5}
              filter="url(#segShadow)" />
            <text x={barX + i * segW + segW / 2} y={barY + barH / 2 + 6} textAnchor="middle"
              fill={isSel ? "white" : isFilled && scene.interaction_mode === "highlight" ? color : "#CBD5E1"} className="text-lg font-extrabold">
              {i + 1}
            </text>
            {isFilled && scene.interaction_mode === "highlight" && (
              <motion.rect x={barX + i * segW + 1} y={barY - 2} width={segW - 2} height={barH + 4} rx={11} fill="none" stroke={color} strokeWidth={2.5}
                animate={{ opacity: [0, 0.8, 0] }} transition={{ repeat: Infinity, duration: 1.8, delay: i * 0.12 }} />
            )}
          </motion.g>
        );
      })}

      {/* Progress bar */}
      <motion.rect x={barX} y={255} width={(num / den) * barW} height={10} rx={5} fill="#7C5CFC"
        initial={{ width: 0 }} animate={{ width: (num / den) * barW }} transition={{ delay: 0.8, duration: 0.5 }} />
      <rect x={barX} y={255} width={barW} height={10} rx={5} fill="none" stroke="#E2E8F0" strokeWidth={1.5} />
      <text x={300} y={290} textAnchor="middle" fill="#94A3B8" className="text-[11px] font-bold">
        {((num / den) * 100).toFixed(0)}% dari keseluruhan
      </text>
    </svg>
  );
}
