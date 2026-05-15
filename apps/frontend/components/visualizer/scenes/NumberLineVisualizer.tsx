"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { VisualizerProps } from "../VisualizerCanvas";

/**
 * NumberLineVisualizer — Menunjukkan posisi bilangan pada garis bilangan
 */
export function NumberLineVisualizer({ input, scene, onCorrect, onWrong }: VisualizerProps) {
  const [selected, setSelected] = useState<number | null>(null);

  // Parse target number from math_state
  const targetNum = parseFloat(input.math_state.replace(/[^-\d.]/g, "")) || 0;
  const rangeMin = Math.min(-5, targetNum - 2);
  const rangeMax = Math.max(5, targetNum + 2);
  const ticks = [];
  for (let i = rangeMin; i <= rangeMax; i++) {
    ticks.push(i);
  }

  const lineY = 200;
  const lineLeft = 60;
  const lineRight = 540;
  const lineWidth = lineRight - lineLeft;

  const numToX = (n: number) =>
    lineLeft + ((n - rangeMin) / (rangeMax - rangeMin)) * lineWidth;

  const handleClick = (n: number) => {
    if (scene.interaction_mode === "none" || scene.interaction_mode === "highlight") return;
    setSelected(n);
    if (n === targetNum) {
      onCorrect();
    } else {
      onWrong();
    }
  };

  return (
    <svg viewBox="0 0 600 350" className="w-full h-full max-w-[600px]">
      <defs>
        <linearGradient id="nlGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.3} />
          <stop offset="50%" stopColor="#ec4899" stopOpacity={0.3} />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.3} />
        </linearGradient>
      </defs>

      {/* Main line */}
      <motion.line
        x1={lineLeft} y1={lineY} x2={lineRight} y2={lineY}
        stroke="url(#nlGrad)"
        strokeWidth={3}
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6 }}
      />

      {/* Arrows */}
      <motion.polygon
        points={`${lineLeft - 8},${lineY} ${lineLeft + 4},${lineY - 6} ${lineLeft + 4},${lineY + 6}`}
        fill="#7c3aed"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        transition={{ delay: 0.6 }}
      />
      <motion.polygon
        points={`${lineRight + 8},${lineY} ${lineRight - 4},${lineY - 6} ${lineRight - 4},${lineY + 6}`}
        fill="#f59e0b"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        transition={{ delay: 0.6 }}
      />

      {/* Ticks and labels */}
      {ticks.map((n, i) => {
        const x = numToX(n);
        const isZero = n === 0;
        const isTarget = n === targetNum;
        const isSelected = selected === n;

        return (
          <motion.g
            key={n}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.04 }}
            onClick={() => handleClick(n)}
            style={{ cursor: scene.interaction_mode !== "none" ? "pointer" : "default" }}
          >
            {/* Tick */}
            <line
              x1={x} y1={lineY - (isZero ? 12 : 8)}
              x2={x} y2={lineY + (isZero ? 12 : 8)}
              stroke={isZero ? "#ffffff60" : isTarget && scene.interaction_mode === "highlight" ? "#7c3aed" : "#ffffff30"}
              strokeWidth={isZero ? 2 : 1.5}
            />

            {/* Number label */}
            <text
              x={x} y={lineY + 28}
              textAnchor="middle"
              className={`text-xs font-mono ${
                isZero ? "fill-white/70 font-bold" : isSelected ? "fill-violet-300" : "fill-white/40"
              }`}
            >
              {n}
            </text>

            {/* Click target circle */}
            {scene.interaction_mode !== "none" && scene.interaction_mode !== "highlight" && (
              <circle
                cx={x} cy={lineY} r={10}
                fill={isSelected ? (isTarget ? "#7c3aed" : "#ef4444") + "30" : "transparent"}
                stroke="transparent"
                strokeWidth={1}
              />
            )}

            {/* Target highlight */}
            {isTarget && (scene.interaction_mode === "highlight" || isSelected) && (
              <>
                <motion.circle
                  cx={x} cy={lineY} r={8}
                  fill="#7c3aed"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring" }}
                />
                <motion.circle
                  cx={x} cy={lineY} r={14}
                  fill="none"
                  stroke="#7c3aed"
                  strokeWidth={2}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: [1, 1.3, 1], opacity: [1, 0.3, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                />
                <text
                  x={x} y={lineY - 25}
                  textAnchor="middle"
                  className="fill-violet-300 text-xs font-bold"
                >
                  {input.math_state}
                </text>
              </>
            )}
          </motion.g>
        );
      })}

      {/* Legend */}
      <text x={300} y={310} textAnchor="middle" className="fill-white/20 text-[10px]">
        Garis Bilangan
      </text>
    </svg>
  );
}
