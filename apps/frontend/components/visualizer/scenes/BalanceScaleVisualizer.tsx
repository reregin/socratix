"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { VisualizerProps } from "../VisualizerCanvas";

export function BalanceScaleVisualizer({ input, scene, onCorrect, onWrong }: VisualizerProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const parts = input.math_state.split("=").map((s) => s.trim());
  const leftSide = parts[0] || input.math_state;
  const rightSide = parts[1] || "?";
  const leftTokens = tokenize(leftSide);
  const rightTokens = tokenize(rightSide);

  const handleClick = (token: string) => {
    if (scene.interaction_mode === "none" || scene.interaction_mode === "highlight") return;
    setSelected(token);
    const ct = scene.correct_target.toLowerCase().replace(/di ruas kiri|di ruas kanan/g, "").trim();
    if (scene.correct_target.toLowerCase().includes(token.toLowerCase()) || token.toLowerCase().includes(ct)) {
      onCorrect();
    } else { onWrong(); }
  };

  const isHighlighted = (token: string) => scene.highlight_focus.toLowerCase().includes(token.toLowerCase());

  return (
    <svg viewBox="0 0 600 400" className="w-full h-full max-w-[600px]">
      <defs>
        <linearGradient id="scaleBeam" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#7C5CFC" />
          <stop offset="100%" stopColor="#FF6B8A" />
        </linearGradient>
        <linearGradient id="panLeft" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#EDE9FE" />
          <stop offset="100%" stopColor="#DDD6FE" />
        </linearGradient>
        <linearGradient id="panRight" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFE4E6" />
          <stop offset="100%" stopColor="#FECDD3" />
        </linearGradient>
        <filter id="tileShadow"><feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.1" /></filter>
        <filter id="softGlow"><feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#7C5CFC" floodOpacity="0.3" /></filter>
      </defs>

      {/* Base stand */}
      <motion.rect x={265} y={320} width={70} height={14} rx={7} fill="#E2E8F0"
        initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.4 }} />
      <motion.rect x={287} y={248} width={26} height={78} rx={8} fill="#CBD5E1"
        initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} style={{ transformOrigin: "300px 326px" }} transition={{ duration: 0.3 }} />

      {/* Beam */}
      <motion.line x1={80} y1={248} x2={520} y2={248} stroke="url(#scaleBeam)" strokeWidth={6} strokeLinecap="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5, delay: 0.3 }} />

      {/* Fulcrum */}
      <motion.polygon points="283,254 317,254 300,236" fill="#7C5CFC" filter="url(#tileShadow)"
        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.4, type: "spring" }} />

      {/* Left pan */}
      <motion.path d="M65,248 Q65,272 110,278 L250,278 Q295,272 295,248" fill="url(#panLeft)" stroke="#C4B5FD" strokeWidth={2}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} />

      {/* Right pan */}
      <motion.path d="M305,248 Q305,272 350,278 L490,278 Q535,272 535,248" fill="url(#panRight)" stroke="#FDA4AF" strokeWidth={2}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} />

      {/* Labels */}
      <text x={180} y={225} textAnchor="middle" fill="#7C5CFC" className="text-[11px] font-extrabold">Ruas Kiri</text>
      <text x={420} y={225} textAnchor="middle" fill="#FF6B8A" className="text-[11px] font-extrabold">Ruas Kanan</text>

      {/* Left tokens */}
      {leftTokens.map((token, i) => {
        const x = 115 + i * 60;
        const hl = isHighlighted(token);
        const isVar = /[a-z]/i.test(token);
        const isSel = selected === token;
        return (
          <motion.g key={`l-${i}`} initial={{ opacity: 0, y: -25 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 + i * 0.1, type: "spring", stiffness: 200 }}
            onClick={() => handleClick(token)} style={{ cursor: scene.interaction_mode !== "none" ? "pointer" : "default" }}>
            <rect x={x - 24} y={178} width={48} height={44} rx={12}
              fill={isSel ? "#7C5CFC" : hl ? "#EDE9FE" : isVar ? "#DBEAFE" : "#F1F5F9"}
              stroke={isSel ? "#5B21B6" : hl ? "#7C5CFC" : isVar ? "#93C5FD" : "#E2E8F0"} strokeWidth={2} filter="url(#tileShadow)" />
            <text x={x} y={205} textAnchor="middle" fill={isSel ? "white" : isVar ? "#2563EB" : hl ? "#7C5CFC" : "#475569"} className="text-sm font-extrabold">
              {token}
            </text>
            {hl && <motion.rect x={x - 26} y={176} width={52} height={48} rx={14} fill="none" stroke="#7C5CFC" strokeWidth={2.5}
              animate={{ opacity: [0, 1, 0], scale: [0.95, 1.05, 0.95] }} transition={{ repeat: Infinity, duration: 1.5 }} filter="url(#softGlow)" />}
          </motion.g>
        );
      })}

      {/* Equals */}
      <text x={300} y={206} textAnchor="middle" fill="#94A3B8" className="text-xl font-extrabold">=</text>

      {/* Right tokens */}
      {rightTokens.map((token, i) => {
        const x = 380 + i * 60;
        const isSel = selected === token;
        return (
          <motion.g key={`r-${i}`} initial={{ opacity: 0, y: -25 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 + i * 0.1, type: "spring", stiffness: 200 }}
            onClick={() => handleClick(token)} style={{ cursor: scene.interaction_mode !== "none" ? "pointer" : "default" }}>
            <rect x={x - 24} y={178} width={48} height={44} rx={12}
              fill={isSel ? "#FF6B8A" : "#FFF1F2"} stroke={isSel ? "#E11D48" : "#FECDD3"} strokeWidth={2} filter="url(#tileShadow)" />
            <text x={x} y={205} textAnchor="middle" fill={isSel ? "white" : "#E11D48"} className="text-sm font-extrabold">{token}</text>
          </motion.g>
        );
      })}

      {/* Bottom equation */}
      <text x={300} y={365} textAnchor="middle" fill="#CBD5E1" className="text-xs font-mono font-bold">{input.math_state}</text>
    </svg>
  );
}

function tokenize(expr: string): string[] {
  const matches = expr.match(/[+-]?\s*\d*[a-z]?[²³]?|\d+/gi);
  const tokens: string[] = [];
  if (matches) for (const m of matches) { const c = m.replace(/\s/g, ""); if (c) tokens.push(c); }
  return tokens.length ? tokens : [expr];
}
