"use client";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import VisualizationCanvas from "./VisualizationCanvas";

export default function ChatInterface() {
  return (
    <div className="flex h-screen w-full" style={{ backgroundColor: "#FEFAF6" }}>
      
      {/* Sidebar Kiri */}
      <div className="w-64 flex flex-col border-r" style={{ backgroundColor: "#FEFAF6", borderColor: "#EADBC8" }}>
        <div className="p-5 border-b" style={{ borderColor: "#EADBC8" }}>
          <h1 className="heading-lg" style={{ color: "#102C57" }}>Socratix</h1>
          <p className="text-xs mt-1 body-text-sm" style={{ color: "#DAC0A3" }}>Your Socratic Math Tutor</p>
        </div>
        <div className="p-4">
          <button className="w-full py-2 px-4 rounded-xl text-sm font-medium transition-all" style={{ backgroundColor: "#102C57", color: "#FEFAF6" }}>
            + New Chat
          </button>
        </div>
      </div>

      {/* Area Chat Tengah */}
      <div className="flex flex-col flex-1 h-full">
        <MessageList />
        <MessageInput />
      </div>

      {/* Panel Visualisasi Kanan */}
      <div className="w-96 border-l" style={{ borderColor: "#EADBC8" }}>
        <VisualizationCanvas />
      </div>

    </div>
  );
}