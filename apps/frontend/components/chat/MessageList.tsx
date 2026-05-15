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
                backgroundColor: isAssistant ? "#7C5CFC" : "#00A88B",
                color: "#FFFFFF",
              }}
            >
              {isAssistant ? "S" : "U"}
            </div>
            <div
              className={`px-4 py-3 rounded-2xl text-sm max-w-[85%] sm:max-w-sm ${
                isAssistant ? "rounded-tl-none" : "rounded-tr-none"
              }`}
              style={{
                backgroundColor: isAssistant ? "#FFFFFF" : "#1E1B4B",
                color: isAssistant ? "#334155" : "#FFFFFF",
                border: isAssistant ? "1px solid #E8E8F0" : "1px solid #1E1B4B",
                boxShadow: isAssistant
                  ? "0 6px 18px rgba(30, 27, 75, 0.06)"
                  : "0 6px 18px rgba(30, 27, 75, 0.14)",
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
