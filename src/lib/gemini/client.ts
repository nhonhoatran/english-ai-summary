import "server-only";
import { GoogleGenAI } from "@google/genai";

export const ai = new GoogleGenAI({});

export const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-3.6-flash";
