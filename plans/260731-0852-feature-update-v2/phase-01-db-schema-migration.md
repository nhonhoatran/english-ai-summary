# Phase 01 — DB Schema Migration

**Effort:** 1.5h | **Priority:** P1 | **Status:** completed  
**Depends on:** nothing (foundation)  
**Blocks:** Phase 02, 03, 04, 05, 06, 07

---

## Goal

Add 4 new fields/models to support: IPA, Summary, Writing Prompts, and Multi-language (targetLanguage).

---

## Changes to `prisma/schema.prisma`

### 1. Add `targetLanguage` enum + field on `Lesson`

```prisma
enum TargetLanguage {
  english
  chinese
}

model Lesson {
  // ... existing fields ...
  targetLanguage TargetLanguage @default(english)  // NEW
  summary        String?                            // NEW — AI-generated summary paragraph
}
```

### 2. Add `ipa` field on `VocabItem`

```prisma
model VocabItem {
  // ... existing fields ...
  ipa  String?  // NEW — IPA phonetic transcription, e.g. /teɪk ɒf/
}
```

> **Note for Chinese:** `ipa` field stores Pinyin for Chinese lessons (e.g. `nǐ hǎo`). Same field, different content driven by `targetLanguage`.

### 3. Add new `WritingPrompt` model

```prisma
model WritingPrompt {
  id         String  @id @default(cuid())
  lessonId   String
  orderIndex Int
  viMeaning  String  // Vietnamese meaning hint shown to user
  enAnswer   String  // Reference English sentence for Gemini semantic check
  lesson     Lesson  @relation(fields: [lessonId], references: [id], onDelete: Cascade)

  @@unique([lessonId, orderIndex])
}
```

Add relation back on `Lesson`:
```prisma
model Lesson {
  // ...
  writingPrompts WritingPrompt[]
}
```

---

## Migration commands

```bash
# 1. Edit schema.prisma with all above changes

# 2. Create migration (review SQL before applying)
npx prisma migrate dev --name v2-ipa-summary-writing-language

# 3. Regenerate Prisma Client
npx prisma generate

# 4. Verify typecheck passes
npx tsc --noEmit
```

---

## Verification checklist

- [x] `schema.prisma` compiles without Prisma errors
- [x] Migration SQL contains: `ALTER TABLE "VocabItem" ADD COLUMN "ipa"`, `ALTER TABLE "Lesson" ADD COLUMN "summary"`, `ALTER TABLE "Lesson" ADD COLUMN "targetLanguage"`, `CREATE TABLE "WritingPrompt"`
- [x] `npx prisma generate` succeeds
- [x] `npx tsc --noEmit` — 0 errors
- [x] Existing lesson records unaffected (new fields are nullable/have defaults)

---

## Risk

**LOW** — all new fields are nullable or have defaults. No breaking changes to existing data.
