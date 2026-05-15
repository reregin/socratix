"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { VisualizerProps } from "../VisualizerCanvas";

export function CoordinatePlaneVisualizer({ input, scene, onCorrect, onWrong }: VisualizerProps) {
  const [clicked, setClicked] = useState<{ x: number; y: number } | null>(null);
  const coordMatch = input.math_state.match(/\((-?\d+)\s*,\s*(-?\d+)\)/);
  const tx = coordMatch ? parseInt(coordMatch[1]) : 2;
  const ty = coordMatch ? parseInt(coordMatch[2]) : 3;
  const grid = 5, ox = 300, oy = 200, cell = 35;
  const toX = (gx: number) => ox + gx * cell;
  const toY = (gy: number) => oy - gy * cell;

  const handleClick = (gx: number, gy: number) => {
    if (scene.interaction_mode === "none" || scene.interaction_mode === "highlight") return;
    setClicked({ x: gx, y: gy });
    if (gx === tx && gy === ty) {
      onCorrect();
    } else {
      onWrong();
    }
  };

  const showGuide = scene.interaction_mode === "highlight" || (clicked?.x === tx && clicked?.y === ty);

  return (
    <svg viewBox="0 0 600 400" className="w-full h-full max-w-[600px]">
      <defs>
        <filter id="ptGlow"><feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#7C5CFC" floodOpacity="0.4" /></filter>
      </defs>

      {/* Grid lines */}
      {Array.from({ length: grid * 2 + 1 }).map((_, i) => {
        const v = i - grid;
        return (
          <g key={v}>
            <line x1={toX(v)} y1={toY(grid)} x2={toX(v)} y2={toY(-grid)} stroke={v === 0 ? "#CBD5E1" : "#F1F5F9"} strokeWidth={v === 0 ? 2 : 1} />
            <line x1={toX(-grid)} y1={toY(v)} x2={toX(grid)} y2={toY(v)} stroke={v === 0 ? "#CBD5E1" : "#F1F5F9"} strokeWidth={v === 0 ? 2 : 1} />
            {v !== 0 && <text x={toX(v)} y={oy + 18} textAnchor="middle" fill="#94A3B8" className="text-[10px] font-mono font-bold">{v}</text>}
            {v !== 0 && <text x={ox - 14} y={toY(v) + 4} textAnchor="end" fill="#94A3B8" className="text-[10px] font-mono font-bold">{v}</text>}
          </g>
        );
      })}

      {/* Axis labels */}
      <text x={toX(grid) + 12} y={oy + 5} fill="#475569" className="text-xs font-extrabold">x</text>
      <text x={ox - 5} y={toY(grid) - 10} textAnchor="middle" fill="#475569" className="text-xs font-extrabold">y</text>
      <text x={ox - 10} y={oy + 16} fill="#94A3B8" className="text-[10px] font-bold">0</text>

      {/* Click targets */}
      {scene.interaction_mode !== "none" && scene.interaction_mode !== "highlight" &&
        Array.from({ length: grid * 2 + 1 }).map((_, xi) =>
          Array.from({ length: grid * 2 + 1 }).map((_, yi) => (
            <circle key={`c-${xi}-${yi}`} cx={toX(xi - grid)} cy={toY(yi - grid)} r={10} fill="transparent"
              onClick={() => handleClick(xi - grid, yi - grid)} style={{ cursor: "pointer" }} />
          ))
        )
      }

      {/* Guide lines */}
      {showGuide && (
        <>
          <motion.line x1={ox} y1={oy} x2={toX(tx)} y2={oy} stroke="#7C5CFC" strokeWidth={3} strokeDasharray="8 4" strokeLinecap="round"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4, delay: 0.2 }} />
          <motion.line x1={toX(tx)} y1={oy} x2={toX(tx)} y2={toY(ty)} stroke="#FF6B8A" strokeWidth={3} strokeDasharray="8 4" strokeLinecap="round"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4, delay: 0.5 }} />
          <motion.text x={toX(tx / 2)} y={oy + 30} textAnchor="middle" fill="#7C5CFC" className="text-[10px] font-extrabold"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>{tx} ke kanan</motion.text>
          <motion.text x={toX(tx) + 25} y={toY(ty / 2)} fill="#FF6B8A" className="text-[10px] font-extrabold"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>{ty} ke atas</motion.text>
        </>
      )}

      {/* Target point */}
      {showGuide && (
        <motion.g initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.8, stiffness: 300 }}>
          <circle cx={toX(tx)} cy={toY(ty)} r={8} fill="#7C5CFC" filter="url(#ptGlow)" />
          <circle cx={toX(tx)} cy={toY(ty)} r={3} fill="white" />
          <motion.circle cx={toX(tx)} cy={toY(ty)} r={14} fill="none" stroke="#7C5CFC" strokeWidth={2.5}
            animate={{ scale: [1, 1.4, 1], opacity: [0.8, 0.2, 0.8] }} transition={{ repeat: Infinity, duration: 2 }} />
          <text x={toX(tx) + 14} y={toY(ty) - 12} fill="#7C5CFC" className="text-xs font-extrabold">({tx}, {ty})</text>
        </motion.g>
      )}

      {/* Wrong click */}
      {clicked && !(clicked.x === tx && clicked.y === ty) && (
        <motion.circle cx={toX(clicked.x)} cy={toY(clicked.y)} r={6} fill="#FF6B8A" initial={{ scale: 0 }} animate={{ scale: [1, 0.4] }} transition={{ duration: 0.4 }} />
      )}
    </svg>
  );
}
