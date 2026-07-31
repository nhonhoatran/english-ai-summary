---
title: "Feature V3: Social & Gamification"
description: "3 t�nh nang m?i: Tracking Points (streak + multiplier), Mini game Nu�i M�o tuong t�c, L?p H?c real-time."
status: pending
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

App V2 h? tr? h?c 1 m�nh. V3 th�m 3 l?p t�nh nang:
1. **Tracking Points** � t�ch di?m + streak multiplier d? t?o th�i quen h?c
2. **Mini game Nu�i M�o** � m�o den tr?ng CSS art, 6 tr?ng th�i, d�ng di?m d? cham m�o
3. **L?p H?c** � real-time sync via polling 3s, Vercel-compatible

## Architecture Invariant (K? th?a t? V2)

- AI runs EXACTLY ONCE at ingest � kh�ng th�m AI call trong render path
- NEVER `prisma db push` � lu�n `prisma migrate dev --name ...`
- File size < 200 lines � split n?u vu?t
- Typecheck sau m?i phase

## Phases

| Phase | Name | Status | Effort |
|-------|------|--------|--------|
| 1 | [DB Schema Migration](./phase-01-db-schema.md) | Completed | 2h |
| 2 | [Tracking Points API + UI](./phase-02-tracking-points.md) | Pending | 5h |
| 3 | [Mini Game Nu�i M�o](./phase-03-cat-minigame.md) | Pending | 7h |
| 4 | [L?p H?c (Classroom)](./phase-04-classroom.md) | Pending | 8h |

## Dependencies

- Phase 02, 03, 04 d?u depend on Phase 01 (DB schema)
- Phase 03 depend on Phase 02 (c?n UserPoint d? deduct points)
- Phase 04 d?c l?p v?i 02, 03 (ch? c?n 01)

## Key Decisions (t? Brainstorm)

| Quy?t d?nh | Ch?n | L� do |
|---|---|---|
| Real-time tech | Polling 3s | Vercel kh�ng support persistent WebSocket |
| Cat visual | CSS art thu?n | Kh�ng load ?nh, animate mu?t, responsive |
| Classroom chat | SKIP MVP | Th�m complexity kh�ng c?n thi?t |
| Points anti-spam | Rate limit + server-verify | Tr�nh gian l?n di?m |

## Hard Rules

- NEVER `prisma db push`
- File < 200 lines � split n?u vu?t
- Cat actions: deduct points TRU?C r?i m?i update state
- Cron: verify `Authorization: Bearer $CRON_SECRET`
- Classroom: ch? hostUserId m?i POST /sync v� /end
- Typecheck sau m?i phase
