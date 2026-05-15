"use client";

import { motion } from "framer-motion";
import type { VisualizerProps } from "../VisualizerCanvas";

/**
 * AreaModelVisualizer — Menunjukkan perkalian sebagai grid area
 * 
 * Parsing math_state: "3 × 4" → rows=3, cols=4
 */
export function AreaModelVisualizer({ input, scene, onCorrect, onWrong }: VisualizerProps) {
  // Parse multiplication
  const mulMatch = input.math_state.match(/(\d+)\s*[×x*]\s*(\d+)/i);
  const rows = mulMatch ? Math.min(parseInt(mulMatch[1]), 10) : 3;
  const cols = mulMatch ? Math.min(parseInt(mulMatch[2]), 10) : 4;

  const cellSize = Math.min(40, 300 / Math.max(rows, cols));
  const gridW = cols * cellSize;
  const gridH = rows * cellSize;
  const startX = 300 - gridW / 2;
  const startY = 180 - gridH / 2;

  const colors = ["#7c3aed", "#8b5cf6", "#a78bfa", "#6d28d9", "#5b21b6"];

  return (
    <svg viewBox="0 0 600 350" className="w-full h-full max-w-[600px]">
      {/* Title */}
      <motion.text
        x={300} y={50}
        textAnchor="middle"
        className="fill-white/80 text-2xl font-bold"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <tspan className="fill-violet-400">{rows}</tspan>
        <tspan className="fill-white/30"> × </tspan>
        <tspan className="fill-pink-400">{cols}</tspan>
        <tspan className="fill-white/30"> = </tspan>
        <tspan className="fill-emerald-400">{rows * cols}</tspan>
      </motion.text>

      {/* Row label */}
      <motion.text
        x={startX - 15} y={startY + gridH / 2 + 5}
        textAnchor="middle"
        className="fill-violet-400/60 text-xs font-bold"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        transform={`rotate(-90, ${startX - 15}, ${startY + gridH / 2})`}
      >
        {rows} baris
      </motion.text>

      {/* Column label */}
      <motion.text
        x={startX + gridW / 2} y={startY - 12}
        textAnchor="middle"
        className="fill-pink-400/60 text-xs font-bold"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {cols} kolom
      </motion.text>

      {/* Grid cells */}
      {Array.from({ length: rows }).map((_, r) =>
        Array.from({ length: cols }).map((_, c) => {
          const idx = r * cols + c;
          return (
            <motion.rect
              key={`${r}-${c}`}
              x={startX + c * cellSize + 1.5}
              y={startY + r * cellSize + 1.5}
              width={cellSize - 3}
              height={cellSize - 3}
              rx={4}
              fill={colors[r % colors.length] + "40"}
              stroke={colors[r % colors.length] + "80"}
              strokeWidth={1}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + idx * 0.03, type: "spring", stiffness: 200 }}
            />
          );
        })
      )}

      {/* Cell numbers */}
      {Array.from({ length: rows }).map((_, r) =>
        Array.from({ length: cols }).map((_, c) => {
          const idx = r * cols + c + 1;
          return (
            <motion.text
              key={`t-${r}-${c}`}
              x={startX + c * cellSize + cellSize / 2}
              y={startY + r * cellSize + cellSize / 2 + 4}
              textAnchor="middle"
              className="fill-white/40 text-[10px] font-mono"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 + idx * 0.03 }}
            >
              {idx}
            </motion.text>
          );
        })
      )}

      {/* Result */}
      <motion.text
        x={300} y={startY + gridH + 40}
        textAnchor="middle"
        className="fill-white/30 text-xs"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        Total: {rows * cols} kotak
      </motion.text>
    </svg>
  );
}
