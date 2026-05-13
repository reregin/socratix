"use client";

import { useState } from "react";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import VisualizationCanvas from "./VisualizationCanvas";

type Message = {
  id: string;
  role: string;
  content: string;
};

const WELCOME_MESSAGE: Message = {
  id: "welcome",
  role: "assistant",
  content: "Hi! I'm Socratix. What math problem are you working on today?",
};

const MOCK_REPLIES = [
  "Interesting! Before I give you the answer, what do you think the first step should be?",
  "Good thinking! Can you tell me why you approached it that way?",
  "You're on the right track. What happens if you try to simplify that expression first?",
  "Let's think about this together. What do you already know about this type of problem?",
  "Almost there! Take another look at your calculation — does anything seem off?",
  "Great effort! What rule or formula do you think applies here?",
];

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    setTimeout(() => {
      const reply = MOCK_REPLIES[Math.floor(Math.random() * MOCK_REPLIES.length)];
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: reply,
        },
      ]);
      setIsLoading(false);
    }, 1000);
  };

  const handleNewChat = () => {
    setMessages([WELCOME_MESSAGE]);
    setInput("");
    setIsLoading(false);
    setShowHint(false);
  };

  return (
    <div className="flex h-screen w-full" style={{ backgroundColor: "#FEFAF6" }}>

      {/* Sidebar Kiri */}
      <div className="w-64 flex flex-col border-r" style={{ backgroundColor: "#FEFAF6", borderColor: "#EADBC8" }}>
        <div className="p-5 border-b" style={{ borderColor: "#EADBC8" }}>
          <h1 className="text-xl font-bold" style={{ color: "#102C57" }}>Socratix</h1>
          <p className="text-xs mt-1" style={{ color: "#DAC0A3" }}>Your Socratic Math Tutor</p>
        </div>
        <div className="p-4">
          <button
            onClick={handleNewChat}
            className="w-full py-2 px-4 rounded-xl text-sm font-medium transition-all hover:opacity-80"
            style={{ backgroundColor: "#102C57", color: "#FEFAF6" }}
          >
            + New Chat
          </button>
        </div>
      </div>

      {/* Area Chat Tengah */}
      <div className="flex flex-col flex-1 h-full overflow-hidden">
        <MessageList messages={messages} />

        {/* Loading dots */}
        {isLoading && (
          <div className="px-6 pb-2 flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
              style={{ backgroundColor: "#102C57", color: "#FEFAF6" }}
            >
              S
            </div>
            <div
              className="px-4 py-3 rounded-2xl rounded-tl-none"
              style={{ backgroundColor: "#EADBC8" }}
            >
              <div className="flex space-x-1">
                <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: "#102C57" }}></div>
                <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: "#102C57", animationDelay: "0.1s" }}></div>
                <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: "#102C57", animationDelay: "0.2s" }}></div>
              </div>
            </div>
          </div>
        )}

        <MessageInput
          input={input}
          setInput={setInput}
          handleSubmit={handleSubmit}
          isLoading={isLoading}
        />
      </div>

      {/* Panel Visualisasi Kanan */}
      <div className="w-96 border-l flex flex-col" style={{ borderColor: "#EADBC8" }}>
        <VisualizationCanvas />

        {/* Hint Panel */}
        <div className="border-t" style={{ borderColor: "#EADBC8" }}>
          <button
            onClick={() => setShowHint(!showHint)}
            className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium transition-all"
            style={{ backgroundColor: "#FEFAF6", color: "#102C57" }}
          >
            <span>💡 Hint</span>
            <span>{showHint ? "▲" : "▼"}</span>
          </button>
          {showHint && (
            <div
              className="px-4 py-3 text-sm"
              style={{ backgroundColor: "#EADBC8", color: "#102C57" }}
            >
              Try breaking the problem into smaller steps. What's the first thing you need to find?
            </div>
          )}
        </div>
      </div>

    </div>
  );
}