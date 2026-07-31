---
title: "Feature Update V2: IPA, Summary, Writing Practice, Multi-language, Full UI Redesign"
description: "6 new features: IPA on vocabulary, AI summary tab, sentence writing practice tab, TikTok dropped, English+Chinese multi-language, full UI/UX redesign."
status: pending
priority: P1
effort: 28h
branch: feature/v2-feature-update
tags: [nextjs, prisma, gemini, multi-language, ipa, ui-redesign, writing-practice]
created: 2026-07-31
blockedBy: []
blocks: []
---

# Feature Update V2

## Context

App hien tai da co 5 tabs (Script, Dialogue, Grammar, Quiz, Vocabulary) chi cho tieng Anh tu YouTube. Brainstorm session 2026-07-31 xac nhan 6 tinh nang can them.

## TikTok decision

DROPPED - TikTok khong co public captions API, can yt-dlp binary (khong chay Vercel), aggressive scraping block. Khong trien khai.

## Scope

| # | Tinh nang | Quyet dinh |
|---|---|---|
| 1 | IPA (en-US) cho Vocabulary | Gemini gen truoc -> fallback Free Dictionary API |
| 2 | Tab Summary | Them vao prompt chinh, luu summary field trong Lesson |
| 3 | Tab Viet lai cau | Gen writingPrompts (VN meaning + EN answer), Gemini semantic check |
| 4 | Multi-language English + Chinese | targetLanguage field, dual prompt templates, Pinyin cho Chinese |
| 5 | Full UI/UX Redesign | Layout moi, hero moi, card design moi hoan toan |

## Architecture invariant (KEPT)

AI runs EXACTLY ONCE at ingest. summary, writingPrompts, ipa deu duoc gen trong ingest pipeline, persist to DB. Zero AI calls on lesson page load.

Exception duy nhat: Tab Viet lai cau co Gemini semantic check moi lan user submit cau. Day la interactive feature, KHONG phai ingest.

## Phases

| # | Phase | Priority | Effort | Status | Depends on |
|---|---|---|---|---|---|
| 01 | DB Schema Migration | P1 | 1.5h | completed | - |
| 02 | Prompt & AI Layer Update | P1 | 4h | completed | 01 |
| 03 | IPA Enrichment (Dictionary API) | P1 | 1.5h | completed | 02 |
| 04 | Tab Summary UI | P2 | 1h | completed | 02 |
| 05 | Tab Viet lai cau + Gemini check API | P2 | 4h | pending | 02 |
| 06 | Multi-language: Add-form + Captions + Prompts | P1 | 5h | pending | 02 |
| 07 | Full UI/UX Redesign | P2 | 10h | pending | 01-06 |

## Key files affected

prisma/schema.prisma                               <- Phase 01
src/lib/gemini/prompt-lesson-analysis.ts           <- Phase 02
src/lib/gemini/lesson-schemas.ts                   <- Phase 02
src/lib/gemini/generate-lesson.ts                  <- Phase 02, 06
src/lib/ingest/ingest-lesson.ts                    <- Phase 02, 03, 06
src/lib/ingest/fetch-youtube-captions.ts           <- Phase 06
src/app/api/check-writing/route.ts                 <- Phase 05 (NEW)
src/components/add-lesson-form.tsx                 <- Phase 06, 07
src/components/lesson/lesson-tabs.tsx              <- Phase 04, 05, 07
src/components/lesson/tab-vocabulary.tsx           <- Phase 03, 07
src/components/lesson/tab-summary.tsx              <- Phase 04 (NEW)
src/components/lesson/tab-writing-practice.tsx     <- Phase 05 (NEW)
src/app/lessons/[id]/page.tsx                      <- Phase 04, 05, 07
src/app/page.tsx                                   <- Phase 07
src/app/globals.css                                <- Phase 07

## Hard rules

- NEVER prisma db push - always prisma migrate dev --name ...
- File size < 200 lines - split neu vuot
- IPA fetch: Gemini gen truoc -> validate format -> neu missing/invalid, goi Free Dictionary API
- Writing check: Gemini check KHONG duoc goi trong ingest. Chi goi khi user submit cau trong tab.
- Chinese captions: fetchYoutubeCaptions can nhan lang param - "en" hoac "zh-Hans"
- targetLanguage enum: "english" | "chinese" - stored in DB, drives all prompt branching
- Typecheck sau moi phase
