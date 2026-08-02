# Lộ Trình Phát Triển

> Cập nhật: 2026-08-02
> Tài liệu sống — cập nhật khi một giai đoạn đổi trạng thái hoặc phạm vi thay đổi.
> Lịch sử chi tiết xem [changelog](project-changelog.md).

## Trạng thái hiện tại

| Chỉ số | Giá trị | Nguồn |
|---|---|---|
| Giai đoạn đã xong | V1 → V4 | `plans/` |
| Migration đã apply | 4 | `prisma/migrations/` |
| File nguồn (ts/tsx) | 128 | `src/` |
| Test | 78 pass / 11 file | `npx vitest run` |
| Lint | Sạch | `npx eslint .` |
| Typecheck | Sạch | `npx tsc --noEmit` |
| Build | Thành công, 23 route | `npx next build --webpack` |

## Các giai đoạn

### ✅ V1 — Bản đầu (2026-07-25)

`plans/260725-1010-youtube-english-lesson-app/` — 8 phase, hoàn thành.

Dựng app, pipeline nạp bài từ YouTube + Gemini, trang bài học nhiều tab, ôn flashcard FSRS, xác thực, Docker, test.

### ✅ V2 — Nâng cấp bài học (2026-07-31)

`plans/260731-0852-feature-update-v2/` — 7 phase, hoàn thành.

Tab Summary, tab luyện viết có AI chấm, IPA, hỗ trợ tiếng Trung, thiết kế lại UI.

### ✅ V3 — Social & Gamification (2026-07-31)

`plans/260731-0944-v3-social-gamification/` — 4 phase, hoàn thành.

Điểm và streak, minigame mèo, lớp học trực tuyến bản đầu bằng Socket.io.

### ✅ V4 — Refactor lớp học (2026-08-02)

`plans/260802-0853-classroom-refactor/` — 5 phase, hoàn thành.

Một lớp chứa nhiều bài, xóa được lớp, tiến độ luyện viết lưu DB, tương tác realtime giữa học viên, dọn UX và lint.

---

## Việc còn treo

Những chỗ đã nhận diện nhưng **cố ý chưa làm**. Không có deadline — làm khi cần.

### Nợ kỹ thuật

| Việc | Vì sao còn treo | Ảnh hưởng |
|---|---|---|
| `docs/testing.md` và `docs/deployment.md` đang viết tiếng Anh | Có từ trước khi chốt quy ước tài liệu tiếng Việt | Nhẹ — trong `docs/` đang lẫn 2 ngôn ngữ |
| Metadata mặc định trong `src/app/layout.tsx` vẫn là "Create Next App" | Chưa ai đụng tới | Nhẹ — tiêu đề tab trình duyệt và SEO |
| Cảnh báo Next 16: convention `middleware` đã deprecated, nên đổi sang `proxy` | Chưa bắt buộc | Nhẹ — sẽ vỡ ở bản Next sau |
| Feed hoạt động của lớp chỉ nằm trong bộ nhớ | YAGNI — nó là "không khí lớp học", không phải hồ sơ | Reload là mất |
| Ba `eslint-disable-next-line` có ghi rõ lý do (`cat-sprite`, `cat-widget`) | Animation/polling do prop và route kích hoạt — quy tắc lint khắt khe quá mức ở đây | Không |

### Ý tưởng tính năng (chưa cam kết)

- Host xem được tiến độ chi tiết từng học viên (hiện chỉ có bảng xếp hạng).
- Sắp xếp lại thứ tự bài trong lớp bằng kéo thả (`Lesson.classroomOrder` đã có sẵn, UI chưa làm).
- Bài tập luyện viết cho phép nộp lại nhiều lần và xem lịch sử (`PracticeAttempt.attemptNo` đã đếm rồi, UI chưa hiện).
- Đồng bộ vị trí video giữa host và học viên (`Classroom.currentSegment` đã có trong schema, chưa nối vào player).

## Quy ước cập nhật tài liệu này

Cập nhật khi:

- Một giai đoạn đổi trạng thái (đang làm → xong).
- Có tính năng lớn được ship, hoặc phạm vi/timeline thay đổi.
- Phát hiện nợ kỹ thuật đáng ghi nhớ — thêm vào bảng "Việc còn treo" kèm lý do.

Đi kèm: thêm mục tương ứng vào [changelog](project-changelog.md), và cập nhật [kiến trúc](system-architecture.md) nếu cấu trúc hệ thống đổi.
