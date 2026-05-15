"use client";

import { motion } from "framer-motion";
import type { VisualizerProps } from "../VisualizerCanvas";

export function AreaModelVisualizer({ input, scene }: VisualizerProps) {
  const mulMatch = input.math_state.match(/(\d+)\s*[×x*]\s*(\d+)/i);
  const rows = mulMatch ? Math.min(parseInt(mulMatch[1]), 10) : 3;
  const cols = mulMatch ? Math.min(parseInt(mulMatch[2]), 10) : 4;
  const cellSize = Math.min(50, 340 / Math.max(rows, cols));
  const gridW = cols * cellSize, gridH = rows * cellSize;
  const startX = 300 - gridW / 2, startY = 170 - gridH / 2;

  const ROW_COLORS = ["#7C5CFC", "#FF6B8A", "#00C9A7", "#FFB946", "#38BDF8", "#F472B6", "#34D399", "#FB923C", "#A78BFA", "#F87171"];

  return (
    <svg viewBox="0 0 600 360" className="w-full h-full max-w-[600px]">
      <defs><filter id="cellShadow"><feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.06" /></filter></defs>

      {/* Title */}
      <motion.text x={300} y={45} textAnchor="middle" className="text-2xl font-extrabold" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <tspan fill="#7C5CFC">{rows}</tspan>
        <tspan fill="#CBD5E1"> × </tspan>
        <tspan fill="#FF6B8A">{cols}</tspan>
        <tspan fill="#CBD5E1"> = </tspan>
        <tspan fill="#00C9A7">{rows * cols}</tspan>
      </motion.text>

      {/* Row/col labels */}
      <text x={startX - 12} y={startY + gridH / 2 + 4} textAnchor="middle" fill="#7C5CFC" className="text-[10px] font-extrabold"
        transform={`rotate(-90, ${startX - 12}, ${startY + gridH / 2})`}>{rows} baris</text>
      <text x={startX + gridW / 2} y={startY - 10} textAnchor="middle" fill="#FF6B8A" className="text-[10px] font-extrabold">{cols} kolom</text>

      {/* Grid cells */}
      {Array.from({ length: rows }).map((_, r) =>
        Array.from({ length: cols }).map((_, c) => {
          const idx = r * cols + c;
          const color = ROW_COLORS[r % ROW_COLORS.length];
          return (
            <motion.g key={`${r}-${c}`}>
              <motion.rect x={startX + c * cellSize + 2} y={startY + r * cellSize + 2}
                width={cellSize - 4} height={cellSize - 4} rx={8}
                fill={color + "20"} stroke={color + "50"} strokeWidth={1.5} filter="url(#cellShadow)"
                initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.08 + idx * 0.025, type: "spring", stiffness: 250 }} />
              <motion.text x={startX + c * cellSize + cellSize / 2} y={startY + r * cellSize + cellSize / 2 + 5}
                textAnchor="middle" fill={color + "90"} className="text-[10px] font-bold"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 + idx * 0.025 }}>
                {idx + 1}
              </motion.text>
            </motion.g>
          );
        })
      )}

      <motion.text x={300} y={startY + gridH + 35} textAnchor="middle" fill="#94A3B8" className="text-xs font-bold"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
        Total: {rows * cols} kotak 🎯
      </motion.text>
    </svg>
  );
}
