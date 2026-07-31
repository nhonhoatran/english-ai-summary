# Phase 02 — Prompt & AI Layer Update

**Effort:** 4h | **Priority:** P1 | **Status:** completed  
**Depends on:** Phase 01  
**Blocks:** Phase 03, 04, 05, 06

---

## Goal

Update Gemini prompt and all related schemas/types to produce:
1. `summary` — short AI paragraph summarizing the video
2. `ipa` per vocab item — phonetic transcription (IPA for English, Pinyin for Chinese)
3. `writingPrompts` — array of `{ viMeaning, enAnswer }` for the Writing Practice tab
4. Language param — `targetLanguage` param flows into `LessonAnalysisOptions` and shapes the entire prompt

---

## Step 1: Update `LessonAnalysisOptions` in `prompt-lesson-analysis.ts`

```typescript
export interface LessonAnalysisOptions {
  grammarCount?: number;
  quizCount?: number;
  vocabCount?: number;
  dialogueCount?: number;
  writingPromptCount?: number;  // NEW — default 8
  targetLanguage?: "english" | "chinese";  // NEW — default "english"
}
```

---

## Step 2: Update `buildLessonAnalysisPrompt()` in `prompt-lesson-analysis.ts`

### Add language-aware preamble

```typescript
const isEnglish = (options?.targetLanguage ?? "english") === "english";
const langLabel = isEnglish ? "English" : "Chinese (Mandarin)";
const ipaLabel = isEnglish ? "IPA phonetic transcription (en-US)" : "Pinyin romanization";
const ipaExample = isEnglish ? "/teɪk ɒf/" : "nǐ hǎo";
```

### Replace preamble line
```
// OLD:
You are building an English lesson page...

// NEW (language-aware):
You are building a ${langLabel} lesson page in the exact style of elllo.org...
```

### Update `=== 4. VOCABULARY ===` section

Add `ipa` field instruction:
```
For each vocab item:
  - term: the word or phrase as used
  - meaning: short plain-English definition (under 15 words)
  - ipa: ${ipaLabel} for this term (e.g. "${ipaExample}"). Must be a valid phonetic notation string.
  - example: ONE new sentence using the term correctly
```

### Add `=== 6. SUMMARY ===` section

```
=== 6. SUMMARY ===
Write a concise summary of this video in 3-5 sentences. Include:
- What the speakers discuss (the main topic)
- 2-3 key points or themes covered
- Suggested English level for this content (A1/A2/B1/B2/C1/C2)
Write in plain English, friendly tone.
```

### Add `=== 7. WRITING PROMPTS ===` section

```
=== 7. WRITING PROMPTS ===
Create exactly ${writingPromptCount} sentence-writing exercises based on the transcript content.
Each exercise gives the learner a Vietnamese meaning, and the learner must write the English sentence.

For each:
  - viMeaning: the Vietnamese translation of the sentence (plain, natural Vietnamese)
  - enAnswer: the reference English sentence (short, natural, derivable from the transcript context)

Rules:
- Sentences should be SHORT (max 10 words) — learnable sentences, not paragraphs
- viMeaning must be natural Vietnamese, not literal word-for-word translation
- enAnswer must demonstrate the lesson's grammarTheme where possible
- Each enAnswer must be UNIQUE — no duplicate sentences
```

---

## Step 3: Update `lesson-schemas.ts`

### Update `vocabItemSchema`
```typescript
export const vocabItemSchema = z.object({
  term: z.string().min(1),
  meaning: z.string().min(1),
  ipa: z.string().optional(),     // NEW — nullable IPA/Pinyin
  example: z.string().min(1),
});
```

### Add `writingPromptSchema`
```typescript
export const writingPromptSchema = z.object({
  viMeaning: z.string().min(1),
  enAnswer: z.string().min(1),
});
```

### Update `lessonAnalysisSchema`
```typescript
export const lessonAnalysisSchema = z.object({
  // ...existing fields...
  summary: z.string().min(1),                    // NEW
  writingPrompts: z.array(writingPromptSchema).min(1),  // NEW
});
```

### Update `getLessonAnalysisJsonSchema()` to include:
- `vocabItems[].ipa` → `{ type: "string" }` (not required — optional field)
- `summary` → `{ type: "string" }` (required)
- `writingPrompts` → array of `{ viMeaning: string, enAnswer: string }` (required)

### Export new types
```typescript
export type WritingPrompt = z.infer<typeof writingPromptSchema>;
```

---

## Step 4: Update `generate-lesson.ts`

Add `summary` and `writingPrompts` to `GeneratedLesson`:
```typescript
export interface GeneratedLesson {
  transcript: TranscriptSegment[];
  title: string;
  description: string;
  grammarTheme: string;
  grammarPoints: GrammarPoint[];
  quizQuestions: QuizQuestion[];
  vocabItems: VocabItem[];          // VocabItem now has optional ipa
  dialogueLines: DialogueLine[];
  summary: string;                  // NEW
  writingPrompts: WritingPrompt[];  // NEW
}
```

Update `generateLesson()` return to extract `result.analysis.summary` and `result.analysis.writingPrompts`.

---

## Step 5: Update `ingest-lesson.ts`

### Pass `targetLanguage` from options into the DB write:
```typescript
await tx.lesson.update({
  where: { id: lessonId },
  data: {
    // ...existing...
    summary: generated.summary,                    // NEW
    targetLanguage: options?.targetLanguage ?? "english",  // NEW
    writingPrompts: {
      create: generated.writingPrompts.map((wp, idx) => ({
        orderIndex: idx + 1,
        viMeaning: wp.viMeaning,
        enAnswer: wp.enAnswer,
      })),
    },
    vocabItems: {
      create: generated.vocabItems.map((v, idx) => ({
        orderIndex: idx + 1,
        term: v.term,
        meaning: v.meaning,
        ipa: v.ipa ?? null,   // NEW
        example: v.example,
      })),
    },
  },
});
```

Also add `writingPrompts` to `deleteMany` list at the start of the transaction.

---

## Verification checklist

- [x] `npx tsc --noEmit` passes
- [x] Generate a test lesson (English) — check `summary` field is populated in DB
- [x] Check `writingPrompts` table has rows for the lesson
- [x] Check `vocabItems.ipa` is populated (may be null for some terms — that's ok)
- [x] Prompt length check: `buildLessonAnalysisPrompt()` output is under Gemini token limit

---

## Risk

**MEDIUM** — Largest change in this PR. Gemini may struggle with 7 sections in one prompt. Mitigation: if quality degrades, can split summary into a separate "Phase 02b" call with its own strategy. Monitor first.
