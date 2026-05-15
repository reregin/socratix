import Groq from "groq-sdk";

const SYSTEM_PROMPT = `You are a Math Visualization Planner for Indonesian middle school students.

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
}`;

const FALLBACK_SCENE = {
  component: "GeometryShapeVisualizer",
  scene_intent: "Menampilkan visual sederhana sesuai langkah soal.",
  highlight_focus: "bagian penting pada langkah ini",
  interaction_mode: "highlight",
  student_instruction: "Perhatikan bagian yang disorot.",
  correct_target: "bagian yang disorot",
  hint: "Coba baca kembali pertanyaannya dan perhatikan bagian yang disorot.",
  success_feedback: "Bagus, kamu sudah memperhatikan bagian pentingnya.",
};

export async function POST(req: Request) {
  try {
    const input = await req.json();

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.warn("GROQ_API_KEY not set — returning fallback");
      return Response.json(FALLBACK_SCENE);
    }

    const groq = new Groq({ apiKey });

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Visual Step JSON:\n${JSON.stringify(input, null, 2)}`,
        },
      ],
      model: "openai/gpt-oss-120b",
      temperature: 0.7,
      max_tokens: 1024,
      response_format: { type: "json_object" },
    });

    const content = chatCompletion.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(content);

    // Basic validation
    if (parsed.component && parsed.scene_intent && parsed.interaction_mode) {
      return Response.json(parsed);
    }

    console.warn("LLM output missing required fields — using fallback");
    return Response.json(FALLBACK_SCENE);
  } catch (error) {
    console.error("Visualizer API error:", error);
    return Response.json(FALLBACK_SCENE);
  }
}
