"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { VisualizerProps } from "../VisualizerCanvas";

/**
 * BalanceScaleVisualizer — Menunjukkan keseimbangan persamaan
 * 
 * Parsing math_state: "2x + 3 = 11"
 * → left: "2x + 3" , right: "11"
 * → Render timbangan dengan tiles di kedua sisi
 */
export function BalanceScaleVisualizer({ input, scene, onCorrect, onWrong }: VisualizerProps) {
  const [selected, setSelected] = useState<string | null>(null);

  // Parse equation sides
  const parts = input.math_state.split("=").map((s) => s.trim());
  const leftSide = parts[0] || input.math_state;
  const rightSide = parts[1] || "?";

  // Parse left side into tokens (simple tokenizer)
  const leftTokens = tokenize(leftSide);
  const rightTokens = tokenize(rightSide);

  const handleClick = (token: string) => {
    if (scene.interaction_mode === "none" || scene.interaction_mode === "highlight") return;
    setSelected(token);
    // Check if this matches the correct_target (fuzzy match)
    if (
      scene.correct_target.toLowerCase().includes(token.toLowerCase()) ||
      token.toLowerCase().includes(scene.correct_target.toLowerCase().replace(/di ruas kiri|di ruas kanan/g, "").trim())
    ) {
      onCorrect();
    } else {
      onWrong();
    }
  };

  const isHighlighted = (token: string) => {
    return scene.highlight_focus.toLowerCase().includes(token.toLowerCase());
  };

  return (
    <svg viewBox="0 0 600 400" className="w-full h-full max-w-[600px]">
      {/* Background gradient */}
      <defs>
        <linearGradient id="scaleBg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a1a2e" />
          <stop offset="100%" stopColor="#16162a" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Scale base */}
      <motion.rect
        x={270} y={320} width={60} height={12} rx={6}
        fill="#4a4a6a"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.4 }}
      />
      <motion.rect
        x={290} y={250} width={20} height={75} rx={4}
        fill="#3a3a5a"
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        style={{ transformOrigin: "300px 325px" }}
        transition={{ duration: 0.3 }}
      />

      {/* Balance beam */}
      <motion.line
        x1={100} y1={250} x2={500} y2={250}
        stroke="#6b6b9a"
        strokeWidth={4}
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      />

      {/* Fulcrum triangle */}
      <motion.polygon
        points="285,255 315,255 300,240"
        fill="#7c3aed"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.4 }}
      />

      {/* Left pan */}
      <motion.path
        d="M80,250 Q80,270 120,275 L240,275 Q280,270 280,250"
        fill="none"
        stroke="#7c3aed"
        strokeWidth={2.5}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      />

      {/* Right pan */}
      <motion.path
        d="M320,250 Q320,270 360,275 L480,275 Q520,270 520,250"
        fill="none"
        stroke="#ec4899"
        strokeWidth={2.5}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      />

      {/* Left side label */}
      <text x={180} y={230} textAnchor="middle" className="fill-violet-300 text-xs font-semibold">
        Ruas Kiri
      </text>

      {/* Right side label */}
      <text x={420} y={230} textAnchor="middle" className="fill-pink-300 text-xs font-semibold">
        Ruas Kanan
      </text>

      {/* Left tokens */}
      {leftTokens.map((token, i) => {
        const x = 120 + i * 55;
        const hl = isHighlighted(token);
        const isVar = token.includes("x") || token.includes("y");
        return (
          <motion.g
            key={`left-${i}`}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 + i * 0.1 }}
            onClick={() => handleClick(token)}
            style={{ cursor: scene.interaction_mode !== "none" ? "pointer" : "default" }}
          >
            <rect
              x={x - 22} y={185} width={44} height={40} rx={8}
              fill={
                selected === token
                  ? "#7c3aed"
                  : hl
                  ? "#7c3aed44"
                  : isVar
                  ? "#3b82f620"
                  : "#ffffff10"
              }
              stroke={hl ? "#7c3aed" : selected === token ? "#a78bfa" : "#ffffff15"}
              strokeWidth={hl || selected === token ? 2 : 1}
            />
            <text
              x={x} y={210}
              textAnchor="middle"
              className={`text-sm font-bold ${
                isVar ? "fill-blue-300" : hl ? "fill-violet-300" : "fill-white/80"
              }`}
            >
              {token}
            </text>
            {hl && (
              <motion.rect
                x={x - 24} y={183} width={48} height={44} rx={10}
                fill="none"
                stroke="#7c3aed"
                strokeWidth={2}
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              />
            )}
          </motion.g>
        );
      })}

      {/* Right tokens */}
      {rightTokens.map((token, i) => {
        const x = 380 + i * 55;
        const hl = isHighlighted(token);
        return (
          <motion.g
            key={`right-${i}`}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 + i * 0.1 }}
            onClick={() => handleClick(token)}
            style={{ cursor: scene.interaction_mode !== "none" ? "pointer" : "default" }}
          >
            <rect
              x={x - 22} y={185} width={44} height={40} rx={8}
              fill={selected === token ? "#ec4899" : hl ? "#ec489944" : "#ffffff10"}
              stroke={hl ? "#ec4899" : "#ffffff15"}
              strokeWidth={hl ? 2 : 1}
            />
            <text
              x={x} y={210}
              textAnchor="middle"
              className="fill-pink-300 text-sm font-bold"
            >
              {token}
            </text>
          </motion.g>
        );
      })}

      {/* Equals sign */}
      <text x={300} y={210} textAnchor="middle" className="fill-white/40 text-lg font-bold">
        =
      </text>

      {/* Equation display */}
      <text x={300} y={370} textAnchor="middle" className="fill-white/20 text-xs font-mono">
        {input.math_state}
      </text>
    </svg>
  );
}

/** Simple math tokenizer: "2x + 3" → ["2x", "+3"] */
function tokenize(expr: string): string[] {
  const tokens: string[] = [];
  // Match terms like 2x, +3, -5, 11, x, etc.
  const matches = expr.match(/[+-]?\s*\d*[a-z]?[²³]?|\d+/gi);
  if (matches) {
    for (const m of matches) {
      const cleaned = m.replace(/\s/g, "");
      if (cleaned) tokens.push(cleaned);
    }
  }
  if (tokens.length === 0) tokens.push(expr);
  return tokens;
}
