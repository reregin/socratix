"use client";

import { useState } from "react";
import { BarChart2, Lightbulb, ChevronDown, ChevronUp } from "lucide-react";

export default function VisualizationCanvas() {
  const [hintOpen, setHintOpen] = useState(false);

  return (
    <div className="h-full flex flex-col p-6" style={{ backgroundColor: "#FEFAF6" }}>
      
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

      {/* Hint Box - Single Container */}
      <div 
        className="mt-4 rounded-xl transition-all overflow-hidden"
        style={{
          backgroundColor: "#EADBC8",
          color: "#102C57",
        }}
      >
        <button
          onClick={() => setHintOpen(!hintOpen)}
          className="w-full flex items-center justify-between px-4 py-3"
          style={{
            backgroundColor: "inherit",
            color: "inherit",
          }}
        >
          <div className="flex items-center gap-2">
            <Lightbulb size={16} />
            <span className="text-sm font-medium">Hint</span>
          </div>
          {hintOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {hintOpen && (
          <div
            className="px-4 pb-3 text-sm"
            style={{
              borderTop: "1px solid rgba(16, 44, 87, 0.1)",
              color: "#102C57",
            }}
          >
            Try breaking the number down into its smallest factors. 
            What is the smallest prime number that divides evenly into your number?
          </div>
        )}
      </div>

    </div>
  );
} 
