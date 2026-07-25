# Phase 03 — Gemini integration + THE PROBE + elllo-shaped prompts

## Context Links
- Plan overview: [plan.md](./plan.md)
- **Verified spec (source of truth for API shape + elllo format):** `plans\reports\verified-260725-1002-elllo-format-and-gemini-api.md`
- Reference lesson replicated: https://elllo.org/english/grammar/L2-03-MegTodd-Sandwich.htm
- Blocked by: [Phase 01](./phase-01-scaffold-nextjs-tailwind-shadcn.md)
- Blocks: [Phase 04](./phase-04-transcript-source-and-ingest-pipeline.md)

## Overview
- **Priority:** P1 — highest risk, highest value. Do this before building any UI.
- **Status:** completed
- **Effort:** 4h
- **Description:** Build the `lesson-generator` module: takes a YouTube URL (+ optional caption transcript) and returns a validated, elllo-shaped lesson object. Resolve the one blocking unknown (does video input + JSON schema work in a single call?) with a real probe, then hide the answer behind an interface so no caller depends on it.

## Key Insights

- **The researcher report's Gemini code is WRONG.** Do not copy it. Corrected shape, verified against official docs:
  ```ts
  import { GoogleGenAI } from "@google/genai";      // v2.13.0 (verified on npm)
  const ai = new GoogleGenAI({});                    // reads GEMINI_API_KEY from env
  const interaction = await ai.interactions.create({
    model: env.GEMINI_MODEL,
    input: [
      { type: "text", text: prompt },
      { type: "video", uri: youtubeUrl },            // no mimeType needed for YouTube
    ],
    response_format: { type: "text", mime_type: "application/json", schema },
  });
  const json = JSON.parse(interaction.output_text);
  ```
  **Banned in this codebase:** `models.generateContent`, `fileData`, `fileUri`, `generationConfig`, `responseSchema`, `SchemaType`, `vertexai: true`, `@google/generative-ai`. Grep for these before committing — any hit is the obsolete API.
- **THE BLOCKING UNKNOWN:** it is NOT confirmed that `response_format` (JSON schema) works in the same request as `{type:"video"}` input. Official docs never demonstrate the combination; the researcher's "yes" cited the obsolete API so it does not transfer. **Probe first, design second.**
- **Therefore: one abstraction boundary.** `generateLesson()` is the only exported entry point. Internally it dispatches to a 1-call or 2-call strategy. Callers (Phase 04 ingest) must never learn which. If the probe answer flips later, one file changes.
- **elllo grammar format is NOT "find 4 grammar points".** Verified: the entire lesson centers on **ONE dominant structure** (e.g. imperatives) and all 4 points elaborate facets of that single theme. A naive "list 4 grammar points" prompt produces 4 unrelated points and gets the format wrong. The prompt must force theme-selection first, then decomposition.
- **elllo grammar examples are INVENTED, not quoted.** Verified: for a sandwich-making lesson the examples are "Come here.", "Help me please.", "Please give me your passport." — generic, decontextualized. The prompt must explicitly forbid quoting the transcript, or the model will quote by default.
- **elllo quiz distractors are plausible in-domain terms from the same lesson** (bread/bacon/cheese/tomatoes), never random words. One question blanks a verb slot instead of a noun slot (Q5: "_____ the bread" → spread/toast/slice). Every answer is derivable from the transcript alone. Encode all three properties in the prompt.
- Video token cost (from docs): ~300 tokens/sec default resolution, ~100 tokens/sec low. A 20-min video ≈ 360k tokens default. User accepts cost, but prefer low media resolution for the transcription path since we need speech, not visual detail — cheaper AND faster with no quality loss for our purpose.
- If a caption transcript is available (Phase 04), the analysis call is **text-only** — no video tokens at all. That is the cheap common path; the video path is the fallback.

## Requirements

### Functional
- `generateLesson(input)` returns `{ title, description, grammarTheme, segments[], grammarPoints[], quizQuestions[], vocabItems[] }`, fully validated.
- Exactly 4 grammar points, each with exactly 4 examples.
- Exactly 5 quiz questions, each with exactly 3 options and a valid `correctIndex` in 0..2.
- Transcript segments carry `startSeconds` (int), `speaker`, `text`, in ascending time order.
- Works in two modes: (a) caption transcript supplied → text-only analysis; (b) no captions → video input, transcribe + analyze.
- Invalid/short model output is rejected with a descriptive error, never silently persisted.

### Non-functional
- Every file < 200 lines. Prompts live in their own files.
- Zod is the single source of truth for shape; the JSON Schema sent to Gemini derives from it (no hand-maintained duplicate).
- One retry on validation failure, then fail. No infinite retry loops (token burn without progress).
- No `console.log` of the API key or full prompt+response payloads in production paths.

## Architecture

### Module layout
```
src/lib/gemini/
  client.ts                  # GoogleGenAI singleton, model id from env
  lesson-schemas.ts          # Zod schemas + derived JSON Schema (the contract)
  prompt-lesson-analysis.ts  # the analysis prompt (grammar + quiz + vocab)
  prompt-transcription.ts    # the video->transcript prompt
  generate-lesson.ts         # PUBLIC: generateLesson(); strategy dispatch
  strategy-single-call.ts    # video + response_format in ONE call
  strategy-two-call.ts       # call 1 transcript (text), call 2 analysis (schema)
scripts/
  probe-gemini-video-schema.ts   # THE PROBE, run once, manually
```

### The abstraction boundary
```ts
// generate-lesson.ts — the ONLY thing Phase 04 imports
export type GenerateLessonInput =
  | { kind: "with-captions"; youtubeUrl: string; transcript: CaptionSegment[] }
  | { kind: "video-only";    youtubeUrl: string };

export async function generateLesson(input: GenerateLessonInput): Promise<GeneratedLesson>;
```
Dispatch rules:
- `with-captions` → always text-only analysis call. (No video tokens. Schema+text is documented and safe.)
- `video-only` → if probe said single-call works → `strategy-single-call`; else → `strategy-two-call`.

The probe result is recorded as a constant `GEMINI_SUPPORTS_VIDEO_WITH_SCHEMA` in `generate-lesson.ts` with a comment citing the probe date and output. Not an env var — it is a fact about the API, not a deployment setting.

### Data flow
```
youtubeUrl (+captions?)
  → prompt built from lesson-schemas + prompt-* files
  → ai.interactions.create({ input, response_format })
  → interaction.output_text
  → JSON.parse
  → Zod .parse  ← arity enforced HERE (4x4 grammar, 5x3 quiz)
  → GeneratedLesson  → Phase 04 persists
```
Validation is the gate. The DB cannot enforce array arity (Phase 02 risk table), so Zod is the only thing standing between a malformed model response and a broken lesson page.

## THE PROBE (do this first — step 1, before writing anything else)

`scripts/probe-gemini-video-schema.ts`, run manually with a real key against a short public video (use a 1–2 min video to keep the probe cheap):

```ts
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});
const schema = {
  type: "object",
  properties: {
    title: { type: "string" },
    lineCount: { type: "integer" },
  },
  required: ["title", "lineCount"],
};

async function main() {
  const interaction = await ai.interactions.create({
    model: process.env.GEMINI_MODEL ?? "gemini-3.6-flash",
    input: [
      { type: "text", text: "Give the video's title and how many spoken lines it has." },
      { type: "video", uri: "https://www.youtube.com/watch?v=<SHORT_PUBLIC_VIDEO>" },
    ],
    response_format: { type: "text", mime_type: "application/json", schema },
  });
  console.log("RAW:", interaction.output_text);
  console.log("PARSED:", JSON.parse(interaction.output_text));
}
main().catch((e) => { console.error("PROBE FAILED:", e); process.exit(1); });
```

Record in this file, under a `## Probe Result` heading appended at implementation time:
1. Did it return valid schema-conforming JSON? (yes → single-call path is live)
2. Exact model id that worked (docs show `gemini-3.6-flash`; confirm it exists on this key's tier — if not, try `gemini-2.5-flash` and record which).
3. Wall-clock latency for the short video (extrapolate for 20-min).
4. If it errored: the verbatim error message and code.

Also probe **latency for a realistic 20-min video** once, since "is `interactions.create` sync-blocking and how slow" is an open question that drives the Phase 04 UX (progress feedback vs simple spinner).

## The Prompts (highest-value artifact of this plan)

### `prompt-transcription.ts` — video → timestamped transcript
```
You are transcribing an English-learning video for a study website.

Produce a faithful, verbatim transcript of everything spoken.

Rules:
- One entry per speaker turn. A new entry every time the speaker changes.
- Label speakers with their real names if stated in the video; otherwise "Speaker 1", "Speaker 2".
- startSeconds = the integer second at which that turn begins.
- Transcribe EXACTLY what is said. Do NOT clean up grammar, do NOT fix mistakes,
  do NOT remove filler. Keep short backchannel turns as their own entries
  ("Yum.", "Yes.", "Mm-hmm.", "Right.").
- Do not add commentary, summaries, or stage directions.
```
(Faithfulness rule mirrors the verified finding: elllo keeps "Yum." / "Mm-hmm." as turns and preserves a speaker's actual grammatical error rather than correcting it.)

### `prompt-lesson-analysis.ts` — the elllo replicator
Sent with the transcript inline (text-only path) or alongside the video (single-call path).

```
You are building an English lesson page in the exact style of elllo.org, from the
conversation transcript below.

Produce FOUR things: lesson metadata, a grammar section, a quiz, and a vocabulary list.

=== 1. METADATA ===
- title: short, natural, describes the conversation topic (e.g. "Making a Sandwich").
- description: ONE sentence describing what the speakers talk about.

=== 2. GRAMMAR SECTION ===
This is the part most often done wrong. Read carefully.

STEP A - Pick ONE grammar structure. Scan the transcript and identify the single
grammatical structure that appears most often and most characteristically in it
(for example: imperatives, present perfect, comparatives, "used to", modals of
advice, past continuous). Name it in `grammarTheme`. Pick exactly ONE.
Do NOT pick four different unrelated grammar topics.

STEP B - Break that ONE structure into exactly 4 points. Each point teaches a
different facet of the SAME structure: its form, why/when it is used, a variation
or politeness form, and its negative or question form.

STEP C - For each point write:
  - explanation: ONE sentence, plain language, aimed at an intermediate learner.
  - examples: exactly 4 short example sentences.

CRITICAL RULE FOR EXAMPLES: The examples must be NEWLY INVENTED generic sentences.
Do NOT quote, copy, or lightly reword any line from the transcript. They should be
everyday sentences a textbook would use, unrelated to the transcript's topic.

Worked reference (a transcript about making a sandwich yielded the theme
"imperatives", and note how the examples have nothing to do with sandwiches):
  Point 1: The imperative is the base form of the verb. We use it to give
           instructions, commands or suggestions.
           - Come here.  - Help me please.  - Look at this.  - Don't do that!
  Point 2: The imperative does not have a subject because the subject is the listener.
           - Listen to me.  - Speak slower please.  - Stand over there.  - Open the door.
  Point 3: Add the word 'please' to make the commands more polite.
           - Please sit here.  - Please give me your passport.
           - Please spell your name for me.  - Please pay this amount.
  Point 4: The negative form of the imperative uses 'do not' or 'don't' plus the base verb.
           - Do not go there.  - Don't eat too much.  - Do not stay up too late.
           - Don't fall asleep.

=== 3. QUIZ ===
Exactly 5 gap-fill questions. Each has exactly 3 options labelled by position
(index 0, 1, 2) and exactly one correct answer.

Rules:
- Write each prompt as a short sentence with the missing word shown as "_______".
- Every answer MUST be derivable from the transcript alone - someone who listened
  can answer; someone who did not, cannot.
- Where possible, phrase the stems using the lesson's grammar theme, so the quiz
  tests the grammar AND comprehension at once.
- DISTRACTORS: the two wrong options must be plausible, in-domain words drawn from
  the same conversation - other things actually mentioned. Never random or
  obviously-wrong words.
- VARY THE BLANK: blank the object/noun in most questions, but make at least one
  question blank the VERB instead.
- A distractor may be a phrase rather than a single word (e.g. "both of them").

Worked reference (from the sandwich transcript):
  1) Spread the _______.                    0) bread  1) bacon   2) mayonnaise   [correct 2]
  2) Slice the _______.                     0) bread  1) cheese  2) tomatoes     [correct 2]
  3) Fry the _______.                       0) bread  1) bacon   2) both of them [correct 1]
  4) Cut the _______.                       0) bacon  1) bananas 2) bread        [correct 1]
  5) On both sandwiches, _____ the bread.   0) spread 1) toast   2) slice        [correct 1]
Note how 1-4 blank the noun and 5 blanks the verb, and how every option is a real
item from that conversation.

=== 4. VOCABULARY ===
Pick 6 to 10 words or phrases from the transcript that an intermediate English
learner would likely NOT know - prefer idioms, phrasal verbs, and collocations
over single easy nouns. For each:
  - term: the word or phrase as used in the conversation.
  - meaning: a short plain-English definition (under 15 words).
  - example: ONE new sentence using the term correctly, different from the
    transcript's sentence.

=== TRANSCRIPT ===
{transcript}
```

Transcript is injected as `MM:SS Speaker: text` lines — human-readable and gives the model timing context.

### Zod contract (`lesson-schemas.ts`)
```ts
import { z } from "zod";

export const transcriptSegmentSchema = z.object({
  startSeconds: z.number().int().min(0),
  speaker: z.string().min(1),
  text: z.string().min(1),
});

export const grammarPointSchema = z.object({
  explanation: z.string().min(1),
  examples: z.array(z.string().min(1)).length(4),   // exactly 4 - verified elllo format
});

export const quizQuestionSchema = z.object({
  prompt: z.string().min(1),
  options: z.array(z.string().min(1)).length(3),    // exactly 3 - a/b/c
  correctIndex: z.number().int().min(0).max(2),
});

export const vocabItemSchema = z.object({
  term: z.string().min(1),
  meaning: z.string().min(1),
  example: z.string().min(1),
});

export const lessonAnalysisSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  grammarTheme: z.string().min(1),
  grammarPoints: z.array(grammarPointSchema).length(4),   // exactly 4
  quizQuestions: z.array(quizQuestionSchema).length(5),   // exactly 5
  vocabItems: z.array(vocabItemSchema).min(6).max(10),
});
```
Derive the JSON Schema for `response_format` from these with `z.toJSONSchema()` (Zod 4) so there is exactly one definition. If the installed Zod lacks it, add `zod-to-json-schema`. Verify the emitted schema is accepted by the API — strip unsupported keywords (`$schema`, `additionalProperties`) if it rejects them, and note which in the probe result.

## Related Code Files

**Create:**
- `src/lib/gemini/client.ts`
- `src/lib/gemini/lesson-schemas.ts`
- `src/lib/gemini/prompt-transcription.ts`
- `src/lib/gemini/prompt-lesson-analysis.ts`
- `src/lib/gemini/generate-lesson.ts`
- `src/lib/gemini/strategy-single-call.ts`
- `src/lib/gemini/strategy-two-call.ts`
- `scripts/probe-gemini-video-schema.ts`

**Modify:**
- `package.json` — `pnpm add @google/genai@2.13.0`; add `"probe:gemini"` script.
- `.env.example` — already gains `GEMINI_MODEL` in Phase 01.

**Delete:** none.

## Implementation Steps

1. **Run the probe.** Write `scripts/probe-gemini-video-schema.ts`, run it against a short public video with the real key. Append a `## Probe Result` section to this file with the 4 recorded answers. **Do not proceed until this is answered** — it decides which strategy file is the live one.
2. Probe latency once with a ~20-min video; record wall-clock. Feeds Phase 04 UX.
3. `pnpm add @google/genai@2.13.0`.
4. Write `client.ts`: `new GoogleGenAI({})` singleton (reads `GEMINI_API_KEY` implicitly), model from `env.GEMINI_MODEL`. Server-only — add `import "server-only"` so an accidental client import fails at build, not in production.
5. Write `lesson-schemas.ts` (Zod + derived JSON Schema). Confirm the emitted JSON Schema is API-accepted.
6. Write the two prompt files, verbatim as above, exported as template functions.
7. Write `strategy-two-call.ts` — always safe, build it FIRST regardless of probe outcome (it is the fallback and also the caption path's analysis call).
8. Write `strategy-single-call.ts` — only wire it in if the probe said yes; otherwise leave it unexported with a comment citing the probe.
9. Write `generate-lesson.ts` with the dispatch + the `GEMINI_SUPPORTS_VIDEO_WITH_SCHEMA` constant + one retry on Zod failure (re-ask once, appending "Your previous response was invalid: <issues>. Return JSON matching the schema exactly.").
10. End-to-end manual check on ONE real elllo-like YouTube video. Print the result and eyeball against the verified format: is `grammarTheme` a single structure? Are the 16 examples free of transcript quotes? Are all 15 quiz options in-domain? If not, iterate on the prompt — this is expected, budget for 2–3 iterations.
11. Grep the whole `src/` for banned identifiers: `generateContent`, `fileData`, `generationConfig`, `SchemaType`, `vertexai`. Must be zero hits.
12. `pnpm typecheck`. Commit: `feat: add gemini lesson generator with elllo-format prompts`.

## Todo List
- [x] **Run the probe; record result in this file**
- [x] Record 20-min-video latency
- [x] `pnpm add @google/genai@2.13.0`
- [x] `client.ts` (+ `server-only`)
- [x] `lesson-schemas.ts` Zod + derived JSON Schema, API-accepted
- [x] `prompt-transcription.ts`
- [x] `prompt-lesson-analysis.ts`
- [x] `strategy-two-call.ts` (always)
- [x] `strategy-single-call.ts` (wire only if probe = yes)
- [x] `generate-lesson.ts` dispatch + single retry
- [x] Manual quality pass on a real video; iterate prompt
- [x] Grep for banned obsolete-API identifiers = 0 hits
- [x] `pnpm typecheck` green
- [x] Commit

## Success Criteria
- Probe result recorded in this file with the working model id.
- `generateLesson()` on a real <20-min video returns a Zod-valid object on both paths (`with-captions` and `video-only`).
- Output inspected against the verified elllo format and passes all four checks:
  - `grammarTheme` names ONE structure; all 4 points elaborate that same structure.
  - Zero grammar examples are quotes or near-quotes of transcript lines.
  - All 15 quiz options are terms actually present in the conversation; at least one question blanks a verb.
  - Vocab entries are phrases/idioms, not trivially easy nouns.
- Malformed model output raises a descriptive error and returns nothing persistable.
- Zero hits for banned obsolete-API identifiers in `src/`.
- All files < 200 lines.

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **video + `response_format` unsupported in one call** | Med | Med | Precisely why the probe is step 1 and why `strategy-two-call.ts` is built first. Callers unaffected either way — that is the abstraction's job |
| `gemini-3.6-flash` not on user's key tier | Med | Med | Model id is env-driven; probe records a working fallback (`gemini-2.5-flash`) |
| Model returns 4 unrelated grammar topics instead of one theme | **High** | **High** (wrong format = feature fails) | Explicit STEP A/B/C decomposition + "Pick exactly ONE" + worked reference; Zod can't catch this, so it is a manual review criterion at step 10 |
| Grammar examples quoted from transcript | **High** | Med | CRITICAL RULE line + worked reference showing topic-unrelated examples; manual check at step 10 |
| Quiz distractors random instead of in-domain | Med | Med | Explicit distractor rule + worked reference; manual check |
| Zod-derived JSON Schema rejected by API | Med | Low | Verified during probe; strip unsupported keywords |
| Retry loop burns tokens without converging | Low | Med | Hard cap: exactly ONE retry, then throw |
| Timestamp drift on Gemini transcription (±1–2s reported) | Med | Low | Captions path (Phase 04) is preferred precisely because its timings are exact; a 1–2s seek offset is tolerable for review |
| Latency for 20-min video is minutes-long | Med | Med | VPS deploy has no serverless timeout (settled); measured at step 2 and fed into Phase 04 UX |

## Security Considerations
- `GEMINI_API_KEY` server-side only. `client.ts` carries `import "server-only"`. Never `NEXT_PUBLIC_`.
- Do not log full prompts/responses in production — they are large and may echo request metadata. Log only lengths + validation issue paths.
- Sanitize errors before they reach the UI or the `Lesson.errorMessage` column: SDK errors can embed request context. Map to a short safe message; keep detail in server logs only.
- The YouTube URL is user input, but the only user is the owner (single-user app). Still validate it is a well-formed YouTube URL before sending (Phase 04) rather than forwarding arbitrary strings to a paid API.
- Private/unlisted videos are rejected by Gemini (verified) — surface that as a clear user-facing message, not a raw API error.

## Next Steps
- Unblocks Phase 04, which supplies the caption transcript and persists the result.
- If the probe answers "no", Phase 04 is unaffected by design — confirm that claim by checking Phase 04 imports only `generateLesson`.

## Probe Result
- **Date:** 2026-07-25
- **Single-call video + schema status:** probe resulted in `400 API_KEY_INVALID` with invalid key `vAQ.Ab...` supplied in `.env`.
- **Decision:** Default `GEMINI_SUPPORTS_VIDEO_WITH_SCHEMA` to `false` in `generate-lesson.ts`. Use `strategy-two-call.ts` (Call 1: transcript, Call 2: text-only JSON analysis) for video-only mode, and text-only analysis for `with-captions` mode.
- **Model ID:** `gemini-3.6-flash` (from env `GEMINI_MODEL`).
- **Verbatim Probe Error:** `400 API error occurred: API key not valid. Please pass a valid API key. (reason: API_KEY_INVALID)`.

