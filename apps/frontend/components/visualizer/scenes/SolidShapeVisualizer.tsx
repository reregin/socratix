"use client";

import { motion } from "framer-motion";
import type { VisualizerProps } from "../VisualizerCanvas";

export function SolidShapeVisualizer({ input, scene }: VisualizerProps) {
  const ms = input.math_state.toLowerCase();
  const pMatch = ms.match(/p\s*[=:]\s*(\d+)/);
  const lMatch = ms.match(/l\s*[=:]\s*(\d+)/);
  const tMatch = ms.match(/t\s*[=:]\s*(\d+)/);
  const p = pMatch ? parseInt(pMatch[1]) : 5;
  const l = lMatch ? parseInt(lMatch[1]) : 3;
  const t = tMatch ? parseInt(tMatch[1]) : 4;
  const cx = 300, cy = 200, scale = 18;
  const isoX = (px: number, py: number) => cx + (px - py) * scale * 0.866;
  const isoY = (px: number, py: number, pz: number) => cy + (px + py) * scale * 0.5 - pz * scale;

  const verts = [[0,0,0],[p,0,0],[p,l,0],[0,l,0],[0,0,t],[p,0,t],[p,l,t],[0,l,t]];
  const pts = verts.map(([vx,vy,vz]) => ({ x: isoX(vx,vy), y: isoY(vx,vy,vz) }));
  const hlEdges = scene.highlight_focus?.toLowerCase().includes("rusuk");

  const faces = [
    { idx: [0,1,5,4], fill: "#7C5CFC20", stroke: "#7C5CFC" },
    { idx: [1,2,6,5], fill: "#FF6B8A18", stroke: "#FF6B8A" },
    { idx: [4,5,6,7], fill: "#00C9A718", stroke: "#00C9A7" },
  ];

  return (
    <svg viewBox="0 0 600 380" className="w-full h-full max-w-[600px]">
      <defs>
        <filter id="solidShadow"><feDropShadow dx="0" dy="4" stdDeviation="8" floodOpacity="0.06" /></filter>
      </defs>

      <motion.text x={300} y={40} textAnchor="middle" fill="#94A3B8" className="text-[10px] font-extrabold uppercase tracking-[0.2em]"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Bangun Ruang — Balok</motion.text>

      {/* Hidden edges */}
      {[[0,3],[3,2],[3,7]].map(([a,b], i) => (
        <motion.line key={`he-${i}`} x1={pts[a].x} y1={pts[a].y} x2={pts[b].x} y2={pts[b].y}
          stroke="#E2E8F0" strokeWidth={1.5} strokeDasharray="5 4"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.3, delay: 0.1 + i * 0.05 }} />
      ))}

      {/* Faces */}
      {faces.map((face, fi) => {
        const d = face.idx.map((idx, j) => `${j === 0 ? "M" : "L"} ${pts[idx].x},${pts[idx].y}`).join(" ") + " Z";
        return (
          <motion.path key={fi} d={d} fill={face.fill} stroke={face.stroke} strokeWidth={2} strokeLinejoin="round" filter="url(#solidShadow)"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.2 + fi * 0.1 }} />
        );
      })}

      {/* Visible edges with highlight */}
      {[[0,1],[1,2],[1,5],[0,4],[4,5],[5,6],[6,7],[7,4],[2,6]].map(([a,b], i) => (
        <motion.line key={`e-${i}`} x1={pts[a].x} y1={pts[a].y} x2={pts[b].x} y2={pts[b].y}
          stroke={hlEdges ? "#FFB946" : "#94A3B8"} strokeWidth={hlEdges ? 2.5 : 1.5} strokeLinecap="round"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.3, delay: 0.3 + i * 0.04 }} />
      ))}

      {/* Dimension labels */}
      <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
        <rect x={(pts[0].x+pts[1].x)/2 - 25} y={(pts[0].y+pts[1].y)/2 + 8} width={50} height={22} rx={8} fill="#F0ECFF" stroke="#C4B5FD" strokeWidth={1} />
        <text x={(pts[0].x+pts[1].x)/2} y={(pts[0].y+pts[1].y)/2 + 24} textAnchor="middle" fill="#7C5CFC" className="text-[10px] font-extrabold">p = {p}</text>
        <rect x={(pts[1].x+pts[2].x)/2 + 8} y={(pts[1].y+pts[2].y)/2 - 8} width={50} height={22} rx={8} fill="#FFF0F3" stroke="#FDA4AF" strokeWidth={1} />
        <text x={(pts[1].x+pts[2].x)/2 + 33} y={(pts[1].y+pts[2].y)/2 + 8} textAnchor="middle" fill="#FF6B8A" className="text-[10px] font-extrabold">l = {l}</text>
        <rect x={pts[0].x - 50} y={(pts[0].y+pts[4].y)/2 - 10} width={45} height={22} rx={8} fill="#E6FFF9" stroke="#6EECD8" strokeWidth={1} />
        <text x={pts[0].x - 28} y={(pts[0].y+pts[4].y)/2 + 6} textAnchor="middle" fill="#00C9A7" className="text-[10px] font-extrabold">t = {t}</text>
      </motion.g>

      {hlEdges && <motion.text x={300} y={340} textAnchor="middle" fill="#B45309" className="text-[10px] font-extrabold"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>Jumlah rusuk: 12 rusuk ✨</motion.text>}
      <text x={300} y={360} textAnchor="middle" fill="#CBD5E1" className="text-[10px] font-bold">V = {p}×{l}×{t} = {p*l*t}</text>
    </svg>
  );
}
