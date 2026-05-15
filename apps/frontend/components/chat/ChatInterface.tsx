"use client";

import { useState } from "react";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import VisualizationCanvas from "./VisualizationCanvas";
import AgentTracePanel from "./AgentTracePanel";
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

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const CHAT_STREAM_URL =
  process.env.NEXT_PUBLIC_CHAT_STREAM_URL ?? "http://localhost:6969/chat";

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
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

  const handleSampleChange = (key: string) => {
    setVisualizerState(visualizerStateFromSample(key));
    setVisualizerStatus("Sample visualizer loaded.");
  };

  const handleNewChat = () => {
    setMessages([]);
    setInput("");
    setTraceEvents([]);
    setVisualizerState(visualizerStateFromSample());
    setVisualizerStatus("Ready with sample visualizer.");
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
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

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setTraceEvents([]);
    setVisualizerState(inferredVisualizerState);
    setVisualizerStatus("Preparing visualization...");

    const assistantId = crypto.randomUUID();
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
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, content: m.content + event.text }
                  : m,
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
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: message || "Error connecting to server." }
            : m,
        ),
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#FAFBFF]">
      <div className="flex w-64 shrink-0 flex-col border-r border-[#E8E8F0] bg-white">
        <div className="border-b border-[#E8E8F0] p-5">
          <h1 className="text-xl font-extrabold text-[#1E1B4B]">Socratix</h1>
          <p className="mt-1 text-xs font-semibold text-[#64748B]">
            Your Socratic Math Tutor
          </p>
        </div>
        <div className="p-4">
          <button
            onClick={handleNewChat}
            className="w-full rounded-lg bg-[#7C5CFC] px-4 py-2.5 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#684AE8]"
          >
            New Chat
          </button>
        </div>
      </div>

      <div className="flex h-full min-w-0 flex-1 flex-col">
        <MessageList messages={messages} isLoading={isLoading} />
        <AgentTracePanel events={traceEvents} isLoading={isLoading} />
        <MessageInput
          input={input}
          setInput={setInput}
          handleSubmit={handleSubmit}
          isLoading={isLoading}
        />
      </div>

      <div className="flex h-full w-[42vw] min-w-[420px] max-w-[520px] shrink-0 flex-col border-l border-[#E8E8F0]">
        <VisualizationCanvas
          activeKey={visualizerState.sampleKey}
          input={visualizerState.input}
          scene={visualizerState.scene}
          statusLabel={visualizerStatus}
          sourceLabel={sourceLabelFor(visualizerState.source)}
          onSampleChange={handleSampleChange}
        />
      </div>
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

function sourceLabelFor(source: ChatVisualizerState["source"]): string {
  if (source === "stream") {
    return "Agent";
  }

  if (source === "inferred") {
    return "Input";
  }

  return "Sample";
}
