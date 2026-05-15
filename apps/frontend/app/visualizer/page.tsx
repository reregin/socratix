"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { VisualizerCanvas } from "../../components/visualizer/VisualizerCanvas";

interface VisualStepInput {
  topic: string; step_number: number; socratic_question: string; math_state: string;
  target_concept: string; expected_student_focus: string; visual_type_expected: string; visual_goal: string;
}

interface SimpleScenePlan {
  component: string; scene_intent: string; highlight_focus: string; interaction_mode: string;
  student_instruction: string; correct_target: string; hint: string; success_feedback: string;
}

const SAMPLES: Record<string, { label: string; input: VisualStepInput; scene: SimpleScenePlan }> = {
  balance_scale: {
    label: "⚖️ Persamaan Linear",
    input: { topic: "persamaan_linear_satu_variabel", step_number: 1, socratic_question: "Bagian mana yang harus kita hilangkan dulu agar x lebih mudah ditemukan?", math_state: "2x + 3 = 11", target_concept: "mengisolasi variabel", expected_student_focus: "+3 di ruas kiri", visual_type_expected: "balance_scale", visual_goal: "Menunjukkan bahwa persamaan adalah dua sisi yang seimbang." },
    scene: { component: "BalanceScaleVisualizer", scene_intent: "Menunjukkan bahwa 2x + 3 dan 11 adalah dua sisi yang seimbang.", highlight_focus: "+3 di ruas kiri", interaction_mode: "select", student_instruction: "Klik bagian yang perlu dihilangkan terlebih dahulu.", correct_target: "+3 di ruas kiri", hint: "Cari bagian yang menempel pada x tetapi bukan x.", success_feedback: "Benar, +3 adalah bagian yang perlu kita perhatikan agar x bisa dibuat sendirian." },
  },
  fraction_bar: {
    label: "🍕 Pecahan",
    input: { topic: "pecahan", step_number: 1, socratic_question: "Dari 4 bagian yang sama besar, berapa bagian yang diambil?", math_state: "3/4", target_concept: "makna pembilang dan penyebut", expected_student_focus: "angka 3 sebagai bagian yang diambil", visual_type_expected: "fraction_bar", visual_goal: "Menunjukkan bahwa 3/4 berarti 3 bagian dari 4 bagian sama besar." },
    scene: { component: "FractionBarVisualizer", scene_intent: "Menunjukkan bahwa 3/4 berarti 3 bagian diambil dari 4 bagian yang sama besar.", highlight_focus: "3 bagian yang diambil", interaction_mode: "select", student_instruction: "Klik bagian-bagian yang diambil pada pecahan ini.", correct_target: "3 bagian yang diarsir", hint: "Perhatikan bagian yang warnanya berbeda dari keseluruhan batang.", success_feedback: "Benar! 3 bagian yang diambil menunjukkan pembilang dari pecahan 3/4." },
  },
  number_line: {
    label: "📏 Bilangan Bulat",
    input: { topic: "bilangan_bulat", step_number: 1, socratic_question: "Di mana posisi bilangan -3 pada garis bilangan?", math_state: "-3", target_concept: "posisi bilangan negatif pada garis bilangan", expected_student_focus: "posisi -3 di sebelah kiri nol", visual_type_expected: "number_line", visual_goal: "Menunjukkan bahwa bilangan negatif berada di sebelah kiri nol." },
    scene: { component: "NumberLineVisualizer", scene_intent: "Menunjukkan posisi -3 pada garis bilangan.", highlight_focus: "posisi -3 di sebelah kiri nol", interaction_mode: "select", student_instruction: "Klik posisi yang tepat untuk bilangan -3.", correct_target: "titik -3", hint: "Bilangan negatif selalu di sebelah kiri nol.", success_feedback: "Benar! -3 ada di sebelah kiri nol pada garis bilangan." },
  },
  coordinate_plane: {
    label: "📍 Koordinat",
    input: { topic: "koordinat_cartesius", step_number: 1, socratic_question: "Bagaimana cara menemukan titik (2,3) di bidang koordinat?", math_state: "titik (2,3)", target_concept: "membaca koordinat x dan y", expected_student_focus: "gerak 2 ke kanan dan 3 ke atas", visual_type_expected: "coordinate_plane", visual_goal: "Menunjukkan bahwa koordinat (2,3) berarti 2 ke kanan lalu 3 ke atas." },
    scene: { component: "CoordinatePlaneVisualizer", scene_intent: "Menunjukkan posisi titik (2,3) pada bidang koordinat.", highlight_focus: "gerak 2 ke kanan dan 3 ke atas", interaction_mode: "select", student_instruction: "Klik posisi titik (2,3) pada bidang koordinat.", correct_target: "titik (2,3)", hint: "Mulai dari titik nol, gerak ke kanan dulu baru ke atas.", success_feedback: "Benar! Titik (2,3) artinya 2 ke kanan dan 3 ke atas dari titik asal." },
  },
  geometry_shape: {
    label: "📐 Bangun Datar",
    input: { topic: "bangun_datar", step_number: 1, socratic_question: "Bagian mana dari segitiga yang menjadi alas dan tingginya?", math_state: "segitiga dengan alas 8 cm dan tinggi 5 cm", target_concept: "luas segitiga", expected_student_focus: "alas dan tinggi segitiga", visual_type_expected: "geometry_shape", visual_goal: "Menunjukkan alas dan tinggi pada segitiga." },
    scene: { component: "GeometryShapeVisualizer", scene_intent: "Menunjukkan alas dan tinggi pada segitiga.", highlight_focus: "alas dan tinggi segitiga", interaction_mode: "highlight", student_instruction: "Perhatikan bagian alas dan tinggi yang disorot.", correct_target: "alas dan tinggi segitiga", hint: "Alas di bawah, tinggi tegak lurus ke atas.", success_feedback: "Bagus! Alas dan tinggi segitiga sudah teridentifikasi." },
  },
  area_model: {
    label: "🔢 Perkalian",
    input: { topic: "perkalian", step_number: 1, socratic_question: "Berapa banyak kotak kecil yang terbentuk dari 3 × 4?", math_state: "3 × 4", target_concept: "perkalian sebagai susunan kotak", expected_student_focus: "susunan 3 baris dan 4 kolom", visual_type_expected: "area_model", visual_goal: "Menunjukkan bahwa 3 × 4 membentuk 12 kotak." },
    scene: { component: "AreaModelVisualizer", scene_intent: "Menunjukkan bahwa 3 × 4 membentuk grid 3 baris × 4 kolom.", highlight_focus: "susunan 3 baris dan 4 kolom", interaction_mode: "highlight", student_instruction: "Hitung jumlah kotak yang terbentuk.", correct_target: "12 kotak", hint: "Hitung kotak per baris, lalu kalikan dengan jumlah baris.", success_feedback: "Benar! 3 × 4 = 12 kotak kecil." },
  },
  angle_diagram: {
    label: "✏️ Sudut",
    input: { topic: "sudut", step_number: 1, socratic_question: "Berapa besar sudut yang terbentuk?", math_state: "sudut 60°", target_concept: "mengukur besar sudut", expected_student_focus: "busur sudut 60°", visual_type_expected: "angle_diagram", visual_goal: "Menunjukkan sudut 60° pada diagram." },
    scene: { component: "AngleDiagramVisualizer", scene_intent: "Menunjukkan sudut 60° dengan jelas.", highlight_focus: "busur sudut 60°", interaction_mode: "slider", student_instruction: "Geser slider untuk membuat sudut yang tepat.", correct_target: "sudut 60°", hint: "Sudut lancip kurang dari 90°.", success_feedback: "Benar! Sudut 60° adalah sudut lancip." },
  },
  bar_model: {
    label: "⚖️ Perbandingan",
    input: { topic: "perbandingan", step_number: 1, socratic_question: "Jika perbandingan apel dan jeruk 2:3, mana yang lebih banyak?", math_state: "2:3", target_concept: "perbandingan dua besaran", expected_student_focus: "panjang batang perbandingan", visual_type_expected: "bar_model", visual_goal: "Menunjukkan perbandingan 2:3 secara visual." },
    scene: { component: "BarModelVisualizer", scene_intent: "Menunjukkan perbandingan 2:3 dengan model batang.", highlight_focus: "panjang batang perbandingan", interaction_mode: "highlight", student_instruction: "Perhatikan batang mana yang lebih panjang.", correct_target: "batang jeruk (3 bagian)", hint: "Batang yang lebih panjang menunjukkan jumlah yang lebih banyak.", success_feedback: "Benar! Jeruk lebih banyak karena bagiannya 3, sedangkan apel 2." },
  },
  table_pattern: {
    label: "🔄 Pola Bilangan",
    input: { topic: "pola_bilangan", step_number: 1, socratic_question: "Apa pola yang kamu lihat pada barisan ini?", math_state: "2, 4, 6, 8, ...", target_concept: "pola bilangan genap", expected_student_focus: "selisih antar bilangan", visual_type_expected: "table_pattern", visual_goal: "Menunjukkan pola kenaikan bilangan." },
    scene: { component: "TablePatternVisualizer", scene_intent: "Menunjukkan pola kenaikan +2 pada barisan bilangan.", highlight_focus: "selisih antar bilangan", interaction_mode: "highlight", student_instruction: "Perhatikan selisih antara setiap dua bilangan berurutan.", correct_target: "selisih +2", hint: "Kurangi bilangan setelahnya dengan bilangan sebelumnya.", success_feedback: "Benar! Setiap bilangan naik 2 dari bilangan sebelumnya." },
  },
  simple_chart: {
    label: "📊 Statistika",
    input: { topic: "statistika", step_number: 1, socratic_question: "Data mana yang paling banyak muncul?", math_state: "data: 3, 5, 5, 7, 5, 8", target_concept: "modus data", expected_student_focus: "nilai yang paling sering muncul", visual_type_expected: "simple_chart", visual_goal: "Menunjukkan frekuensi setiap data." },
    scene: { component: "SimpleChartVisualizer", scene_intent: "Menunjukkan frekuensi setiap nilai data.", highlight_focus: "batang tertinggi", interaction_mode: "select", student_instruction: "Klik batang yang paling tinggi.", correct_target: "batang angka 5", hint: "Cari batang yang paling tinggi di diagram.", success_feedback: "Benar! Angka 5 muncul paling sering (3 kali), jadi itu modusnya." },
  },
  solid_shape: {
    label: "📦 Bangun Ruang",
    input: { topic: "bangun_ruang", step_number: 1, socratic_question: "Berapa banyak rusuk pada balok?", math_state: "balok dengan p=5, l=3, t=4", target_concept: "unsur-unsur balok", expected_student_focus: "rusuk-rusuk balok", visual_type_expected: "solid_shape", visual_goal: "Menunjukkan rusuk-rusuk pada balok." },
    scene: { component: "SolidShapeVisualizer", scene_intent: "Menunjukkan balok dan rusuk-rusuknya.", highlight_focus: "rusuk-rusuk balok", interaction_mode: "highlight", student_instruction: "Hitung jumlah rusuk yang disorot.", correct_target: "12 rusuk", hint: "Balok memiliki rusuk di atas, bawah, dan sisi tegak.", success_feedback: "Benar! Balok memiliki 12 rusuk." },
  },
};

const DEFAULT_KEY = "balance_scale";

export default function VisualizerPage() {
  const [activeKey, setActiveKey] = useState(DEFAULT_KEY);
  const [visualInput, setVisualInput] = useState<VisualStepInput>(SAMPLES[DEFAULT_KEY].input);
  const [scenePlan, setScenePlan] = useState<SimpleScenePlan>(SAMPLES[DEFAULT_KEY].scene);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devMode, setDevMode] = useState(false);
  const [devInputJson, setDevInputJson] = useState(JSON.stringify(SAMPLES[DEFAULT_KEY].input, null, 2));
  const [devSceneJson, setDevSceneJson] = useState(JSON.stringify(SAMPLES[DEFAULT_KEY].scene, null, 2));
  const [mathState, setMathState] = useState(SAMPLES[DEFAULT_KEY].input.math_state);
  const [question, setQuestion] = useState(SAMPLES[DEFAULT_KEY].input.socratic_question);

  const loadSample = useCallback((key: string) => {
    const s = SAMPLES[key]; if (!s) return;
    setActiveKey(key);
    setVisualInput(s.input); setScenePlan(s.scene);
    setMathState(s.input.math_state); setQuestion(s.input.socratic_question);
    setDevInputJson(JSON.stringify(s.input, null, 2)); setDevSceneJson(JSON.stringify(s.scene, null, 2));
    setError(null);
  }, []);

  const generateWithAI = useCallback(async () => {
    setLoading(true); setError(null);
    const s = SAMPLES[activeKey];
    const input: VisualStepInput = { ...s.input, math_state: mathState, socratic_question: question };
    try {
      const res = await fetch("/api/visualizer", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
      const scene = await res.json();
      setVisualInput(input); setScenePlan(scene);
      setDevInputJson(JSON.stringify(input, null, 2)); setDevSceneJson(JSON.stringify(scene, null, 2));
    } catch (e) { setError((e as Error).message); }
    setLoading(false);
  }, [activeKey, mathState, question]);

  const handleDevRender = useCallback(() => {
    try { setVisualInput(JSON.parse(devInputJson)); setScenePlan(JSON.parse(devSceneJson)); setError(null); }
    catch (e) { setError(`JSON Error: ${(e as Error).message}`); }
  }, [devInputJson, devSceneJson]);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--background)" }}>
      {/* Header */}
      <header className="px-6 py-3 flex items-center gap-4 sticky top-0 z-40" style={{ background: "rgba(250,251,255,0.9)", backdropFilter: "blur(12px)", borderBottom: "1px solid var(--card-border)" }}>
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl shadow-md" style={{ background: "linear-gradient(135deg, var(--primary), #9f7afa)" }}>🧮</div>
        <div>
          <h1 className="text-lg font-extrabold" style={{ color: "var(--text-primary)" }}>Socratix Visualizer</h1>
          <p className="text-[11px] font-semibold" style={{ color: "var(--text-muted)" }}>Belajar Matematika dengan Visual Interaktif ✨</p>
        </div>
        <div className="ml-auto">
          <button onClick={() => setDevMode(!devMode)} className="px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all" style={{ background: devMode ? "var(--primary)" : "var(--primary-bg)", color: devMode ? "white" : "var(--primary)" }}>
            🛠 {devMode ? "Mode Siswa" : "Mode Dev"}
          </button>
        </div>
      </header>

      <div className="flex-1 max-w-5xl mx-auto w-full px-6 py-5 flex flex-col gap-5">
        {/* Topic Pills */}
        <div className="flex flex-wrap gap-2">
          {Object.entries(SAMPLES).map(([key, s]) => (
            <button key={key} onClick={() => loadSample(key)}
              className="px-3.5 py-2 rounded-2xl text-xs font-bold transition-all hover:scale-105 active:scale-95"
              style={{
                background: activeKey === key ? "var(--primary)" : "white",
                color: activeKey === key ? "white" : "var(--primary)",
                border: `1.5px solid ${activeKey === key ? "var(--primary)" : "var(--card-border)"}`,
                boxShadow: activeKey === key ? "0 4px 14px rgba(124,92,252,0.3)" : "0 1px 3px rgba(0,0,0,0.04)",
              }}>
              {s.label}
            </button>
          ))}
        </div>

        {/* Smart Input or Dev Mode */}
        <AnimatePresence mode="wait">
          {!devMode ? (
            <motion.div key="student" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="glass-card p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider mb-1 block" style={{ color: "var(--text-muted)" }}>Keadaan Matematika</label>
                  <input type="text" value={mathState} onChange={(e) => setMathState(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl text-sm font-mono font-bold outline-none focus:ring-2 focus:ring-[#7C5CFC]/30 transition-all"
                    style={{ border: "1.5px solid var(--card-border)", color: "var(--text-primary)", background: "white" }} />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider mb-1 block" style={{ color: "var(--text-muted)" }}>Pertanyaan Socratic</label>
                  <input type="text" value={question} onChange={(e) => setQuestion(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#7C5CFC]/30 transition-all"
                    style={{ border: "1.5px solid var(--card-border)", color: "var(--text-primary)", background: "white" }} />
                </div>
              </div>
              <button onClick={generateWithAI} disabled={loading}
                className="btn-playful mt-3 w-full flex items-center justify-center gap-2 disabled:opacity-60">
                {loading ? <><span className="animate-spin inline-block">⚡</span> AI sedang berpikir...</> : <>🤖 Generate dengan AI</>}
              </button>
              {error && <p className="mt-2 text-xs font-bold px-3 py-2 rounded-xl" style={{ background: "var(--danger-bg)", color: "var(--danger)" }}>{error}</p>}
            </motion.div>
          ) : (
            <motion.div key="dev" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="glass-card p-5">
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--primary)" }}>🛠 Mode Developer</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold mb-1 block" style={{ color: "var(--text-muted)" }}>Visual Step JSON</label>
                  <textarea value={devInputJson} onChange={(e) => setDevInputJson(e.target.value)}
                    className="w-full h-52 px-3 py-2 rounded-xl text-[11px] font-mono resize-none outline-none"
                    style={{ border: "1.5px solid var(--card-border)", color: "#059669", background: "#F0FDF4" }} spellCheck={false} />
                </div>
                <div>
                  <label className="text-[10px] font-bold mb-1 block" style={{ color: "var(--text-muted)" }}>Scene Plan JSON</label>
                  <textarea value={devSceneJson} onChange={(e) => setDevSceneJson(e.target.value)}
                    className="w-full h-52 px-3 py-2 rounded-xl text-[11px] font-mono resize-none outline-none"
                    style={{ border: "1.5px solid var(--card-border)", color: "#B45309", background: "var(--amber-bg)" }} spellCheck={false} />
                </div>
              </div>
              <button onClick={handleDevRender} className="btn-playful mt-3 w-full">🚀 Render</button>
              {error && <p className="mt-2 text-xs font-bold px-3 py-2 rounded-xl" style={{ background: "var(--danger-bg)", color: "var(--danger)" }}>{error}</p>}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Info bar */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="tag-primary">{scenePlan.component.replace("Visualizer", "")}</span>
          <span className="tag-secondary">Mode: {scenePlan.interaction_mode}</span>
          <span className="ml-auto text-[11px] font-semibold" style={{ color: "var(--text-muted)" }}>Step {visualInput.step_number} · {visualInput.topic.replace(/_/g, " ")}</span>
        </div>

        {/* Canvas */}
        <VisualizerCanvas input={visualInput} scene={scenePlan} />
      </div>
    </div>
  );
}
