# Chuẩn Code

> Cập nhật: 2026-08-02 · Đây là mô tả những quy ước **đang thực sự áp dụng** trong repo, không phải mong muốn.

## Nguyên tắc nền

**YAGNI · KISS · DRY.** Ưu tiên code chạy được và dễ đọc hơn là style hoàn hảo. Không tạo file "enhanced" song song — sửa thẳng file đang có.

## Đặt tên file

| Loại | Quy ước | Ví dụ |
|------|---------|-------|
| TS/TSX | kebab-case, tên mô tả rõ mục đích | `get-classroom-context.ts`, `practice-prompt-navigator.tsx` |
| Test | trùng tên file được test + `.test.ts` | `practice-types.test.ts` |
| Route handler | thư mục theo URL + `route.ts` | `api/classroom/[code]/join/route.ts` |
| Migration | `<timestamp>_<mô_tả_snake_case>` | `20260802015300_v4_classroom_multi_lesson_and_practice` |

Tên dài không sao — quan trọng là đọc tên file đã hiểu nó làm gì, khỏi phải mở ra coi.

## Kích thước file

**Giữ dưới 200 dòng.** Vượt thì tách:

- Component to → tách phần con ra file riêng (ví dụ `classroom-viewer.tsx` tách ra `classroom-header-bar.tsx`; `tab-writing-practice.tsx` tách ra `practice-result-card.tsx`, `practice-summary-card.tsx`).
- Logic lặp ở nhiều nơi → gom vào `src/lib/` (ví dụ `display-name.ts`, `member-cookie.ts`, `handle-route-error.ts`).

## Ngôn ngữ

| Chỗ | Ngôn ngữ |
|-----|----------|
| Commit message | **Tiếng Anh**, conventional commit |
| Comment trong code | **Tiếng Anh** (comment mới) |
| Chuỗi hiển thị cho người dùng | Tiếng Việt |
| Tài liệu trong `docs/`, `plans/` | Tiếng Việt |

Ngoại lệ giữ tiếng Việt trong code: thuật ngữ nghiệp vụ dịch ra sẽ tối nghĩa.

**Không đi dịch hàng loạt comment cũ** — chỉ viết tiếng Anh cho comment mới, tránh phình diff.

### Viết comment thế nào

Comment giải thích **tại sao**, không phải **cái gì**. Ưu tiên ghi lại quyết định và cái bẫy đã gặp:

```ts
// keepMounted is REQUIRED, not cosmetic: Base UI's Tabs.Panel defaults to
// keepMounted={false}, which unmounts the hidden panel and throws away all
// of its React state.
```

## Server Components trước

Search / lọc / phân trang / hiển thị danh sách → **làm ở server**.

- Query + filter + sort + paginate trong Server Component, dùng `searchParams`.
- **Không** kéo hết data về browser rồi filter bằng JS.
- Client Component chỉ dùng khi cần tương tác thật (socket, form, animation).
- Widget cần data lúc mount → **server truyền xuống qua prop**, đừng fetch trong `useEffect`. Xem `PointsWidget` nhận `initialData`.

Ngoại lệ (phải nói rõ trước khi làm): data nhỏ cố định trong trang, hoặc bắt buộc realtime/offline ở client.

## Database

**LUẬT CỨNG: không bao giờ dùng `prisma db push`.** Mọi thay đổi schema phải có migration:

```bash
npx prisma migrate dev --name mo_ta_thay_doi
# hoặc review SQL trước:
npx prisma migrate dev --name ... --create-only   # → sửa SQL → migrate deploy
```

Lý do: `db push` làm schema thật trên DB lệch khỏi lịch sử migration (migration được track trong git).

Khi migration đụng data đang có: **rename cột thay vì drop + add**, và viết backfill trong cùng file SQL. Xem `20260802015300_v4_...` làm mẫu.

Kiểm tra không lệch:

```bash
npx prisma migrate diff --from-schema-datamodel prisma/schema.prisma \
  --to-schema-datasource prisma/schema.prisma --exit-code
```

## Xử lý lỗi & bảo mật

- Route handler: `catch (error: unknown)` rồi trả `handleRouteError("METHOD /đường/dẫn", error)`. Không tự chế lại nhánh 401/500.
- **Không trả nội dung lỗi nội bộ về client** — log ở server, client nhận thông điệp chung.
- Server Action: kiểm tra quyền **trước** khi làm việc nặng (xem `ingestLessonAction` chặn non-host trước khi gọi AI).
- Danh tính lấy từ session, **không lấy từ giá trị client gửi lên**.
- Socket event có đặc quyền chỉ do server phát sau khi kiểm tra quyền.
- Không commit `.env`, API key, thông tin DB.

## TypeScript

- **Không dùng `any`.** Dùng `unknown` rồi thu hẹp kiểu, hoặc khai báo interface.
- Cần ép kiểu giữa 2 kiểu tương đương về cấu trúc nhưng khác tên (ví dụ JSON schema → `Schema` của Gemini) thì `as unknown as X` **kèm comment giải thích**.
- Type dùng chung giữa server và client để ở file **không có** `import "server-only"` (xem `practice-types.ts` vs `practice-attempts.ts`).

## React

- Không `setState` đồng bộ trong `useEffect`. Thay bằng:
  - Suy ra từ prop/state có sẵn (xem `isSquishing` trong `cat-sprite.tsx`).
  - `useSyncExternalStore` cho cờ mounted (`use-is-mounted.ts`).
  - Server truyền data xuống qua prop.
- Callback từ prop mà effect cần dùng → giữ trong `useRef`, đừng bỏ vô dependency (tránh re-subscribe mỗi lần render).
- Bắt buộc phải phá luật lint thì dùng `eslint-disable-next-line` **hẹp đúng 1 dòng + ghi rõ lý do**. Không disable cả file.

## Trước khi commit / push

```bash
npx tsc --noEmit     # phải sạch
npx eslint .         # phải sạch
npx vitest run       # phải pass hết
npx next build --webpack
```

**Không bỏ qua test rớt cho build xanh.** Không xài mock/fake/mẹo tạm để qua CI.

Test integration cần Postgres chạy sẵn và migration đã apply cho DB test — xem [testing.md](testing.md).

## Lint

`.claude/`, `.agents/`, `.opencode/`, `.cursor/` bị bỏ qua trong `eslint.config.mjs` — đó là script tooling vendored, không phải code app.

`server.js` được tắt riêng rule `no-require-imports` vì bắt buộc phải là CommonJS (`package.json` không có `"type": "module"`).
