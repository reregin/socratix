"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { VisualizerProps } from "../VisualizerCanvas";

export function BalanceScaleVisualizer({
  input,
  scene,
  onCorrect,
  onWrong,
}: VisualizerProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const parts = input.math_state.split("=").map((s) => s.trim());
  const leftSide = parts[0] || input.math_state;
  const rightSide = parts[1] || "?";
  const leftTokens = tokenize(leftSide);
  const rightTokens = tokenize(rightSide);
  const isInteractive = scene.interaction_mode !== "none";
  const tokenY = 58;
  const tokenWidth = 56;
  const tokenHeight = 46;

  const handleClick = (token: string) => {
    if (!isInteractive) return;

    setSelected(token);
    const correctTarget = scene.correct_target.toLowerCase();
    const normalizedTarget = correctTarget
      .replace(/di ruas kiri|di ruas kanan/g, "")
      .trim();
    const normalizedToken = token.toLowerCase();

    if (
      correctTarget.includes(normalizedToken) ||
      normalizedToken.includes(normalizedTarget)
    ) {
      onCorrect();
    } else {
      onWrong();
    }
  };

  const isHighlighted = (token: string) =>
    scene.highlight_focus.toLowerCase().includes(token.toLowerCase());

  return (
    <svg viewBox="0 0 600 320" className="h-auto w-full max-w-[600px]">
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
        <filter id="tileShadow">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.1" />
        </filter>
        <filter id="softGlow">
          <feDropShadow
            dx="0"
            dy="0"
            stdDeviation="6"
            floodColor="#7C5CFC"
            floodOpacity="0.3"
          />
        </filter>
      </defs>

      <motion.rect
        x={265}
        y={242}
        width={70}
        height={14}
        rx={7}
        fill="#E2E8F0"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.4 }}
      />
      <motion.rect
        x={287}
        y={170}
        width={26}
        height={78}
        rx={8}
        fill="#CBD5E1"
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        style={{ transformOrigin: "300px 248px" }}
        transition={{ duration: 0.3 }}
      />

      <motion.line
        x1={80}
        y1={170}
        x2={520}
        y2={170}
        stroke="url(#scaleBeam)"
        strokeWidth={6}
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      />

      <motion.polygon
        points="283,176 317,176 300,158"
        fill="#7C5CFC"
        filter="url(#tileShadow)"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.4, type: "spring" }}
      />

      <motion.path
        d="M65,170 Q65,198 110,204 L250,204 Q295,198 295,170"
        fill="url(#panLeft)"
        stroke="#C4B5FD"
        strokeWidth={2}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      />
      <motion.path
        d="M305,170 Q305,198 350,204 L490,204 Q535,198 535,170"
        fill="url(#panRight)"
        stroke="#FDA4AF"
        strokeWidth={2}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      />

      <text
        x={180}
        y={125}
        textAnchor="middle"
        fill="#7C5CFC"
        className="text-[11px] font-extrabold"
      >
        Ruas Kiri
      </text>
      <text
        x={420}
        y={125}
        textAnchor="middle"
        fill="#FF6B8A"
        className="text-[11px] font-extrabold"
      >
        Ruas Kanan
      </text>

      {leftTokens.map((token, i) => {
        const x = 115 + i * 60;
        const highlighted = isHighlighted(token);
        const isVar = /[a-z]/i.test(token);
        const isSelected = selected === token;

        return (
          <TokenTile
            key={`l-${i}`}
            x={x}
            y={tokenY}
            token={token}
            fill={
              isSelected
                ? "#7C5CFC"
                : highlighted
                  ? "#EDE9FE"
                  : isVar
                    ? "#DBEAFE"
                    : "#F1F5F9"
            }
            stroke={
              isSelected
                ? "#5B21B6"
                : highlighted
                  ? "#7C5CFC"
                  : isVar
                    ? "#93C5FD"
                    : "#E2E8F0"
            }
            textFill={
              isSelected
                ? "white"
                : isVar
                  ? "#2563EB"
                  : highlighted
                    ? "#7C5CFC"
                    : "#475569"
            }
            highlighted={highlighted}
            interactive={isInteractive}
            tokenWidth={tokenWidth}
            tokenHeight={tokenHeight}
            delay={0.6 + i * 0.1}
            onClick={() => handleClick(token)}
          />
        );
      })}

      <text
        x={300}
        y={88}
        textAnchor="middle"
        fill="#94A3B8"
        className="text-xl font-extrabold"
      >
        =
      </text>

      {rightTokens.map((token, i) => {
        const x = 380 + i * 60;
        const isSelected = selected === token;

        return (
          <TokenTile
            key={`r-${i}`}
            x={x}
            y={tokenY}
            token={token}
            fill={isSelected ? "#FF6B8A" : "#FFF1F2"}
            stroke={isSelected ? "#E11D48" : "#FECDD3"}
            textFill={isSelected ? "white" : "#E11D48"}
            highlighted={false}
            interactive={isInteractive}
            tokenWidth={tokenWidth}
            tokenHeight={tokenHeight}
            delay={0.6 + i * 0.1}
            onClick={() => handleClick(token)}
          />
        );
      })}

      <text
        x={300}
        y={292}
        textAnchor="middle"
        fill="#CBD5E1"
        className="text-xs font-mono font-bold"
      >
        {input.math_state}
      </text>
    </svg>
  );
}

function TokenTile({
  x,
  y,
  token,
  fill,
  stroke,
  textFill,
  highlighted,
  interactive,
  tokenWidth,
  tokenHeight,
  delay,
  onClick,
}: {
  x: number;
  y: number;
  token: string;
  fill: string;
  stroke: string;
  textFill: string;
  highlighted: boolean;
  interactive: boolean;
  tokenWidth: number;
  tokenHeight: number;
  delay: number;
  onClick: () => void;
}) {
  return (
    <motion.g
      initial={{ opacity: 0, y: -25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: "spring", stiffness: 200 }}
      onClick={onClick}
      style={{ cursor: interactive ? "pointer" : "default" }}
    >
      <rect
        x={x - 34}
        y={y - 9}
        width={68}
        height={64}
        rx={16}
        fill="transparent"
        pointerEvents="all"
      />
      <rect
        x={x - tokenWidth / 2}
        y={y}
        width={tokenWidth}
        height={tokenHeight}
        rx={12}
        fill={fill}
        stroke={stroke}
        strokeWidth={2}
        filter="url(#tileShadow)"
      />
      <text
        x={x}
        y={y + 28}
        textAnchor="middle"
        fill={textFill}
        className="text-sm font-extrabold"
        pointerEvents="none"
      >
        {token}
      </text>
      {highlighted && (
        <motion.rect
          x={x - tokenWidth / 2 - 2}
          y={y - 2}
          width={tokenWidth + 4}
          height={tokenHeight + 4}
          rx={14}
          fill="none"
          stroke="#7C5CFC"
          strokeWidth={2.5}
          animate={{ opacity: [0, 1, 0], scale: [0.95, 1.05, 0.95] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          filter="url(#softGlow)"
          pointerEvents="none"
        />
      )}
    </motion.g>
  );
}

function tokenize(expr: string): string[] {
  const matches = expr.match(/[+-]?\s*\d*[a-z]?|\d+/gi);
  const tokens: string[] = [];

  if (matches) {
    for (const match of matches) {
      const token = match.replace(/\s/g, "");
      if (token) tokens.push(token);
    }
  }

  return tokens.length ? tokens : [expr];
}
