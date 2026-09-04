# Cờ Vây Việt — Blog

Dự án blog cộng đồng cờ vây Việt Nam. Mục tiêu: truyền tải và mở rộng phong trào cờ vây thông qua nội dung về nhân vật, CLB, kiến thức nhập môn, tin tức và văn hóa.

## Cấu trúc thư mục

```
co-vay-blog/
├── index.html              # Mockup trang chủ (HTML + CSS thuần)
├── assets/
│   ├── css/
│   │   └── styles.css      # Toàn bộ style của trang chủ
│   ├── js/
│   │   ├── exercise-manifest.js  # Dữ liệu 200 ảnh bài tập, sinh từ content/*.pdf
│   │   └── exercises.js          # Logic chọn ngẫu nhiên 5 bài/ngày + lightbox
│   └── exercises/
│       └── topic-01 … topic-10/  # Ảnh bài tập đã cắt từ sách, theo 10 chủ đề
├── content/
│   ├── co-vay-la-gi-khac-co-vua-the-nao.md   # Bài viết nhập môn (bản nháp)
│   └── Ảnh màn hình...pdf   # Sách "어린이바둑수련장 6" (nguồn ảnh bài tập)
└── README.md
```

## Trạng thái hiện tại

- `index.html` là **mockup tĩnh** cho trang chủ, dùng để thống nhất bố cục và định hướng thiết kế trước khi dựng thành website thật.
- Font dùng: `Noto Serif` (tiêu đề) + `Be Vietnam Pro` (nội dung), load qua Google Fonts.
- Bảng màu: xem biến CSS ở đầu file `styles.css` (`--ink`, `--paper`, `--wood`, `--seal`, `--stone-white`).
- Thư mục `content/` chứa bài viết đã soạn, dùng làm nội dung mẫu khi build trang bài viết chi tiết.

## Các chuyên mục nội dung

1. **Nhân vật** — phỏng vấn kỳ thủ, câu chuyện cá nhân
2. **CLB & Cộng đồng** — giới thiệu các CLB (Bình Nguyên, Đà Nẵng...)
3. **Kiến thức nhập môn** — luật chơi, thuật ngữ, lộ trình học
4. **Tin tức & Sự kiện** — lịch giải, tường thuật, tin liên đoàn
5. **Văn hóa & Câu chuyện** — văn hóa Đông Á, AI và cờ vây
6. **Bài tập cờ vây hôm nay** — mỗi ngày random 5 bài tập từ 5/10 chủ đề (bố cục, sống chết, mạch, xâm nhập, tấn công, định thức, tàn cuộc…), lấy từ 200 trang đã cắt trong `assets/exercises/`. Ngày chẵn dùng chủ đề 1–5, ngày lẻ dùng chủ đề 6–10 (xem `assets/js/exercises.js`).

## Việc cần làm tiếp theo (gợi ý)

- [ ] Viết chi tiết nội dung từng bài trong 5 chuyên mục
- [ ] Dựng trang chi tiết bài viết (`post.html` hoặc chuyển sang framework như Next.js/Astro nếu cần CMS)
- [ ] Thêm trang "Bản đồ CLB toàn quốc"
- [ ] Kết nối form "Gửi thông tin CLB" ở cuối trang chủ
- [ ] Responsive testing kỹ trên mobile
