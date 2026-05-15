"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { VisualizerProps } from "../VisualizerCanvas";

/**
 * FractionBarVisualizer — Menunjukkan pecahan sebagai bagian dari keseluruhan
 * 
 * Parsing math_state: "3/4" → numerator=3, denominator=4
 */
export function FractionBarVisualizer({ input, scene, onCorrect, onWrong }: VisualizerProps) {
  const [selectedParts, setSelectedParts] = useState<Set<number>>(new Set());

  // Parse fraction
  const fractionMatch = input.math_state.match(/(\d+)\s*\/\s*(\d+)/);
  const numerator = fractionMatch ? parseInt(fractionMatch[1]) : 3;
  const denominator = fractionMatch ? parseInt(fractionMatch[2]) : 4;

  const barWidth = 400;
  const barHeight = 60;
  const barX = 100;
  const barY = 150;
  const segWidth = barWidth / denominator;

  const handleSegmentClick = (idx: number) => {
    if (scene.interaction_mode === "none" || scene.interaction_mode === "highlight") return;

    const next = new Set(selectedParts);
    if (next.has(idx)) {
      next.delete(idx);
    } else {
      next.add(idx);
    }
    setSelectedParts(next);

    // Check if exactly numerator parts are selected
    if (next.size === numerator) {
      onCorrect();
    }
  };

  const colors = [
    "#7c3aed", "#8b5cf6", "#a78bfa", "#c4b5fd",
    "#6d28d9", "#5b21b6", "#4c1d95", "#ddd6fe",
  ];

  return (
    <svg viewBox="0 0 600 350" className="w-full h-full max-w-[600px]">
      {/* Fraction label */}
      <motion.text
        x={300} y={80}
        textAnchor="middle"
        className="fill-white/80 text-3xl font-bold"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <tspan className="fill-violet-400">{numerator}</tspan>
        <tspan className="fill-white/30"> / </tspan>
        <tspan className="fill-pink-400">{denominator}</tspan>
      </motion.text>

      <motion.text
        x={300} y={105}
        textAnchor="middle"
        className="fill-white/30 text-xs"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {numerator} bagian dari {denominator} bagian
      </motion.text>

      {/* Fraction bar segments */}
      {Array.from({ length: denominator }).map((_, i) => {
        const isFilled = i < numerator;
        const isSelected = selectedParts.has(i);
        const isInteractive =
          scene.interaction_mode !== "none" && scene.interaction_mode !== "highlight";

        return (
          <motion.g
            key={i}
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ delay: 0.2 + i * 0.08 }}
            onClick={() => handleSegmentClick(i)}
            style={{ cursor: isInteractive ? "pointer" : "default" }}
          >
            <rect
              x={barX + i * segWidth + 2}
              y={barY}
              width={segWidth - 4}
              height={barHeight}
              rx={6}
              fill={
                isSelected
                  ? "#7c3aed"
                  : isFilled && scene.interaction_mode === "highlight"
                  ? colors[i % colors.length] + "90"
                  : "#ffffff08"
              }
              stroke={
                isFilled && scene.interaction_mode === "highlight"
                  ? colors[i % colors.length]
                  : isSelected
                  ? "#a78bfa"
                  : "#ffffff15"
              }
              strokeWidth={isFilled && scene.interaction_mode === "highlight" ? 2 : 1}
            />

            {/* Segment number */}
            <text
              x={barX + i * segWidth + segWidth / 2}
              y={barY + barHeight / 2 + 5}
              textAnchor="middle"
              className={`text-sm font-bold ${
                isSelected || (isFilled && scene.interaction_mode === "highlight")
                  ? "fill-white/90"
                  : "fill-white/25"
              }`}
            >
              {i + 1}
            </text>

            {/* Highlight animation for filled segments */}
            {isFilled && scene.interaction_mode === "highlight" && (
              <motion.rect
                x={barX + i * segWidth}
                y={barY - 2}
                width={segWidth}
                height={barHeight + 4}
                rx={7}
                fill="none"
                stroke="#7c3aed"
                strokeWidth={2}
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.8, 0] }}
                transition={{ repeat: Infinity, duration: 2, delay: i * 0.15 }}
              />
            )}
          </motion.g>
        );
      })}

      {/* Bottom labels */}
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <text x={barX} y={barY + barHeight + 30} className="fill-violet-400/60 text-[10px]">
          ← Bagian yang diambil ({numerator})
        </text>
        <text x={barX + barWidth} y={barY + barHeight + 30} textAnchor="end" className="fill-pink-400/60 text-[10px]">
          Total bagian ({denominator}) →
        </text>
      </motion.g>

      {/* Visual summary bar below */}
      <motion.rect
        x={barX} y={270} width={(numerator / denominator) * barWidth} height={8} rx={4}
        fill="#7c3aed"
        initial={{ width: 0 }}
        animate={{ width: (numerator / denominator) * barWidth }}
        transition={{ delay: 0.8, duration: 0.5 }}
      />
      <rect
        x={barX} y={270} width={barWidth} height={8} rx={4}
        fill="none" stroke="#ffffff15" strokeWidth={1}
      />
      <text x={300} y={300} textAnchor="middle" className="fill-white/20 text-[10px]">
        {((numerator / denominator) * 100).toFixed(0)}% dari keseluruhan
      </text>
    </svg>
  );
}
