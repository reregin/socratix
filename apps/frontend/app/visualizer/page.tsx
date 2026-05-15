"use client";

import { useCallback, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Code2, Eye, FlaskConical, Loader2, Play, Sparkles } from "lucide-react";
import { VisualizerCanvas } from "@/components/visualizer/VisualizerCanvas";
import {
  DEFAULT_VISUALIZER_SAMPLE_KEY,
  VISUALIZER_SAMPLES,
} from "@/components/visualizer/sampleScenes";
import type {
  SimpleScenePlan,
  VisualStepInput,
} from "@/components/visualizer/VisualizerCanvas";

export default function VisualizerPage() {
  const [activeKey, setActiveKey] = useState(DEFAULT_VISUALIZER_SAMPLE_KEY);
  const [visualInput, setVisualInput] = useState<VisualStepInput>(
    VISUALIZER_SAMPLES[DEFAULT_VISUALIZER_SAMPLE_KEY].input,
  );
  const [scenePlan, setScenePlan] = useState<SimpleScenePlan>(
    VISUALIZER_SAMPLES[DEFAULT_VISUALIZER_SAMPLE_KEY].scene,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devMode, setDevMode] = useState(false);
  const [devInputJson, setDevInputJson] = useState(
    JSON.stringify(VISUALIZER_SAMPLES[DEFAULT_VISUALIZER_SAMPLE_KEY].input, null, 2),
  );
  const [devSceneJson, setDevSceneJson] = useState(
    JSON.stringify(VISUALIZER_SAMPLES[DEFAULT_VISUALIZER_SAMPLE_KEY].scene, null, 2),
  );
  const [mathState, setMathState] = useState(
    VISUALIZER_SAMPLES[DEFAULT_VISUALIZER_SAMPLE_KEY].input.math_state,
  );
  const [question, setQuestion] = useState(
    VISUALIZER_SAMPLES[DEFAULT_VISUALIZER_SAMPLE_KEY].input.socratic_question,
  );

  const activeSample = useMemo(() => VISUALIZER_SAMPLES[activeKey], [activeKey]);

  const syncEditors = useCallback((input: VisualStepInput, scene: SimpleScenePlan) => {
    setDevInputJson(JSON.stringify(input, null, 2));
    setDevSceneJson(JSON.stringify(scene, null, 2));
  }, []);

  const loadSample = useCallback(
    (key: string) => {
      const sample = VISUALIZER_SAMPLES[key];
      if (!sample) return;

      setActiveKey(key);
      setVisualInput(sample.input);
      setScenePlan(sample.scene);
      setMathState(sample.input.math_state);
      setQuestion(sample.input.socratic_question);
      syncEditors(sample.input, sample.scene);
      setError(null);
    },
    [syncEditors],
  );

  const generateWithAI = useCallback(async () => {
    setLoading(true);
    setError(null);

    const input: VisualStepInput = {
      ...activeSample.input,
      math_state: mathState,
      socratic_question: question,
    };

    try {
      const res = await fetch("/api/visualizer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      if (!res.ok) {
        throw new Error(`API visualizer gagal (${res.status})`);
      }

      const scene = (await res.json()) as SimpleScenePlan;
      setVisualInput(input);
      setScenePlan(scene);
      syncEditors(input, scene);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [activeSample.input, mathState, question, syncEditors]);

  const handleDevRender = useCallback(() => {
    try {
      const nextInput = JSON.parse(devInputJson) as VisualStepInput;
      const nextScene = JSON.parse(devSceneJson) as SimpleScenePlan;
      setVisualInput(nextInput);
      setScenePlan(nextScene);
      setMathState(nextInput.math_state);
      setQuestion(nextInput.socratic_question);
      setError(null);
    } catch (e) {
      setError(`JSON Error: ${(e as Error).message}`);
    }
  }, [devInputJson, devSceneJson]);

  return (
    <main className="min-h-screen bg-[#FAFBFF] text-[#1E1B4B]">
      <header className="sticky top-0 z-40 border-b border-[#E8E8F0] bg-white/90 px-5 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#7C5CFC] text-white shadow-sm">
            <Sparkles size={20} />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-extrabold">Socratix Visualizer Lab</h1>
            <p className="text-xs font-semibold text-[#64748B]">
              Test visual step, scene plan, dan renderer SVG dalam satu tempat.
            </p>
          </div>
          <button
            onClick={() => setDevMode((value) => !value)}
            className="ml-auto inline-flex items-center gap-2 rounded-lg border border-[#D8D5FF] px-3 py-2 text-xs font-bold text-[#5B3FE8] transition hover:bg-[#F0ECFF]"
          >
            {devMode ? <Eye size={15} /> : <Code2 size={15} />}
            {devMode ? "Mode Preview" : "Mode Dev"}
          </button>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-7xl gap-5 px-5 py-5 lg:grid-cols-[380px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <section className="rounded-lg border border-[#E8E8F0] bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <FlaskConical size={17} className="text-[#00A88B]" />
              <h2 className="text-sm font-extrabold">Preset Topik</h2>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(VISUALIZER_SAMPLES).map(([key, sample]) => (
                <button
                  key={key}
                  onClick={() => loadSample(key)}
                  className="rounded-lg border px-3 py-2 text-left text-xs font-bold transition hover:-translate-y-0.5 hover:shadow-sm"
                  style={{
                    background: activeKey === key ? "#7C5CFC" : "#FFFFFF",
                    borderColor: activeKey === key ? "#7C5CFC" : "#E8E8F0",
                    color: activeKey === key ? "#FFFFFF" : "#475569",
                  }}
                >
                  {sample.shortLabel}
                </button>
              ))}
            </div>
          </section>

          <AnimatePresence mode="wait">
            {!devMode ? (
              <motion.section
                key="preview-controls"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="rounded-lg border border-[#E8E8F0] bg-white p-4 shadow-sm"
              >
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-[#7C5CFC]">
                  Input Cepat
                </p>
                <label className="mb-1 block text-xs font-bold text-[#64748B]">
                  Keadaan matematika
                </label>
                <input
                  type="text"
                  value={mathState}
                  onChange={(e) => setMathState(e.target.value)}
                  className="mb-3 w-full rounded-lg border border-[#E8E8F0] bg-[#FAFBFF] px-3 py-2.5 font-mono text-sm font-bold text-[#1E1B4B] outline-none focus:border-[#7C5CFC]"
                />

                <label className="mb-1 block text-xs font-bold text-[#64748B]">
                  Pertanyaan Socratic
                </label>
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="h-24 w-full resize-none rounded-lg border border-[#E8E8F0] bg-[#FAFBFF] px-3 py-2.5 text-sm font-semibold text-[#1E1B4B] outline-none focus:border-[#7C5CFC]"
                />

                <button
                  onClick={generateWithAI}
                  disabled={loading}
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#7C5CFC] px-4 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#684AE8] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? <Loader2 size={17} className="animate-spin" /> : <Sparkles size={17} />}
                  {loading ? "AI sedang menyusun scene..." : "Generate dengan AI"}
                </button>
              </motion.section>
            ) : (
              <motion.section
                key="dev-controls"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="rounded-lg border border-[#E8E8F0] bg-white p-4 shadow-sm"
              >
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-[#7C5CFC]">
                  JSON Editor
                </p>
                <label className="mb-1 block text-xs font-bold text-[#64748B]">
                  Visual Step JSON
                </label>
                <textarea
                  value={devInputJson}
                  onChange={(e) => setDevInputJson(e.target.value)}
                  className="h-44 w-full resize-none rounded-lg border border-[#BFECDD] bg-[#F0FDF4] px-3 py-2 font-mono text-[11px] text-[#047857] outline-none focus:border-[#00A88B]"
                  spellCheck={false}
                />

                <label className="mb-1 mt-3 block text-xs font-bold text-[#64748B]">
                  Scene Plan JSON
                </label>
                <textarea
                  value={devSceneJson}
                  onChange={(e) => setDevSceneJson(e.target.value)}
                  className="h-44 w-full resize-none rounded-lg border border-[#FFE0A3] bg-[#FFF8EB] px-3 py-2 font-mono text-[11px] text-[#B45309] outline-none focus:border-[#FFB946]"
                  spellCheck={false}
                />

                <button
                  onClick={handleDevRender}
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#00A88B] px-4 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#008F77]"
                >
                  <Play size={17} />
                  Render JSON
                </button>
              </motion.section>
            )}
          </AnimatePresence>

          {error && (
            <div className="rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm font-bold text-[#B91C1C]">
              {error}
            </div>
          )}
        </aside>

        <section className="min-h-[640px] rounded-lg border border-[#E8E8F0] bg-white p-4 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#F0ECFF] px-3 py-1 text-xs font-extrabold text-[#5B3FE8]">
              {activeSample.label}
            </span>
            <span className="rounded-full bg-[#E6FFF9] px-3 py-1 text-xs font-extrabold text-[#008F77]">
              {scenePlan.component.replace("Visualizer", "")}
            </span>
            <span className="rounded-full bg-[#FFF0F3] px-3 py-1 text-xs font-extrabold text-[#D83D64]">
              Mode: {scenePlan.interaction_mode}
            </span>
            <span className="ml-auto text-xs font-semibold text-[#64748B]">
              Step {visualInput.step_number} - {visualInput.topic.replace(/_/g, " ")}
            </span>
          </div>

          <VisualizerCanvas input={visualInput} scene={scenePlan} />
        </section>
      </div>
    </main>
  );
}
