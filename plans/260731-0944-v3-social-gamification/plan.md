---
title: "Feature V3: Social & Gamification"
description: "3 tính năng mới: Tracking Points (streak + multiplier), Mini game Nuôi Mèo tương tác, Lớp Học real-time."
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

App V2 hỗ trợ học 1 mình. V3 thêm 3 lớp tính năng:
1. **Tracking Points** – tích điểm + streak multiplier để tạo thói quen học
2. **Mini game Nuôi Mèo** – mèo đen trắng CSS art, 6 trạng thái, dùng điểm để chăm mèo
3. **Lớp Học** – real-time sync via polling 3s, Vercel-compatible

## Architecture Invariant (Kế thừa từ V2)

- AI runs EXACTLY ONCE at ingest – không thêm AI call trong render path
- NEVER `prisma db push` – luôn `prisma migrate dev --name ...`
- File size < 200 lines – split nếu vượt
- Typecheck sau mỗi phase

## Phases

| Phase | Name | Status | Effort |
|-------|------|--------|--------|
| 1 | [DB Schema Migration](./phase-01-db-schema.md) | Completed | 2h |
| 2 | [Tracking Points API + UI](./phase-02-tracking-points.md) | Completed | 5h |
| 3 | [Mini Game Nuôi Mèo](./phase-03-cat-minigame.md) | Pending | 7h |
| 4 | [Lớp Học (Classroom)](./phase-04-classroom.md) | Pending | 8h |

## Dependencies

- Phase 02, 03, 04 đều depend on Phase 01 (DB schema)
- Phase 03 depend on Phase 02 (cần UserPoint để deduct points)
- Phase 04 độc lập với 02, 03 (chỉ cần 01)

## Key Decisions (từ Brainstorm)

| Quyết định | Chọn | Lý do |
|---|---|---|
| Real-time tech | Polling 3s | Vercel không support persistent WebSocket |
| Cat visual | CSS art thuần | Không load ảnh, animate mượt, responsive |
| Classroom chat | SKIP MVP | Thêm complexity không cần thiết |
| Points anti-spam | Rate limit + server-verify | Tránh gian lận điểm |

## Hard Rules

- NEVER `prisma db push`
- File < 200 lines – split nếu vượt
- Cat actions: deduct points TRƯỚC rồi mới update state
- Cron: verify `Authorization: Bearer $CRON_SECRET`
- Classroom: chỉ hostUserId mới POST /sync và /end
- Typecheck sau mỗi phase
