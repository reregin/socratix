"use client";

import { useEffect, useRef } from "react";

type Message = {
  id: string;
  role: string;
  content: string;
};

export default function MessageList({ messages }: { messages: Message[] }) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
      {messages.map((message) => {
        const isAssistant = message.role === "assistant";
        return (
          <div
            key={message.id}
            className={`flex items-start gap-3 ${isAssistant ? "" : "flex-row-reverse"}`}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
              style={{
                backgroundColor: isAssistant ? "#102C57" : "#DAC0A3",
                color: isAssistant ? "#FEFAF6" : "#102C57",
              }}
            >
              {isAssistant ? "S" : "U"}
            </div>
            <div
              className={`px-4 py-3 rounded-2xl text-sm max-w-[85%] sm:max-w-sm ${
                isAssistant ? "rounded-tl-none" : "rounded-tr-none"
              }`}
              style={{
                backgroundColor: isAssistant ? "#EADBC8" : "#102C57",
                color: isAssistant ? "#102C57" : "#FEFAF6",
                boxShadow: isAssistant
                  ? "0 4px 12px rgba(16, 44, 87, 0.08), 0 1px 3px rgba(16, 44, 87, 0.12)"
                  : "0 4px 12px rgba(16, 44, 87, 0.15), 0 1px 3px rgba(16, 44, 87, 0.2)",
              }}
            >
              {message.content}
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}