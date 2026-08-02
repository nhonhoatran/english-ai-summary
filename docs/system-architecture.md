# Kiến Trúc Hệ Thống

> Cập nhật: 2026-08-02 · Nguồn: đọc trực tiếp từ code trong `src/`, `prisma/schema.prisma`, `server.js`

## Tổng quan

Ứng dụng học tiếng Anh/Trung từ video YouTube. AI (Gemini) sinh ra bài học gồm transcript, hội thoại, ngữ pháp, từ vựng, quiz và bài luyện viết. Người dùng học một mình hoặc mở **lớp học trực tuyến** để học cùng nhau theo thời gian thực.

## Stack

| Lớp | Công nghệ | Ghi chú |
|-----|-----------|---------|
| Framework | Next.js 16 (App Router) | Build bằng `--webpack` (Turbopack sinh hashed external modules gây lỗi Docker) |
| UI | React 19, Tailwind CSS v4, Base UI (`@base-ui/react`) | shadcn-style component trong `src/components/ui/` |
| Database | PostgreSQL + Prisma 6 | Migration bắt buộc, **không dùng `db push`** |
| AI | `@google/genai` (Gemini) | Sinh bài học + chấm bài luyện viết |
| Realtime | Socket.io | Custom server `server.js` bọc Next |
| Ôn tập | `ts-fsrs` | Thuật toán spaced repetition cho flashcard |
| Test | Vitest | Unit + integration (DB thật, tách riêng) |

## Custom server

`server.js` bọc Next trong một HTTP server để gắn Socket.io vào cùng process:

- Socket path: `/api/socket/io`
- Gán `global.io` → route handler và server action phát event được qua `src/lib/realtime/emit-to-room.ts`
- Giữ **presence** trong bộ nhớ: `Map<roomCode, Map<socketId, info>>`, gộp theo `userId` (mở nhiều tab vẫn tính 1 người)

**Hệ quả:** phải chạy bằng `node server.js` (script `pnpm dev`), không dùng `next dev`/`next start` trực tiếp — mất realtime.

## Cấu trúc thư mục

```
src/
├── app/
│   ├── actions/          # Server Actions (ingest, xóa lesson/classroom, chọn bài, chấm điểm flashcard)
│   ├── api/              # Route handlers
│   │   ├── cat/          # Minigame mèo (feed/bath/pet/play)
│   │   ├── classroom/    # create, [code]/{join,end,state,sync}
│   │   ├── points/       # award, history, today
│   │   ├── practice/     # [lessonId] — trạng thái luyện viết
│   │   ├── check-writing/# Chấm câu bằng Gemini
│   │   └── cron/         # cat-decay (gọi bằng CRON_SECRET)
│   ├── classroom/[code]/ # Trang lớp học
│   ├── lessons/[id]/     # Trang bài học đơn
│   └── review/           # Ôn flashcard FSRS
├── components/
│   ├── cat/ classroom/ lesson/ points/ practice/ review/ ui/
└── lib/
    ├── api/              # handleRouteError dùng chung
    ├── auth/             # Cookie session ký HMAC bằng WebCrypto
    ├── classroom/        # display-name, member-cookie, get-classroom-context, generate-code
    ├── fsrs/             # Bọc ts-fsrs
    ├── gemini/           # client, prompt, schema, 2 strategy sinh bài
    ├── ingest/           # Pipeline nạp video → bài học
    ├── points/           # Điểm, streak
    ├── practice/         # Lưu/đọc bài luyện viết + hook realtime
    ├── react/            # use-is-mounted
    └── realtime/         # emit-to-room
```

## Mô hình dữ liệu (rút gọn)

```
User ──< Lesson ──< TranscriptSegment / DialogueLine / GrammarPoint
  │        │        QuizQuestion / VocabItem / WritingPrompt
  │        └──< PracticeAttempt
  ├──< Classroom (host) ──< Lesson          (1 lớp — nhiều bài)
  │                     └──< ClassMember
  ├──< Flashcard ──< ReviewLog
  ├──< UserPoint / UserStreak / CatState
```

Điểm cần nhớ:

- **`Lesson.classroomId` nullable**: `null` = bài học cá nhân, có giá trị = bài thuộc lớp. Xóa lớp thì bài trong lớp xóa theo (cascade).
- **`Classroom.currentLessonId`**: bài mà cả lớp đang học, host đổi được.
- **`Lesson` KHÔNG unique `[userId, videoId]`** — cùng một host được thêm cùng một video vào nhiều lớp. Idempotency xử lý trong `ingest-lesson.ts` bằng `findFirst({ userId, videoId, classroomId })`.
- **`PracticeAttempt`** vừa là bài đã chấm vừa là kho tiến độ: học viên resume ở câu đầu tiên chưa có dòng nào. Không có bảng progress riêng.

## Luồng chính

### Nạp bài học (`src/lib/ingest/ingest-lesson.ts`)

```
URL YouTube
  → parseYoutubeUrl()          tách videoId, chặn playlist
  → tìm Lesson trùng (scoped theo classroomId)  → reuse nếu đã READY
  → tạo/reset Lesson ở trạng thái GENERATING
  → fetchYoutubeCaptions()     có phụ đề? dùng luôn : nhờ Gemini transcribe
  → generateLesson()           Gemini sinh summary/dialogue/grammar/quiz/vocab/writing
  → enrichVocabWithIpa()       Free Dictionary API (chỉ tiếng Anh)
  → $transaction               xóa dữ liệu cũ + ghi toàn bộ, set READY
```

Lỗi → `status = FAILED` kèm `errorMessage` đã được làm sạch (không lộ chi tiết nội bộ).

### Lớp học realtime

```
Host tạo lớp        → mã 6 ký tự, host thành ClassMember luôn
Học viên vào lớp    → /api/classroom/[code]/join, khóa danh tính theo userId
Client join socket  → { code, userId, memberId, displayName }
Host đổi tab        → socket "sync-state" + ghi DB → member đang bật đồng bộ đổi theo
Học viên chấm bài   → /api/check-writing lưu PracticeAttempt → server emit "practice-attempt"
                      → cả lớp thấy: chip câu hỏi, bảng xếp hạng, feed hoạt động
Host kết thúc/xóa   → server emit "room-ended" / "room-deleted"
```

**Nguyên tắc:** event có tính đặc quyền (`room-ended`, `room-deleted`, `lesson-switched`) **chỉ do server phát** sau khi kiểm tra quyền host. Client chỉ được phát `join-room`, `leave-room`, `request-presence`, `sync-state`.

### Socket event

| Event | Hướng | Ý nghĩa |
|-------|-------|---------|
| `join-room` / `leave-room` | client → server | Vào/rời phòng, kèm danh tính |
| `request-presence` | client → server | Xin roster hiện tại |
| `presence-updated` | server → client | Danh sách đang online |
| `member-joined` / `member-left` | server → client | Feed hoạt động |
| `sync-state` → `state-updated` | client(host) → cả phòng | Đồng bộ tab |
| `practice-attempt` | server → cả phòng | Có người vừa chấm bài |
| `lesson-switched` / `lessons-changed` | server → cả phòng | Bài học trong lớp thay đổi |
| `room-ended` / `room-deleted` | server → cả phòng | Lớp đóng / bị xóa |

### Xác thực

Một mật khẩu chung (`APP_PASSWORD`) cho cả app. Đăng nhập xong nhận cookie session ký HMAC (`src/lib/auth/auth-cookie.ts`, dùng WebCrypto để chạy được ở Edge middleware). `src/middleware.ts` chặn **mọi** route trừ `/login` và `/api/login`.

**Hệ quả quan trọng:** mọi người trong lớp học đều là `User` đã đăng nhập → định danh realtime khóa theo `userId` được, không cần cơ chế riêng.

### Gamification

- `UserPoint` ghi từng lần cộng điểm theo `PointSource`; `UserStreak` giữ chuỗi ngày.
- `CatState` là con mèo ảo, tâm trạng tính trong `compute-cat-mood.ts` từ đói/bẩn/vui + điểm hôm nay + giờ trong ngày + có đang ở trang bài học không.
- `/api/cron/cat-decay` chạy định kỳ để mèo đói/bẩn dần, bảo vệ bằng `CRON_SECRET`.

## Ràng buộc & quyết định đáng nhớ

| Quyết định | Lý do |
|---|---|
| Build bằng `next build --webpack` | Turbopack sinh hashed external modules làm hỏng image Docker |
| `keepMounted` trên mọi `TabsContent` | Base UI mặc định unmount panel ẩn → mất sạch state tab Practice |
| Presence từ socket, không từ `lastSeenAt` | Cửa sổ 10s + heartbeat 10s làm danh sách nhấp nháy |
| `PracticeAttempt` gộp tiến độ + kết quả | Một nguồn sự thật cho progress, bảng xếp hạng và feed |
| Không unique `[userId, videoId]` | Chặn host tái sử dụng video giữa các lớp |

## Tài liệu liên quan

- [Chuẩn code](code-standards.md)
- [Lộ trình phát triển](development-roadmap.md)
- [Changelog](project-changelog.md)
- [Hướng dẫn test](testing.md) *(tiếng Anh)*
- [Hướng dẫn deploy](deployment.md) *(tiếng Anh)*
