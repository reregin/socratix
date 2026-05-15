# VISUALIZATION_AGENT_RULE.md

## 1. Tujuan Sistem

Math Visualizer Agent v1 bertugas membuat rencana visualisasi untuk pembelajaran matematika SMP berbasis Socratic.

Fokus agent ini **bukan menyelesaikan soal**, tetapi membuat visualisasi yang mendukung setiap step pertanyaan Socratic.

Visualizer harus:

- sederhana
- interaktif
- playful
- cocok untuk anak SMP
- tidak langsung membocorkan jawaban akhir
- membantu siswa memahami satu konsep per step

Prinsip utama:

```txt
1 step = 1 konsep = 1 fokus visual
```

---

## 2. Input dari Agent Sebelumnya

Math Visualizer Agent menerima JSON dari agent sebelumnya.

### Input schema

```json
{
  "topic": "",
  "step_number": 1,
  "socratic_question": "",
  "math_state": "",
  "target_concept": "",
  "expected_student_focus": "",
  "visual_type_expected": "",
  "visual_goal": ""
}
```

### Contoh input

```json
{
  "topic": "persamaan_linear_satu_variabel",
  "step_number": 1,
  "socratic_question": "Bagian mana yang harus kita hilangkan dulu agar x lebih mudah ditemukan?",
  "math_state": "2x + 3 = 11",
  "target_concept": "mengisolasi variabel",
  "expected_student_focus": "+3 di ruas kiri",
  "visual_type_expected": "balance_scale",
  "visual_goal": "Menunjukkan bahwa persamaan adalah dua sisi yang seimbang."
}
```

---

## 3. Penjelasan Field Input

### `topic`

Topik matematika SMP.

Contoh:

```txt
persamaan_linear_satu_variabel
pecahan
perbandingan
koordinat_cartesius
gradien
bangun_datar
bangun_ruang
sudut
pola_bilangan
statistika
```

### `step_number`

Nomor step Socratic.

Satu JSON berarti satu step visualisasi.

### `socratic_question`

Pertanyaan Socratic yang sedang diberikan ke siswa.

Visualizer harus mendukung pertanyaan ini.

### `math_state`

Keadaan matematika saat ini.

Contoh:

```txt
2x + 3 = 11
3/4
titik (2,3)
garis melalui titik (0,0) dan (1,2)
segitiga dengan alas 8 cm dan tinggi 5 cm
```

### `target_concept`

Konsep utama yang ingin dipahami siswa.

Contoh:

```txt
mengisolasi variabel
operasi yang sama pada kedua ruas
makna pembilang dan penyebut
membaca koordinat x dan y
gradien sebagai perubahan vertikal dibagi horizontal
luas sebagai jumlah satuan persegi
```

### `expected_student_focus`

Bagian yang harus diperhatikan siswa.

Contoh:

```txt
+3 di ruas kiri
kedua ruas persamaan
angka 3 sebagai pembilang
gerak 2 ke kanan dan 3 ke atas
alas dan tinggi segitiga
```

### `visual_type_expected`

Jenis visual yang diharapkan.

Allowed visual types:

```txt
balance_scale
number_line
fraction_bar
area_model
coordinate_plane
geometry_shape
angle_diagram
bar_model
table_pattern
solid_shape
simple_chart
```

### `visual_goal`

Tujuan visualisasi pada step tersebut.

Contoh:

```txt
Menunjukkan bahwa persamaan adalah dua sisi yang seimbang.
Menunjukkan bahwa 3/4 berarti 3 bagian dari 4 bagian sama besar.
Menunjukkan bahwa koordinat (2,3) berarti 2 ke kanan lalu 3 ke atas.
```

---

## 4. Output dari Math Visualizer Agent v1

Untuk v1, output dibuat sederhana agar stabil dengan Llama 3.3 70B.

Agent tidak perlu membuat detail SVG, koordinat, object ID, atau nested render props.

Agent hanya membuat **Simple Scene Plan**.

### Output schema

```json
{
  "component": "",
  "scene_intent": "",
  "highlight_focus": "",
  "interaction_mode": "",
  "student_instruction": "",
  "correct_target": "",
  "hint": "",
  "success_feedback": ""
}
```

### Contoh output

```json
{
  "component": "BalanceScaleVisualizer",
  "scene_intent": "Menunjukkan bahwa 2x + 3 dan 11 adalah dua sisi yang seimbang.",
  "highlight_focus": "+3 di ruas kiri",
  "interaction_mode": "select",
  "student_instruction": "Klik bagian yang perlu dihilangkan terlebih dahulu.",
  "correct_target": "+3 di ruas kiri",
  "hint": "Cari bagian yang menempel pada x tetapi bukan x.",
  "success_feedback": "Benar, +3 adalah bagian yang perlu kita perhatikan agar x bisa dibuat sendirian."
}
```

---

## 5. Penjelasan Field Output

### `component`

Komponen frontend yang harus digunakan.

Allowed components:

```txt
BalanceScaleVisualizer
NumberLineVisualizer
FractionBarVisualizer
AreaModelVisualizer
CoordinatePlaneVisualizer
GeometryShapeVisualizer
AngleDiagramVisualizer
BarModelVisualizer
TablePatternVisualizer
SolidShapeVisualizer
SimpleChartVisualizer
```

Mapping umum:

| `visual_type_expected` | `component` |
|---|---|
| `balance_scale` | `BalanceScaleVisualizer` |
| `number_line` | `NumberLineVisualizer` |
| `fraction_bar` | `FractionBarVisualizer` |
| `area_model` | `AreaModelVisualizer` |
| `coordinate_plane` | `CoordinatePlaneVisualizer` |
| `geometry_shape` | `GeometryShapeVisualizer` |
| `angle_diagram` | `AngleDiagramVisualizer` |
| `bar_model` | `BarModelVisualizer` |
| `table_pattern` | `TablePatternVisualizer` |
| `solid_shape` | `SolidShapeVisualizer` |
| `simple_chart` | `SimpleChartVisualizer` |

### `scene_intent`

Tujuan singkat scene visual.

Ini menjelaskan apa yang ingin divisualkan, bukan jawaban akhir.

### `highlight_focus`

Bagian yang perlu disorot di visual.

Biasanya diambil dari:

```json
{
  "expected_student_focus": ""
}
```

### `interaction_mode`

Mode interaksi siswa.

Allowed interaction modes:

```txt
none
highlight
select
drag
slider
construct
```

Penjelasan:

| Mode | Fungsi |
|---|---|
| `none` | hanya menampilkan visual |
| `highlight` | menyorot bagian penting |
| `select` | siswa klik/tap bagian yang benar |
| `drag` | siswa drag objek |
| `slider` | siswa mengubah parameter |
| `construct` | siswa membangun/menempatkan sesuatu |

### `student_instruction`

Instruksi singkat untuk siswa.

Contoh:

```txt
Klik bagian yang perlu dihilangkan terlebih dahulu.
Geser titik ke posisi yang sesuai.
Ubah slider untuk melihat perubahan garis.
Susun blok untuk membentuk perbandingan yang benar.
```

### `correct_target`

Target benar dari interaksi.

Untuk v1, ini masih berupa string sederhana.

Contoh:

```txt
+3 di ruas kiri
titik (2,3)
3 bagian yang diarsir
alas segitiga
```

### `hint`

Petunjuk jika siswa salah atau bingung.

Hint tidak boleh langsung membocorkan jawaban final.

### `success_feedback`

Feedback ketika siswa benar.

Harus positif, singkat, dan sesuai level SMP.

---

## 6. Peran LLM

LLM digunakan sebagai **visual planning agent**.

LLM tidak boleh:

- membuat SVG
- membuat HTML
- membuat koordinat detail
- membuat komponen frontend bebas
- menyelesaikan soal sampai jawaban akhir
- membuat JSON terlalu nested
- membuat format di luar schema

LLM hanya boleh:

- memilih component
- menentukan fokus visual
- memilih interaction mode
- membuat instruksi siswa
- membuat hint
- membuat success feedback

---

## 7. Arsitektur v1

Alur sistem:

```txt
Socratic Agent
   ↓
Visual Step JSON
   ↓
Math Visualizer Agent / LLM
   ↓
Simple Scene Plan JSON
   ↓
Frontend Renderer
   ↓
Interactive Visual
```

Frontend menerima dua data:

```txt
1. Visual Step JSON asli
2. Simple Scene Plan dari Math Visualizer Agent
```

Frontend lalu melakukan parsing dan render detail.

---

## 8. Pembagian Tanggung Jawab

### LLM / Math Visualizer Agent

Bertugas:

```txt
- memahami step Socratic
- memilih component
- menentukan fokus visual
- menentukan interaction mode
- menulis instruksi
- menulis hint
- menulis feedback
```

### Frontend / Rule-based Renderer

Bertugas:

```txt
- parsing math_state
- membuat objek visual detail
- render SVG/component
- mengatur posisi objek
- menjalankan animasi
- memvalidasi interaksi siswa
- menampilkan feedback
```

Contoh:

Input:

```txt
math_state = "2x + 3 = 11"
component = "BalanceScaleVisualizer"
```

Frontend yang mengubah menjadi:

```txt
left side: 2 variable tiles + 3 unit tiles
right side: 11 unit tiles
highlight: +3 di ruas kiri
```

---

## 9. Strategi Visual

Untuk target SMP, visual harus:

```txt
playful
clean
modern
friendly
sederhana
tidak textbook-heavy
```

Visualizer tidak boleh menampilkan terlalu banyak konsep sekaligus.

---

## 10. 2D dan Pseudo-3D

Untuk v1:

```txt
80% visualisasi = 2D
20% visualisasi = pseudo-3D
```

Full 3D belum diperlukan.

Bangun ruang divisualkan dengan:

```txt
isometric 2D
jaring-jaring
layer volume
unit cube stack
```

Contoh untuk balok:

```txt
- solid view: balok isometric
- net view: jaring-jaring balok
- layer view: susunan kubus satuan untuk volume
```

---

## 11. Level Interaksi

Sistem akan mendukung 4 level interaksi.

### Level 1 — Highlight interaction

Menyorot bagian penting.

Contoh:

```txt
highlight +3 di ruas kiri
highlight pembilang
highlight alas segitiga
```

### Level 2 — Drag and drop interaction

Siswa bisa memindahkan objek.

Contoh:

```txt
drag unit block
drag titik koordinat
drag potongan pecahan
drag label sisi
```

### Level 3 — Slider interaction

Siswa mengubah parameter.

Contoh:

```txt
ubah nilai gradien
ubah besar sudut
ubah panjang/lebar
ubah jumlah bagian pecahan
```

### Level 4 — Construct interaction

Siswa membangun visual.

Contoh:

```txt
letakkan titik pada koordinat
susun fraction bar
buat garis dari dua titik
susun model rasio
susun jaring-jaring
```

---

## 12. Strategi Asset

Asset tidak dibuat sebagai gambar statis, tetapi sebagai **component system**.

Struktur asset:

```txt
Layer 1: Visual Primitives
Layer 2: Math Objects
Layer 3: Visual Scenes
Layer 4: Decorative Assets
```

### Layer 1 — Visual Primitives

Komponen dasar:

```txt
Point
Line
Arrow
Arc
Grid
Tile
Block
Label
HighlightRing
DimensionLine
ConnectorLine
```

### Layer 2 — Math Objects

Objek matematika yang punya makna:

```txt
VariableTile
UnitTile
FractionSegment
NumberLineTick
CoordinatePoint
AngleArc
ShapeSide
AreaCell
RatioBlock
CubeUnit
EquationSide
```

### Layer 3 — Visual Scenes

Scene utama:

```txt
BalanceScaleVisualizer
NumberLineVisualizer
FractionBarVisualizer
AreaModelVisualizer
CoordinatePlaneVisualizer
GeometryShapeVisualizer
AngleDiagramVisualizer
BarModelVisualizer
TablePatternVisualizer
SolidShapeVisualizer
SimpleChartVisualizer
```

### Layer 4 — Decorative Assets

Dekorasi opsional:

```txt
mascot
hint bubble
success badge
background pattern
small icon
confetti animation
```

Dekorasi tidak boleh mengganggu visual matematika.

---

## 13. Asset Core untuk MVP

Komponen asset awal yang disarankan:

```txt
VariableTile
UnitTile
BalanceScale
NumberLine
FractionBar
CoordinateGrid
PointMarker
LineGraph
PolygonShape
DimensionArrow
AngleArc
RatioBlock
IsometricCuboid
NetDiagram
HighlightRing
```

---

## 14. Tech Stack

Rekomendasi stack:

```txt
Next.js
React
TypeScript
Tailwind CSS
SVG
Framer Motion
Zod
KaTeX / MathJax
```

Opsional:

```txt
Recharts untuk statistik
React Three Fiber untuk full 3D di fase lanjut
Lottie untuk animasi dekoratif kecil
```

Untuk v1, gunakan **SVG-first**.

---

## 15. Validasi Schema

Output LLM harus divalidasi.

Contoh Zod schema:

```ts
import { z } from "zod";

export const SimpleScenePlanSchema = z.object({
  component: z.enum([
    "BalanceScaleVisualizer",
    "NumberLineVisualizer",
    "FractionBarVisualizer",
    "AreaModelVisualizer",
    "CoordinatePlaneVisualizer",
    "GeometryShapeVisualizer",
    "AngleDiagramVisualizer",
    "BarModelVisualizer",
    "TablePatternVisualizer",
    "SolidShapeVisualizer",
    "SimpleChartVisualizer"
  ]),
  scene_intent: z.string(),
  highlight_focus: z.string(),
  interaction_mode: z.enum([
    "none",
    "highlight",
    "select",
    "drag",
    "slider",
    "construct"
  ]),
  student_instruction: z.string(),
  correct_target: z.string(),
  hint: z.string(),
  success_feedback: z.string()
});
```

Jika output invalid, gunakan fallback.

---

## 16. Fallback Output

Jika LLM gagal menghasilkan JSON valid:

```json
{
  "component": "GeometryShapeVisualizer",
  "scene_intent": "Menampilkan visual sederhana sesuai langkah soal.",
  "highlight_focus": "bagian penting pada langkah ini",
  "interaction_mode": "highlight",
  "student_instruction": "Perhatikan bagian yang disorot.",
  "correct_target": "bagian yang disorot",
  "hint": "Coba baca kembali pertanyaannya dan perhatikan bagian yang disorot.",
  "success_feedback": "Bagus, kamu sudah memperhatikan bagian pentingnya."
}
```

---

## 17. Prompt untuk Llama 3.3 70B

Gunakan prompt berikut untuk agent:

```txt
You are a Math Visualization Planner for Indonesian middle school students.

Your task is to convert a Visual Step JSON into a Simple Scene Plan JSON.

Rules:
- Output JSON only.
- Do not solve the problem.
- Do not reveal the final answer.
- Use only the allowed component names.
- Use only the allowed interaction modes.
- Keep all text in Indonesian.
- Keep the scene simple and focused on one concept.
- Do not create SVG, HTML, coordinates, CSS, or detailed render objects.
- Do not add fields outside the required JSON shape.

Allowed components:
- BalanceScaleVisualizer
- NumberLineVisualizer
- FractionBarVisualizer
- AreaModelVisualizer
- CoordinatePlaneVisualizer
- GeometryShapeVisualizer
- AngleDiagramVisualizer
- BarModelVisualizer
- TablePatternVisualizer
- SolidShapeVisualizer
- SimpleChartVisualizer

Allowed interaction modes:
- none
- highlight
- select
- drag
- slider
- construct

Return exactly this JSON shape:
{
  "component": "",
  "scene_intent": "",
  "highlight_focus": "",
  "interaction_mode": "",
  "student_instruction": "",
  "correct_target": "",
  "hint": "",
  "success_feedback": ""
}
```

---

## 18. Contoh End-to-End

### Input

```json
{
  "topic": "pecahan",
  "step_number": 1,
  "socratic_question": "Dari 4 bagian yang sama besar, berapa bagian yang diambil?",
  "math_state": "3/4",
  "target_concept": "makna pembilang dan penyebut",
  "expected_student_focus": "angka 3 sebagai bagian yang diambil",
  "visual_type_expected": "fraction_bar",
  "visual_goal": "Menunjukkan bahwa 3/4 berarti 3 bagian dari 4 bagian sama besar."
}
```

### Output

```json
{
  "component": "FractionBarVisualizer",
  "scene_intent": "Menunjukkan bahwa 3/4 berarti 3 bagian diambil dari 4 bagian yang sama besar.",
  "highlight_focus": "3 bagian yang diambil",
  "interaction_mode": "select",
  "student_instruction": "Klik bagian-bagian yang diambil pada pecahan ini.",
  "correct_target": "3 bagian yang diarsir",
  "hint": "Perhatikan bagian yang warnanya berbeda dari keseluruhan batang.",
  "success_feedback": "Benar, 3 bagian yang diambil menunjukkan pembilang dari pecahan 3/4."
}
```

---

## 19. Prinsip untuk Agent Code

Agent code harus menjaga agar sistem:

```txt
simple
schema-based
deterministic after LLM
easy to validate
easy to fallback
```

Jangan membuat LLM menghasilkan visual detail terlalu kompleks.

Target v1:

```txt
LLM membuat rencana visual sederhana.
Frontend membuat render detail secara rule-based.
```

---

## 20. Kesimpulan Final

Math Visualizer Agent v1 bekerja seperti ini:

```txt
Input:
Visual Step JSON dari Socratic Agent

Process:
LLM membuat Simple Scene Plan dengan schema tetap

Output:
JSON sederhana berisi component, fokus visual, mode interaksi, instruksi, hint, dan feedback

Render:
Frontend membaca Simple Scene Plan + Visual Step JSON asli, lalu merender visual SVG interaktif
```

Fokus v1:

```txt
bukan visual sempurna,
tapi pipeline stabil dari step Socratic → rencana visual → visual interaktif sederhana.
```
