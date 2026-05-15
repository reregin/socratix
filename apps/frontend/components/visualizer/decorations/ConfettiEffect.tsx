"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const COLORS = ["#7C5CFC", "#FF6B8A", "#00C9A7", "#FFB946", "#4ADE80", "#F472B6", "#38BDF8"];
const SHAPES = ["circle", "square", "star"] as const;

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  shape: (typeof SHAPES)[number];
  size: number;
  rotation: number;
  velocityX: number;
  velocityY: number;
}

export function ConfettiEffect({ trigger }: { trigger: boolean }) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!trigger) return;
    const newParticles: Particle[] = Array.from({ length: 30 }, (_, i) => ({
      id: Date.now() + i,
      x: 50 + Math.random() * 300,
      y: -10,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
      size: 6 + Math.random() * 8,
      rotation: Math.random() * 360,
      velocityX: (Math.random() - 0.5) * 200,
      velocityY: Math.random() * 100 + 50,
    }));
    setParticles(newParticles);
    const timer = setTimeout(() => setParticles([]), 2500);
    return () => clearTimeout(timer);
  }, [trigger]);

  return (
    <AnimatePresence>
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ x: p.x, y: p.y, rotate: 0, opacity: 1, scale: 1 }}
          animate={{
            x: p.x + p.velocityX,
            y: p.y + p.velocityY + 200,
            rotate: p.rotation + 360,
            opacity: 0,
            scale: 0.3,
          }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5 + Math.random(), ease: "easeOut" }}
          className="absolute pointer-events-none z-50"
          style={{ width: p.size, height: p.size }}
        >
          {p.shape === "circle" ? (
            <div className="w-full h-full rounded-full" style={{ background: p.color }} />
          ) : p.shape === "square" ? (
            <div className="w-full h-full rounded-sm" style={{ background: p.color }} />
          ) : (
            <svg viewBox="0 0 24 24" className="w-full h-full">
              <path
                d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                fill={p.color}
              />
            </svg>
          )}
        </motion.div>
      ))}
    </AnimatePresence>
  );
}
