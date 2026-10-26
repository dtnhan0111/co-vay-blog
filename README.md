# Go Đà Nẵng — kỳ quán số của người chơi cờ Vây

Cộng đồng cờ Vây **ngoài đời** của Đà Nẵng. Giống Strava cho kỳ thủ: không chơi online, mà **ghi lại những ván đã đánh thật** (tại CLB, quán trà, nhà bạn bè), để đối thủ xác nhận, rồi cả cộng đồng cùng nhìn lại.

> Đây không phải một hệ thống quản lý. Là một quán trà có bàn cờ: nền lưới bàn cờ, thẻ gỗ, avatar là quân đen/trắng, và "kudos" là *đặt một quân*.

Tài liệu thiết kế đầy đủ (yêu cầu chức năng, user flow, ERD, cấu trúc thư mục, wireframe): [docs/DESIGN.md](docs/DESIGN.md).

## Chạy nhanh (demo mode — không cần backend)

```bash
npm install
npm run dev        # http://localhost:3000
```

Khi chưa cấu hình Supabase, app chạy ở **demo mode** với 20 kỳ thủ, 5 CLB và ~200 ván **hư cấu**, ngày tháng luôn tính theo hôm nay. Ở trang `/login` bạn chọn "ngồi vào ghế" một kỳ thủ mẫu (gợi ý: *Nguyễn Thị Thu Hiền* — đang có một lời mời xác nhận chờ, một ván đã gửi, một ván bị báo sai).

Dữ liệu demo sống trong bộ nhớ server, khởi động lại là về trạng thái ban đầu.

Thử luồng chính trong hai tab ẩn danh: Hiền ghi ván với *Đặng Hoài Nam* → đăng nhập demo bằng Nam → "Đúng rồi" → ván lên kỳ phổ.

## Dùng Supabase thật

1. Tạo project Supabase (hoặc `supabase start` để chạy local).
2. Áp schema và dữ liệu mẫu:
   ```bash
   supabase db reset            # chạy migrations/ + seed.sql (local)
   # hoặc dán supabase/migrations/20260101000000_init.sql, rồi supabase/seed.sql vào SQL editor
   ```
3. Bật Google: *Authentication → Providers → Google* (tạo OAuth client ở Google Cloud Console; redirect URI là callback của Supabase). Thêm `http://localhost:3000/auth/callback` vào *Redirect URLs*.
4. Tạo `.env.local`:
   ```bash
   cp .env.example .env.local   # điền NEXT_PUBLIC_SUPABASE_URL và NEXT_PUBLIC_SUPABASE_ANON_KEY
   ```
5. `npm run dev`.

**Nhận lại hồ sơ mẫu khi đăng nhập:** đăng nhập Google lần đầu sẽ *nhận* hồ sơ có cùng email (không phân biệt hoa thường), nếu không có thì tạo hồ sơ mới. Để nhập vai một kỳ thủ trong seed:

```sql
update public.users set email = 'ban@gmail.com' where display_name = 'Nguyễn Thị Thu Hiền';
```

Sau thay đổi schema, sinh lại kiểu bằng `supabase gen types typescript --local > src/types/database.ts` (file hiện tại được viết tay theo đúng định dạng đó).

## Kiến trúc ngắn gọn

| Lớp | Ở đâu | Ghi chú |
|-----|-------|---------|
| Schema, RLS, trigger | `supabase/migrations/` | Ván mới → trigger tạo yêu cầu xác nhận → đối thủ trả lời → trigger cập nhật `matches.status`. Email không bao giờ lộ ra client (column-level grant). |
| Dữ liệu mẫu | `src/lib/seed/source.ts` | Một nguồn cho cả demo mode và `supabase/seed.sql` (`npm run seed:sql`). |
| Repository | `src/lib/data/` | Một interface, hai hiện thực (Supabase / Demo). Biến môi trường quyết định. |
| Thống kê | `src/lib/stats.ts` | Hàm thuần, có test (`npm test`); profile, đối đầu, thống kê, API đều dùng chung. |
| API | `src/app/api/**` | `GET/POST /api/matches`, `GET/DELETE /api/matches/:id`, `POST /api/matches/:id/confirm`, `POST /api/matches/:id/kudos`, `GET /api/players`, `GET/PATCH /api/players/:id`, `GET /api/head-to-head`, `GET /api/stats`. Validate bằng zod. |
| UI | `src/components/go/` | Ngôn ngữ thị giác: quân cờ, avatar, thẻ gỗ, bàn cờ hoạt động 19×19, loader quân rơi. |

Trang: Trang chủ (kỳ phổ + khay xác nhận) · Ghi ván · Kỳ thủ · Hồ sơ · Đối đầu · Thống kê · Chi tiết ván · Đăng nhập.

## Scripts

```bash
npm run dev          # phát triển
npm run build        # build production
npm run typecheck    # tsc --noEmit
npm run lint
npm test             # test thống kê (node:test + tsx)
npm run seed:sql     # sinh lại supabase/seed.sql
```

## Ghi chú thiết kế & giới hạn đã biết

- **Bảng thứ năm `kudos`** được thêm ngoài 4 bảng yêu cầu để phục vụ "đặt một quân". Bỏ được mà không ảnh hưởng phần còn lại.
- Thống kê tính trong ứng dụng từ toàn bộ ván đã xác nhận — phù hợp quy mô một thành phố (hàng nghìn ván). Khi lớn hơn, chuyển sang SQL view / materialized view.
- Danh sách kỳ thủ chỉ gồm người đã có hồ sơ (đã đăng nhập hoặc được tạo sẵn). Chưa có "thêm khách vãng lai".
- Ván chưa được xác nhận không bao giờ hết hạn tự động.
- Dữ liệu demo hoàn toàn hư cấu.

## Roadmap gợi ý

Tự xác nhận sau N ngày · thông báo (email/Zalo) khi có lời mời · tải kỳ phổ SGF kèm ván · giải đấu nội bộ CLB · xếp hạng Elo · trang CLB riêng · vai trò admin để tạo hồ sơ sẵn.

---

Bản blog cờ vây cũ (HTML tĩnh) được lưu ở [archive/co-vay-blog-v1/](archive/co-vay-blog-v1/).
