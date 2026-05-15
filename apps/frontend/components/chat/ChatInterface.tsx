"use client";

import { useMemo, useState } from "react";
import { Bot, MessageSquarePlus, PanelRight, Sparkles } from "lucide-react";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import { VisualizerCanvas } from "@/components/visualizer/VisualizerCanvas";
import {
  DEFAULT_VISUALIZER_SAMPLE_KEY,
  VISUALIZER_SAMPLES,
} from "@/components/visualizer/sampleScenes";

type Message = {
  id: string;
  role: string;
  content: string;
};

const WELCOME_MESSAGE: Message = {
  id: "welcome",
  role: "assistant",
  content: "Hi! Aku Socratix. Kirim soal matematika, lalu cek panel visualisasi di kanan.",
};

const MOCK_REPLIES = [
  "Menarik. Sebelum mencari jawaban akhir, menurutmu langkah pertama yang paling masuk akal apa?",
  "Bagus. Coba jelaskan kenapa kamu memilih langkah itu.",
  "Kita hampir sampai. Apa yang terjadi kalau ekspresinya disederhanakan dulu?",
  "Oke, mari kita pecah perlahan. Informasi apa yang sudah kita punya dari soal ini?",
  "Usahamu sudah tepat arahnya. Coba cek lagi perhitungan kecilnya, ada bagian yang terasa janggal?",
  "Mantap. Aturan atau konsep apa yang menurutmu cocok dipakai di sini?",
];

function inferSampleKey(text: string) {
  const normalized = text.toLowerCase();

  if (normalized.includes("/") || normalized.includes("pecahan")) return "fraction_bar";
  if (normalized.includes("koordinat") || normalized.includes("(")) return "coordinate_plane";
  if (normalized.includes("sudut") || normalized.includes("derajat")) return "angle_diagram";
  if (normalized.includes("segitiga") || normalized.includes("luas")) return "geometry_shape";
  if (normalized.includes("data") || normalized.includes("modus")) return "simple_chart";
  if (normalized.includes("balok") || normalized.includes("rusuk")) return "solid_shape";
  if (normalized.includes(":") || normalized.includes("perbandingan")) return "bar_model";
  if (normalized.includes("pola") || normalized.includes("barisan")) return "table_pattern";
  if (normalized.includes("x") && normalized.includes("=")) return "balance_scale";
  if (normalized.includes("kali") || normalized.includes(" x ")) return "area_model";
  if (normalized.includes("negatif") || normalized.includes("-")) return "number_line";

  return DEFAULT_VISUALIZER_SAMPLE_KEY;
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeKey, setActiveKey] = useState(DEFAULT_VISUALIZER_SAMPLE_KEY);

  const activeSample = useMemo(() => VISUALIZER_SAMPLES[activeKey], [activeKey]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };

    setActiveKey(inferSampleKey(input));
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
    setActiveKey(DEFAULT_VISUALIZER_SAMPLE_KEY);
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
              <p className="text-xs font-semibold text-[#64748B]">Socratic Math Tutor</p>
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
                onClick={() => setActiveKey(key)}
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

        <MessageList messages={messages} />

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

        <MessageInput input={input} setInput={setInput} handleSubmit={handleSubmit} isLoading={isLoading} />
      </section>

      <section className="hidden min-w-0 flex-[1.15] flex-col bg-white xl:flex">
        <div className="flex items-center gap-3 border-b border-[#E8E8F0] px-5 py-3">
          <PanelRight size={18} className="text-[#00A88B]" />
          <div className="min-w-0">
            <h2 className="truncate text-sm font-extrabold">Visualizer Side-by-Side</h2>
            <p className="text-xs font-semibold text-[#64748B]">
              {activeSample.label} - {activeSample.scene.component}
            </p>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          <VisualizerCanvas input={activeSample.input} scene={activeSample.scene} />
        </div>
      </section>
    </div>
  );
}
