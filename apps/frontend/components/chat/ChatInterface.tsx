"use client";

import { useState } from "react";
import { Lightbulb, ChevronDown, ChevronUp } from "lucide-react";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import VisualizationCanvas from "./VisualizationCanvas";

interface ChatStreamEvent {
  type: "token" | "scene" | "done" | "error" | "progress";
  messageId?: string;
  text?: string;
  scene?: StreamSceneDescriptor;
  message?: string;
  step?: string;
  status?: string;
  label?: string;
}

interface StreamSceneDescriptor {
  scene: StreamSceneComponent[];
  animation: string | null;
}

interface StreamSceneComponent {
  component: string;
  props: Record<string, unknown>;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hintOpen, setHintOpen] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  const [currentScene, setCurrentScene] = useState<StreamSceneDescriptor | null>(null);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    const assistantId = crypto.randomUUID();
    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: "assistant", content: "" },
    ]);

    try {
      const response = await fetch("http://localhost:3001/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage.content, sessionId }),
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error("No response body");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const event: ChatStreamEvent = JSON.parse(line.slice(6));
              if (event.type === "token") {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, content: m.content + event.text }
                      : m
                  )
                );
              } else if (event.type === "scene" && event.scene) {
                setCurrentScene(event.scene);
              }
            } catch {}
          }
        }
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: "Error connecting to server." }
            : m
        )
      );
    } finally {
      setIsLoading(false);
    }
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
            onClick={() => setMessages([])}
            className="w-full py-2 px-4 rounded-xl text-sm font-medium"
            style={{ backgroundColor: "#102C57", color: "#FEFAF6" }}
          >
            + New Chat
          </button>
        </div>
      </div>

      {/* Area Chat Tengah */}
      <div className="flex flex-col flex-1 h-full">
        <MessageList messages={messages} isLoading={isLoading} />
        <MessageInput
          input={input}
          setInput={setInput}
          handleSubmit={handleSubmit}
          isLoading={isLoading}
        />
      </div>

      {/* Panel Kanan */}
      <div className="w-96 border-l flex flex-col" style={{ borderColor: "#EADBC8" }}>
        <VisualizationCanvas scene={currentScene} />
        <div className="mt-4 mx-4 mb-4 rounded-xl overflow-hidden" style={{ backgroundColor: "#EADBC8" }}>
          <button
            onClick={() => setHintOpen(!hintOpen)}
            className="w-full flex items-center justify-between px-4 py-3"
            style={{ color: "#102C57" }}
          >
            <div className="flex items-center gap-2">
              <Lightbulb size={16} />
              <span className="text-sm font-medium">Hint</span>
            </div>
            {hintOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {hintOpen && (
            <div className="px-4 pb-3 text-sm" style={{ borderTop: "1px solid rgba(16,44,87,0.1)", color: "#102C57" }}>
              Try breaking the problem down step by step.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}