# KAIST Story Autopilot v4

## UI tinh gọn
Thanh điều hướng chỉ còn 5 khu vực chính:
1. Phòng tác giả AI
2. Story Studio
3. Manga Studio
4. Autopilot
5. Xuất bản

Các màn hình Bản thảo / Truyện / Nhân vật / Thế giới & Dàn ý được gom vào Story Studio để tiết kiệm không gian.

## Phòng tác giả AI
- Lịch sử chat mặc định thu gọn để tăng diện tích hội thoại.
- 4 chế độ chính: Bàn ý tưởng, Viết chương, Manga, Phản biện.
- Cài đặt ngữ cảnh / depth / model / âm báo được gom dưới Nâng cao.
- Thêm chỉ dẫn hệ thống cho tư duy phòng biên kịch, phản biện thật và storyboard manga.

## Manga Studio
- Mặc định mở category Manga, style Anime/Manga, tỉ lệ 4:5.
- Dùng Gemini Image là provider chính, Pollinations fallback theo cấu hình server hiện tại.

## Story Autopilot
API mới:
- GET/POST /api/story-automations
- PUT/DELETE /api/story-automations/:id
- POST /api/story-automations/:id/run-now
- GET /api/publication-queue
- PUT /api/publication-queue/:id

Pipeline:
- Đọc Story Bible + nhân vật + world rules + outline + chương gần nhất.
- Tự sinh chương tiếp theo.
- Nếu Manga/Hybrid: tự sinh storyboard theo page/panel và IMAGE PROMPT.
- Nếu bật render ảnh: tự render panel manga bằng Gemini Image, fallback Pollinations.
- Tạo publication queue và hỗ trợ bước duyệt trước khi xếp đăng.
- Scheduler server kiểm tra lịch mỗi phút.

## Tự đăng lên web
Nếu cấu hình server-side:
- PUBLISH_WEBHOOK_URL
- PUBLISH_WEBHOOK_TOKEN (tùy chọn)

Publisher Agent sẽ POST JSON của chương đã duyệt/queued tới website/CMS của bạn.
Không giả lập đăng nhập vào nền tảng bên thứ ba. Wattpad/Webnovel/Inkitt cần connector/API/OAuth hợp lệ của từng nền tảng.

## Lưu ý quota
Tùy chọn tự render toàn bộ panel manga có thể tiêu thụ nhiều quota Image AI, nên mặc định tắt.