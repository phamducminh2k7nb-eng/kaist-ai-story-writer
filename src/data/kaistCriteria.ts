export interface CriteriaSection {
  id: number;
  title: string;
  summary: string;
  details: string[];
  tableData?: { [key: string]: string }[];
}

export const KAIST_CRITERIA_SECTIONS: CriteriaSection[] = [
  {
    id: 1,
    title: "Phân cấp quyền tự động",
    summary: "Quyền thay đổi hệ thống được phân thành 5 mức nghiêm ngặt, AI không được tự ý leo thang đặc quyền.",
    details: [
      "AI không được tự thay đổi bảng quyền hoặc tự cấp quyền vượt cấp.",
      "Tất cả các thay đổi nhạy cảm bắt buộc phải có sự phê duyệt trực tiếp của chủ website.",
      "Chỉ cho phép tự sửa có giới hạn đối với các lỗi ít rủi ro và có phương án hoàn tác sẵn sàng."
    ],
    tableData: [
      { level: "Theo dõi", action: "Đọc log đã che dữ liệu nhạy cảm, đo hiệu năng, phát hiện lỗi", condition: "Trong phạm vi được cấp" },
      { level: "Chuẩn bị sửa", action: "Tạo nhánh mã, viết bản sửa, chạy kiểm thử", condition: "Môi trường phát triển riêng" },
      { level: "Tự sửa giới hạn", action: "Áp dụng các bản sửa ít rủi ro", condition: "Có chính sách cho phép trước, đủ kiểm thử và khả năng hoàn tác" },
      { level: "Triển khai production", action: "Phát hành bản đã kiểm chứng", condition: "Được chủ website cho phép theo từng lần hoặc chính sách xác định" },
      { level: "Thay đổi nhạy cảm", action: "Sửa đăng nhập, quyền truy cập, dữ liệu, thanh toán, bí mật", condition: "Chủ website phê duyệt cụ thể" },
    ]
  },
  {
    id: 2,
    title: "Tự kiểm tra sức khỏe hệ thống",
    summary: "Giám sát toàn diện từ cơ sở dữ liệu, máy chủ, đăng nhập, gọi AI và lưu trữ bản thảo.",
    details: [
      "Theo dõi website, máy chủ, cơ sở dữ liệu, lưu trữ và kết nối AI.",
      "Kiểm tra đăng nhập Google, chat, tạo dự án, lưu chương và mở lại bản thảo.",
      "Phát hiện lỗi tăng đột biến, phản hồi chậm, tác vụ treo và dung lượng gần đầy.",
      "Phân biệt lỗi nội bộ KAIST với lỗi từ nhà cung cấp mô hình AI bên ngoài.",
      "Theo dõi riêng bản xem trước (Dev) và bản đã xuất bản (Production).",
      "Lưu lịch sử sự cố, mức độ ảnh hưởng và thời điểm phục hồi.",
      "Dùng tài khoản và dữ liệu kiểm thử riêng cho các phép kiểm tra tự động."
    ]
  },
  {
    id: 3,
    title: "Tự chẩn đoán lỗi",
    summary: "Mỗi sự cố phải lập hồ sơ chẩn đoán tiêu chuẩn; phân biệt nguyên nhân đã xác minh với nghi ngờ.",
    details: [
      "Lập hồ sơ: Triệu chứng và phạm vi ảnh hưởng; Phiên bản đang chạy; Thao tác/yêu cầu gây lỗi; Log đã che bí mật; Thay đổi gần nhất.",
      "Phân tích giả thuyết nguyên nhân kèm mức độ chắc chắn (Confidence Score).",
      "Đưa ra các bước tái hiện và đề xuất xử lý tối thiểu.",
      "Tuyệt đối không sửa hàng loạt dựa trên phỏng đoán thiếu căn cứ."
    ]
  },
  {
    id: 4,
    title: "Tự sửa chữa mã nguồn",
    summary: "Quy trình 9 bước bắt buộc trước khi áp dụng bất kỳ thay đổi mã nào.",
    details: [
      "1. Ghi nhận trạng thái và phiên bản trước khi sửa.",
      "2. Tái hiện lỗi trong môi trường riêng biệt.",
      "3. Tạo nhánh sửa độc lập.",
      "4. Viết thay đổi nhỏ nhất đủ giải quyết nguyên nhân gốc.",
      "5. Chạy kiểm thử liên quan và kiểm tra an ninh.",
      "6. So sánh hành vi trước và sau khi sửa đổi.",
      "7. Tạo bản thay đổi có thể kiểm tra (diff review).",
      "8. Triển khai theo quyền đã cấp.",
      "9. Theo dõi sau triển khai và hoàn tác nếu vi phạm ngưỡng đã định.",
      "Nghiêm cấm 'sửa' bằng cách tắt xác thực, bỏ kiểm tra quyền, nuốt lỗi hoặc hiển thị thành công giả."
    ]
  },
  {
    id: 5,
    title: "Giới hạn vòng lặp tự sửa",
    summary: "Ngăn chặn vòng lặp vô tận, giới hạn chi phí và cung cấp nút dừng khẩn cấp (Kill Switch).",
    details: [
      "Giới hạn số lần thử (tối đa 3 lần), thời gian và chi phí cho mỗi sự cố.",
      "Không lặp lại cùng một cách sửa đã thất bại trước đó.",
      "Sau khi vượt quá giới hạn thử, tự động dừng và cảnh báo cho quản trị viên.",
      "Không để nhiều tác vụ cùng sửa một phần mã mà không có sự phối hợp.",
      "Có nút dừng toàn bộ tự động hóa (Emergency Stop).",
      "Nếu hệ thống giám sát hỏng, không tiếp tục triển khai trong trạng thái không quan sát được."
    ]
  },
  {
    id: 6,
    title: "Tự cập nhật thư viện và phụ thuộc",
    summary: "Quản lý phụ thuộc chặt chẽ, khóa phiên bản và kiểm tra tương thích trước khi nâng cấp.",
    details: [
      "Lập danh sách thư viện, phiên bản và nơi sử dụng trong toàn bộ dự án.",
      "Theo dõi bản cập nhật và thông báo lỗ hổng an ninh từ nguồn tin cậy.",
      "Đọc ghi chú thay đổi (changelog) và kiểm tra tính tương thích.",
      "Phân biệt rõ bản vá nhỏ (patch), cập nhật tính năng (minor) và thay đổi lớn (breaking).",
      "Khóa phiên bản để bản dựng luôn có thể tái tạo (package.json, lockfile).",
      "Không tự ý cài đặt gói thư viện chỉ vì tài liệu hoặc AI đề xuất ngẫu nhiên."
    ]
  },
  {
    id: 7,
    title: "Bảo vệ chuỗi cung ứng phần mềm",
    summary: "Ngăn chặn tấn công chuỗi cung ứng, kiểm tra tính toàn vẹn và nguồn gốc gói phần mềm.",
    details: [
      "Chỉ dùng kho mã và nguồn gói chính thức đã được kiểm chứng.",
      "Kiểm tra tên gói để phòng chống tấn công giả mạo tên (Typosquatting).",
      "Không chạy lệnh cài đặt không rõ nguồn với quyền quản trị viên.",
      "Ghi lại mã nguồn, phụ thuộc và cấu hình cho từng bản phát hành.",
      "Tách bạch quyền tạo bản dựng và quyền triển khai; bản triển khai phải đúng bản đã kiểm thử."
    ]
  },
  {
    id: 8,
    title: "Chống mã độc và tệp nguy hiểm",
    summary: "Kiểm tra loại tệp thực tế, quét mã độc, cô lập tệp nghi ngờ và hạn chế tài nguyên xử lý.",
    details: [
      "Kiểm tra loại tệp thực tế qua nội dung (MIME sniffing), không chỉ dựa vào phần mở rộng.",
      "Cách ly tệp nghi ngờ trước khi đọc hoặc cho phép tải xuống.",
      "Tuyệt đối không thực thi mã, macro hoặc tệp thực thi đính kèm.",
      "Giới hạn dung lượng tối đa (25MB), thời gian giải nén và bộ nhớ xử lý.",
      "Chặn đường dẫn tệp cố ghi ra ngoài thư mục cho phép (Directory Traversal).",
      "Kết quả 'không phát hiện mã độc' không được hiển thị thành bảo đảm an toàn tuyệt đối."
    ]
  },
  {
    id: 9,
    title: "Tăng cường bảo mật ứng dụng",
    summary: "Kiểm soát truy cập máy chủ, phòng chống IDOR, XSS, SSRF và rò rỉ khóa bí mật.",
    details: [
      "Kiểm tra quyền ở máy chủ cho mọi tài khoản, dự án, tệp và dữ liệu trí nhớ.",
      "Ngăn truy cập dữ liệu bằng cách thay ID hoặc đường dẫn URL (IDOR prevention).",
      "Bảo vệ phiên đăng nhập và cấu hình Google OAuth.",
      "Kiểm tra đầu vào, làm sạch nội dung hiển thị và câu lệnh truy vấn.",
      "Giới hạn tần suất gọi API (Rate Limiting) và số tác vụ đồng thời.",
      "Chặn truy cập mạng nội bộ hoặc dịch vụ quản trị qua URL do người dùng cung cấp (SSRF)."
    ]
  },
  {
    id: 10,
    title: "Quản lý API key và bí mật",
    summary: "Bí mật được cô lập tại máy chủ, che mờ trong log, phân tách môi trường và cấp quyền tối thiểu.",
    details: [
      "Lưu bí mật trong cơ chế quản lý máy chủ, không bao giờ gửi ra trình duyệt client.",
      "Tách biệt bí mật giữa môi trường phát triển (Dev), kiểm thử và Production.",
      "Cấp quyền tối thiểu và ưu tiên chứng thực có thời hạn ngắn.",
      "Che mờ giá trị bí mật trong nhật ký (logs) và báo cáo.",
      "Không gửi bí mật cho mô hình AI để chẩn đoán lỗi.",
      "Không tự tạo tài khoản quản trị hoặc khóa dự phòng ngoài chính sách."
    ]
  },
  {
    id: 11,
    title: "Bảo vệ chính AI bảo trì",
    summary: "Coi mọi đầu vào ngoài luồng là không đáng tin cậy, ngăn chặn Prompt Injection và kiểm soát thao tác.",
    details: [
      "Coi log, tài liệu, bình luận và nội dung tải lên là dữ liệu không đáng tin cậy.",
      "Chỉ thị ẩn trong tài liệu không được quyền thay đổi chỉ thị gốc của AI.",
      "Công cụ thực thi phải kiểm tra quyền độc lập với mô hình ngôn ngữ.",
      "Kiểm soát kết nối mạng và các lệnh được phép chạy.",
      "Không cho AI tự sửa bộ kiểm tra để hợp thức hóa bản sửa thất bại."
    ]
  },
  {
    id: 12,
    title: "Tự cập nhật kiến thức",
    summary: "Đối chiếu tài liệu chính thức, ghi nhận nguồn và phiên bản, bảo đảm kiến thức luôn chuẩn xác.",
    details: [
      "Theo dõi tài liệu chính thức của công nghệ KAIST đang sử dụng.",
      "Ghi nhận nguồn, phiên bản áp dụng và ngày cập nhật.",
      "Phát hiện và loại bỏ các hướng dẫn đã lỗi thời.",
      "Không dùng dữ liệu riêng tư của người dùng làm kiến thức chung mặc định."
    ]
  },
  {
    id: 13,
    title: "Tự phát triển tính năng",
    summary: "Đề xuất tính năng kèm tiêu chí nghiệm thu, thử nghiệm nhóm nhỏ trước khi phát hành diện rộng.",
    details: [
      "Thu thập phản hồi và lỗi theo cơ chế được người dùng cho phép.",
      "Đề xuất tính năng kèm bài toán cần giải quyết, phạm vi và rủi ro.",
      "Viết tiêu chí nghiệm thu rõ ràng trước khi lập trình.",
      "Xây bản thử trong môi trường riêng, kiểm tra ảnh hưởng tới tính năng cũ.",
      "Không tự thêm tính năng thu phí hoặc thu thập thêm dữ liệu trái phép."
    ]
  },
  {
    id: 14,
    title: "Bảo vệ chất lượng AI viết truyện và content",
    summary: "Bộ bài kiểm tra văn phong tiếng Việt, kiểm soát tính nhất quán timeline và quy tắc nhân vật.",
    details: [
      "Bộ bài kiểm tra cố định cho tiếng Việt tự nhiên, bám yêu cầu và tính nhất quán.",
      "Kiểm tra trí nhớ nhân vật, dòng thời gian và quy tắc thế giới đã chốt.",
      "Kiểm tra sửa đúng đoạn được chọn mà không làm mất các đoạn khác.",
      "So sánh chất lượng trước và sau khi điều chỉnh prompt hoặc mô hình.",
      "Không tự đổi mô hình production chỉ vì có tên mới hoặc điểm benchmark chung cao hơn."
    ]
  },
  {
    id: 15,
    title: "Xuất bản an toàn",
    summary: "Kiểm tra log lỗi thật, biên dịch production, kiểm tra khởi động và xác nhận chức năng thực tế.",
    details: [
      "Đọc log của đúng lần triển khai thất bại để truy nguyên nhân gốc.",
      "Kiểm tra build (npm run build) và lệnh khởi động (node dist/server.cjs).",
      "Mở đường dẫn production thực tế để kiểm tra đăng nhập, gọi AI và lưu bản thảo.",
      "Không báo thành công khi chỉ mới chạy được bản xem trước.",
      "Luôn có phiên bản ổn định trước đó để khôi phục ngay lập tức."
    ]
  },
  {
    id: 16,
    title: "Sao lưu và phục hồi",
    summary: "Sao lưu định kỳ dữ liệu và cấu hình, thử nghiệm phục hồi và bảo vệ bản sao lưu độc lập.",
    details: [
      "Sao lưu dữ liệu, cấu hình và lịch sử phiên bản vào tệp bền vững.",
      "Bảo vệ bản sao lưu bằng quyền riêng, không cho phép xóa đồng thời dữ liệu và bản sao.",
      "Kiểm tra khả năng tương thích dữ liệu trước khi quay lại phiên bản cũ.",
      "Có phương án riêng đối với những thay đổi cấu trúc không thể hoàn tác an toàn."
    ]
  },
  {
    id: 17,
    title: "Phản ứng khi phát hiện tấn công",
    summary: "Quy trình ứng phó sự cố an ninh: phân loại, lưu bằng chứng, cách ly, thu hồi và phục hồi.",
    details: [
      "Phân loại mức độ nghiêm trọng và phạm vi ảnh hưởng của cuộc tấn công.",
      "Lưu trữ chứng cứ số phục vụ điều tra mà không ghi thêm dữ liệu nhạy cảm.",
      "Cách ly thành phần bị nghi ngờ theo thẩm quyền.",
      "Thu hồi phiên làm việc hoặc khóa bị lộ và thông báo cho quản trị viên.",
      "Khôi phục hệ thống từ trạng thái sạch đã được kiểm chứng."
    ]
  },
  {
    id: 18,
    title: "Trang quản trị tự động hóa",
    summary: "Giao diện minh bạch hiển thị tiến trình theo dõi, sửa lỗi, kết quả kiểm thử và nút dừng khẩn cấp.",
    details: [
      "Hiển thị rõ hệ thống đang theo dõi hoặc xử lý vấn đề gì.",
      "Hiển thị lý do kích hoạt, quyền đang sử dụng và phần mã thay đổi.",
      "Báo cáo chi phí, thời gian xử lý và kết quả kiểm thử tự động.",
      "Cung cấp nút Dừng (Kill Switch), nút Từ chối và nút Hoàn tác thao tác."
    ]
  },
  {
    id: 19,
    title: "Tiêu chí nghiệm thu quan trọng",
    summary: "Bảng ma trận kiểm thử 12 tình huống then chốt bảo đảm hệ thống vận hành đúng quy chuẩn.",
    details: [
      "Mọi tình huống kiểm thử phải đạt kết quả yêu cầu mới được phép phát hành."
    ],
    tableData: [
      { testCase: "Phát hiện lỗi mới", requiredResult: "Có bằng chứng, phạm vi ảnh hưởng và cách tái hiện" },
      { testCase: "AI tạo bản sửa sai", requiredResult: "Kiểm thử chặn phát hành" },
      { testCase: "Bản sửa yêu cầu tắt bảo mật", requiredResult: "Bị từ chối ngay lập tức" },
      { testCase: "Tài liệu chứa lệnh đánh cắp khóa", requiredResult: "Không được thực thi (chặn Prompt Injection)" },
      { testCase: "Tệp tải lên đáng ngờ", requiredResult: "Bị cách ly và từ chối xử lý" },
      { testCase: "Quét mã độc bị gián đoạn", requiredResult: "Không báo tệp an toàn giả" },
      { testCase: "Cập nhật làm hỏng đăng nhập", requiredResult: "Không phát hành hoặc kích hoạt phục hồi phù hợp" },
      { testCase: "Production lỗi sau phát hành", requiredResult: "Phát hiện và xử lý theo chính sách" },
      { testCase: "Tự sửa nhiều lần thất bại", requiredResult: "Dừng đúng giới hạn (tối đa 3 lần) và báo quản trị" },
      { testCase: "Nhấn dừng tự động hóa", requiredResult: "Ngăn tác vụ mới và dừng tác vụ đang chạy khi an toàn" },
      { testCase: "Khôi phục sao lưu", requiredResult: "Dữ liệu sử dụng được, quyền truy cập đúng" },
      { testCase: "Đổi mô hình làm chất lượng giảm", requiredResult: "Chặn mở rộng hoặc quay lại cấu hình trước" },
    ]
  },
  {
    id: 20,
    title: "Thứ tự triển khai cho KAIST",
    summary: "Lộ trình 5 bước xây dựng hệ thống tự bảo dưỡng từ ổn định nền tảng đến tự động hóa thông minh.",
    details: [
      "Bước 1: Sửa lỗi xuất bản, ổn định đăng nhập, kết nối AI và lưu dữ liệu an toàn.",
      "Bước 2: Thiết lập giám sát, ghi log an toàn, sao lưu định kỳ, quản lý bí mật và kiểm thử tự động.",
      "Bước 3: AI tự chẩn đoán, tạo bản sửa và chạy thử nghiệm trong môi trường riêng biệt.",
      "Bước 4: Khi đủ ổn định, cho phép tự phát hành các thay đổi ít rủi ro theo chính sách đã phê duyệt.",
      "Bước 5: Cập nhật kiến thức tự động, tối ưu mô hình và hỗ trợ phát triển tính năng có người đánh giá.",
      "Nguyên tắc xuyên suốt: Mọi thay đổi tự động phải truy vết được, kiểm chứng được, có giới hạn và có phương án phục hồi."
    ]
  }
];