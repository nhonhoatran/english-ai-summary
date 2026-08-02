# Phase 04 — Realtime peer trong tab Practice

**Trạng thái:** ✅ Xong

## Vấn đề gốc
`server.js` chỉ có 3 event (`join-room`, `sync-state`, `end-room`), không có event nào cho việc làm bài. Nặng nhất: `classroom-viewer.tsx:58` (bản cũ) join socket với tên cứng `"Member"` cho **mọi** học viên → server không phân biệt nổi ai với ai.

## Đã làm

### Server (`server.js`)
- `join-room` nhận `{ code, userId, memberId, displayName }` — danh tính thật.
- **Presence lấy từ chính kết nối socket**, lưu trong `presenceByRoom: Map<roomCode, Map<socketId, info>>`. Gộp theo `userId` nên mở 2 tab vẫn tính 1 người.
- Thêm `request-presence` (client hỏi roster ngay khi mount) và `leave-room`.
- Bỏ `end-room` do client emit — chuyển sang server emit sau khi kiểm tra host.

### Emit từ server
- `src/lib/realtime/emit-to-room.ts` (mới) — đọc `globalThis.io` do `server.js` gán, không bao giờ throw. Trả `null` khi chạy trong `next build` / unit test.
- Các event: `practice-attempt`, `lesson-switched`, `lessons-changed`, `room-ended`, `room-deleted`, `member-joined`.

### UI
| Tính năng người dùng chọn | Component |
|---|---|
| Ai đang ở câu nào + đúng/sai | `practice-prompt-navigator.tsx` — dải chip câu hỏi, mỗi chip có avatar bạn học kèm màu xanh/đỏ |
| Xem câu trả lời của bạn | `practice-peer-answers.tsx` — **khóa** cho tới khi bản thân đã trả lời câu đó (tránh chép bài) |
| Bảng xếp hạng live | `classroom-leaderboard.tsx` — tự nghe socket nên vẫn cập nhật khi lớp đang ở tab khác |
| Feed hoạt động | `classroom-activity-feed.tsx` — in-memory, tối đa 30 dòng |

- `src/lib/practice/use-practice-realtime.ts` (mới) — hook đồng bộ attempt, tự fetch lại toàn bộ khi socket reconnect (event phát lúc mất mạng thì mất luôn).

## Quyết định thiết kế
- **Bảng xếp hạng tự subscribe socket** thay vì nhận state từ tab Practice: tab Practice hiếm khi là panel đang mở, nếu phụ thuộc nó thì bảng xếp hạng đứng im.
- **Khóa xem câu trả lời của bạn** cho tới khi mình làm xong — không thì panel này thành chỗ chép bài, bài tập mất tác dụng dạy học.
- **Feed không lưu DB** (YAGNI): nó là "không khí lớp học", không phải hồ sơ.

## Lỗi phát sinh đã sửa
Effect socket ban đầu phụ thuộc `isFreeMode` → mỗi lần toggle là `leave-room` rồi join lại, làm mình biến mất khỏi presence của người khác. Chuyển sang `useRef` + effect đồng bộ riêng.
