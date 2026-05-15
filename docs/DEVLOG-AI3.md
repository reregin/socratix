# DEVLOG AI3

## The Change
- Membangun `VisualizerService` (Agent #4) beserta skema validasi Zod (`visualizer.schema.ts`), controller untuk testing standalone (`visualizer.controller.ts`), dan unit tests.
- Service visualizer ini mematuhi struktur agen NestJS lainnya, menerima sebuah prompt dan mengembalikan representasi `SceneDescriptor` berformat JSON.
- Membuat halaman HTML standalone untuk pengujian 3D di `apps/backend/scratch/test-visualizer.html` menggunakan Three.js untuk secara visual merepresentasikan deskriptor adegan (BalanceScale, NumberLine, dll).
- Untuk saat ini `VisualizerService` memanggil model Groq (konsisten dengan agen lain) menggunakan output terstruktur JSON dari Vercel AI SDK.

## The Reasoning
- Sesuai dengan spesifikasi pada `docs/PIPELINE.md` (Phase 5a) di mana Visualizer berada di antara Prompt Builder dan Response Generator.
- Menggunakan Groq alih-alih Gemini Flash-Lite untuk sementara demi konsistensi dengan implementasi dari agen-agen yang sudah lebih dulu dibuat.
- Pembuatan halaman standalone sangat penting agar visualisasi 3D environment dapat dikerjakan secara independen dan dieksplorasi (secara statis, dengan rotasi dan scale) tanpa harus memblokir atau menunggu antarmuka utama frontend.

## The Tech Debt
- Endpoint `/api/visualizer/generate` saat ini bersifat mock dan terbuka tanpa guard; endpoint ini harusnya dihapus jika fungsionalitas sudah terhubung di Pipeline utuh atau hanya disimpan pada saat development mode saja.
- Model 3D pada `test-visualizer.html` masih bergantung pada library dari CDN. Di fase deployment, library-library ini sebaiknya dibundel lewat Next.js / Vite untuk performa yang optimal.
- File `src/generated/prisma/client.ts` di-patch manual untuk menghapus `import.meta.url` — ini akan tertimpa jika `prisma generate` dijalankan ulang. Perlu solusi permanen (misalnya custom generator atau post-generate script).

---

## 2026-04-27 — Bug Fixes: Server Startup & Visualizer Connection

## The Change
- **Prisma ESM/CJS fix**: Menghapus `import.meta.url` dari `src/generated/prisma/client.ts` karena NestJS mengkompilasi ke CJS, sedangkan `import.meta.url` adalah sintaks ESM-only yang menyebabkan `ReferenceError: exports is not defined in ES module scope` pada Node 22.
- **Zod v4 fix**: Mengubah `z.record(z.unknown())` menjadi `z.record(z.string(), z.unknown())` di `visualizer.schema.ts` karena Zod v4 membutuhkan 2 argumen untuk `z.record()`.
- **TypeScript fix**: Menambahkan type annotation `string[]` pada `math-validator.service.ts` line 262 untuk mengatasi inferensi `never[]`.
- **DB/Redis graceful fallback**: Mengubah `redis.provider.ts` dan `prisma.service.ts` agar tidak crash saat `REDIS_URL` / `DATABASE_URL` kosong. Server kini bisa boot tanpa database untuk testing agent yang tidak butuh DB.
- **Static file serving**: Menambahkan `app.useStaticAssets()` di `main.ts` agar `test-visualizer.html` bisa diakses via `http://localhost:3000/test-visualizer.html`.
- **CORS**: Mengaktifkan CORS di `main.ts` untuk cross-origin testing.
- **Build exclusion**: Mengecualikan `src/generated` dari `tsconfig.build.json` dan menambahkan NestJS asset copy rule di `nest-cli.json`.

## The Reasoning
- Error Prisma adalah konflik pre-existing antara Prisma v7 (yang generate ESM code) dan NestJS (yang kompilasi ke CJS). Solusi minimal: hapus `import.meta.url` karena `__dirname` sudah tersedia di CJS.
- Membuat DB/Redis graceful fallback agar developer bisa menjalankan `npm run start:dev` tanpa database/Redis — penting untuk testing agent-agent yang hanya butuh LLM API.

## The Tech Debt
- Patch `src/generated/prisma/client.ts` akan hilang jika `prisma generate` dijalankan ulang. Perlu post-generate script.
- `.env` dibuat dengan placeholder API key — user perlu mengisi `GROQ_API_KEY` yang valid agar LLM berfungsi.
- `prisma.service.ts` menggunakan dummy connection string saat `DATABASE_URL` kosong — ini akan menyebabkan error runtime jika ada query DB yang benar-benar dijalankan.

---

## 2026-05-15 — Refactor: Simple Scene Plan + Frontend Visualizer Page

### The Change
- **Backend Schema Refactor** (`visualizer.schema.ts`): Mengganti `SceneDescriptorSchema` (3D scene descriptor dengan nested objects: scene array, camera, lighting) menjadi `SimpleScenePlanSchema` flat JSON sesuai `VISUALIZATION_AGENT_RULE.md`. Output LLM kini hanya berisi: `component`, `scene_intent`, `highlight_focus`, `interaction_mode`, `student_instruction`, `correct_target`, `hint`, `success_feedback`. Juga menambahkan `VisualStepInputSchema` untuk validasi input dari Socratic Agent.
- **Backend Service Refactor** (`visualizer.service.ts`): Mengganti `generateScene()` dan `generateFromPrompt()` menjadi satu method `generateScenePlan(input: VisualStepInput)`. Prompt LLM mengikuti template dari Section 17 VISUALIZATION_AGENT_RULE.md. Fallback output sesuai Section 16.
- **Backend Controller Update** (`visualizer.controller.ts`): Endpoint `POST /api/visualizer/generate` kini menerima Visual Step JSON langsung dan mengembalikan Simple Scene Plan JSON.
- **Frontend Visualizer Page** (`app/visualizer/page.tsx`): Halaman baru di `/visualizer` dengan split-panel UI: JSON editor (tabs Visual Step JSON & Scene Plan JSON) di kiri, SVG visualization canvas di kanan. Tersedia 11 sample data buttons untuk semua jenis visualisasi.
- **VisualizerCanvas** (`components/visualizer/VisualizerCanvas.tsx`): Component wrapper yang menampilkan pertanyaan Socratic, instruksi siswa, tombol hint, area render SVG (dynamic component routing), dan feedback correct/wrong.
- **11 Scene Visualizers** (`components/visualizer/scenes/`): Semua komponen SVG sesuai VISUALIZATION_AGENT_RULE.md:
  1. `BalanceScaleVisualizer` — timbangan persamaan, tokenize math_state, select mode
  2. `NumberLineVisualizer` — garis bilangan dengan ticks, select/highlight mode
  3. `FractionBarVisualizer` — pecahan sebagai segmen batang, select mode
  4. `AreaModelVisualizer` — grid perkalian, highlight mode
  5. `CoordinatePlaneVisualizer` — bidang koordinat dengan guide lines, select mode
  6. `GeometryShapeVisualizer` — bangun datar (segitiga) dengan dimensi, highlight mode
  7. `AngleDiagramVisualizer` — diagram sudut dengan busur, slider mode
  8. `BarModelVisualizer` — model batang perbandingan, highlight mode
  9. `TablePatternVisualizer` — pola bilangan dengan difference arrows, highlight mode
  10. `SimpleChartVisualizer` — diagram frekuensi, select mode
  11. `SolidShapeVisualizer` — bangun ruang isometric 2D (balok), highlight mode

### The Reasoning
- Refactor dari 3D scene descriptor ke Simple Scene Plan mengikuti prinsip v1 di VISUALIZATION_AGENT_RULE.md: "LLM membuat rencana visual sederhana, Frontend membuat render detail secara rule-based."
- Pendekatan SVG-first (bukan Three.js) sesuai rekomendasi tech stack v1 di Section 14: "Untuk v1, gunakan SVG-first."
- Setiap visualizer melakukan parsing `math_state` secara rule-based di frontend — LLM tidak perlu membuat koordinat detail, SVG, atau HTML.
- Frontend menggunakan Framer Motion untuk animasi (sudah ada di dependencies) — smooth entrance animations dan interactive highlights.
- Halaman `/visualizer` berdiri sendiri agar bisa diuji secara independen tanpa pipeline backend berjalan.

### The Tech Debt
- Parsing `math_state` di setiap visualizer masih menggunakan regex sederhana — perlu di-robustify untuk edge cases (misal: persamaan multi-variabel, pecahan campuran, dsb).
- `GeometryShapeVisualizer` saat ini hanya mendukung segitiga — perlu ditambahkan support untuk persegi, lingkaran, dsb.
- Interaksi `drag` dan `construct` belum diimplementasikan di frontend — saat ini hanya `select`, `highlight`, dan `slider` yang berfungsi.
- Belum ada koneksi langsung antara halaman `/visualizer` dan backend API — input masih manual via JSON editor. Perlu integrasi ke pipeline utama.

---

## 2026-05-15 — Upgrade v2: Light Theme, Groq API, Enhanced Visualizations

### The Change
- **Light Theme Overhaul** (`globals.css`, `layout.tsx`): Dark developer theme diganti menjadi light pastel theme dengan warna playful (purple #7C5CFC, coral #FF6B8A, teal #00C9A7, amber #FFB946). Menambahkan Nunito font (rounded, kid-friendly), glassmorphism cards, speech bubble CSS, dan custom btn-playful.
- **Groq API Route** (`app/api/visualizer/route.ts`): Next.js API Route baru yang memanggil Groq SDK dengan model `openai/gpt-oss-120b`. Accepts Visual Step JSON → returns Scene Plan JSON. Fallback sesuai Section 16 jika LLM gagal.
- **Page Redesign** (`app/visualizer/page.tsx`): Centered layout (bukan split-panel), topic pill selector dengan 11 preset, smart input form (math_state + question), "Generate dengan AI" button, dev mode toggle.
- **VisualizerCanvas v2**: Speech bubble Socratic question, confetti effect on correct answer, animated emoji feedback (🎉/🤔), playful hint toggle.
- **Decorative Components**: `ConfettiEffect.tsx` (30-particle burst), `FeedbackBadge.tsx` (success/error badges with spring animations).
- **All 11 Scene Visualizers v2**: Upgraded dari flat dark ke vibrant light theme — gradient fills, drop shadows, rounded shapes, spring animations, playful colors per component.

### The Reasoning
- Light theme lebih sesuai untuk target audience (anak SMP) — warm, inviting, tidak intimidating.
- Groq API route di frontend (Next.js API Route) memungkinkan testing LLM langsung tanpa perlu NestJS backend running — faster iteration.
- Model `openai/gpt-oss-120b` dipilih karena user preference dan tersedia di Groq.
- Pre-baked sample scenes untuk semua 11 topic memastikan instant rendering saat topic switch — AI generation hanya untuk customization.
- Confetti + animated emojis memberikan positive reinforcement yang penting untuk engagement anak SMP.

### The Tech Debt
- `.env.local` dengan `GROQ_API_KEY` placeholder — user perlu isi sendiri.
- Parsing `math_state` di setiap visualizer masih regex sederhana.
- Interaksi `drag` dan `construct` belum diimplementasikan.
- KaTeX sudah di-install tapi belum digunakan di komponen — perlu integrasi untuk render math expressions yang lebih cantik.

---

## 2026-05-15 - Visualizer Polish + Chat Side-by-Side Testing

### The Change
- **Visualizer Page Polish** (`apps/frontend/app/visualizer/page.tsx`): Merombak halaman `/visualizer` menjadi layout light lab view dengan panel preset/input di kiri dan canvas preview besar di kanan. Label sample yang sebelumnya bergantung emoji dipindahkan ke teks bersih agar tidak rentan tampil mojibake/hitam/aneh di terminal/browser tertentu.
- **Shared Sample Data** (`apps/frontend/components/visualizer/sampleScenes.ts`): Memindahkan 11 sample Visual Step + Scene Plan ke modul reusable agar `/visualizer` dan `/chat` memakai source of truth yang sama.
- **Chat Side-by-Side Testing** (`apps/frontend/components/chat/ChatInterface.tsx`): Mengganti placeholder visualisasi chat dengan `VisualizerCanvas` asli di panel kanan. Chat sekarang memiliki selector sample visualizer dan inferensi sederhana dari input user untuk mengganti contoh visual secara otomatis.
- **Canvas Cleanup** (`apps/frontend/components/visualizer/VisualizerCanvas.tsx`, scene visualizer files, `ConfettiEffect.tsx`): Mengganti visible emoji/icon raw menjadi lucide icons atau teks biasa, membersihkan lint errors/warnings, dan memperbaiki confetti agar sesuai aturan React lint terbaru.

### The Reasoning
- Masalah tampilan gelap/jelek kemungkinan berasal dari kombinasi UI lama chat yang masih memakai palet beige/dark-blue, placeholder canvas, dan karakter emoji/mojibake yang tidak konsisten. Solusi dibuat dengan eksplisit memakai background light, border halus, dan token warna visualizer yang sama.
- Sample data dijadikan reusable supaya AI3 bisa mengetes agent visualizer langsung di `/visualizer` maupun side-by-side di `/chat` tanpa copy-paste besar di tiap halaman.
- Chat memakai renderer visualizer yang sama dengan lab page agar testing pipeline visual bukan sekadar placeholder.

### The Tech Debt
- Panel visualizer di chat masih memakai sample lokal, belum menerima Scene Plan real dari pipeline chat backend.
- Inferensi topik dari input chat masih rule-based sederhana; nanti sebaiknya diganti dengan output VisualizerService/Pipeline.
- `next build` sempat gagal karena file `.next/app-path-routes-manifest.json` terkunci di Windows, kemungkinan karena dev server localhost:3000 sedang aktif. `npm run lint` dan `npx tsc --noEmit` sudah lolos.
