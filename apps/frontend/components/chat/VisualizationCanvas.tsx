"use client";
import React from "react";
import { BarChart2 } from "lucide-react";
interface StreamSceneComponent {
  component: string;
  props: Record<string, unknown>;
  position?: { x: number; y: number; z: number };
}

interface StreamSceneDescriptor {
  scene: StreamSceneComponent[];
  animation: string | null;
}
interface VisualizationCanvasProps {
  scene?: StreamSceneDescriptor | null;
}

function renderComponent(comp: StreamSceneComponent, index: number): React.ReactNode {
  const props = comp.props as Record<string, string | number>;

  switch (comp.component) {
    case "NumberLine":
      return (
        <svg key={index} viewBox="0 0 300 60" className="w-full">
          <line x1="10" y1="30" x2="290" y2="30" stroke="#102C57" strokeWidth="2" />
          {[0,1,2,3,4,5,6,7,8,9,10].map((n) => (
            <g key={n}>
              <line x1={10 + n*28} y1="24" x2={10 + n*28} y2="36" stroke="#102C57" strokeWidth="1.5" />
              <text x={10 + n*28} y="50" textAnchor="middle" fontSize="10" fill="#102C57">{n}</text>
            </g>
          ))}
        </svg>
      );

    case "CoordinatePlane":
      return (
        <svg key={index} viewBox="0 0 200 200" className="w-full max-w-xs">
          <line x1="100" y1="10" x2="100" y2="190" stroke="#102C57" strokeWidth="1.5" />
          <line x1="10" y1="100" x2="190" y2="100" stroke="#102C57" strokeWidth="1.5" />
          {[-4,-3,-2,-1,1,2,3,4].map((n) => (
            <g key={n}>
              <line x1={100 + n*20} y1="96" x2={100 + n*20} y2="104" stroke="#102C57" strokeWidth="1" />
              <line x1="96" y1={100 - n*20} x2="104" y2={100 - n*20} stroke="#102C57" strokeWidth="1" />
            </g>
          ))}
          <text x="105" y="15" fontSize="10" fill="#102C57">y</text>
          <text x="185" y="107" fontSize="10" fill="#102C57">x</text>
        </svg>
      );

    case "EquationBlock":
      return (
        <div key={index} className="px-6 py-4 rounded-xl text-center text-lg font-mono" style={{ backgroundColor: "#EADBC8", color: "#102C57" }}>
          {String(props.equation || props.label || "?")}
        </div>
      );

    default:
      return (
        <div key={index} className="px-4 py-2 rounded-lg text-sm" style={{ backgroundColor: "#EADBC8", color: "#102C57" }}>
          {comp.component}
        </div>
      );
  }
}

export default function VisualizationCanvas({ scene }: VisualizationCanvasProps) {
  return (
    <div className="flex-1 flex flex-col p-6" style={{ backgroundColor: "#FEFAF6" }}>
      <div className="mb-4">
        <h2 className="text-base font-semibold" style={{ color: "#102C57" }}>
          Visualization
        </h2>
      </div>

      <div
        className="flex-1 rounded-2xl flex flex-col items-center justify-center gap-4 p-4"
        style={{
          backgroundColor: "#FEFAF6",
          border: "2px dashed #EADBC8",
        }}
      >
        {scene && scene.scene.length > 0 ? (
          scene.scene.map((comp, index) => renderComponent(comp, index))
        ) : (
          <>
            <BarChart2 size={40} style={{ color: "#DAC0A3" }} />
            <p className="text-sm text-center" style={{ color: "#DAC0A3" }}>
              Visualization will appear here
            </p>
          </>
        )}
      </div>
    </div>
  );
}