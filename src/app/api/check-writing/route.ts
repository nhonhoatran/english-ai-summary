import { NextRequest, NextResponse } from "next/server";
import type { Schema } from "@google/genai";
import { requireAuth } from "@/lib/auth/require-auth";
import { ai, GEMINI_MODEL } from "@/lib/gemini/client";
import { db } from "@/lib/db";
import { z } from "zod";
import { resolvePracticeAccess } from "@/lib/practice/practice-access";
import { savePracticeAttempt } from "@/lib/practice/practice-attempts";
import { emitToRoom } from "@/lib/realtime/emit-to-room";

const RequestSchema = z.object({
  promptId: z.string().optional(),
  referenceAnswer: z.string().max(500).optional(),
  userAnswer: z.string().min(1).max(500),
  viMeaning: z.string().max(300).optional(),
});

const CheckResultSchema = z.object({
  isCorrect: z.boolean(),
  score: z.number().int().min(0).max(100),
  feedback: z.string(),
  suggestion: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();

    const body = await req.json();
    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
    }

    let referenceAnswer = parsed.data.referenceAnswer;
    let viMeaning = parsed.data.viMeaning;
    let targetLanguage = "english";

    // Set when the answer belongs to a stored prompt, so it can be persisted.
    let promptContext: {
      promptId: string;
      promptIndex: number;
      lessonId: string;
      classroomId: string | null;
      classroomCode: string | null;
      displayName: string;
    } | null = null;

    if (parsed.data.promptId) {
      const prompt = await db.writingPrompt.findUnique({
        where: { id: parsed.data.promptId },
        select: {
          id: true,
          orderIndex: true,
          enAnswer: true,
          viMeaning: true,
          lessonId: true,
        },
      });

      if (!prompt) {
        return NextResponse.json({ error: "Writing prompt not found" }, { status: 404 });
      }

      // Owner OR classroom member — not just the owner, otherwise students
      // cannot practise a lesson their host created.
      const access = await resolvePracticeAccess(prompt.lessonId, session.userId);
      if (!access) {
        return NextResponse.json(
          { error: "Bạn không có quyền luyện tập bài học này." },
          { status: 403 }
        );
      }

      referenceAnswer = prompt.enAnswer;
      viMeaning = prompt.viMeaning;
      targetLanguage = access.targetLanguage;
      promptContext = {
        promptId: prompt.id,
        promptIndex: prompt.orderIndex,
        lessonId: prompt.lessonId,
        classroomId: access.classroomId,
        classroomCode: access.classroomCode,
        displayName: access.displayName,
      };
    }

    if (!referenceAnswer || !viMeaning) {
      return NextResponse.json(
        { error: "Missing reference answer or Vietnamese meaning" },
        { status: 400 }
      );
    }

    const promptText = buildCheckPrompt(
      viMeaning,
      referenceAnswer,
      parsed.data.userAnswer,
      targetLanguage
    );

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: promptText,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            isCorrect: { type: "boolean" },
            score: { type: "integer" },
            feedback: { type: "string" },
            suggestion: { type: "string" },
          },
          required: ["isCorrect", "score", "feedback"],
          // Structurally identical to Gemini's Schema, but nominally distinct.
        } as unknown as Schema,
      },
    });

    if (!response.text) {
      return NextResponse.json({ error: "AI evaluation failed" }, { status: 500 });
    }

    const result = CheckResultSchema.parse(JSON.parse(response.text));

    // Persist so the learner resumes where they left off, and let the rest of
    // the class see the answer land in real time.
    if (promptContext) {
      const attempt = await savePracticeAttempt({
        lessonId: promptContext.lessonId,
        promptId: promptContext.promptId,
        promptIndex: promptContext.promptIndex,
        userId: session.userId,
        classroomId: promptContext.classroomId,
        displayName: promptContext.displayName,
        answer: parsed.data.userAnswer,
        isCorrect: result.isCorrect,
        score: result.score,
        feedback: result.feedback,
        suggestion: result.suggestion ?? null,
      });

      if (promptContext.classroomCode) {
        emitToRoom(promptContext.classroomCode, "practice-attempt", {
          lessonId: promptContext.lessonId,
          attempt,
        });
      }
    }

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    if (message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error in POST /api/check-writing:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function buildCheckPrompt(
  viMeaning: string,
  referenceAnswer: string,
  userAnswer: string,
  targetLanguage: string = "english"
): string {
  const langLabel = targetLanguage === "chinese" ? "Chinese (Mandarin)" : "English";
  return `You are a ${langLabel} language teacher evaluating a student's sentence writing exercise.

Vietnamese meaning shown to student: "${viMeaning}"
Reference correct answer: "${referenceAnswer}"
Student's answer: "${userAnswer}"

Evaluate the student's answer:
- isCorrect: true if the student's answer conveys the same meaning correctly (allow minor variations, different word choices that preserve meaning, contractions or equivalent phrasing)
- score: 0-100 (100 = perfect, 70+ = acceptable, below 70 = needs improvement)
- feedback: one encouraging sentence explaining the result in Vietnamese or English
- suggestion: only if isCorrect is false — provide the correct or improved version in ${langLabel}

Be lenient with: minor punctuation, spacing differences, Pinyin vs characters if applicable.
Be strict with: wrong vocabulary, wrong grammar/tense, completely different meaning.`;
}
