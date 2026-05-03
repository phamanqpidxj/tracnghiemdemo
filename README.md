# Trắc nghiệm Linux — Web luyện thi

Web HTTP để **luyện trắc nghiệm môn Hệ điều hành Linux**, dữ liệu trích xuất từ
file `bài tập linux.docx` và bộ câu hỏi của T.S Đào Thế Long (PDF do bạn cung
cấp).

- **101 câu hỏi** trắc nghiệm có đáp án
  - Phần 1 — Bài tập Linux: 75 câu
  - Phần 2 — Đào Thế Long: 26 câu
- 3 chế độ:
  - **Luyện tập**: kiểm tra đáp án từng câu
  - **Làm bài thi**: hẹn giờ, nộp bài, xem điểm và xem lại
  - **Ngân hàng**: duyệt và tìm kiếm tất cả câu hỏi
- Hoạt động hoàn toàn ở client-side (HTML/CSS/JS), không cần backend
- Hỗ trợ giao diện tối, responsive cho mobile

## Cấu trúc dự án

```text
.
├── index.html       # Trang chính
├── styles.css       # Styles
├── app.js           # Toàn bộ logic quiz
├── questions.json   # Bộ câu hỏi + đáp án
└── server.py        # HTTP server tiện lợi (chỉ stdlib Python)
```

## Chạy local

Vì trình duyệt không cho `fetch()` từ `file://`, hãy phục vụ qua HTTP. Bất kỳ
HTTP server tĩnh nào cũng được:

```bash
# tuỳ chọn 1 — Python stdlib
python3 server.py
# → http://localhost:8000

# tuỳ chọn 2 — http.server có sẵn
python3 -m http.server 8000

# tuỳ chọn 3 — Node
npx serve -l 8000
```

Sau đó mở <http://localhost:8000> trong trình duyệt.

## Triển khai

Vì là static site, chỉ cần upload toàn bộ thư mục lên bất kỳ static host nào:
GitHub Pages, Netlify, Vercel, Cloudflare Pages, S3 + CloudFront…

Ví dụ với GitHub Pages: bật Pages cho branch `main`, root `/`.

## Bộ dữ liệu câu hỏi

Mỗi câu hỏi trong `questions.json`:

```json
{
  "id": 1,
  "section": 1,
  "text": "Với các phiên bản của hệ điều hành mã nguồn linux ...",
  "options": {
    "A": "Không có tổ chức nào chịu trách nhiệm ...",
    "B": "User không quen sử dụng Linux",
    "C": "Khả năng tương thích với phần cứng mới còn hạn chế",
    "D": "Mã nguồn mở nên ai cũng có thể phát triển thêm"
  },
  "answer": "A"
}
```

- `section`: `1` = Bài tập Linux, `2` = Đào Thế Long
- `id`: số thứ tự câu trong tài liệu gốc
- `answer`: đáp án đúng (chữ A/B/C/D)

Một số câu (Q17, Q19, Q46, Q64, Q65 trong tài liệu gốc) không đầy đủ trong
nguồn, đã được lược bỏ. Bạn có thể bổ sung trực tiếp vào `questions.json`.

## Phát triển thêm

Một số ý tưởng có thể thêm sau:
- Lưu lịch sử các bài thi vào `localStorage`
- Đánh dấu câu hỏi để ôn lại
- Xuất kết quả thi ra PDF
- Thêm chế độ flashcard
