# Verified Spec: elllo Lesson Format + Gemini API (self-verified)

**Date:** 2026-07-25
**Verified by:** main session (Playwright browser + official Google docs)
**Purpose:** Corrects errors in `researcher-260725-1002-gemini-youtube-api.md` and fills gaps in `researcher-260725-1002-lesson-format-and-srs.md`

---

## Part 1: elllo Lesson Format — VERIFIED via Playwright

Source: https://elllo.org/english/grammar/L2-03-MegTodd-Sandwich.htm
Method: real browser, clicked each tab, read rendered DOM. (Researcher's WebFetch could NOT see Quiz/Grammar — JS-rendered.)

### Tab structure
Exactly 3 tabs, anchor-based: `#view1` Script, `#view2` Grammar, `#view3` Quiz.
Header above tabs: speaker photos + flags + names, lesson title, 1-line description, embedded SoundCloud player.

### Tab 1: Script — VERIFIED
- One `<p>` per speaker turn.
- Format: `**Speaker**: text` — bold name, colon, then plain text.
- Very short turns are kept verbatim ("Meg: Yum.", "Todd: Yes.", "Meg: Mm-hmm.") — backchannel noises are NOT stripped.
- NO inline vocab highlighting. NO timestamps.
- Natural speech preserved, including a grammatical error by the speaker ("After that was cut the banana...") — transcript is faithful, not cleaned up.

### Tab 2: Grammar — VERIFIED (verbatim)
Heading: "Grammar Point"
Exactly **4 points**. Each = bold `Point N` + `:` + one-sentence explanation, then a `<ul>` of exactly **4 example sentences**.

Verbatim (lesson topic: Imperatives):
```
Point 1: The imperative is the base form of the verb. We use it to give instructions, commands or suggestions.
  - Come here.
  - Help me please.
  - Look at this.
  - Don't do that!

Point 2: The imperative does not have a subject because the subject is the listener.
  - Listen to me.
  - Speak slower please.
  - Stand over there.
  - Open the door.

Point 3: Add the world 'please' to make the commands more polite.   [sic: "world" typo on their site]
  - Please sit here.
  - Please give me your passport.
  - Please spell your name for me.
  - Please pay this amount.

Point 4: The negative form of the imperative uses do not or don't plus the base verb
  - Do not go there.
  - Don't eat too much.
  - Do not stay up too late.
  - Don't fall asleep.
```

**Key finding:** examples are INVENTED/generic, NOT quoted from the transcript. Whole lesson centers on ONE grammar theme (imperatives), and all 4 points elaborate that single theme. This contradicts a "find 4 random grammar points" prompt design — prompt must pick ONE dominant structure then break it into 4 facets.

### Tab 3: Quiz — VERIFIED (verbatim, researcher could not retrieve this)
Intro line: "Answer the following questions about the interview."
Exactly **5 questions**. Type: **gap-fill with 3 multiple-choice options** (a/b/c). Rendered as checkboxes.
Buttons: `Check Answers`, `Reset Quiz`, `Show Answers`.

Verbatim:
```
1) Spread the _______.          a) bread   b) bacon   c) mayonnaise
2) Slice the _______ .          a) bread   b) cheese  c) tomatoes
3) Fry the ________ .           a) bread   b) bacon   c) both of them
4) Cut the ______ .             a) bacon   b) bananas c) bread
5) On both sandwiches, _____ the bread.   a) spread  b) toast  c) slice
```

**Key findings for prompt design:**
- Questions test BOTH comprehension (did you hear it?) AND the grammar theme (every stem is an imperative + object).
- Distractors are plausible in-domain nouns from the same lesson (bread/bacon/cheese) — NOT random words. Q3's "c) both of them" shows distractors may be non-noun.
- Q5 tests the verb slot instead of the noun slot — variety in what's blanked.
- Answers are derivable from the transcript alone.

### Vocabulary tab
**Does NOT exist** on this page. Only 3 tabs. Our Vocabulary tab is our own addition (no elllo template to copy) — free to design.

---

## Part 2: Gemini API — VERIFIED against official docs

### CORRECTIONS to researcher report

The researcher report's code is **WRONG / outdated**. Do not use it as-is.

| Researcher said | Actually (official docs) |
|---|---|
| `client.models.generateContent({...})` | `ai.interactions.create({...})` — Interactions API |
| `contents: [{ fileData: { fileUri, mimeType: "video/mp4" } }]` | `input: [{ type: "text", text }, { type: "video", uri }]` — no mimeType needed for YouTube |
| `generationConfig: { responseMimeType, responseSchema }` | `response_format: { type, mime_type, schema }` at TOP level |
| `vertexai: true` + `GOOGLE_CLOUD_PROJECT` | `new GoogleGenAI({})` reading `GEMINI_API_KEY` env — API-key path, no GCP project |
| `SchemaType.OBJECT` enum imports | plain JSON Schema; Zod supported via `z.fromJSONSchema()` |

Source: https://ai.google.dev/gemini-api/docs/video-understanding , https://ai.google.dev/gemini-api/docs/interactions/structured-output

### Verified facts

- **Package:** `@google/genai`, latest `2.13.0` (verified `npm view @google/genai version` → 2.13.0). Legacy `@google/generative-ai` is EOL.
- **YouTube URL direct input:** supported. Shape:
  ```javascript
  import { GoogleGenAI } from "@google/genai";
  const ai = new GoogleGenAI({});   // reads GEMINI_API_KEY
  const interaction = await ai.interactions.create({
    model: "gemini-3.6-flash",
    input: [
      { type: "text", text: "Please summarize the video in 3 sentences." },
      { type: "video", uri: "https://www.youtube.com/watch?v=9hE5-98ZeCg" },
    ],
  });
  ```
- **Structured output shape:**
  ```javascript
  response_format: { type: 'text', mime_type: 'application/json', schema: schemaObject }
  // read via interaction.output_text
  // Zod: z.fromJSONSchema(jsonSchema) then .parse(JSON.parse(interaction.output_text))
  ```
- **Video token cost (quoted from docs):** "Approximately 300 tokens per second of video at default media resolution, or 100 tokens per second of video at low media resolution."
- **Length limits:** up to 1 hour at default resolution, up to 3 hours at low resolution (1M-context models). Our videos are <20 min → comfortably inside limits.
- **Private/unlisted videos:** not supported (public only).

### UNVERIFIED — must test with real key before relying on it

1. **Does `response_format` (JSON schema) work in the SAME request as `{type:"video"}` input?**
   Official docs do NOT demonstrate this combination. Researcher claimed YES but cited the old API, so its claim doesn't transfer.
   → **Must run a real probe against the user's key.** If unsupported, fallback = ask for plain text transcript, then a 2nd text-only call with schema.
2. Exact current model ID to use — docs show `gemini-3.6-flash`. Need to confirm it's available on the user's key tier.
3. Timestamp accuracy from Gemini video transcription (docs give no guarantee; forum reports ±1–2s drift).
4. Whether `interactions.create` is sync-blocking for a 20-min video and its real latency.

---

## Part 3: SRS — disagreement with researcher recommendation

Researcher recommended SM-2 over FSRS for "simplicity". **Disagree**, based on its own data:
- `ts-fsrs` v5.4.1 — 25.9k downloads/month, updated 9 days ago, MIT, actively maintained.
- `supermemo` v2.0.23 — ~124 downloads/week, 4 months old.

Since we use a package either way, we never write the scheduling formula ourselves — so "formula complexity" is not our cost. The real cost is column count (FSRS ~5-7 vs SM-2 3), which is trivial in Postgres. Recommend **FSRS via `ts-fsrs`** for better scheduling quality and a far healthier dependency.

Needs confirming at implementation time: exact `ts-fsrs` Card field list for the Prisma schema (read package types, not the wiki).

---

## User constraints (confirmed by user this session)

- Videos **under 20 minutes** → within all Gemini limits.
- **One video at a time**, not playlists → no batch/queue feature needed (YAGNI).
- **User accepts token burn**, no quota-guard features needed → skip rate limiting/usage metering.
- Deploy: **own VPS via Docker** → no serverless timeout constraints; long Gemini calls are fine.
- Auth: **single shared password** for the user only.

## Unresolved questions

1. Does video + `response_format` work in one call? (blocking design decision — probe needed)
2. Which model ID is available on the user's key?
3. Is the user's VPS ARM or x86? (affects Docker base image)
4. Does the user want Vietnamese translation generated at ingest time (more tokens up front) or lazily per-sentence on demand?
