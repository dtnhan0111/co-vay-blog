# Go Đà Nẵng — kỳ quán số của người chơi cờ Vây

Sổ kỳ quán của người chơi cờ Vây Đà Nẵng: đánh xong ghi lại vài dòng, nhiều năm sau nhìn lại vẫn nhớ đã gặp ai bên bàn cờ. Giống Strava cho kỳ thủ: không chơi online, mà **ghi lại những ván đã đánh thật** (tại CLB, quán trà, nhà bạn bè), để đối thủ xác nhận, rồi cả cộng đồng cùng nhìn lại.

Tài liệu thiết kế (yêu cầu chức năng, user flow, ERD, cấu trúc thư mục, wireframe): [docs/DESIGN.md](docs/DESIGN.md).

> App chạy bằng dữ liệu thật trên Supabase, **không có dữ liệu mẫu**. Chưa cấu hình Supabase thì app chỉ hiện màn hình "Kỳ quán chưa mở cửa".

## Cài đặt (làm một lần)

1. **Tạo project Supabase** (supabase.com, gói Free là đủ) hoặc chạy local bằng `supabase start`.
2. **Áp schema:** lần lượt dán từng file trong `supabase/migrations/` (đúng thứ tự tên: `init`, `match_sgf`, `admin`, `tighten_grants`, `match_comments`) vào *SQL Editor* và Run (hoặc `supabase db reset` khi chạy local).
3. **Bật đăng nhập Google:** *Authentication → Providers → Google*. Tạo OAuth client ở Google Cloud Console (loại *Web application*), dán Client ID/Secret vào Supabase, và thêm *Authorized redirect URI* mà Supabase hiển thị.
4. **Khai báo URL:** *Authentication → URL Configuration*
   - *Site URL*: địa chỉ site thật, ví dụ `https://co-vay-blog.vercel.app`
   - *Redirect URLs*: thêm `https://co-vay-blog.vercel.app/auth/callback` và `http://localhost:3000/auth/callback`
5. **Biến môi trường** (Vercel → Settings → Environment Variables, và `.env.local` khi chạy máy bạn). Lấy ở *Project Settings → API*:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```
6. `npm install && npm run dev` (hoặc redeploy trên Vercel).

### Thêm câu lạc bộ thật

CLB do quản trị viên thêm bằng SQL Editor (chưa có màn hình admin):

```sql
insert into public.clubs (slug, name, description, address, meets_at) values
  ('ten-clb', 'Tên CLB', 'Một hai câu giới thiệu', 'Khu vực / địa chỉ', 'Thứ bảy, 14:00–18:00');
```

Thành viên chọn CLB của mình trong *Sửa hồ sơ*. Ô địa điểm khi ghi ván cho chọn nhanh theo danh sách CLB hoặc gõ tự do.

### Quản trị viên

Admin được thêm / thay / gỡ kỳ phổ của **mọi** ván (ngoài hai người chơi). Chỉ đặt được bằng SQL, người dùng không tự phong được:

```sql
update public.users set is_admin = true
where auth_id = (select id from auth.users where lower(email) = 'ban@gmail.com');
```

### Tạo sẵn hồ sơ cho người chưa đăng nhập (tuỳ chọn)

Đăng nhập Google lần đầu sẽ *nhận* hồ sơ có cùng email (không phân biệt hoa thường), nếu không có thì tạo hồ sơ mới ở hạng 10 kyu. Muốn ghi trước một người sẽ tham gia:

```sql
insert into public.users (display_name, email, rank_value) values ('Họ và tên', 'ho@gmail.com', 1);
```

## Cách hoạt động

- **Đối thủ là thành viên:** ván ở trạng thái *chờ*, đối thủ nhận lời mời, bấm "Đúng rồi" thì ván lên kỳ phổ và được tính vào thống kê. "Có sai sót" thì ván bị trả lại kèm lý do.
- **Đối thủ chưa dùng app:** người ghi gõ tên đối thủ, app tạo một **hồ sơ khách** gắn với người ghi. Ván được ghi ngay (không ai xác nhận được) và thẻ ván có nhãn "Ghi một phía". Ván với khách **không tính vào Bảng vàng** để không ai tự bịa khách nhằm nâng thành tích; trên hồ sơ cá nhân thì vẫn hiện. Người tạo khách sửa được tên/hạng của khách đó.
- **Kỳ phổ SGF:** hai người chơi của ván tải file `.sgf` lên (lúc ghi ván hoặc về sau, trang chi tiết ván), có thể thay hoặc gỡ. Kỳ phổ **công khai** cùng ván: ai mở trang ván cũng tái hiện được từng nước (lùi/tiến, kéo thanh trượt, phím mũi tên, tự chạy, đếm quân bắt, lời bình trong file). Bộ đọc SGF và bộ máy bàn cờ (bắt quân, tự sát) tự viết trong `src/lib/sgf/`, có test; chỉ theo đường chính của cây ván, hỗ trợ bàn 9/13/19, tối đa 200 KB, tự nhận bảng mã CA[...] (GBK, Shift_JIS…). Kỳ phổ phải cùng kích thước bàn với ván. Danh sách ván không tải nội dung SGF, chỉ cột `has_sgf`.
- **Bình luận kỳ phổ:** chỉ ván đã xác nhận **và có kỳ phổ** mới có mục bình luận (nút bung/thu gọn dưới bàn cờ). Ai cũng đọc được; chỉ thành viên đăng nhập mới viết (tối đa 500 ký tự), có thể gắn với một nước ("Nước 45", bấm vào là bàn cờ nhảy tới nước đó). Mỗi bình luận có "Đặt một quân"; tác giả hoặc admin xoá được, không sửa được sau khi đăng.
- **Quyền riêng tư và an toàn dữ liệu:** quyền ghi được cấp **theo từng cột** (migration `tighten_grants`): người chơi chỉ sửa được cột `sgf` của ván, đối thủ chỉ trả lời `status`/`reason`, không ai sửa được người thắng, điểm hay tự đổi vai trò admin. Lưu ý: Supabase tự cấp toàn quyền trên bảng mới, nên mọi bảng mới phải được siết như vậy.
- **Quyền riêng tư:** email không bao giờ lộ ra client (column-level grant); ván chưa xác nhận chỉ hai người chơi thấy.

## Kiến trúc ngắn gọn

| Lớp | Ở đâu | Ghi chú |
|-----|-------|---------|
| Schema, RLS, trigger | `supabase/migrations/` | Ván mới → trigger tạo yêu cầu xác nhận (hoặc tự xác nhận nếu đối thủ chưa có tài khoản) → đối thủ trả lời → trigger cập nhật `matches.status`. |
| Truy cập dữ liệu | `src/lib/data/` | Interface `Repository`, hiện thực Supabase. |
| Thống kê | `src/lib/stats.ts` | Hàm thuần, có test (`npm test`); profile, đối đầu, thống kê, API dùng chung. |
| API | `src/app/api/**` | `GET/POST /api/matches`, `GET/DELETE /api/matches/:id`, `POST /api/matches/:id/confirm`, `POST /api/matches/:id/kudos`, `GET/POST /api/players`, `GET/PATCH /api/players/:id`, `GET /api/head-to-head`, `GET /api/stats`. Validate bằng zod. |
| UI | `src/components/go/` | Quân cờ, avatar, thẻ gỗ, bàn cờ hoạt động 19×19, loader quân rơi. |

Trang: Trang chủ (kỳ phổ, khay xác nhận) · Ghi ván · Kỳ thủ · Hồ sơ · Đối đầu · Thống kê · Chi tiết ván · Đăng nhập.

## Scripts

```bash
npm run dev          # phát triển
npm run build        # build production
npm run typecheck    # tsc --noEmit
npm run lint
npm test             # test thống kê (node:test + tsx)
```

Sau khi đổi schema, sinh lại kiểu: `supabase gen types typescript --local > src/types/database.ts` (file hiện tại viết tay theo đúng định dạng đó).

## Giới hạn đã biết

- Thống kê tính trong ứng dụng từ toàn bộ ván đã xác nhận: ổn cho quy mô một thành phố (hàng nghìn ván). Lớn hơn thì chuyển sang SQL view.
- Hồ sơ khách chưa gộp được vào tài khoản khi người đó đăng ký sau (cần admin gộp bằng SQL).
- Kỳ phổ: chưa hiện biến thể (nhánh phụ) và chưa có số thứ tự nước trên quân.
- Ván chờ xác nhận không tự hết hạn. Chưa có màn hình admin. Bảng `kudos` là bảng thứ 5 ngoài 4 bảng gốc.

## Roadmap gợi ý

Gộp hồ sơ khách vào tài khoản · tự xác nhận sau N ngày · thông báo (email/Zalo) khi có lời mời · tải kỳ phổ SGF · giải đấu nội bộ CLB · xếp hạng Elo · trang CLB riêng · vai trò admin.

---

Bản blog cờ vây cũ (HTML tĩnh) được lưu ở [archive/co-vay-blog-v1/](archive/co-vay-blog-v1/).
