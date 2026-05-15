"use client";

import { motion } from "framer-motion";
import type { VisualizerProps } from "../VisualizerCanvas";

/**
 * SolidShapeVisualizer — Menampilkan bangun ruang dalam isometric 2D
 * 
 * Parsing: "balok dengan p=5, l=3, t=4"
 */
export function SolidShapeVisualizer({ input, scene }: VisualizerProps) {
  const ms = input.math_state.toLowerCase();

  // Parse dimensions
  const pMatch = ms.match(/p\s*[=:]\s*(\d+)/);
  const lMatch = ms.match(/l\s*[=:]\s*(\d+)/);
  const tMatch = ms.match(/t\s*[=:]\s*(\d+)/);
  const p = pMatch ? parseInt(pMatch[1]) : 5;
  const l = lMatch ? parseInt(lMatch[1]) : 3;
  const t = tMatch ? parseInt(tMatch[1]) : 4;

  // Isometric projection helper
  const cx = 300, cy = 200;
  const scale = 18;
  const isoX = (px: number, py: number) => cx + (px - py) * scale * 0.866;
  const isoY = (px: number, py: number, pz: number) => cy + (px + py) * scale * 0.5 - pz * scale;

  // 8 vertices of the cuboid
  const verts = [
    [0, 0, 0], [p, 0, 0], [p, l, 0], [0, l, 0], // bottom
    [0, 0, t], [p, 0, t], [p, l, t], [0, l, t], // top
  ];
  const pts = verts.map(([vx, vy, vz]) => ({
    x: isoX(vx, vy),
    y: isoY(vx, vy, vz),
  }));

  const hlEdges = scene.highlight_focus?.toLowerCase().includes("rusuk");

  // Face definitions (indices into pts)
  const faces = [
    { indices: [0, 1, 5, 4], color: "#7c3aed25", stroke: "#7c3aed" }, // front
    { indices: [1, 2, 6, 5], color: "#ec489920", stroke: "#ec4899" }, // right
    { indices: [4, 5, 6, 7], color: "#8b5cf625", stroke: "#8b5cf6" }, // top
  ];

  // All 12 edges
  const edges = [
    [0,1],[1,2],[2,3],[3,0], // bottom
    [4,5],[5,6],[6,7],[7,4], // top
    [0,4],[1,5],[2,6],[3,7], // vertical
  ];

  return (
    <svg viewBox="0 0 600 380" className="w-full h-full max-w-[600px]">
      {/* Title */}
      <motion.text x={300} y={40} textAnchor="middle" className="fill-white/60 text-xs font-bold uppercase tracking-widest"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        Bangun Ruang — Balok
      </motion.text>

      {/* Hidden edges (dashed) */}
      {[[0,3],[3,2],[3,7]].map(([a,b], i) => (
        <motion.line key={`he-${i}`}
          x1={pts[a].x} y1={pts[a].y} x2={pts[b].x} y2={pts[b].y}
          stroke="#ffffff15" strokeWidth={1} strokeDasharray="4 3"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
          transition={{ duration: 0.3, delay: 0.1 + i * 0.05 }} />
      ))}

      {/* Faces */}
      {faces.map((face, fi) => {
        const d = face.indices.map((idx, j) =>
          `${j === 0 ? "M" : "L"} ${pts[idx].x},${pts[idx].y}`
        ).join(" ") + " Z";
        return (
          <motion.path key={`face-${fi}`} d={d}
            fill={face.color} stroke={face.stroke} strokeWidth={1.5} strokeLinejoin="round"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 + fi * 0.1 }} />
        );
      })}

      {/* Visible edges */}
      {edges.filter(([a]) => ![3].includes(a) || a === 0).map(([a, b], i) => (
        <motion.line key={`edge-${i}`}
          x1={pts[a].x} y1={pts[a].y} x2={pts[b].x} y2={pts[b].y}
          stroke={hlEdges ? "#f59e0b80" : "#ffffff30"} strokeWidth={hlEdges ? 2 : 1.5}
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
          transition={{ duration: 0.3, delay: 0.3 + i * 0.04 }} />
      ))}

      {/* Dimension labels */}
      <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
        {/* Length (p) — front bottom edge */}
        <text x={(pts[0].x + pts[1].x) / 2} y={(pts[0].y + pts[1].y) / 2 + 20}
          textAnchor="middle" className="fill-violet-300 text-[11px] font-bold">
          p = {p}
        </text>
        {/* Width (l) — right bottom edge */}
        <text x={(pts[1].x + pts[2].x) / 2 + 15} y={(pts[1].y + pts[2].y) / 2 + 5}
          textAnchor="start" className="fill-pink-300 text-[11px] font-bold">
          l = {l}
        </text>
        {/* Height (t) — front left vertical */}
        <text x={pts[0].x - 15} y={(pts[0].y + pts[4].y) / 2}
          textAnchor="end" className="fill-blue-300 text-[11px] font-bold">
          t = {t}
        </text>
      </motion.g>

      {/* Edge count */}
      {hlEdges && (
        <motion.text x={300} y={340} textAnchor="middle" className="fill-amber-400/50 text-[10px]"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
          Jumlah rusuk: 12 rusuk
        </motion.text>
      )}

      <text x={300} y={360} textAnchor="middle" className="fill-white/15 text-[10px]">
        V = p × l × t = {p} × {l} × {t} = {p * l * t}
      </text>
    </svg>
  );
}
