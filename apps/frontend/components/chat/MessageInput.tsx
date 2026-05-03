"use client";

import { useState } from "react";
import { Send } from "lucide-react";

export default function MessageInput() {
  const [inputValue, setInputValue] = useState("");

  const handleSend = () => {
    if (inputValue.trim()) {
      console.log("Sending:", inputValue);
      setInputValue("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className="p-4 sm:p-6"
      style={{
        borderTop: "1px solid #EADBC8",
        boxShadow: "0 -4px 12px rgba(16, 44, 87, 0.04)",
      }}
    >
      <div
        className="flex items-center gap-3 rounded-2xl px-4 py-3"
        style={{
          backgroundColor: "#FEFAF6",
          border: "1px solid #EADBC8",
        }}
      >
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask Socratix anything..."
          className="flex-1 bg-transparent outline-none text-sm body-text"
          style={{ color: "#102C57" }}
        />
        <button
          onClick={handleSend}
          disabled={!inputValue.trim()}
          className="p-2 rounded-full transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ backgroundColor: "#102C57", color: "#FEFAF6" }}
          aria-label="Send message"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
} 
