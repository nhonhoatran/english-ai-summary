# Phase 04 — L?p H?c (Classroom)

## Overview

- **Priority:** P1
- **Effort:** 8h
- **Status:** Pending
- **Depends on:** Phase 01 (DB Schema)

Tính nang l?p h?c real-time: host t?o l?p ? share link ? members join ? cùng xem bài theo sync c?a host.

## Requirements

### Functional
- Host t?o l?p t? lesson page ? nh?n code 6 ký t? (VD: "ENG4X2")
- Member vào link `/classroom/[code]` ? nh?p tên hi?n th? + phone (optional)
- Members du?c sync tab/segment khi host navigate
- Toggle "T? do" d? member t? navigate
- Host "K?t thúc l?p" ? session dóng
- Danh sách member online (lastSeenAt < 10s)

### Non-functional
- Real-time via polling 3s (Vercel-compatible)
- Không c?n chat (SKIP MVP)
- Không c?n leaderboard trong classroom (SKIP MVP)
- Code classroom unique, retry n?u trùng

## Architecture

### Polling Strategy

```
Host side:
  - Khi navigate tab/segment ? POST /api/classroom/[code]/sync
  - Immediate, không c?n interval

Member side:
  - useEffect v?i setInterval(3000)
  - GET /api/classroom/[code]/state ? c?p nh?t lastSeenAt
  - So sánh lastSyncAt v?i prevSyncAt
  - N?u thay d?i ? navigate theo host
  - Stop polling khi isFreeMode = true ho?c isActive = false
```

### Code Generation

```typescript
// generate-code.ts
function generateCode(): string {
  // 6 chars: uppercase letters + digits, no ambiguous (0, O, I, l)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 6 }, () => chars[Math.random() * chars.length | 0]).join('')
}
// Verify unique trong DB, retry t?i da 5 l?n
```

### Online Detection

```sql
-- Members "online" = lastSeenAt trong 10 giây g?n nh?t
WHERE classroomId = ? AND lastSeenAt > NOW() - INTERVAL '10 seconds'
```

## Related Code Files

| File | Action | Mô t? |
|------|--------|--------|
| `src/lib/classroom/generate-code.ts` | Create | Unique 6-char code |
| `src/app/api/classroom/create/route.ts` | Create | POST — host t?o l?p |
| `src/app/api/classroom/[code]/join/route.ts` | Create | POST — member join |
| `src/app/api/classroom/[code]/state/route.ts` | Create | GET — poll state |
| `src/app/api/classroom/[code]/sync/route.ts` | Create | POST — host push state |
| `src/app/api/classroom/[code]/end/route.ts` | Create | POST — host end |
| `src/app/api/classroom/[code]/members/route.ts` | Create | GET — online list |
| `src/app/classroom/[code]/page.tsx` | Create | Classroom page |
| `src/components/classroom/classroom-viewer.tsx` | Create | Synced lesson view |
| `src/components/classroom/member-list.tsx` | Create | Online members panel |
| `src/components/classroom/create-classroom-btn.tsx` | Create | Button + share modal |
| `src/app/lessons/[id]/page.tsx` | Modify | Thêm "T?o l?p" button |

## Implementation Steps

1. **`generate-code.ts`**
   - Gen 6 chars t? safe charset
   - Check DB unique, retry max 5

2. **`POST /api/classroom/create`**
   - Auth: verify user t? session
   - Verify `lessonId` belongs to userId
   - Gen unique code
   - Create `Classroom` record
   - Return `{ code, url: '/classroom/' + code }`

3. **`POST /api/classroom/[code]/join`**
   - Validate classroom t?n t?i + isActive = true
   - Validate `displayName` unique trong classroom
   - Create `ClassMember` record
   - Set cookie `classroom_member_id` cho session
   - Return `{ memberId, classroom }`

4. **`GET /api/classroom/[code]/state`**
   - Load classroom state (currentTab, currentSegment, lastSyncAt, isActive)
   - Update `ClassMember.lastSeenAt` = NOW (via memberId t? cookie)
   - Return state

5. **`POST /api/classroom/[code]/sync`**
   - Verify caller `userId` = `classroom.hostUserId`
   - Update: currentTab, currentSegment, lastSyncAt
   - Return updated state

6. **`POST /api/classroom/[code]/end`**
   - Verify caller = hostUserId
   - Set `isActive = false`

7. **`GET /api/classroom/[code]/members`**
   - Return members WHERE lastSeenAt > NOW - 10s
   - Include displayName, joinedAt

8. **`classroom/[code]/page.tsx`**
   - Server component: load classroom basic info
   - If not member (no cookie) ? render join form
   - If member ? render `<ClassroomViewer />`

9. **`classroom-viewer.tsx`**
   ```typescript
   // State: isFreeMode (default false)
   // useEffect: setInterval poll state m?i 3s
   //   ? so sánh lastSyncAt
   //   ? n?u changed + !isFreeMode ? navigate
   // Render: lesson tabs (reuse existing components)
   // Top bar: "?? Ðang h?c cùng [Host]" | toggle "T? do"
   // Right panel: <MemberList />
   ```

10. **`member-list.tsx`**
    - Fetch `/api/classroom/[code]/members` m?i 3s
    - Hi?n th? avatar initial + displayName
    - Badge "Host" cho host

11. **`create-classroom-btn.tsx`**
    - Button: "?? T?o l?p h?c"
    - POST /api/classroom/create
    - Modal: hi?n th? link + nút copy

12. **Lesson page** — thêm `<CreateClassroomBtn lessonId={lesson.id} />` khi `lesson.status === 'READY'`

13. `npx tsc --noEmit` — zero errors

## Todo

- [ ] `src/lib/classroom/generate-code.ts`
- [ ] `POST /api/classroom/create` — verify lesson ownership
- [ ] `POST /api/classroom/[code]/join` — unique displayName check
- [ ] `GET /api/classroom/[code]/state` — update lastSeenAt
- [ ] `POST /api/classroom/[code]/sync` — host only
- [ ] `POST /api/classroom/[code]/end` — host only
- [ ] `GET /api/classroom/[code]/members` — online filter
- [ ] `src/app/classroom/[code]/page.tsx`
- [ ] `src/components/classroom/classroom-viewer.tsx` — polling hook
- [ ] `src/components/classroom/member-list.tsx`
- [ ] `src/components/classroom/create-classroom-btn.tsx`
- [ ] Lesson page: thêm Create button
- [ ] `npx tsc --noEmit` — zero errors

## Success Criteria

- Host t?o l?p ? nh?n code, share link
- Member join v?i display name ? th?y lesson synced
- Member t? navigate khi b?t "T? do"
- Member list c?p nh?t dúng (online/offline)
- Host "K?t thúc" ? member redirect ra kh?i l?p
- 3s polling không gây lag noticeable

## Risk Assessment

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Code collision | Very Low | Retry 5 l?n, 36^6 = 2.1B combinations |
| Polling quá nhi?u (N members × 3s) | Medium | State endpoint nh? (1 DB row), OK cho <50 members |
| Member spoofing (gi? làm host) | Medium | Verify `userId` = `hostUserId` t? session, không t? body |
| Cookie m?t ? member b? kick | Low | Cookie path = `/classroom/[code]`, SameSite=Lax |
| Race condition: 2 ngu?i join cùng displayName | Low | `@@unique([classroomId, displayName])` — DB constraint |

## Security Considerations

- `/sync` và `/end`: verify userId = hostUserId t? session server-side
- Code generation: dùng `crypto.getRandomValues` n?u có th? (không Math.random)
- Cookie: HttpOnly, SameSite=Lax, không expose memberId ra client bundle
- Validate displayName: max 30 chars, strip HTML tags
- isActive check: ?n classroom sau khi ended (không serve stale data)
