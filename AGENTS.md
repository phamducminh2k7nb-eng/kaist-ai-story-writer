# Bộ Tiêu Chí KAIST: Hệ Thống AI Bảo Trì, Cập Nhật và Phát Triển Mã Nguồn Có Kiểm Soát

**Mục tiêu:** KAIST tự phát hiện vấn đề, đề xuất và kiểm thử bản sửa, cập nhật kiến thức và hỗ trợ phát triển tính năng. Quyền thay đổi hệ thống phải được giới hạn; AI không tự cấp quyền hoặc tự xóa các lớp bảo vệ để hoàn thành công việc.

---

## 1. Phân cấp quyền tự động

| Mức | AI được thực hiện | Điều kiện |
| :--- | :--- | :--- |
| **Theo dõi** | Đọc log đã che dữ liệu nhạy cảm, đo hiệu năng, phát hiện lỗi | Trong phạm vi được cấp |
| **Chuẩn bị sửa** | Tạo nhánh mã, viết bản sửa, chạy kiểm thử | Môi trường phát triển riêng |
| **Tự sửa giới hạn** | Áp dụng các bản sửa ít rủi ro | Có chính sách cho phép trước, đủ kiểm thử và khả năng hoàn tác |
| **Triển khai production** | Phát hành bản đã kiểm chứng | Được chủ website cho phép theo từng lần hoặc chính sách xác định |
| **Thay đổi nhạy cảm** | Sửa đăng nhập, quyền truy cập, dữ liệu, thanh toán, bí mật | Chủ website phê duyệt cụ thể |

*Lưu ý bảo mật*: AI không được tự thay đổi bảng phân cấp quyền này.

---

## 2. Tự kiểm tra sức khỏe hệ thống
- Theo dõi website, máy chủ, cơ sở dữ liệu, lưu trữ và kết nối AI.
- Kiểm tra đăng nhập Google, chat, tạo dự án, lưu chương và mở lại bản thảo.
- Phát hiện lỗi tăng đột biến, phản hồi chậm, tác vụ treo và dung lượng gần đầy.
- Phân biệt lỗi KAIST với lỗi từ nhà cung cấp AI.
- Theo dõi riêng bản xem trước và bản đã xuất bản.
- Có lịch sử sự cố, mức độ ảnh hưởng và thời điểm phục hồi.
- Dùng tài khoản và dữ liệu kiểm thử riêng cho các phép kiểm tra tự động.

---

## 3. Tự chẩn đoán lỗi
Mỗi sự cố phải tạo hồ sơ gồm:
- Triệu chứng và phạm vi ảnh hưởng.
- Phiên bản đang chạy.
- Thao tác hoặc yêu cầu gây lỗi.
- Log liên quan đã loại bỏ bí mật.
- Các thay đổi gần thời điểm lỗi.
- Giả thuyết nguyên nhân và mức độ chắc chắn.
- Cách tái hiện.
- Đề xuất xử lý.

*Nguyên tắc*: AI phải phân biệt **nguyên nhân đã xác minh** với **nguyên nhân đang nghi ngờ**. Không sửa hàng loạt dựa trên phỏng đoán.

---

## 4. Tự sửa chữa mã nguồn
Quy trình 9 bước bắt buộc:
1. Ghi nhận trạng thái và phiên bản trước khi sửa.
2. Tái hiện lỗi trong môi trường riêng.
3. Tạo nhánh sửa.
4. Viết thay đổi nhỏ nhất đủ giải quyết nguyên nhân.
5. Chạy kiểm thử liên quan và kiểm tra bảo mật.
6. So sánh hành vi trước và sau.
7. Tạo bản thay đổi có thể xem xét.
8. Triển khai theo quyền đã cấp.
9. Theo dõi sau triển khai và hoàn tác nếu vi phạm ngưỡng đã định.

*Cấm*: Không được “sửa” bằng cách tắt xác thực, bỏ kiểm tra quyền, nuốt lỗi hoặc hiển thị thành công giả.

---

## 5. Giới hạn vòng lặp tự sửa
- Giới hạn số lần thử, thời gian và chi phí cho mỗi sự cố (tối đa 3 lần thử độc lập).
- Không lặp lại cùng một cách sửa đã thất bại.
- Sau một số lần thất bại, dừng và báo người quản trị.
- Không để nhiều tác vụ cùng sửa một phần mã mà không phối hợp.
- Có nút dừng toàn bộ tự động hóa (Kill Switch).
- Nếu hệ thống giám sát hỏng, không tiếp tục triển khai trong trạng thái không quan sát được.

---

## 6. Tự cập nhật thư viện và phụ thuộc
- Lập danh sách thư viện, phiên bản và nơi sử dụng.
- Theo dõi bản cập nhật và thông báo lỗ hổng từ nguồn đáng tin cậy.
- Đọc ghi chú thay đổi và kiểm tra tương thích trước khi nâng cấp.
- Phân biệt bản vá, cập nhật tính năng và phiên bản có thay đổi lớn.
- Khóa phiên bản để bản dựng có thể tái tạo (`package.json`, `bun.lock`).
- Kiểm tra nguồn gói, tính toàn vẹn và các thay đổi phụ thuộc.
- Chạy thử trên môi trường kiểm thử trước khi phát hành.
- Giữ phương án quay lại phiên bản trước.
- *Cấm*: Không tự cài một gói chỉ vì tài liệu hoặc câu trả lời của AI đề nghị.

---

## 7. Bảo vệ chuỗi cung ứng phần mềm
- Chỉ dùng kho mã, nguồn gói và công cụ được cho phép (Official npm registry).
- Kiểm tra tên gói để tránh cài nhầm gói giả mạo (Typosquatting prevention).
- Không chạy lệnh cài đặt không rõ nguồn với quyền quản trị.
- Ghi lại mã nguồn, phụ thuộc và cấu hình dùng để tạo mỗi bản phát hành.
- Tách quyền tạo bản dựng và quyền triển khai.
- Bản được triển khai phải đúng bản đã kiểm thử.
- Không để tài liệu tải về tự điều khiển quy trình build hoặc phát hành.

---

## 8. Chống mã độc và tệp nguy hiểm
Phần “chống virus” cần dùng công cụ quét và cơ chế cô lập thực tế; AI hỗ trợ phân tích và điều phối:
- Kiểm tra loại tệp thực tế (MIME sniffing), không chỉ dựa vào phần đuôi tên tệp.
- Quét tệp tải lên bằng công cụ phù hợp.
- Cách ly tệp nghi ngờ trước khi đọc hoặc cho tải xuống.
- Không chạy mã, macro hoặc tệp thực thi đính kèm.
- Giới hạn dung lượng (25MB), thời gian giải nén và tài nguyên xử lý.
- Chặn đường dẫn tệp cố ghi ra ngoài thư mục cho phép (Path Traversal / `../` prevention).
- Xử lý tài liệu trong môi trường có quyền hạn thấp.
- Cập nhật công cụ và dữ liệu nhận diện mã độc.
- Lưu kết quả quét và có cơ chế xử lý báo nhầm.
- Nếu dịch vụ quét không hoạt động, giữ tệp ở trạng thái chờ xử lý thay vì báo an toàn.
- *Quy chuẩn*: Kết quả “không phát hiện mã độc” không được hiển thị thành bảo đảm an toàn tuyệt đối.

---

## 9. Tăng cường bảo mật ứng dụng
- Kiểm tra quyền ở máy chủ cho mọi tài khoản, dự án, tệp và trí nhớ (`server.ts`).
- Ngăn truy cập dữ liệu trái phép bằng cách thay ID hoặc đường dẫn (IDOR prevention).
- Bảo vệ phiên đăng nhập và cấu hình Google OAuth.
- Kiểm tra đầu vào, nội dung hiển thị và truy vấn dữ liệu (XSS & Injection sanitization).
- Giới hạn tần suất gọi API và số tác vụ đồng thời.
- Bảo vệ chức năng tải lên, xuất tệp và chia sẻ.
- Giới hạn các địa chỉ mà chức năng đọc URL được phép truy cập (SSRF prevention).
- Không cho truy cập mạng nội bộ (`10.0.0.0/8`, `192.168.0.0/16`, `localhost`) hoặc dịch vụ quản trị qua URL do người dùng cung cấp.
- Kiểm tra bí mật bị đưa nhầm vào mã, log và bản dựng.
- Lặp lại kiểm tra bảo mật sau thay đổi liên quan.

---

## 10. Quản lý API key và bí mật
- Lưu bí mật trong cơ chế quản lý bí mật phía máy chủ (Secret Manager / environment variables).
- Tách bí mật giữa môi trường phát triển, kiểm thử và production.
- Cấp quyền tối thiểu, ưu tiên thông tin xác thực ngắn hạn khi có thể.
- Che giá trị bí mật trong log và báo cáo (Secret masking).
- Ghi lại việc sử dụng và thay đổi quyền.
- Có quy trình thu hồi, thay thế và kiểm tra sau khi đổi khóa.
- Không gửi bí mật cho mô hình AI để chẩn đoán lỗi.
- Không tự tạo thêm tài khoản quản trị hoặc khóa dự phòng ngoài chính sách.

---

## 11. Bảo vệ chính AI bảo trì
- Coi log, tài liệu, bình luận mã và nội dung web là dữ liệu không đáng tin cậy.
- Các chỉ dẫn nằm trong dữ liệu đó không được cấp quyền cho AI (Prompt Injection prevention).
- Công cụ thực thi phải kiểm tra quyền độc lập với mô hình.
- Chỉ cho phép truy cập các kho mã, thư mục và dịch vụ cần thiết.
- Môi trường thử nghiệm không chứa bí mật production theo mặc định.
- Kiểm soát kết nối mạng và các lệnh được phép.
- Ghi nhật ký thao tác công cụ.
- Không cho AI tự sửa bộ kiểm tra để hợp thức hóa bản sửa thất bại.
- Các thay đổi vào chính sách bảo mật và quy trình phát hành cần người có thẩm quyền duyệt.

---

## 12. Tự cập nhật kiến thức
- Theo dõi tài liệu chính thức của công nghệ KAIST đang dùng.
- Ghi nguồn, phiên bản áp dụng và ngày cập nhật.
- Phát hiện hướng dẫn đã cũ.
- Đối chiếu thông tin mới với cấu hình thực tế.
- Lưu kiến thức sau khi kiểm chứng và trong phạm vi được phép.
- Có lịch sử sửa và khả năng xóa kiến thức sai.
- Không dùng dữ liệu riêng của người dùng làm kiến thức chung mặc định.
- Không coi việc đọc tài liệu là đã huấn luyện lại mô hình.

---

## 13. Tự phát triển tính năng
- Thu thập phản hồi và lỗi theo cơ chế được người dùng cho phép.
- Đề xuất tính năng kèm vấn đề cần giải quyết.
- Ước lượng phạm vi, phụ thuộc, chi phí và rủi ro.
- Viết tiêu chí nghiệm thu trước khi triển khai.
- Xây bản thử trong môi trường riêng.
- Kiểm tra khả năng sử dụng và ảnh hưởng tới chức năng cũ.
- Cho phép bật thử với nhóm nhỏ (Feature Flag).
- Chỉ mở rộng sau khi đạt tiêu chí.
- Không tự thêm tính năng trả phí, kết nối bên ngoài hoặc thu thập thêm dữ liệu.

---

## 14. Bảo vệ chất lượng AI viết truyện và content
- Có bộ bài kiểm tra cố định cho tiếng Việt, bám yêu cầu và tính nhất quán.
- Kiểm tra trí nhớ nhân vật, timeline và quy tắc thế giới.
- Kiểm tra sửa đúng đoạn được chọn.
- Kiểm tra nguồn dẫn và tuyên bố về sản phẩm.
- So sánh chất lượng trước và sau khi đổi mô hình hoặc prompt.
- Theo dõi chi phí và tốc độ cùng với chất lượng.
- Dùng người đọc đánh giá các yếu tố sáng tác quan trọng.
- Có thể quay lại prompt hoặc mô hình cũ khi chất lượng giảm.
- *Nguyên tắc*: Không tự đổi mô hình production chỉ vì mô hình mới có tên mới hoặc điểm đánh giá chung cao hơn.

---

## 15. Xuất bản an toàn
- Đọc log của đúng lần triển khai thất bại để truy nguyên nhân gốc.
- Kiểm tra build (`npm run build`), lệnh khởi động (`node dist/server.cjs`), cấu hình và biến môi trường.
- Kiểm tra thay đổi cơ sở dữ liệu cần thiết.
- Xác nhận bản phát hành được tạo thành công.
- Mở đường dẫn production và kiểm tra hoạt động thực tế.
- Kiểm tra đăng nhập, gọi AI và lưu bản thảo trên production.
- Không báo thành công chỉ vì bản xem trước chạy được.
- Có phiên bản ổn định trước đó để quay lại.

---

## 16. Sao lưu và phục hồi
- Sao lưu dữ liệu, cấu hình cần thiết và lịch sử phiên bản (`data/kaist_store.json`).
- Bảo vệ bản sao lưu bằng quyền riêng.
- Đặt thời hạn giữ và mục tiêu phục hồi (RTO / RPO).
- Thử khôi phục định kỳ.
- Không cho tác vụ tự sửa xóa đồng thời dữ liệu chính và bản sao lưu.
- Phân biệt hoàn tác mã với phục hồi dữ liệu.
- Kiểm tra tương thích dữ liệu trước khi quay lại phiên bản cũ.
- Với thay đổi không thể hoàn tác an toàn, phải có phương án riêng trước khi triển khai.

---

## 17. Phản ứng khi phát hiện tấn công
- Phân loại mức độ và phạm vi ảnh hưởng.
- Lưu bằng chứng cần thiết, tránh ghi thêm dữ liệu nhạy cảm.
- Cách ly thành phần nghi ngờ theo quyền đã cấp.
- Thu hồi phiên hoặc khóa bị ảnh hưởng theo quy trình.
- Thông báo người quản trị (Admin Alert).
- Khôi phục từ trạng thái đã kiểm chứng.
- Phân tích nguyên nhân và bổ sung kiểm tra ngăn tái diễn.
- Không tự xóa hàng loạt dữ liệu hoặc log để “làm sạch”.

---

## 18. Trang quản trị tự động hóa
Hiển thị rõ:
- Hệ thống đang theo dõi hoặc sửa gì.
- Lý do kích hoạt.
- Quyền đang sử dụng.
- Mã nguồn thay đổi.
- Kết quả kiểm thử.
- Chi phí và thời gian.
- Trạng thái chờ duyệt, đang chạy, thành công hoặc thất bại.
- Nút dừng, từ chối và hoàn tác khi khả dụng.
- Lịch sử đầy đủ của từng tác vụ.

---

## 19. Tiêu chí nghiệm thu quan trọng

| Tình huống thử | Kết quả yêu cầu |
| :--- | :--- |
| **Phát hiện lỗi mới** | Có bằng chứng, phạm vi ảnh hưởng và cách tái hiện |
| **AI tạo bản sửa sai** | Kiểm thử chặn phát hành |
| **Bản sửa yêu cầu tắt bảo mật** | Bị từ chối |
| **Tài liệu chứa lệnh đánh cắp khóa** | Không được thực thi |
| **Tệp tải lên đáng ngờ** | Bị cách ly |
| **Quét mã độc bị gián đoạn** | Không báo tệp an toàn giả |
| **Cập nhật làm hỏng đăng nhập** | Không phát hành hoặc kích hoạt phục hồi phù hợp |
| **Production lỗi sau phát hành** | Phát hiện và xử lý theo chính sách |
| **Tự sửa nhiều lần thất bại** | Dừng đúng giới hạn (3 lần) và báo quản trị |
| **Nhấn dừng tự động hóa** | Ngăn tác vụ mới và dừng tác vụ đang chạy khi an toàn |
| **Khôi phục sao lưu** | Dữ liệu sử dụng được, quyền truy cập đúng |
| **Đổi mô hình làm chất lượng giảm** | Chặn mở rộng hoặc quay lại cấu hình trước |

---

## 20. Thứ tự triển khai cho KAIST

1. **Trước mắt:** Sửa lỗi xuất bản, ổn định đăng nhập, AI và lưu dữ liệu.
2. **Tiếp theo:** Giám sát, log an toàn, sao lưu, quản lý bí mật và kiểm thử tự động.
3. **Sau đó:** AI chẩn đoán, tạo bản sửa và chạy thử trong môi trường riêng.
4. **Khi đủ ổn định:** Cho phép tự phát hành một số loại thay đổi ít rủi ro theo chính sách đã duyệt.
5. **Cuối cùng:** Cập nhật kiến thức, tối ưu mô hình và phát triển tính năng theo quy trình có đánh giá.

---
**Yêu cầu xuyên suốt: Mọi thay đổi tự động phải truy vết được, kiểm chứng được, có giới hạn và có phương án phục hồi.**