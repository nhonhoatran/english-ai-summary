# Phase 05 — Dọn UX + member list + kiểm thử

**Trạng thái:** ✅ Xong

## Những chỗ thiết kế chưa hợp lý đã dọn

| Chỗ | Trước | Sau |
|-----|-------|-----|
| Danh sách thành viên | Poll `/members` mỗi 5s, API chỉ đếm ai `lastSeenAt` trong 10s trong khi client ping cũng 10s → nhấp nháy hiện-mất | Presence lấy thẳng từ socket, có badge "Realtime / Mất kết nối" |
| Nhận diện host | `displayName.startsWith("Host")` — học viên tên "Hostel" bị nhận nhầm | So sánh `userId === hostUserId` |
| Cookie thành viên | `maxAge` 1 ngày, ghép chuỗi lặp ở 5 chỗ | `src/lib/classroom/member-cookie.ts`, 30 ngày, một chỗ duy nhất |
| Form vào lớp | Bắt gõ số điện thoại dù đã đăng nhập | Bỏ hẳn — server lấy từ session |
| Màn chờ bài học | `router.refresh()` mỗi 3 giây | Nghe socket, poll dự phòng 20s |
| Trang chủ | Lớp đã kết thúc trộn chung với lớp đang mở; bài học trong lớp lẫn vô mục "bài học cá nhân" | Tách 2 mục; bài solo lọc `classroomId: null` |
| Card lớp học | Chỉ hiện tên 1 bài | Tên lớp, số bài học, số thành viên, bài đang học, nút xóa |
| Tạo lớp | Tạo ngay, không tên | Dialog đặt tên lớp (không bắt buộc) |
| Đóng lớp | Chỉ có "Kết thúc lớp" (thực chất là ẩn) | "Kết thúc buổi" (giữ data) và "Xóa lớp" (xóa hẳn) tách bạch |

## Module hóa (theo luật < 200 dòng/file)
Tách từ các file phình to:
- `classroom-header-bar.tsx` ← tách khỏi `classroom-viewer.tsx`
- `practice-result-card.tsx`, `practice-summary-card.tsx` ← tách khỏi `tab-writing-practice.tsx`
- `src/lib/classroom/{display-name,member-cookie,get-classroom-context}.ts` ← gom logic lặp ở 4-5 file

## Kiểm chứng
| Lệnh | Kết quả |
|------|---------|
| `npx tsc --noEmit` | Sạch |
| `npx eslint` (các file đã đụng) | Sạch |
| `npx vitest run` | 78/78 pass (11 file) |
| `npx next build --webpack` | Build thành công, 23 route |
| `prisma migrate diff` | No difference detected |

## Bổ sung sau khi người dùng yêu cầu "dọn nốt"

### Lint sạch toàn repo (từ 1123 → 0)

| Nhóm | Cách xử lý |
|---|---|
| 1055 lỗi trong `.claude/`, `.agents/`, `.opencode/` | Thêm vô `globalIgnores` — script tooling vendored, không phải code app |
| 3 lỗi `no-require-imports` ở `server.js` | Tắt rule riêng cho file này: bắt buộc CommonJS vì `package.json` không có `"type": "module"` |
| 14 route handler `catch (error: any)` giống hệt nhau | Gom về `src/lib/api/handle-route-error.ts`, codemod một lượt. Tiện thể chặn luôn việc rò nội dung lỗi nội bộ về client |
| `any` còn lại (5 chỗ) | `WindowWithWebkitAudio`, `Prisma.InputJsonObject`, `as unknown as Schema`, `err instanceof Error` |
| `set-state-in-effect` (6 chỗ) | Suy từ prop thay vì state (`cat-sprite`, `cat-animated-svg`); `useIsMounted()` bằng `useSyncExternalStore`; `PointsWidget` nhận `initialData` từ server |
| `exhaustive-deps`, unused vars | `useRef` cho callback từ prop; xóa biến thừa; bỏ prop `title` không dùng của `TabSummary` |

Còn **3 `eslint-disable-next-line`** hẹp đúng một dòng, mỗi cái kèm lý do: animation kích hoạt bởi prop (`cat-sprite`) và polling theo route (`cat-widget`) — không hoisted lên server được vì tâm trạng mèo phụ thuộc route hiện tại, mà root layout không re-render khi điều hướng.

### Bộ tài liệu mới trong `docs/`

- `system-architecture.md` — stack, custom server, mô hình dữ liệu, luồng chính, bảng socket event
- `code-standards.md` — quy ước đang thực sự áp dụng (đặt tên, cỡ file, ngôn ngữ, DB, bảo mật, React)
- `development-roadmap.md` — trạng thái V1→V4, việc còn treo kèm lý do
- `project-changelog.md` — dựng lại từ lịch sử git + thư mục `plans/`

Viết bằng tiếng Việt theo quy ước. `testing.md` và `deployment.md` có sẵn từ trước vẫn đang tiếng Anh — đã ghi vào mục "việc còn treo" của roadmap.
