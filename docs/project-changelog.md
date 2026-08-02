# Changelog

> Ghi lại thay đổi đáng kể theo từng đợt. Dựng lại từ lịch sử git + thư mục `plans/`.
> Định dạng theo tinh thần [Keep a Changelog](https://keepachangelog.com/vi/1.1.0/).

---

## [V4] Refactor lớp học — 2026-08-02

Đợt refactor xử lý 4 vấn đề người dùng báo, cộng vài lỗi chặn cứng phát hiện trong lúc làm.
Kế hoạch chi tiết: `plans/260802-0853-classroom-refactor/`

### Thêm mới

- **Xóa lớp học vĩnh viễn** — server action `deleteClassroomAction`, chỉ host, bắt gõ lại mã lớp để xác nhận, dialog báo trước sẽ mất bao nhiêu bài học và thành viên.
- **Một lớp chứa nhiều bài học** — sidebar liệt kê bài trong lớp, host chuyển bài cho cả lớp hoặc xóa từng bài.
- **Lưu tiến độ luyện viết** — bảng `PracticeAttempt`, resume đúng câu chưa làm kể cả sau khi F5.
- **Realtime peer trong tab Practice** — chip câu hỏi hiện avatar bạn học kèm đúng/sai, xem được câu trả lời của bạn (khóa tới khi mình làm xong), bảng xếp hạng live, feed hoạt động.
- Đặt tên cho lớp học (`Classroom.name`).
- `GET /api/practice/[lessonId]` — trạng thái luyện tập đầy đủ, dùng để đồng bộ lại sau khi socket reconnect.
- `handleRouteError()` dùng chung cho mọi route handler.
- `useIsMounted()` thay cho idiom `useState` + `useEffect` để gate `createPortal`.

### Sửa lỗi

- **Tab Practice tụt về 5%** — Base UI `Tabs.Panel` mặc định `keepMounted={false}` nên đổi tab là unmount, mất sạch state. Bật `keepMounted` cho mọi tab. Thanh tiến độ cũng đổi sang tính theo **số câu đã trả lời** thay vì vị trí con trỏ.
- **Học viên không chấm được bài** *(chặn cứng)* — `/api/check-writing` lọc `lesson.userId === session.userId` nên chỉ chủ bài học chấm được, học viên trong lớp dính 404. Giờ cho phép chủ bài học **hoặc** thành viên lớp.
- **Chiếm danh tính khi vào lớp** *(bảo mật)* — route `join` tìm thành viên theo tên gõ vào; gõ trùng tên người khác là chiếm luôn membership của họ. Chuyển sang khóa theo `userId`.
- **Ai cũng đóng được lớp** *(bảo mật)* — event `end-room` do client phát, không kiểm tra quyền. Chuyển sang server phát sau khi xác nhận host.
- **Thêm video mới ghi đè bài cũ trong lớp** — do `Classroom.lessonId` là quan hệ 1-1.
- **Danh sách thành viên nhấp nháy** — API lọc `lastSeenAt` trong cửa sổ 10s trong khi client heartbeat cũng 10s. Chuyển presence sang lấy từ socket.
- **Nhận diện host bằng `displayName.startsWith("Host")`** — học viên đặt tên "Hostel" là bị nhận nhầm. Đổi sang so `userId === hostUserId`.
- **Cookie thành viên chỉ sống 1 ngày** → hôm sau bị đá ra bắt join lại. Nâng lên 30 ngày, gom về `member-cookie.ts`.
- Lỗi nội bộ không còn rò về client (`handleRouteError` trả thông điệp chung, log ở server).

### Thay đổi

- **Schema V4** (`20260802015300_v4_classroom_multi_lesson_and_practice`):
  - `Lesson` + `classroomId`, `classroomOrder`; bỏ unique `[userId, videoId]` → index
  - `Classroom`: `lessonId` → `currentLessonId`, + `lessons Lesson[]`, + `name`
  - `ClassMember` + `userId` + unique `[classroomId, userId]`
  - Bảng mới `PracticeAttempt`
  - Migration viết tay để **giữ nguyên data**: rename cột thay vì drop/add, kèm backfill
- Trang chủ tách "Lớp đang hoạt động" / "Lớp đã kết thúc"; bài học cá nhân lọc `classroomId: null`.
- `PointsWidget` nhận `initialData` từ server thay vì fetch lúc mount.
- Màn chờ bài học đổi từ `router.refresh()` mỗi 3 giây sang lắng nghe socket (poll dự phòng 20s).
- Form vào lớp bỏ ô số điện thoại — server lấy từ session.
- Tách `classroom-header-bar`, `practice-result-card`, `practice-summary-card` để mọi file dưới 200 dòng.

### Gỡ bỏ

- `GET /api/classroom/[code]/members` — không còn ai gọi sau khi presence chuyển sang socket, và nó nhận diện host bằng string sniff.

### Dọn dẹp

- Lint sạch toàn repo: bỏ hết `any` trong code app, xử lý các lỗi `react-hooks`, bỏ qua lint cho thư mục tooling (`.claude/`, `.agents/`, `.opencode/`, `.cursor/`).
- Thêm 22 unit test mới (`practice-types.test.ts`, `display-name.test.ts`) — tổng 78 test.
- Bổ sung bộ tài liệu: kiến trúc, chuẩn code, lộ trình, changelog.

---

## [V3] Social & Gamification — 2026-07-31

Kế hoạch: `plans/260731-0944-v3-social-gamification/`

- **Điểm & streak** — `UserPoint`, `UserStreak`, API `award`/`today`/`history`, widget streak.
- **Minigame mèo** — `CatState` với 6 trạng thái cảm xúc, API cho ăn/tắm/vuốt/chơi, cron `cat-decay`, widget nổi ở góc màn hình. Con mèo qua nhiều lần thiết kế lại (Three.js 3D → HTML5 Canvas → SVG vector 2D kèm hiệu ứng âm thanh Web Audio và vật lý vuốt ve).
- **Lớp học trực tuyến (Phase 04)** — Socket.io trên custom server, mã lớp 6 ký tự, đồng bộ tab theo host, danh sách thành viên.
- Sửa modal bị cắt bằng `createPortal` render vào `document.body`.

## [V2] Nâng cấp bài học — 2026-07-31

Kế hoạch: `plans/260731-0852-feature-update-v2/`

- Tab **Summary** và tab **Writing Practice** (chấm câu bằng Gemini).
- **IPA** cho từ vựng, có fallback sang Free Dictionary API.
- **Đa ngôn ngữ**: hỗ trợ tiếng Anh và tiếng Trung xuyên suốt form, lấy phụ đề và prompt AI.
- Thiết kế lại toàn bộ UI theo hướng glassmorphism kèm micro-animation.

## [V1] Bản đầu — 2026-07-25

Kế hoạch: `plans/260725-1010-youtube-english-lesson-app/`

- Dựng Next.js + Tailwind + shadcn, schema Prisma cho lesson và flashcard FSRS.
- Pipeline nạp bài: lấy phụ đề YouTube, fallback sang Gemini transcribe, Gemini sinh bài theo format ELLLO.
- Trang bài học với các tab và player tua theo timestamp.
- Ôn flashcard bằng `ts-fsrs`.
- Xác thực bằng mật khẩu chung, sau đó nâng lên đăng nhập theo số điện thoại kèm cô lập dữ liệu từng người.
- Docker + Dokploy, bộ test unit và integration.
- Xóa bài học kèm cascade; cho phép tùy chỉnh số lượng quiz / từ vựng / ngữ pháp / lượt thoại.
