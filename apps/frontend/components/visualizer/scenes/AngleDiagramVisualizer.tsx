"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { VisualizerProps } from "../VisualizerCanvas";

export function AngleDiagramVisualizer({ input, scene, onCorrect }: VisualizerProps) {
  const angleMatch = input.math_state.match(/(\d+)\s*°/);
  const targetAngle = angleMatch ? parseInt(angleMatch[1]) : 60;
  const [sliderAngle, setSliderAngle] = useState(0);
  const cx = 300, cy = 220, armLen = 120;
  const display = scene.interaction_mode === "slider" ? sliderAngle : targetAngle;
  const rad = (display * Math.PI) / 180;
  const endX = cx + armLen * Math.cos(-rad), endY = cy + armLen * Math.sin(-rad);
  const arcR = 55;
  const arcEndX = cx + arcR * Math.cos(-rad), arcEndY = cy + arcR * Math.sin(-rad);
  const largeArc = display > 180 ? 1 : 0;
  const arcPath = `M ${cx + arcR},${cy} A ${arcR},${arcR} 0 ${largeArc} 0 ${arcEndX},${arcEndY}`;

  return (
    <svg viewBox="0 0 600 380" className="w-full h-full max-w-[600px]">
      <defs>
        <linearGradient id="arcGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#FFB946" /><stop offset="100%" stopColor="#FF6B8A" />
        </linearGradient>
      </defs>

      <motion.text x={300} y={55} textAnchor="middle" className="text-2xl font-extrabold" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <tspan fill="#7C5CFC">{display}°</tspan>
      </motion.text>

      {/* Arc fill */}
      <motion.path d={`M ${cx},${cy} L ${cx + arcR},${cy} A ${arcR},${arcR} 0 ${largeArc} 0 ${arcEndX},${arcEndY} Z`}
        fill="#FFB94615" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} />

      {/* Base arm */}
      <motion.line x1={cx} y1={cy} x2={cx + armLen} y2={cy} stroke="#7C5CFC" strokeWidth={4} strokeLinecap="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4 }} />

      {/* Rotating arm */}
      <motion.line x1={cx} y1={cy} x2={endX} y2={endY} stroke="#FF6B8A" strokeWidth={4} strokeLinecap="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4, delay: 0.2 }} />

      {/* Arc */}
      <motion.path d={arcPath} fill="none" stroke="url(#arcGrad)" strokeWidth={3.5} strokeLinecap="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5, delay: 0.4 }} />

      {/* Angle label on arc */}
      <motion.text x={cx + (arcR + 22) * Math.cos(-rad / 2)} y={cy + (arcR + 22) * Math.sin(-rad / 2) + 4}
        textAnchor="middle" fill="#B45309" className="text-xs font-extrabold"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>{display}°</motion.text>

      {/* Vertex */}
      <circle cx={cx} cy={cy} r={5} fill="#7C5CFC" />
      <circle cx={cx} cy={cy} r={2} fill="white" />

      {/* Slider */}
      {scene.interaction_mode === "slider" && (
        <foreignObject x={150} y={300} width={300} height={50}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
            <input type="range" min={0} max={360} value={sliderAngle}
              onChange={(e) => { const v = parseInt(e.target.value); setSliderAngle(v); if (Math.abs(v - targetAngle) <= 3) onCorrect(); }}
              style={{ width: "100%", accentColor: "#7C5CFC" }} />
            <span style={{ fontSize: "10px", color: "#94A3B8", fontWeight: 700 }}>Geser untuk mengatur sudut 🎯</span>
          </div>
        </foreignObject>
      )}

      <text x={300} y={365} textAnchor="middle" fill="#CBD5E1" className="text-[10px] font-bold">
        {targetAngle < 90 ? "Sudut Lancip" : targetAngle === 90 ? "Sudut Siku-siku" : targetAngle < 180 ? "Sudut Tumpul" : "Sudut Refleks"}
      </text>
    </svg>
  );
}
