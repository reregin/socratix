"use client";

import { BarChart2 } from "lucide-react";

export default function VisualizationCanvas() {
  return (
    <div className="flex-1 flex flex-col p-6" style={{ backgroundColor: "#FEFAF6" }}>
      
      {/* Header */}
      <div className="mb-4">
        <h2 className="heading-sm" style={{ color: "#102C57" }}>
          Visualization
        </h2>
      </div>

      {/* Canvas Placeholder */}
      <div
        className="flex-1 rounded-2xl flex flex-col items-center justify-center gap-3"
        style={{
          backgroundColor: "#FEFAF6",
          border: "2px dashed #EADBC8",
        }}
      >
        <BarChart2 size={40} style={{ color: "#DAC0A3" }} />
        <p className="text-sm text-center body-text" style={{ color: "#DAC0A3" }}>
          Visualization will appear here
        </p>
      </div>

    </div>
  );
}