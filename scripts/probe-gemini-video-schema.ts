import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;
console.log("Using API key starting with:", apiKey ? apiKey.substring(0, 6) + "..." : "NONE");

const ai = new GoogleGenAI({ apiKey });
const model = process.env.GEMINI_MODEL ?? "gemini-3.6-flash";

const schema = {
  type: "object",
  properties: {
    title: { type: "string" },
    lineCount: { type: "integer" },
  },
  required: ["title", "lineCount"],
};

async function main() {
  console.log("Using model:", model);
  try {
    const interaction = await ai.interactions.create({
      model,
      input: [
        { type: "text", text: "Give the video's title and how many spoken lines it has." },
        { type: "video", uri: "https://www.youtube.com/watch?v=jNQXAC9IVRw" },
      ],
      response_format: { type: "text", mime_type: "application/json", schema },
    });
    console.log("SUCCESS RAW:", interaction.output_text);
    console.log("SUCCESS PARSED:", JSON.parse(interaction.output_text ?? "{}"));
  } catch (e: unknown) {
    const err = e as { status?: number; statusCode?: number; message?: string; body?: unknown };
    console.error("PROBE ERROR STATUS:", err.status || err.statusCode);
    console.error("PROBE ERROR MESSAGE:", err.message);
    if (err.body) {
      console.error("PROBE ERROR BODY:", err.body);
    }
  }
}

main();
