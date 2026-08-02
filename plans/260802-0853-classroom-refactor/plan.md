# Refactor Lớp Học — Đa bài học, Xóa lớp, Tiến độ Practice, Realtime peer

**Ngày:** 2026-08-02 · **Branch:** main · **Trạng thái:** Đang thực hiện

## Bối cảnh

4 vấn đề do người dùng báo, đã xác minh trực tiếp trong code:

| # | Vấn đề | Nguyên nhân gốc (đã xác minh) |
|---|--------|------------------------------|
| 1 | Tạo lớp xong không xóa được | Không tồn tại API xóa lớp. Chỉ có `POST /api/classroom/[code]/end` (`end/route.ts:38`) set `isActive=false`. `classroom-list-card.tsx` không có nút xóa. `page.tsx:32-45` không lọc `isActive` nên lớp đã kết thúc vẫn hiện |
| 2 | Sai tư tưởng: 1 lớp chỉ 1 bài | `schema.prisma:251` để `Classroom.lessonId String?` (quan hệ 1-1). `ingest-lesson-action.ts:32-40` **ghi đè** `lessonId` mỗi lần host thêm video → bài cũ văng khỏi lớp |
| 3 | Practice tụt về 5% | Base UI `Tabs.Panel` mặc định `keepMounted = false` (`TabsPanel.js:37`, `shouldRender = keepMounted \|\| mounted` dòng 110) → đổi tab là `TabWritingPractice` unmount, `currentIndex`/`scores` (`tab-writing-practice.tsx:42-46`) về 0. Gen 20 câu → `1/20 = 5%`. Tiến độ cũng không hề lưu DB |
| 4 | Realtime không tương tác được | `server.js` chỉ có `join-room`/`sync-state`/`end-room`, không có event làm bài. Mọi học viên join socket với tên cứng `"Member"` (`classroom-viewer.tsx:58`) → server không phân biệt được ai. Member list poll 10s, lọc `lastSeenAt` trong 10s (`members/route.ts:38-44`) → danh sách nhấp nháy |

## Quyết định đã chốt với người dùng

1. **Lớp sở hữu nhiều bài** — `Lesson.classroomId` nullable (null = bài solo). Xóa lớp thì bài trong lớp xóa theo.
2. **Xóa lớp = hard delete**, có dialog xác nhận bằng cách gõ lại mã lớp.
3. **Realtime peer đầy đủ**: ai đang ở câu nào + đúng/sai · xem được câu trả lời của bạn · bảng xếp hạng live · feed hoạt động.
4. **Phạm vi**: làm hết 4 vấn đề + dọn UX.

## Phát hiện then chốt

- `src/middleware.ts:30-40` bắt buộc auth **mọi route** → học viên trong lớp luôn là `User` đã đăng nhập. Nhờ vậy định danh realtime khóa theo `userId` được, không cần cơ chế danh tính riêng.
- `Lesson.@@unique([userId, videoId])` chặn việc cùng một host thêm cùng một video vào 2 lớp khác nhau → phải bỏ, thay bằng index + `findFirst` scoped theo `classroomId`.
- `global.io` đã được gán trong `server.js:23` → server action / route handler emit socket được, không cần để client tự emit (hiện `end-room` do client emit — bất kỳ ai cũng gọi được).

## Các phase

| Phase | Nội dung | Trạng thái |
|-------|----------|-----------|
| [01](phase-01-schema-multi-lesson.md) | Schema đa bài học + migration | ✅ Xong |
| [02](phase-02-delete-classroom-lessons.md) | Xóa lớp + quản lý nhiều bài trong lớp | ✅ Xong |
| [03](phase-03-practice-progress.md) | Fix tiến độ tab Practice (keepMounted + lưu DB) | ✅ Xong |
| [04](phase-04-realtime-peer.md) | Realtime peer activity | ✅ Xong |
| [05](phase-05-ux-cleanup.md) | Dọn UX, member list, typecheck/test | ✅ Xong |

## Phụ thuộc

- Phase 2/3/4 đều phụ thuộc Phase 1 (schema).
- Phase 4 phụ thuộc Phase 3 (`PracticeAttempt` phải ghi được trước khi broadcast).
- Luật cứng: mọi thay đổi schema đi qua `prisma migrate dev`, **không dùng `db:push`**.
