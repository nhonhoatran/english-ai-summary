# Phase 02 — Xóa lớp học + quản lý nhiều bài trong lớp

**Trạng thái:** ✅ Xong

## Vấn đề gốc
Không tồn tại API xóa lớp — chỉ có `POST /api/classroom/[code]/end` set `isActive=false`, và card lớp học không có nút xóa. Lớp đã kết thúc vẫn nằm trong danh sách trang chủ vì query không lọc `isActive`.

## Đã làm

### Xóa lớp (hard delete)
- `src/app/actions/delete-classroom-action.ts` (mới)
  - `deleteClassroomAction(code, confirmCode)` — chỉ host, bắt buộc `confirmCode` khớp mã lớp
  - `getClassroomDeletionSummary(code)` — trả số bài học + thành viên để hiện trong dialog
  - Cascade trong migration lo phần xóa lessons / members / attempts
  - Emit `room-deleted` **trước khi** xóa row để người đang trong lớp biết
- `src/components/classroom/delete-classroom-button.tsx` (mới) — dialog bắt gõ lại mã lớp; nút đặt **ngoài** thẻ `<Link>` để mở dialog không bị điều hướng

### Quản lý nhiều bài trong lớp
- `src/app/actions/classroom-lesson-actions.ts` (mới)
  - `selectClassroomLessonAction` — host chuyển cả lớp sang bài khác, emit `lesson-switched`
  - `removeClassroomLessonAction` — xóa 1 bài; nếu đang là bài hiện tại thì tự rơi về bài kế tiếp thay vì để lớp trống
- `src/components/classroom/classroom-lesson-list.tsx` (mới) — sidebar liệt kê bài, host bấm ▶ để chuyển bài, 🗑 để xóa
- `ClassroomAddLesson` hiển thị số bài đang có, nói rõ bài mới được thêm vào cuối

### Bảo mật
- `end-room` trước đây do **client** emit → ai cũng đóng được lớp. Chuyển sang server emit trong `end/route.ts` sau khi đã kiểm tra host.
- `join/route.ts`: định danh theo `session.userId` chứ không theo tên gõ vào — trước đây gõ trùng tên người khác là **chiếm luôn** membership của họ.

## File chính
`delete-classroom-action.ts`, `classroom-lesson-actions.ts`, `delete-classroom-button.tsx`, `classroom-lesson-list.tsx`, `classroom-list-card.tsx`, `classroom-header-bar.tsx`, `src/app/page.tsx`

## Đã xóa
- `src/app/api/classroom/[code]/members/route.ts` — không còn ai gọi sau khi presence chuyển sang socket, và nó nhận diện host bằng `displayName.startsWith("Host")` (học viên tên "Hostel" là dính).
