# Phase 03 — Fix tiến độ tab Practice

**Trạng thái:** ✅ Xong

## Nguyên nhân gốc (đã xác minh trong `node_modules`)

Base UI `Tabs.Panel` mặc định `keepMounted = false`:
- `node_modules/@base-ui/react/tabs/panel/TabsPanel.js:37` → `keepMounted = false`
- cùng file dòng 110 → `const shouldRender = keepMounted || mounted`

Nghĩa là **đổi tab = unmount panel = mất sạch React state**. `TabWritingPractice` giữ `currentIndex` và `scores` trong `useState` (`tab-writing-practice.tsx:42-46` bản cũ) nên quay lại là về câu 1. Gen 20 câu → `1/20 = 5%`, đúng con số người dùng thấy.

Hai lỗi phụ đi kèm:
1. **Không lưu gì xuống DB** → F5 là mất tiến độ.
2. **Thanh tiến độ tính sai ý nghĩa**: công thức cũ `((currentIndex + 1) / total) * 100` bám theo **vị trí con trỏ**, không phải số câu đã làm. Lùi về câu 1 sau khi làm xong 15 câu vẫn hiện 5%.
3. **Lỗi chặn cứng**: `check-writing/route.ts:37` lọc `lesson: { userId: session.userId }` → chỉ chủ bài học chấm được. Học viên trong lớp bấm "Check Answer" là 404.

## Đã làm

- `lesson-tabs.tsx` — thêm `keepMounted` cho **tất cả** `TabsContent`, kèm comment giải thích vì sao đây là bắt buộc chứ không phải làm đẹp.
- `src/lib/practice/practice-attempts.ts` (mới) — `getOwnAttempts`, `getClassroomAttempts`, `savePracticeAttempt` (upsert, tăng `attemptNo`).
- `src/lib/practice/practice-access.ts` (mới) — cho phép **chủ bài học HOẶC thành viên lớp** luyện tập → fix lỗi 404 ở trên.
- `src/lib/practice/practice-types.ts` (mới) — hàm thuần dùng chung: `firstUnansweredIndex`, `mergeAttempt`, `buildLeaderboard`.
- `check-writing/route.ts` — sửa quyền, lưu `PracticeAttempt`, emit `practice-attempt`.
- `GET /api/practice/[lessonId]` (mới) — trả toàn bộ trạng thái luyện tập, dùng để đồng bộ lại sau khi socket reconnect.
- `tab-writing-practice.tsx` viết lại:
  - Resume ở câu chưa làm đầu tiên (`firstUnansweredIndex`)
  - Tiến độ = **số câu đã trả lời** / tổng số câu
  - Đi tới đi lui tự do giữa các câu, có nút "Làm lại câu này"
  - Tách `PracticeResultCard` + `PracticeSummaryCard` cho dưới 200 dòng

## Kiểm chứng
- `src/lib/practice/practice-types.test.ts` — 13 test cho resume / merge / leaderboard
- Toàn bộ suite: 78/78 pass
