"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { VisualizerCanvas } from "../../components/visualizer/VisualizerCanvas";

/* ─── Types ─────────────────────────────────────────────────────────── */

interface VisualStepInput {
  topic: string;
  step_number: number;
  socratic_question: string;
  math_state: string;
  target_concept: string;
  expected_student_focus: string;
  visual_type_expected: string;
  visual_goal: string;
}

interface SimpleScenePlan {
  component: string;
  scene_intent: string;
  highlight_focus: string;
  interaction_mode: string;
  student_instruction: string;
  correct_target: string;
  hint: string;
  success_feedback: string;
}

/* ─── Sample Data ───────────────────────────────────────────────────── */

const SAMPLE_INPUT: VisualStepInput = {
  topic: "persamaan_linear_satu_variabel",
  step_number: 1,
  socratic_question:
    "Bagian mana yang harus kita hilangkan dulu agar x lebih mudah ditemukan?",
  math_state: "2x + 3 = 11",
  target_concept: "mengisolasi variabel",
  expected_student_focus: "+3 di ruas kiri",
  visual_type_expected: "balance_scale",
  visual_goal:
    "Menunjukkan bahwa persamaan adalah dua sisi yang seimbang.",
};

const SAMPLE_SCENE: SimpleScenePlan = {
  component: "BalanceScaleVisualizer",
  scene_intent:
    "Menunjukkan bahwa 2x + 3 dan 11 adalah dua sisi yang seimbang.",
  highlight_focus: "+3 di ruas kiri",
  interaction_mode: "select",
  student_instruction:
    "Klik bagian yang perlu dihilangkan terlebih dahulu.",
  correct_target: "+3 di ruas kiri",
  hint: "Cari bagian yang menempel pada x tetapi bukan x.",
  success_feedback:
    "Benar, +3 adalah bagian yang perlu kita perhatikan agar x bisa dibuat sendirian.",
};

const ALL_SAMPLES: Record<string, { input: VisualStepInput; scene: SimpleScenePlan }> = {
  balance_scale: {
    input: SAMPLE_INPUT,
    scene: SAMPLE_SCENE,
  },
  fraction_bar: {
    input: {
      topic: "pecahan",
      step_number: 1,
      socratic_question: "Dari 4 bagian yang sama besar, berapa bagian yang diambil?",
      math_state: "3/4",
      target_concept: "makna pembilang dan penyebut",
      expected_student_focus: "angka 3 sebagai bagian yang diambil",
      visual_type_expected: "fraction_bar",
      visual_goal: "Menunjukkan bahwa 3/4 berarti 3 bagian dari 4 bagian sama besar.",
    },
    scene: {
      component: "FractionBarVisualizer",
      scene_intent: "Menunjukkan bahwa 3/4 berarti 3 bagian diambil dari 4 bagian yang sama besar.",
      highlight_focus: "3 bagian yang diambil",
      interaction_mode: "select",
      student_instruction: "Klik bagian-bagian yang diambil pada pecahan ini.",
      correct_target: "3 bagian yang diarsir",
      hint: "Perhatikan bagian yang warnanya berbeda dari keseluruhan batang.",
      success_feedback: "Benar, 3 bagian yang diambil menunjukkan pembilang dari pecahan 3/4.",
    },
  },
  number_line: {
    input: {
      topic: "bilangan_bulat",
      step_number: 1,
      socratic_question: "Di mana posisi bilangan -3 pada garis bilangan?",
      math_state: "-3",
      target_concept: "posisi bilangan negatif pada garis bilangan",
      expected_student_focus: "posisi -3 di sebelah kiri nol",
      visual_type_expected: "number_line",
      visual_goal: "Menunjukkan bahwa bilangan negatif berada di sebelah kiri nol.",
    },
    scene: {
      component: "NumberLineVisualizer",
      scene_intent: "Menunjukkan posisi -3 pada garis bilangan.",
      highlight_focus: "posisi -3 di sebelah kiri nol",
      interaction_mode: "select",
      student_instruction: "Klik posisi yang tepat untuk bilangan -3.",
      correct_target: "titik -3",
      hint: "Bilangan negatif selalu di sebelah kiri nol.",
      success_feedback: "Benar! -3 ada di sebelah kiri nol pada garis bilangan.",
    },
  },
  coordinate_plane: {
    input: {
      topic: "koordinat_cartesius",
      step_number: 1,
      socratic_question: "Bagaimana cara menemukan titik (2,3) di bidang koordinat?",
      math_state: "titik (2,3)",
      target_concept: "membaca koordinat x dan y",
      expected_student_focus: "gerak 2 ke kanan dan 3 ke atas",
      visual_type_expected: "coordinate_plane",
      visual_goal: "Menunjukkan bahwa koordinat (2,3) berarti 2 ke kanan lalu 3 ke atas.",
    },
    scene: {
      component: "CoordinatePlaneVisualizer",
      scene_intent: "Menunjukkan posisi titik (2,3) pada bidang koordinat.",
      highlight_focus: "gerak 2 ke kanan dan 3 ke atas",
      interaction_mode: "select",
      student_instruction: "Klik posisi titik (2,3) pada bidang koordinat.",
      correct_target: "titik (2,3)",
      hint: "Mulai dari titik nol, gerak ke kanan dulu baru ke atas.",
      success_feedback: "Benar! Titik (2,3) artinya 2 ke kanan dan 3 ke atas dari titik asal.",
    },
  },
  geometry_shape: {
    input: {
      topic: "bangun_datar",
      step_number: 1,
      socratic_question: "Bagian mana dari segitiga yang menjadi alas dan tingginya?",
      math_state: "segitiga dengan alas 8 cm dan tinggi 5 cm",
      target_concept: "luas segitiga",
      expected_student_focus: "alas dan tinggi segitiga",
      visual_type_expected: "geometry_shape",
      visual_goal: "Menunjukkan alas dan tinggi pada segitiga.",
    },
    scene: {
      component: "GeometryShapeVisualizer",
      scene_intent: "Menunjukkan alas dan tinggi pada segitiga.",
      highlight_focus: "alas dan tinggi segitiga",
      interaction_mode: "highlight",
      student_instruction: "Perhatikan bagian alas dan tinggi yang disorot.",
      correct_target: "alas dan tinggi segitiga",
      hint: "Alas di bawah, tinggi tegak lurus ke atas.",
      success_feedback: "Bagus! Alas dan tinggi segitiga sudah teridentifikasi.",
    },
  },
  area_model: {
    input: {
      topic: "perkalian",
      step_number: 1,
      socratic_question: "Berapa banyak kotak kecil yang terbentuk dari 3 × 4?",
      math_state: "3 × 4",
      target_concept: "perkalian sebagai susunan kotak",
      expected_student_focus: "susunan 3 baris dan 4 kolom",
      visual_type_expected: "area_model",
      visual_goal: "Menunjukkan bahwa 3 × 4 membentuk 12 kotak.",
    },
    scene: {
      component: "AreaModelVisualizer",
      scene_intent: "Menunjukkan bahwa 3 × 4 membentuk grid 3 baris × 4 kolom.",
      highlight_focus: "susunan 3 baris dan 4 kolom",
      interaction_mode: "highlight",
      student_instruction: "Hitung jumlah kotak yang terbentuk.",
      correct_target: "12 kotak",
      hint: "Hitung kotak per baris, lalu kalikan dengan jumlah baris.",
      success_feedback: "Benar! 3 × 4 = 12 kotak kecil.",
    },
  },
  angle_diagram: {
    input: {
      topic: "sudut",
      step_number: 1,
      socratic_question: "Berapa besar sudut yang terbentuk?",
      math_state: "sudut 60°",
      target_concept: "mengukur besar sudut",
      expected_student_focus: "busur sudut 60°",
      visual_type_expected: "angle_diagram",
      visual_goal: "Menunjukkan sudut 60° pada diagram.",
    },
    scene: {
      component: "AngleDiagramVisualizer",
      scene_intent: "Menunjukkan sudut 60° dengan jelas.",
      highlight_focus: "busur sudut 60°",
      interaction_mode: "slider",
      student_instruction: "Geser slider untuk membuat sudut yang tepat.",
      correct_target: "sudut 60°",
      hint: "Sudut lancip kurang dari 90°.",
      success_feedback: "Benar! Sudut 60° adalah sudut lancip.",
    },
  },
  bar_model: {
    input: {
      topic: "perbandingan",
      step_number: 1,
      socratic_question: "Jika perbandingan apel dan jeruk 2:3, mana yang lebih banyak?",
      math_state: "2:3",
      target_concept: "perbandingan dua besaran",
      expected_student_focus: "panjang batang perbandingan",
      visual_type_expected: "bar_model",
      visual_goal: "Menunjukkan perbandingan 2:3 secara visual.",
    },
    scene: {
      component: "BarModelVisualizer",
      scene_intent: "Menunjukkan perbandingan 2:3 dengan model batang.",
      highlight_focus: "panjang batang perbandingan",
      interaction_mode: "highlight",
      student_instruction: "Perhatikan batang mana yang lebih panjang.",
      correct_target: "batang jeruk (3 bagian)",
      hint: "Batang yang lebih panjang menunjukkan jumlah yang lebih banyak.",
      success_feedback: "Benar! Jeruk lebih banyak karena bagiannya 3, sedangkan apel 2.",
    },
  },
  table_pattern: {
    input: {
      topic: "pola_bilangan",
      step_number: 1,
      socratic_question: "Apa pola yang kamu lihat pada barisan ini?",
      math_state: "2, 4, 6, 8, ...",
      target_concept: "pola bilangan genap",
      expected_student_focus: "selisih antar bilangan",
      visual_type_expected: "table_pattern",
      visual_goal: "Menunjukkan pola kenaikan bilangan.",
    },
    scene: {
      component: "TablePatternVisualizer",
      scene_intent: "Menunjukkan pola kenaikan +2 pada barisan bilangan.",
      highlight_focus: "selisih antar bilangan",
      interaction_mode: "highlight",
      student_instruction: "Perhatikan selisih antara setiap dua bilangan berurutan.",
      correct_target: "selisih +2",
      hint: "Kurangi bilangan setelahnya dengan bilangan sebelumnya.",
      success_feedback: "Benar! Setiap bilangan naik 2 dari bilangan sebelumnya.",
    },
  },
  simple_chart: {
    input: {
      topic: "statistika",
      step_number: 1,
      socratic_question: "Data mana yang paling banyak muncul?",
      math_state: "data: 3, 5, 5, 7, 5, 8",
      target_concept: "modus data",
      expected_student_focus: "nilai yang paling sering muncul",
      visual_type_expected: "simple_chart",
      visual_goal: "Menunjukkan frekuensi setiap data.",
    },
    scene: {
      component: "SimpleChartVisualizer",
      scene_intent: "Menunjukkan frekuensi setiap nilai data.",
      highlight_focus: "batang tertinggi",
      interaction_mode: "select",
      student_instruction: "Klik batang yang paling tinggi.",
      correct_target: "batang angka 5",
      hint: "Cari batang yang paling tinggi di diagram.",
      success_feedback: "Benar! Angka 5 muncul paling sering (3 kali), jadi itu modusnya.",
    },
  },
  solid_shape: {
    input: {
      topic: "bangun_ruang",
      step_number: 1,
      socratic_question: "Berapa banyak rusuk pada balok?",
      math_state: "balok dengan p=5, l=3, t=4",
      target_concept: "unsur-unsur balok",
      expected_student_focus: "rusuk-rusuk balok",
      visual_type_expected: "solid_shape",
      visual_goal: "Menunjukkan rusuk-rusuk pada balok.",
    },
    scene: {
      component: "SolidShapeVisualizer",
      scene_intent: "Menunjukkan balok dan rusuk-rusuknya.",
      highlight_focus: "rusuk-rusuk balok",
      interaction_mode: "highlight",
      student_instruction: "Hitung jumlah rusuk yang disorot.",
      correct_target: "12 rusuk",
      hint: "Balok memiliki rusuk di atas, bawah, dan sisi tegak.",
      success_feedback: "Benar! Balok memiliki 12 rusuk.",
    },
  },
};

/* ─── Page ──────────────────────────────────────────────────────────── */

export default function VisualizerPage() {
  const [inputJson, setInputJson] = useState(
    JSON.stringify(SAMPLE_INPUT, null, 2)
  );
  const [sceneJson, setSceneJson] = useState(
    JSON.stringify(SAMPLE_SCENE, null, 2)
  );
  const [visualInput, setVisualInput] = useState<VisualStepInput>(SAMPLE_INPUT);
  const [scenePlan, setScenePlan] = useState<SimpleScenePlan>(SAMPLE_SCENE);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"input" | "scene">("input");

  const handleRender = useCallback(() => {
    try {
      const parsedInput = JSON.parse(inputJson) as VisualStepInput;
      const parsedScene = JSON.parse(sceneJson) as SimpleScenePlan;
      setVisualInput(parsedInput);
      setScenePlan(parsedScene);
      setError(null);
    } catch (e) {
      setError(`JSON Parse Error: ${(e as Error).message}`);
    }
  }, [inputJson, sceneJson]);

  const loadSample = useCallback((key: string) => {
    const sample = ALL_SAMPLES[key];
    if (sample) {
      setInputJson(JSON.stringify(sample.input, null, 2));
      setSceneJson(JSON.stringify(sample.scene, null, 2));
      setVisualInput(sample.input);
      setScenePlan(sample.scene);
      setError(null);
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#0f0f1a] text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center gap-4 bg-[#0f0f1a]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-sm font-bold shadow-lg shadow-violet-500/20">
            V
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">
              Math Visualizer
            </h1>
            <p className="text-xs text-white/40">
              Interactive Scene Renderer v1
            </p>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel — JSON Input */}
        <aside className="w-[440px] flex-shrink-0 border-r border-white/10 flex flex-col bg-[#12121f]">
          {/* Sample Selector */}
          <div className="p-3 border-b border-white/10">
            <p className="text-[10px] uppercase tracking-widest text-white/30 mb-2 font-semibold">
              Contoh Visual
            </p>
            <div className="flex flex-wrap gap-1.5">
              {Object.keys(ALL_SAMPLES).map((key) => (
                <button
                  key={key}
                  onClick={() => loadSample(key)}
                  className="px-2.5 py-1 text-[11px] rounded-lg bg-white/5 hover:bg-violet-500/20 hover:text-violet-300 transition-all border border-white/5 hover:border-violet-500/30"
                >
                  {key.replace(/_/g, " ")}
                </button>
              ))}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-white/10">
            <button
              onClick={() => setActiveTab("input")}
              className={`flex-1 py-2.5 text-xs font-semibold transition-all ${
                activeTab === "input"
                  ? "text-violet-400 border-b-2 border-violet-400 bg-violet-500/5"
                  : "text-white/40 hover:text-white/60"
              }`}
            >
              Visual Step JSON
            </button>
            <button
              onClick={() => setActiveTab("scene")}
              className={`flex-1 py-2.5 text-xs font-semibold transition-all ${
                activeTab === "scene"
                  ? "text-fuchsia-400 border-b-2 border-fuchsia-400 bg-fuchsia-500/5"
                  : "text-white/40 hover:text-white/60"
              }`}
            >
              Scene Plan JSON
            </button>
          </div>

          {/* Editor */}
          <div className="flex-1 overflow-hidden relative">
            <AnimatePresence mode="wait">
              {activeTab === "input" ? (
                <motion.textarea
                  key="input-editor"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                  className="absolute inset-0 w-full h-full bg-transparent text-[12px] font-mono text-emerald-300/90 p-4 resize-none outline-none leading-relaxed"
                  value={inputJson}
                  onChange={(e) => setInputJson(e.target.value)}
                  spellCheck={false}
                />
              ) : (
                <motion.textarea
                  key="scene-editor"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.15 }}
                  className="absolute inset-0 w-full h-full bg-transparent text-[12px] font-mono text-amber-300/90 p-4 resize-none outline-none leading-relaxed"
                  value={sceneJson}
                  onChange={(e) => setSceneJson(e.target.value)}
                  spellCheck={false}
                />
              )}
            </AnimatePresence>
          </div>

          {/* Render Button */}
          <div className="p-3 border-t border-white/10">
            {error && (
              <motion.p
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-400 text-[11px] mb-2 bg-red-500/10 rounded-lg px-3 py-2 border border-red-500/20"
              >
                {error}
              </motion.p>
            )}
            <button
              onClick={handleRender}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-sm font-bold hover:from-violet-500 hover:to-fuchsia-500 transition-all shadow-lg shadow-violet-500/20 hover:shadow-violet-500/40 active:scale-[0.98]"
            >
              🚀 Render Visualisasi
            </button>
          </div>
        </aside>

        {/* Right Panel — Visualization */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Scene Info Bar */}
          <div className="px-6 py-3 border-b border-white/10 bg-[#12121f]/50 flex items-center gap-4 flex-wrap">
            <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30">
              {scenePlan.component}
            </span>
            <span className="px-3 py-1 rounded-full text-[11px] bg-white/5 text-white/50 border border-white/10">
              Mode: {scenePlan.interaction_mode}
            </span>
            <span className="text-[11px] text-white/30 ml-auto">
              Step {visualInput.step_number} — {visualInput.topic.replace(/_/g, " ")}
            </span>
          </div>

          {/* Canvas */}
          <div className="flex-1 overflow-auto p-6">
            <VisualizerCanvas
              input={visualInput}
              scene={scenePlan}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
