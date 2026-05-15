"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { VisualizerProps } from "../VisualizerCanvas";

/**
 * CoordinatePlaneVisualizer — Menunjukkan titik dan garis pada bidang koordinat
 * 
 * Parsing math_state: "titik (2,3)" → x=2, y=3
 */
export function CoordinatePlaneVisualizer({ input, scene, onCorrect, onWrong }: VisualizerProps) {
  const [clickedPoint, setClickedPoint] = useState<{ x: number; y: number } | null>(null);

  // Parse coordinates from math_state
  const coordMatch = input.math_state.match(/\((-?\d+)\s*,\s*(-?\d+)\)/);
  const targetX = coordMatch ? parseInt(coordMatch[1]) : 2;
  const targetY = coordMatch ? parseInt(coordMatch[2]) : 3;

  const gridSize = 5;
  const originX = 300;
  const originY = 200;
  const cellSize = 35;

  const toSvgX = (gx: number) => originX + gx * cellSize;
  const toSvgY = (gy: number) => originY - gy * cellSize;

  const handleCellClick = (gx: number, gy: number) => {
    if (scene.interaction_mode === "none" || scene.interaction_mode === "highlight") return;
    setClickedPoint({ x: gx, y: gy });
    if (gx === targetX && gy === targetY) {
      onCorrect();
    } else {
      onWrong();
    }
  };

  return (
    <svg viewBox="0 0 600 400" className="w-full h-full max-w-[600px]">
      <defs>
        <pattern id="gridPattern" width={cellSize} height={cellSize} patternUnits="userSpaceOnUse"
          x={originX % cellSize} y={originY % cellSize}
        >
          <rect width={cellSize} height={cellSize} fill="none" stroke="#ffffff08" strokeWidth={0.5} />
        </pattern>
      </defs>

      {/* Grid background */}
      <rect x={50} y={20} width={500} height={360} fill="url(#gridPattern)" />

      {/* Grid lines */}
      {Array.from({ length: gridSize * 2 + 1 }).map((_, i) => {
        const val = i - gridSize;
        return (
          <g key={`grid-${val}`}>
            {/* Vertical */}
            <line
              x1={toSvgX(val)} y1={toSvgY(gridSize)}
              x2={toSvgX(val)} y2={toSvgY(-gridSize)}
              stroke={val === 0 ? "#ffffff30" : "#ffffff08"}
              strokeWidth={val === 0 ? 1.5 : 0.5}
            />
            {/* Horizontal */}
            <line
              x1={toSvgX(-gridSize)} y1={toSvgY(val)}
              x2={toSvgX(gridSize)} y2={toSvgY(val)}
              stroke={val === 0 ? "#ffffff30" : "#ffffff08"}
              strokeWidth={val === 0 ? 1.5 : 0.5}
            />
            {/* X axis labels */}
            {val !== 0 && (
              <text
                x={toSvgX(val)} y={originY + 16}
                textAnchor="middle"
                className="fill-white/25 text-[10px] font-mono"
              >
                {val}
              </text>
            )}
            {/* Y axis labels */}
            {val !== 0 && (
              <text
                x={originX - 12} y={toSvgY(val) + 4}
                textAnchor="end"
                className="fill-white/25 text-[10px] font-mono"
              >
                {val}
              </text>
            )}
          </g>
        );
      })}

      {/* Axis labels */}
      <text x={toSvgX(gridSize) + 10} y={originY + 4} className="fill-white/40 text-xs font-bold">x</text>
      <text x={originX - 4} y={toSvgY(gridSize) - 8} textAnchor="middle" className="fill-white/40 text-xs font-bold">y</text>
      <text x={originX - 10} y={originY + 14} className="fill-white/30 text-[10px]">0</text>

      {/* X axis arrow */}
      <line x1={toSvgX(-gridSize)} y1={originY} x2={toSvgX(gridSize)} y2={originY} stroke="#ffffff30" strokeWidth={1.5} />
      {/* Y axis arrow */}
      <line x1={originX} y1={toSvgY(-gridSize)} x2={originX} y2={toSvgY(gridSize)} stroke="#ffffff30" strokeWidth={1.5} />

      {/* Clickable intersection points */}
      {scene.interaction_mode !== "none" && scene.interaction_mode !== "highlight" &&
        Array.from({ length: gridSize * 2 + 1 }).map((_, xi) =>
          Array.from({ length: gridSize * 2 + 1 }).map((_, yi) => {
            const gx = xi - gridSize;
            const gy = yi - gridSize;
            return (
              <circle
                key={`click-${gx}-${gy}`}
                cx={toSvgX(gx)} cy={toSvgY(gy)} r={8}
                fill="transparent"
                onClick={() => handleCellClick(gx, gy)}
                style={{ cursor: "pointer" }}
              />
            );
          })
        )
      }

      {/* Guide lines for target (highlight mode) */}
      {(scene.interaction_mode === "highlight" || clickedPoint?.x === targetX && clickedPoint?.y === targetY) && (
        <>
          {/* Horizontal guide */}
          <motion.line
            x1={originX} y1={originY}
            x2={toSvgX(targetX)} y2={originY}
            stroke="#7c3aed"
            strokeWidth={2}
            strokeDasharray="6 3"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          />
          {/* Vertical guide */}
          <motion.line
            x1={toSvgX(targetX)} y1={originY}
            x2={toSvgX(targetX)} y2={toSvgY(targetY)}
            stroke="#ec4899"
            strokeWidth={2}
            strokeDasharray="6 3"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.4, delay: 0.5 }}
          />

          {/* Guide labels */}
          <motion.text
            x={toSvgX(targetX / 2)} y={originY + 30}
            textAnchor="middle"
            className="fill-violet-400 text-[10px] font-bold"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {targetX} ke kanan →
          </motion.text>
          <motion.text
            x={toSvgX(targetX) + 30} y={toSvgY(targetY / 2)}
            className="fill-pink-400 text-[10px] font-bold"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            ↑ {targetY} ke atas
          </motion.text>
        </>
      )}

      {/* Target point */}
      {(scene.interaction_mode === "highlight" || (clickedPoint?.x === targetX && clickedPoint?.y === targetY)) && (
        <motion.g
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.8 }}
        >
          <circle cx={toSvgX(targetX)} cy={toSvgY(targetY)} r={6} fill="#7c3aed" />
          <motion.circle
            cx={toSvgX(targetX)} cy={toSvgY(targetY)} r={12}
            fill="none" stroke="#7c3aed" strokeWidth={2}
            animate={{ scale: [1, 1.4, 1], opacity: [1, 0.2, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
          />
          <text
            x={toSvgX(targetX) + 12} y={toSvgY(targetY) - 10}
            className="fill-violet-300 text-xs font-bold"
          >
            ({targetX}, {targetY})
          </text>
        </motion.g>
      )}

      {/* Clicked wrong point */}
      {clickedPoint && !(clickedPoint.x === targetX && clickedPoint.y === targetY) && (
        <motion.circle
          cx={toSvgX(clickedPoint.x)} cy={toSvgY(clickedPoint.y)} r={5}
          fill="#ef4444"
          initial={{ scale: 0 }}
          animate={{ scale: [1, 0.5] }}
          transition={{ duration: 0.5 }}
        />
      )}
    </svg>
  );
}
