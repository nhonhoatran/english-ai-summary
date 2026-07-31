# Phase 04 - Lớp Học (Classroom - Socket.io Realtime)

## Overview

- **Priority:** P1
- **Effort:** 8h
- **Status:** Completed
- **Depends on:** Phase 01 (DB Schema)

Tính năng lớp học real-time sử dụng **Socket.io WebSocket** (kèm DB fallback): host tạo lớp -> share link -> members join -> cùng xem bài theo sync thời gian thực 0ms của host.

## Architecture

### Socket.io Strategy

```
Server: Custom Node.js server (server.js) + Socket.io Server attached at /api/socket/io

Events:
  - join-room ({ code, displayName })
  - sync-state ({ code, currentTab, currentSegment }) -> broadcast state-updated
  - end-room ({ code }) -> broadcast room-ended
  - member-joined / member-left -> instant member list refresh
```

## Related Code Files

| File | Action | Mô tả |
|------|--------|--------|
| `server.js` | Create | Custom Node server tích hợp Socket.io Server |
| `src/lib/socket.ts` | Create | Client-side Socket.io singleton connection |
| `src/lib/classroom/generate-code.ts` | Create | Unique 6-char code generation |
| `src/app/api/classroom/create/route.ts` | Create | POST -> host tạo lớp |
| `src/app/api/classroom/[code]/join/route.ts` | Create | POST -> member join |
| `src/app/api/classroom/[code]/state/route.ts` | Create | GET -> state fallback |
| `src/app/api/classroom/[code]/sync/route.ts` | Create | POST -> host push state to DB |
| `src/app/api/classroom/[code]/end/route.ts` | Create | POST -> host end room in DB |
| `src/app/api/classroom/[code]/members/route.ts` | Create | GET -> online members list |
| `src/app/classroom/[code]/page.tsx` | Create | Classroom page |
| `src/components/classroom/classroom-viewer.tsx` | Modify | Synced lesson view via Socket.io |
| `src/components/classroom/member-list.tsx` | Modify | Online members panel via Socket events |
| `src/components/classroom/create-classroom-btn.tsx` | Create | Button + share modal |
| `src/app/lessons/[id]/page.tsx` | Modify | Thêm "Tạo lớp" button |

## Todo

- [x] Tích hợp `socket.io` & `socket.io-client` vào `server.js` & `src/lib/socket.ts`
- [x] Realtime sync tab & segment bằng WebSocket 0ms
- [x] Realtime cập nhật danh sách thành viên khi Join/Leave
- [x] Realtime báo lớp kết thúc khi Host bấm "Kết thúc lớp"
- [x] `npx tsc --noEmit` - zero errors

## Success Criteria

- Host tạo lớp -> nhận code, share link
- Member join với display name -> thấy lesson synced tức thì via Socket.io
- Member tự navigate khi bật "Tự do"
- Host "Kết thúc" -> tất cả member nhận tín hiệu đóng room tức thì
- TypeScript build 0 lỗi
