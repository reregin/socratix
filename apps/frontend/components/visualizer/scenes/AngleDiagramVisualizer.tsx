"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { VisualizerProps } from "../VisualizerCanvas";

/**
 * AngleDiagramVisualizer — Menunjukkan sudut dengan busur
 */
export function AngleDiagramVisualizer({ input, scene, onCorrect, onWrong }: VisualizerProps) {
  const angleMatch = input.math_state.match(/(\d+)\s*°/);
  const targetAngle = angleMatch ? parseInt(angleMatch[1]) : 60;
  const [sliderAngle, setSliderAngle] = useState(0);

  const cx = 300, cy = 230, armLen = 120;
  const displayAngle = scene.interaction_mode === "slider" ? sliderAngle : targetAngle;
  const rad = (displayAngle * Math.PI) / 180;

  const endX = cx + armLen * Math.cos(-rad);
  const endY = cy + armLen * Math.sin(-rad);

  // Arc path
  const arcR = 50;
  const arcEndX = cx + arcR * Math.cos(-rad);
  const arcEndY = cy + arcR * Math.sin(-rad);
  const largeArc = displayAngle > 180 ? 1 : 0;
  const arcPath = `M ${cx + arcR},${cy} A ${arcR},${arcR} 0 ${largeArc} 0 ${arcEndX},${arcEndY}`;

  return (
    <svg viewBox="0 0 600 380" className="w-full h-full max-w-[600px]">
      {/* Title */}
      <motion.text x={300} y={50} textAnchor="middle" className="fill-white/80 text-xl font-bold"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <tspan className="fill-violet-400">{displayAngle}°</tspan>
      </motion.text>

      {/* Base arm (horizontal) */}
      <motion.line x1={cx} y1={cy} x2={cx + armLen} y2={cy}
        stroke="#7c3aed" strokeWidth={3} strokeLinecap="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4 }} />

      {/* Rotating arm */}
      <motion.line x1={cx} y1={cy} x2={endX} y2={endY}
        stroke="#ec4899" strokeWidth={3} strokeLinecap="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4, delay: 0.2 }} />

      {/* Arc */}
      <motion.path d={arcPath} fill="none" stroke="#f59e0b" strokeWidth={2.5}
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5, delay: 0.4 }} />

      {/* Angle label */}
      <motion.text
        x={cx + (arcR + 18) * Math.cos(-rad / 2)}
        y={cy + (arcR + 18) * Math.sin(-rad / 2) + 4}
        textAnchor="middle" className="fill-amber-400 text-xs font-bold"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
        {displayAngle}°
      </motion.text>

      {/* Vertex dot */}
      <circle cx={cx} cy={cy} r={4} fill="#ffffff60" />

      {/* Slider */}
      {scene.interaction_mode === "slider" && (
        <foreignObject x={150} y={300} width={300} height={50}>
          <div className="flex flex-col items-center gap-1">
            <input type="range" min={0} max={360} value={sliderAngle}
              onChange={(e) => {
                const v = parseInt(e.target.value);
                setSliderAngle(v);
                if (Math.abs(v - targetAngle) <= 3) onCorrect();
              }}
              className="w-full accent-violet-500" />
            <span className="text-[10px] text-white/30">Geser untuk mengatur sudut</span>
          </div>
        </foreignObject>
      )}

      {/* Angle type label */}
      <text x={300} y={350} textAnchor="middle" className="fill-white/20 text-[10px]">
        {targetAngle < 90 ? "Sudut Lancip" : targetAngle === 90 ? "Sudut Siku-siku" : targetAngle < 180 ? "Sudut Tumpul" : "Sudut Refleks"}
      </text>
    </svg>
  );
}
