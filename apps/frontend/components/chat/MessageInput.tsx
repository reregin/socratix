"use client";

import { Send } from "lucide-react";

interface MessageInputProps {
  input: string;
  setInput: (value: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
}

export default function MessageInput({ input, setInput, handleSubmit, isLoading }: MessageInputProps) {
  return (
    <div
      className="p-4 sm:p-6"
      style={{
        borderTop: "1px solid #EADBC8",
        boxShadow: "0 -4px 12px rgba(16, 44, 87, 0.04)",
      }}
    >
      <form onSubmit={handleSubmit}>
        <div
          className="flex items-center gap-3 rounded-2xl px-4 py-3"
          style={{
            backgroundColor: "#FEFAF6",
            border: "1px solid #EADBC8",
          }}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Socratix anything..."
            className="flex-1 bg-transparent outline-none text-sm body-text"
            style={{ color: "#102C57" }}
            disabled={isLoading}
          />
          {isLoading ? (
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-[#102C57] rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-[#102C57] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-[#102C57] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          ) : (
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-2 rounded-full transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ backgroundColor: "#102C57", color: "#FEFAF6" }}
              aria-label="Send message"
            >
              <Send size={18} />
            </button>
          )}
        </div>
      </form>
    </div>
  );
} 
