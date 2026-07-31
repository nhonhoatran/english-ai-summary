# Technical Journal: Phase 02 — Prompt & AI Layer Update

**Date:** 2026-07-31  
**Author:** Antigravity  
**Commit:** `4f08d88`  
**Topic:** Implementation of Phase 02 AI Prompt and Schema Layer for V2 Features  

---

## 🎯 Objectives & Achievements

In this phase, we updated the Gemini prompt structure and all associated Zod schemas, OpenAPI response schemas, TypeScript types, and ingestion persistence logic to support four core new V2 capabilities:
1. Short video AI Summary generation.
2. IPA / Pinyin phonetic transcriptions per vocabulary item.
3. Sentence-writing practice prompts (`viMeaning`, `enAnswer`).
4. Language-aware prompt preamble for English and Chinese lessons (`targetLanguage`).

## 🛠️ Changes Implemented

- **Prompt Layer (`src/lib/gemini/prompt-lesson-analysis.ts`)**:
  - Added `writingPromptCount?: number` and `targetLanguage?: "english" | "chinese"` to `LessonAnalysisOptions`.
  - Added dynamic language preamble (`langLabel`, `ipaLabel`, `ipaExample`).
  - Added `ipa` field specification under Vocabulary section.
  - Added Section 6 (SUMMARY) and Section 7 (WRITING PROMPTS) to prompt template.

- **Schema & Type Layer (`src/lib/gemini/lesson-schemas.ts`)**:
  - Updated `vocabItemSchema` to include optional `ipa`.
  - Created `writingPromptSchema` (`viMeaning`, `enAnswer`).
  - Updated `lessonAnalysisSchema` with `summary` and `writingPrompts`.
  - Updated `getLessonAnalysisJsonSchema()` for Gemini structured output.

- **Generator Layer (`src/lib/gemini/generate-lesson.ts`)**:
  - Extended `GeneratedLesson` interface and return mapping.

- **Ingestion & Persistence (`src/lib/ingest/ingest-lesson.ts`)**:
  - Added `writingPrompt.deleteMany` to atomic transaction.
  - Persisted `summary`, `targetLanguage`, `ipa`, and `writingPrompts` rows.

- **Test Fixtures & Verification**:
  - Updated `validGeneratedLessonFixture` and `lesson-schemas.test.ts`.
  - Migrated test DB schema (`english_summary_test`) via `prisma migrate reset --force`.
  - Executed `tsc --noEmit` (0 type errors) and `vitest run` (55/55 tests passed).

---

## 🔒 Verification & Compliance
- **Rule Compliance**: Avoided `prisma db push`, created standard Prisma migration in Phase 01 and deployed via `migrate reset` on test database.
- **Git Push**: Pushed directly to `origin/main` (`git@github-nhonhoa:nhonhoatran/english-ai-summary.git`).
