import "server-only";
import { GoogleGenAI } from "@google/genai";
import { env } from "@/lib/env";

export const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

export const GEMINI_MODEL = env.GEMINI_MODEL ?? "gemini-3.6-flash";
