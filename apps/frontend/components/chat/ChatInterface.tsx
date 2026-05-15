"use client";

import { useMemo, useState } from "react";
import { Bot, MessageSquarePlus, PanelRight, Sparkles } from "lucide-react";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import AgentTracePanel from "./AgentTracePanel";
import { VisualizerCanvas } from "@/components/visualizer/VisualizerCanvas";
import {
  DEFAULT_VISUALIZER_SAMPLE_KEY,
  VISUALIZER_SAMPLES,
} from "@/components/visualizer/sampleScenes";
import type {
  ChatStreamDebugEvent,
  ChatStreamEvent,
} from "@/../../packages/shared-types/src/chat-stream";
import {
  visualizerStateFromMessage,
  visualizerStateFromSample,
  visualizerStateFromStreamScene,
  type ChatVisualizerState,
} from "./visualizerState";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const WELCOME_MESSAGE: Message = {
  id: "welcome",
  role: "assistant",
  content:
    "Hi! Aku Socratix. Kirim soal matematika, lalu cek panel visualisasi di kanan.",
};

const CHAT_STREAM_URL =
  process.env.NEXT_PUBLIC_CHAT_STREAM_URL ?? "http://localhost:6969/chat";

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  const [visualizerState, setVisualizerState] = useState<ChatVisualizerState>(
    () => visualizerStateFromSample(),
  );
  const [visualizerStatus, setVisualizerStatus] = useState(
    "Ready with sample visualizer.",
  );
  const [traceEvents, setTraceEvents] = useState<ChatStreamDebugEvent[]>([]);

  const activeKey = visualizerState.sampleKey;
  const activeSample = useMemo(
    () =>
      VISUALIZER_SAMPLES[activeKey] ??
      VISUALIZER_SAMPLES[DEFAULT_VISUALIZER_SAMPLE_KEY],
    [activeKey],
  );

  const handleSampleChange = (key: string) => {
    setVisualizerState(visualizerStateFromSample(key));
    setVisualizerStatus("Sample visualizer loaded.");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim(),
    };
    const inferredVisualizerState = visualizerStateFromMessage(
      userMessage.content,
    );
    let latestVisualizerState = inferredVisualizerState;
    const assistantId = crypto.randomUUID();

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setTraceEvents([]);
    setVisualizerState(inferredVisualizerState);
    setVisualizerStatus("Preparing visualization...");
    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: "assistant", content: "" },
    ]);

    try {
      const response = await fetch(CHAT_STREAM_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage.content, sessionId }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`Chat stream failed (${response.status})`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let sseBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const result = readSseEvents(sseBuffer, chunk);
        sseBuffer = result.buffer;

        for (const event of result.events) {
          if (event.type === "token") {
            setMessages((prev) =>
              prev.map((message) =>
                message.id === assistantId
                  ? { ...message, content: message.content + event.text }
                  : message,
              ),
            );
          }

          if (event.type === "scene") {
            const nextVisualizerState = visualizerStateFromStreamScene(
              event.scene,
              latestVisualizerState,
              userMessage.content,
            );

            if (nextVisualizerState) {
              latestVisualizerState = nextVisualizerState;
              setVisualizerState(nextVisualizerState);
              setVisualizerStatus("Visualizer scene ready.");
            }
          }

          if (event.type === "progress") {
            setVisualizerStatus(event.label);
          }

          if (event.type === "debug") {
            setTraceEvents((prev) => [...prev, event]);
          }

          if (event.type === "done") {
            setVisualizerStatus("Response complete.");
          }

          if (event.type === "error") {
            throw new Error(event.message);
          }
        }
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Error connecting to server.";
      setVisualizerStatus("Backend unavailable. Showing inferred visualizer.");
      setMessages((prev) =>
        prev.map((chatMessage) =>
          chatMessage.id === assistantId
            ? { ...chatMessage, content: message || "Error connecting to server." }
            : chatMessage,
        ),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    setMessages([WELCOME_MESSAGE]);
    setInput("");
    setIsLoading(false);
    setTraceEvents([]);
    setVisualizerState(visualizerStateFromSample());
    setVisualizerStatus("Ready with sample visualizer.");
  };

  return (
    <div className="flex h-screen w-full bg-[#FAFBFF] text-[#1E1B4B]">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-[#E8E8F0] bg-white/90 lg:flex">
        <div className="border-b border-[#E8E8F0] p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#7C5CFC] text-white">
              <Bot size={20} />
            </div>
            <div>
              <h1 className="text-lg font-extrabold">Socratix</h1>
              <p className="text-xs font-semibold text-[#64748B]">
                Socratic Math Tutor
              </p>
            </div>
          </div>
        </div>

        <div className="p-4">
          <button
            onClick={handleNewChat}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#1E1B4B] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#312E81]"
          >
            <MessageSquarePlus size={16} />
            New Chat
          </button>
        </div>

        <div className="px-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[#94A3B8]">
            Visual Test
          </p>
          <div className="space-y-1.5">
            {Object.entries(VISUALIZER_SAMPLES).map(([key, sample]) => (
              <button
                key={key}
                onClick={() => handleSampleChange(key)}
                className="w-full rounded-lg px-3 py-2 text-left text-xs font-bold transition"
                style={{
                  background: activeKey === key ? "#F0ECFF" : "transparent",
                  color: activeKey === key ? "#5B3FE8" : "#64748B",
                }}
              >
                {sample.shortLabel}
              </button>
            ))}
          </div>
        </div>
      </aside>

      <section className="flex min-w-0 flex-[0.95] flex-col border-r border-[#E8E8F0] bg-[#FAFBFF]">
        <div className="flex items-center gap-3 border-b border-[#E8E8F0] bg-white/90 px-5 py-3 backdrop-blur">
          <Sparkles size={18} className="text-[#7C5CFC]" />
          <div className="min-w-0">
            <h2 className="truncate text-sm font-extrabold">Chat Testing</h2>
            <p className="text-xs font-semibold text-[#64748B]">
              Input chat bisa mengubah contoh visualizer secara otomatis.
            </p>
          </div>
        </div>

        <MessageList messages={messages} isLoading={isLoading} />

        <AgentTracePanel events={traceEvents} isLoading={isLoading} />

        {isLoading && (
          <div className="px-6 pb-2">
            <div className="inline-flex items-center gap-2 rounded-lg border border-[#E8E8F0] bg-white px-4 py-3 text-sm font-semibold text-[#64748B] shadow-sm">
              <span className="h-2 w-2 animate-bounce rounded-full bg-[#7C5CFC]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-[#00C9A7] [animation-delay:0.1s]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-[#FFB946] [animation-delay:0.2s]" />
              Socratix sedang berpikir
            </div>
          </div>
        )}

        <MessageInput
          input={input}
          setInput={setInput}
          handleSubmit={handleSubmit}
          isLoading={isLoading}
        />
      </section>

      <section className="hidden min-w-0 flex-[1.15] flex-col bg-white xl:flex">
        <div className="flex items-center gap-3 border-b border-[#E8E8F0] px-5 py-3">
          <PanelRight size={18} className="text-[#00A88B]" />
          <div className="min-w-0">
            <h2 className="truncate text-sm font-extrabold">
              Visualizer Side-by-Side
            </h2>
            <p className="truncate text-xs font-semibold text-[#64748B]">
              {activeSample.label} - {visualizerState.scene.component} -{" "}
              {visualizerStatus}
            </p>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          <VisualizerCanvas
            input={visualizerState.input}
            scene={visualizerState.scene}
          />
        </div>
      </section>
    </div>
  );
}

function readSseEvents(
  buffer: string,
  chunk: string,
): { events: ChatStreamEvent[]; buffer: string } {
  const blocks = `${buffer}${chunk}`.split(/\r?\n\r?\n/);
  const nextBuffer = blocks.pop() ?? "";
  const events = blocks
    .map(parseSseBlock)
    .filter((event): event is ChatStreamEvent => event !== null);

  return { events, buffer: nextBuffer };
}

function parseSseBlock(block: string): ChatStreamEvent | null {
  const data = block
    .split(/\r?\n/)
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.replace(/^data:\s?/, ""))
    .join("\n");

  if (!data) {
    return null;
  }

  try {
    return JSON.parse(data) as ChatStreamEvent;
  } catch {
    return null;
  }
}
