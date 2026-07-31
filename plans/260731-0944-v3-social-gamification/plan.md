---
title: "Feature V3: Social & Gamification"
description: "3 tÃ­nh nÄƒng má»›i: Tracking Points (streak + multiplier), Mini game NuÃ´i MÃ¨o tÆ°Æ¡ng tÃ¡c, Lá»›p Há»c real-time."
status: in_progress
priority: P1
effort: 22h
branch: feature/v3-social-gamification
tags: [feature, backend, frontend, database, gamification]
blockedBy: []
blocks: []
created: 2026-07-31
---

# Feature V3: Social & Gamification

## Overview

App V2 há»— trá»£ há»c 1 mÃ¬nh. V3 thÃªm 3 lá»›p tÃ­nh nÄƒng:
1. **Tracking Points** â€“ tÃ­ch Ä‘iá»ƒm + streak multiplier Ä‘á»ƒ táº¡o thÃ³i quen há»c
2. **Mini game NuÃ´i MÃ¨o** â€“ mÃ¨o Ä‘en tráº¯ng CSS art, 6 tráº¡ng thÃ¡i, dÃ¹ng Ä‘iá»ƒm Ä‘á»ƒ chÄƒm mÃ¨o
3. **Lá»›p Há»c** â€“ real-time sync via polling 3s, Vercel-compatible

## Architecture Invariant (Káº¿ thá»«a tá»« V2)

- AI runs EXACTLY ONCE at ingest â€“ khÃ´ng thÃªm AI call trong render path
- NEVER `prisma db push` â€“ luÃ´n `prisma migrate dev --name ...`
- File size < 200 lines â€“ split náº¿u vÆ°á»£t
- Typecheck sau má»—i phase

## Phases

| Phase | Name | Status | Effort |
|-------|------|--------|--------|
| 1 | [DB Schema Migration](./phase-01-db-schema.md) | Completed | 2h |
| 2 | [Tracking Points API + UI](./phase-02-tracking-points.md) | Completed | 5h |
| 3 | [Mini Game Nuôi Mèo](./phase-03-cat-minigame.md) | Completed | 7h |
| 4 | [Lá»›p Há»c (Classroom)](./phase-04-classroom.md) | Pending | 8h |

## Dependencies

- Phase 02, 03, 04 Ä‘á»u depend on Phase 01 (DB schema)
- Phase 03 depend on Phase 02 (cáº§n UserPoint Ä‘á»ƒ deduct points)
- Phase 04 Ä‘á»™c láº­p vá»›i 02, 03 (chá»‰ cáº§n 01)

## Key Decisions (tá»« Brainstorm)

| Quyáº¿t Ä‘á»‹nh | Chá»n | LÃ½ do |
|---|---|---|
| Real-time tech | Polling 3s | Vercel khÃ´ng support persistent WebSocket |
| Cat visual | CSS art thuáº§n | KhÃ´ng load áº£nh, animate mÆ°á»£t, responsive |
| Classroom chat | SKIP MVP | ThÃªm complexity khÃ´ng cáº§n thiáº¿t |
| Points anti-spam | Rate limit + server-verify | TrÃ¡nh gian láº­n Ä‘iá»ƒm |

## Hard Rules

- NEVER `prisma db push`
- File < 200 lines â€“ split náº¿u vÆ°á»£t
- Cat actions: deduct points TRÆ¯á»šC rá»“i má»›i update state
- Cron: verify `Authorization: Bearer $CRON_SECRET`
- Classroom: chá»‰ hostUserId má»›i POST /sync vÃ  /end
- Typecheck sau má»—i phase
