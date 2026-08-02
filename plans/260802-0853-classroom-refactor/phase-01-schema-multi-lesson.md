# Phase 01 — Schema đa bài học + migration

**Trạng thái:** ✅ Xong · **Ưu tiên:** Cao (chặn các phase còn lại)

## Mục tiêu
Một lớp học sở hữu nhiều bài học, thành viên lớp gắn với `User`, và tiến độ luyện viết được lưu xuống DB.

## Thay đổi schema (`prisma/schema.prisma`)

| Model | Thay đổi |
|-------|----------|
| `Lesson` | + `classroomId String?` (null = bài solo), + `classroomOrder Int`, bỏ `@@unique([userId, videoId])` → đổi thành index |
| `Classroom` | `lessonId` → `currentLessonId` (bài lớp đang học), + `lessons Lesson[]`, + `name String?`, host FK thành `onDelete: Cascade` |
| `ClassMember` | + `userId String?` + `@@unique([classroomId, userId])` |
| `PracticeAttempt` | **Mới** — 1 dòng / (prompt, học viên). Vừa là bài đã chấm, vừa là kho tiến độ |

## Quyết định thiết kế

- **Không tách bảng `PracticeProgress` riêng.** Tiến độ = "câu đầu tiên chưa có `PracticeAttempt`". Một bảng phục vụ cả tiến độ, bảng xếp hạng lẫn feed → DRY, ít chỗ lệch nhau.
- **Bỏ `@@unique([userId, videoId])`** vì nó chặn host thêm cùng một video vào 2 lớp khác nhau. Idempotency chuyển sang `findFirst({ userId, videoId, classroomId })` trong `ingest-lesson.ts`.
- **Migration viết tay** (`20260802015300_v4_classroom_multi_lesson_and_practice`) vì `prisma migrate dev` cần chế độ tương tác. SQL dùng `RENAME COLUMN` thay vì drop/add để **không mất data**, kèm backfill:
  - Bài học mà lớp đang trỏ tới → gán `classroomId` cho lớp đó
  - `ClassMember.userId` backfill từ `phone`, bỏ qua trường hợp trùng phone trong cùng lớp (tránh vỡ unique)

## File đã sửa
- `prisma/schema.prisma`
- `prisma/migrations/20260802015300_v4_classroom_multi_lesson_and_practice/migration.sql` (mới)
- `src/lib/ingest/ingest-lesson.ts` — thêm tham số `classroomId`, tính `classroomOrder`
- `src/app/actions/ingest-lesson-action.ts` — kiểm tra quyền host, gán bài vào lớp, chỉ auto-chọn khi lớp chưa có bài nào
- `src/app/api/classroom/create|join|state/route.ts`
- `src/lib/classroom/{display-name,member-cookie,get-classroom-context}.ts` (mới)

## Kiểm chứng
- `prisma migrate deploy` → applied
- `prisma migrate diff` → `No difference detected` (schema khớp DB, không drift)
- `tsc --noEmit` → sạch
