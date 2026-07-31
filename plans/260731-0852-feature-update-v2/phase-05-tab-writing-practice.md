# Phase 05 — Tab "Viết lại câu" + Gemini Semantic Check API

**Effort:** 4h | **Priority:** P2 | **Status:** completed  
**Depends on:** Phase 02 (`writingPrompts` in DB), Phase 01 (`WritingPrompt` model)  
**Blocks:** Phase 07

---

## Goal

Interactive "Writing Practice" tab:
1. Show Vietnamese meaning → user types English sentence
2. On submit → call Gemini to semantically check if the answer is correct
3. Show pass/fail with explanation

**Architecture:** `writingPrompts` are pre-stored in DB (gen at ingest). Only the **check** call hits Gemini (interactive, user-triggered).

---

## Step 1: Create Gemini check API route `src/app/api/check-writing/route.ts` (NEW FILE)

```typescript
// path/to/src/app/api/check-writing/route.ts

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/require-auth";
import { ai, GEMINI_MODEL } from "@/lib/gemini/client";
import { z } from "zod";

const RequestSchema = z.object({
  referenceAnswer: z.string().min(1).max(500),
  userAnswer: z.string().min(1).max(500),
  viMeaning: z.string().min(1).max(300),
});

const CheckResultSchema = z.object({
  isCorrect: z.boolean(),
  score: z.number().int().min(0).max(100),
  feedback: z.string(),
  suggestion: z.string().optional(),
});

export async function POST(req: NextRequest) {
  await requireAuth();  // throws if not authenticated

  const body = await req.json();
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { referenceAnswer, userAnswer, viMeaning } = parsed.data;

  const prompt = buildCheckPrompt(viMeaning, referenceAnswer, userAnswer);

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
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
      },
    },
  });

  if (!response.text) {
    return NextResponse.json({ error: "AI check failed" }, { status: 500 });
  }

  const result = CheckResultSchema.parse(JSON.parse(response.text));
  return NextResponse.json(result);
}

function buildCheckPrompt(
  viMeaning: string,
  referenceAnswer: string,
  userAnswer: string
): string {
  return `You are an English language teacher evaluating a student's sentence writing exercise.

Vietnamese meaning shown to student: "${viMeaning}"
Reference correct answer: "${referenceAnswer}"
Student's answer: "${userAnswer}"

Evaluate the student's answer:
- isCorrect: true if the student's answer conveys the same meaning correctly (allow minor variations, different word choices that preserve meaning, contractions)
- score: 0-100 (100 = perfect, 70+ = acceptable, below 70 = needs improvement)
- feedback: one encouraging sentence explaining the result
- suggestion: only if isCorrect is false — provide the correct or improved version

Be lenient with: contractions, minor punctuation, British/American spelling differences.
Be strict with: wrong vocabulary, wrong tense, completely different meaning.`;
}
```

---

## Step 2: Create `src/components/lesson/tab-writing-practice.tsx` (NEW FILE, ~180 lines)

```tsx
// path/to/src/components/lesson/tab-writing-practice.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2, ChevronRight, RotateCcw } from "lucide-react";

interface WritingPromptData {
  id: string;
  orderIndex: number;
  viMeaning: string;
  enAnswer: string;  // Only used server-side for check, NOT shown to user
}

// We do NOT pass enAnswer to the client component!
// The check API receives it as the reference — but we never render it in the DOM.
interface WritingPromptClientData {
  id: string;
  orderIndex: number;
  viMeaning: string;
}

interface TabWritingPracticeProps {
  prompts: WritingPromptClientData[];
  lessonId: string;
}

type CheckState =
  | { status: "idle" }
  | { status: "checking" }
  | { status: "result"; isCorrect: boolean; score: number; feedback: string; suggestion?: string };

export function TabWritingPractice({ prompts, lessonId }: TabWritingPracticeProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [checkState, setCheckState] = useState<CheckState>({ status: "idle" });
  const [completedCount, setCompletedCount] = useState(0);

  const currentPrompt = prompts[currentIndex];
  const isLastPrompt = currentIndex === prompts.length - 1;

  // ... state handlers + JSX
  // Full implementation described below
}
```

### UI flow:
1. **Card showing:** progress counter (3/8), Vietnamese meaning in large text
2. **Input:** textarea for user to type English sentence
3. **Submit button** → calls `/api/check-writing` with `{ viMeaning, userAnswer }` and the `enAnswer` fetched from a server action
4. **Result state:** 
   - ✅ Green card: "Correct! Score: 95/100" + feedback
   - ❌ Red card: "Not quite. Score: 45/100" + feedback + suggestion shown
5. **Next button** → advances to next prompt, resets state
6. **Completion screen** when all done: shows score summary

### Security: the `enAnswer` reference

The `enAnswer` must NOT be rendered in the DOM (user can inspect). The check API call must receive it from a **Server Action**:

```typescript
// src/app/actions/check-writing-action.ts
"use server";

import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth/require-auth";

export async function getWritingPromptAnswer(promptId: string): Promise<string | null> {
  const session = await requireAuth();
  const prompt = await db.writingPrompt.findFirst({
    where: { id: promptId, lesson: { userId: session.userId } },
    select: { enAnswer: true },
  });
  return prompt?.enAnswer ?? null;
}
```

Client component calls `getWritingPromptAnswer(promptId)` ONLY at check time (not on mount). This ensures `enAnswer` is never in the browser DOM.

---

## Step 3: Update `lesson-tabs.tsx`

Add `"writing"` to `VALID_TABS`, add `writingTab` prop and trigger/content.

Tab label: `"Practice"` with icon `PenLine`.

---

## Step 4: Update `src/app/lessons/[id]/page.tsx`

Add `writingPrompts` to DB query (already added in Phase 04).

Map prompts for client — **exclude `enAnswer`**:
```typescript
const writingPromptsForTab = lesson.writingPrompts.map((wp) => ({
  id: wp.id,
  orderIndex: wp.orderIndex,
  viMeaning: wp.viMeaning,
  // enAnswer is NOT passed to client
}));
```

Pass `writingTab` to `LessonTabs`.

---

## Verification checklist

- [x] `/api/check-writing` returns 401 if not authenticated
- [x] `enAnswer` is NEVER rendered in browser DOM (inspect element check)
- [x] Correct answer gets `isCorrect: true`
- [x] Clearly wrong answer gets `isCorrect: false` with suggestion
- [x] Progress counter advances correctly
- [x] Completion screen shows after last prompt
- [x] Mobile layout works (textarea full-width, buttons accessible)
- [x] `npx tsc --noEmit` passes

---

## Risk

**MEDIUM** — Gemini check call adds latency per submit (~1-2s). UX must show loading state clearly.  
**Security concern handled:** `enAnswer` served only through authenticated Server Action, never in DOM.
