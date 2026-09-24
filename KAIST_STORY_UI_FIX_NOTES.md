# KAIST Story – Story-first UI update

## Đã thay đổi
- Loại bỏ mục **Content Marketing / VIRAL** khỏi thanh điều hướng.
- Thanh bên mặc định thu gọn để dành diện tích cho bản thảo.
- Chỉ giữ các khu vực phục vụ viết truyện: Tổng quan, AI viết truyện, Bản thảo, Truyện của tôi, Nhân vật, Thế giới & Dàn ý, Ảnh truyện, Xuất bản & Thu nhập, Tư liệu.
- Bỏ các mục riêng Trí nhớ, Lịch, Content Marketing và Cài đặt khỏi sidebar. Cài đặt vẫn mở từ avatar.
- Header được làm gọn, bỏ streak/status/quản trị khỏi thanh trên cùng.
- Branding đổi thành **KAIST Story – Trợ lý AI Viết Truyện & Xuất Bản**.
- Dashboard đổi thành luồng: AI viết → logic nhân vật/thế giới → ảnh truyện → xuất bản.
- Ảnh AI chỉ hướng tới: bìa, nhân vật, phân cảnh, manga/comic; bỏ mục ảnh marketing và ẩn tab tìm ảnh có sẵn khỏi giao diện chính.
- Thêm trang **Xuất bản & Thu nhập**:
  - AI chuẩn bị synopsis/metadata/từ khóa/lịch đăng/checklist.
  - Sao chép toàn bộ truyện.
  - Xuất TXT.
  - Mở các nền tảng xuất bản.
  - Hiển thị rõ rằng tự động đăng cần OAuth/API/kết nối tài khoản nền tảng.
- AI chat bật Google Search Grounding chỉ khi người dùng yêu cầu dữ liệu web hiện tại liên quan nghiên cứu/xuất bản/nền tảng, nhằm hạn chế tốn quota.
- Client không còn tải dữ liệu Marketing/Calendar/Memory riêng khi khởi động, giảm request thừa.

## Tạo ảnh
- Primary: `gemini-3.1-flash-image`.
- Fallback: Pollinations endpoint mới `gen.pollinations.ai` nếu được cấu hình.
- Ảnh tham chiếu được truyền vào Gemini Image trong chế độ reference-guided.

## Lưu ý về tự động đăng truyện
Bản này chuẩn bị gói xuất bản và mở đúng nền tảng. Tự đăng nhập/đăng chương thay người dùng chưa được giả lập. Muốn tự đăng thật cần tích hợp API/OAuth chính thức của từng nền tảng hoặc một browser agent có quyền do người dùng cấp.