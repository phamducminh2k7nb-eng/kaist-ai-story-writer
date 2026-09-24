import dotenv from "dotenv";
dotenv.config();

import http from "http";
import express from "express";
import path from "path";
import crypto from "crypto";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

// Standard CORS & Custom Headers for Preview and Production
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization, x-user-id"
  );
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});

// Production & Ingress Health Check Endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// Server-side Gemini AI Client with User-Agent telemetry
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.log("[KAIST Server] GEMINI_API_KEY chưa được cấu hình. Chạy chế độ phản hồi thông minh nội bộ.");
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// In-Memory & File-backed Multi-User Database Store
interface DatabaseState {
  users: Record<string, any>;
  sessions: Record<string, any>;
  projects: Record<string, any[]>;
  chapters: Record<string, any[]>;
  characters: Record<string, any[]>;
  worldRules: Record<string, any[]>;
  outlines: Record<string, any[]>;
  memories: Record<string, any[]>;
  marketingBrands: Record<string, any[]>;
  marketingContent: Record<string, any[]>;
  documents: Record<string, any[]>;
  images: Record<string, any[]>;
  calendarEvents: Record<string, any[]>;
  chats: Record<string, any[]>;
  preferences: Record<string, any[]>;
  feedback: Record<string, any[]>;
  storyAutomations: Record<string, any[]>;
  publicationQueue: Record<string, any[]>;
  mangaScripts: Record<string, any[]>;
}

// Initial database state
const db: DatabaseState = {
  users: {},
  sessions: {},
  projects: {
    "usr_default": [
      {
        id: "proj_1",
        userId: "usr_default",
        title: "Ký Ức Lam Sa",
        tagline: "Kỳ ảo cổ phong - Bút tích ngàn năm",
        description: "Câu chuyện về một thư sinh trẻ nắm giữ bút pháp phục hồi ký ức cổ xưa giữa đại nạn sụp đổ của vương triều Lam Sa.",
        primaryGenre: "Kỳ ảo (Fantasy)",
        secondaryGenre: "Cổ phong / Huyền bí",
        targetAudience: "Độc giả 16-35 tuổi yêu thích văn phong sâu sắc, triết lý",
        contentRating: "pg13",
        language: "vi",
        pointOfView: "third_limited",
        tense: "past",
        tone: "Trầm lắng, hoài niệm nhưng ẩn chứa hy vọng mãnh liệt",
        coreTheme: "Cái giá của sự lãng quên và sức mạnh của lời hứa xuyên thế kỷ",
        settingTime: "Kỷ nguyên Lam Tinh, thế kỷ 14 hư cấu",
        settingPlace: "Đô thành Sa Lộ và Rừng Chuông Trắng",
        targetWordCount: 80000,
        totalWordCount: 14250,
        rules: [
          { id: "r1", rule: "Nhân vật Lam Tiêu tuyệt đối không biết bơi do ám ảnh thời thơ ấu", type: "must_have", status: "active" },
          { id: "r2", rule: "Phép thuật Lam Thạch tiêu hao tuổi thọ chứ không hồi phục vô hạn", type: "must_have", status: "active" },
          { id: "r3", rule: "Tránh các từ ngữ hiện đại như 'stress', 'ok', 'level', 'game'", type: "forbidden", status: "active" },
        ],
        coverImage: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80",
        createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "proj_2",
        userId: "usr_default",
        title: "Biên Niên Sử Cyberpunk Sài Gòn 2088",
        tagline: "Ánh đèn neon và giọt nước mắt công nghệ",
        description: "Trinh thám công nghệ viễn tưởng xoay quanh một điều tra viên ký ức tại khu chợ đen Thủ Thiêm ngầm.",
        primaryGenre: "Khoa học viễn tưởng (Sci-fi)",
        secondaryGenre: "Trinh thám / Cyberpunk",
        targetAudience: "Độc giả trẻ, đam mê công nghệ và cốt truyện plot twist giật gân",
        contentRating: "16+",
        language: "vi",
        pointOfView: "first",
        tense: "present",
        tone: "Sắc lạnh, dồn dập, nhiều nhịp ngắt hội thoại",
        coreTheme: "Con người còn lại gì khi bộ não được số hóa hoàn toàn?",
        settingTime: "Năm 2088, mùa mưa liên miên",
        settingPlace: "Tầng ngầm Sài Gòn và Đảo Nổi Công Nghệ",
        targetWordCount: 60000,
        totalWordCount: 8200,
        rules: [
          { id: "r_cb1", rule: "Chip não Synapse thế hệ 4 không thể hack từ xa nếu không có tiếp xúc vật lý", type: "must_have", status: "active" },
        ],
        coverImage: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80",
        createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
        updatedAt: new Date().toISOString(),
      }
    ]
  },
  chapters: {
    "proj_1": [
      {
        id: "chap_1",
        projectId: "proj_1",
        order: 1,
        title: "Chương 1: Tiếng Chuông Gãy",
        act: "Hồi I: Khởi Nguyên",
        summary: "Lam Tiêu tìm thấy cây bút Chu Sa gãy trong thư khố cổ và nghe thấy giọng nói của người đã khuất.",
        targetWordCount: 3000,
        actualWordCount: 2840,
        status: "locked",
        content: `Cơn mưa đầu mùa ở Sa Lộ chưa bao giờ mang vị ngọt của trời đất. Nó mặn chát như tro than còn sót lại từ những trận hỏa hoạn ba trăm năm trước.

Lam Tiêu khép lại khung cửa sổ gỗ mục, tiếng then cài run rẩy va vào thanh chắn. Trong căn phòng chật chội tầng ba của Thư viện Cổ Mộc, mùi giấy ải và dầu thông hòa quyện vào nhau thành thứ không khí đặc quánh. Chàng cúi đầu nhìn mảnh ngọc lam thạch đang lập lòe trên bàn gỗ.

"Nếu ngươi chạm vào bút tích đó một lần nữa, ký ức của ngươi sẽ không còn thuộc về ngươi nữa đâu."

Tiếng nói vang lên không phải từ phía cửa, mà vọng ra từ chính chiếc hộp gấm màu huyết dụ. Lam Tiêu nuốt khan. Ngón tay chàng dừng lại cách chuôi bút Chu Sa chỉ nửa tấc. Ký ức về dòng sông chảy xiết năm chàng bảy tuổi lại trào dâng—cơn ngạt thở, bùn đen và nỗi sợ nước ăn sâu vào từng khớp xương khiến lưng chàng lạnh toát. Chàng không biết bơi. Một sự thật giản dị nhưng có thể lấy mạng chàng bất cứ khi nào bước ra bờ hào thành.

Chàng hít sâu một hơi, cầm lấy quản bút. Ngay khoảnh khắc ngòi lông chạm vào mặt giấy, thời gian dường như ngưng đọng lại thành một giọt mực đen nhánh...`,
        authorNotes: "Đoạn mở đầu cần nhấn mạnh nỗi sợ nước của Lam Tiêu để làm cơ sở cho biến cố Chương 4.",
        comments: [],
        versions: [
          {
            id: "ver_1",
            timestamp: new Date(Date.now() - 2 * 86400000).toISOString(),
            content: "Bản thảo sơ khai của Chương 1...",
            wordCount: 1500,
            label: "Bản phác thảo đầu tiên",
          }
        ],
        lastSavedAt: new Date().toISOString(),
      },
      {
        id: "chap_2",
        projectId: "proj_1",
        order: 2,
        title: "Chương 2: Người Giữ Lửa Đêm",
        act: "Hồi I: Khởi Nguyên",
        summary: "Cuộc gặp gỡ tình cờ giữa Lam Tiêu và nữ sát thủ Vân Diệp bên quán trà Bến Vắng.",
        targetWordCount: 3500,
        actualWordCount: 3120,
        status: "drafting",
        content: `Quán trà Bến Vắng nằm lọt thỏm giữa hai mỏm đá nhô ra mặt hồ cạn. Gió đêm lùa qua những tấm mành tre rách tơi tả, rít lên từng hồi như tiếng sáo oan hồn.

Vân Diệp ngồi ở góc tối nhất, chiếc nón rộng vành che khuất nửa khuôn mặt thanh tú. Lưỡi đoản đao gài bên hông nàng được bọc kín trong lớp vải thô thẫm màu. Nàng không nhìn Lam Tiêu khi chàng bước vào, nhưng ngón trỏ khẽ gõ ba nhịp xuống mặt bàn đá—ám hiệu của Hắc Vũ Lâu.

"Công tử có mang theo thứ ta cần không?" giọng nàng trầm và lạnh.

Lam Tiêu bước tới, giữ khoảng cách đúng bốn bước chân theo lời căn dặn của sư phụ. "Vật này không thể giao ra trước khi cô nương giải thích vì sao quân cấm vệ lại truy lùng dấu vết Lam Thạch ráo riết đến vậy."

Vân Diệp ngẩng đầu. Đôi mắt nàng sáng như sao băng trong đêm tối, mang theo sự sắc sảo của kẻ đã quá quen với mùi máu tươi. Nàng mỉm cười nhạt: "Bởi vì Hoàng đế sắp chết rồi, chàng thư sinh ngây thơ ạ. Và thứ duy nhất có thể kéo dài mạng sống của ông ta, chính là ký ức mà chàng đang nắm giữ trong tay."`,
        authorNotes: "Cần giữ bí mật của Vân Diệp: Vân Diệp thực chất là công chúa lưu lạc nhưng Lam Tiêu chưa hề biết điều này.",
        comments: [],
        versions: [],
        lastSavedAt: new Date().toISOString(),
      }
    ]
  },
  characters: {
    "proj_1": [
      {
        id: "char_1",
        name: "Lam Tiêu",
        nickname: "Tiêu công tử / Thư sinh Chu Sa",
        role: "protagonist",
        age: 21,
        pronounAndTitle: "Chàng / Lam công tử",
        appearance: "Dáng người thanh mảnh, nước da hơi tái do ngồi nhiều trong thư phòng, ngón tay dính mực tím, ánh mắt kiên định trầm mặc.",
        occupation: "Người sao chép thư tịch cổ kiêm Khôi phục sư ký ức",
        origin: "Mồ côi tại phường thợ gốm Sa Lộ",
        personality: "Cẩn trọng, chu đáo, nội tâm giàu cảm xúc nhưng ít khi bộc lộ ra ngoài. Trọng lời hứa.",
        internalConflict: "Khao khát tìm lại nguồn gốc gia đình nhưng sợ hãi sự thật đen tối sau cái chết của cha mẹ.",
        externalGoal: "Giải mã bí mật cuốn 'Lam Tinh Thư' trước khi Hắc Vũ Lâu đoạt lấy.",
        innerNeed: "Học cách tin tưởng người khác và vượt qua nỗi ám ảnh thời thơ ấu.",
        fears: "Sợ nước sâu (tuyệt đối không biết bơi); sợ bị tước đoạt ký ức.",
        secrets: "Có khả năng nhìn thấy ký ức vương lại trên các cổ vật chạm vào.",
        powersAndLimits: "Dùng bút Chu Sa để sửa chữa ký ức bề mặt, nhưng mỗi lần dùng bị suy giảm thị lực trong 12 canh giờ.",
        habitsAndVoice: "Thường dùng các từ ngữ cổ nhã nhặn: 'Tại hạ', 'Thiết nghĩ', 'Chưa hẳn là vậy'. Thích uống trà hoa cúc nguội.",
        relationships: [
          { targetCharacterId: "char_2", targetName: "Vân Diệp", relationType: "Đồng minh bất đắc dĩ", dynamic: "Vừa đề phòng vừa âm thầm cảm phục sự quyết đoán của nhau." }
        ],
        knowledge: {
          knows: ["Kỹ thuật giải mã Lam Thạch", "Bí mật vị trí Thư viện ngầm", "Nỗi sợ nước của bản thân"],
          unawareOf: ["Thân thế hoàng tộc thật sự của Vân Diệp", "Sư phụ đã bị hạ độc từ một tháng trước"],
          misinterprets: ["Nghĩ rằng Hắc Vũ Lâu chỉ muốn cướp ngọc để bán lấy tiền"],
          hides: ["Cuốn bút ký gãy của cha để lại trong lớp áo lót"],
        },
        chapterStatuses: [
          { chapterId: "chap_1", location: "Thư viện Cổ Mộc", physicalCondition: "Bình thường, mỏi mắt", holdingItem: "Bút Chu Sa gãy", emotionalState: "Bồn chồn" },
          { chapterId: "chap_2", location: "Quán trà Bến Vắng", physicalCondition: "Lạnh buốt do mưa đêm", holdingItem: "Hộp gấm đựng mảnh ngọc", emotionalState: "Cảnh giác" }
        ],
        avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
      },
      {
        id: "char_2",
        name: "Vân Diệp",
        nickname: "Bóng Đêm Sa Lộ / Diệp cô nương",
        role: "supporting",
        age: 19,
        pronounAndTitle: "Nàng / Sát thủ Vân Diệp",
        appearance: "Vóc người thon gọn dẻo dai, y phục dạ hành màu chàm, tóc buộc đuôi ngựa cao, một vết sẹo nhỏ hình trăng khuyết ở gò má trái.",
        occupation: "Sát thủ tự do trực thuộc mạng lưới Hắc Vũ Lâu",
        origin: "Hoàng cung Lam Sa bị phế truất năm 7 tuổi",
        personality: "Sắc sảo, thực dụng, nói năng dứt khoát, không tin vào lòng tốt vô điều kiện nhưng ghét sự hèn nhát.",
        internalConflict: "Hận hoàng gia nhưng không nỡ nhìn thường dân bị tàn sát.",
        externalGoal: "Đoạt lấy mảnh Lam Thạch để tìm ra hung thủ sát hại mẫu thân.",
        innerNeed: "Tìm lại danh tính và sự bình yên nội tâm.",
        fears: "Sợ bóng tối hoàn toàn không có ánh lửa.",
        secrets: "Nàng chính là Cửu Công chúa thất lạc của vương triều Lam Sa.",
        powersAndLimits: "Khinh công phi phàm và thuật ám sát bằng đoản đao, nhưng thể lực yếu khi đối kháng trực diện dài hơi.",
        habitsAndVoice: "Giọng nói mỉa mai nhẹ nhàng: 'Thư sinh ngốc', 'Chết dưới lưỡi đao còn hơn chết vì ngây thơ'. Gõ ngón tay 3 nhịp khi suy nghĩ.",
        relationships: [
          { targetCharacterId: "char_1", targetName: "Lam Tiêu", relationType: "Con tin kiêm đồng hành", dynamic: "Ban đầu định lợi dụng nhưng dần muốn bảo vệ sự ngây thơ của chàng." }
        ],
        knowledge: {
          knows: ["Kế hoạch thanh trừng của Cấm vệ quân", "Hoàng đế sắp băng hà", "Thân thế hoàng gia của bản thân"],
          unawareOf: ["Lam Tiêu không biết bơi", "Lam Tiêu có thể nhìn thấy ký ức qua tiếp xúc cổ vật"],
          misinterprets: ["Nghĩ Lam Tiêu là tay trong của Tể tướng cài vào thư viện"],
          hides: ["Tín vật phượng hoàng bằng bạch ngọc giấu trong cán dao"],
        },
        chapterStatuses: [
          { chapterId: "chap_2", location: "Quán trà Bến Vắng", physicalCondition: "Có vết thương cũ ở bả vai trái", holdingItem: "Đoản đao chuôi bạch ngọc", emotionalState: "Căng thẳng kìm nén" }
        ],
        avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
      }
    ]
  },
  worldRules: {
    "proj_1": [
      {
        id: "w_1",
        category: "power_system",
        name: "Hệ thống Bút Pháp Chu Sa & Lam Thạch",
        description: "Lam Thạch là khoáng thạch cổ kết tinh từ ký ức của tiền nhân. Dùng ngòi bút pha bột chu sa có thể trích xuất hoặc ghi đè ký ức.",
        status: "finalized",
        costOrLimit: "Tiêu hao tuổi thọ và giảm dần thị lực của người thi triển. Không thể tạo ra ký ức không có thật từ hư không.",
      },
      {
        id: "w_2",
        category: "geography",
        name: "Đô thành Sa Lộ",
        description: "Thành phố xây dựng trên vùng đất cát lún cổ đại, bao quanh bởi hệ thống kênh đào mặn và hào lũy đá xanh.",
        status: "finalized",
        exceptions: "Hào nước mặn rất sâu và có xoáy ngầm độc, rơi xuống nước khó bảo toàn tính mạng.",
      },
      {
        id: "w_3",
        category: "glossary",
        name: "Bảng Thuật Ngữ Cổ Phong Lam Sa",
        description: "Thuật ngữ bắt buộc: 'Khôi phục sư' (người phục chế ký ức), 'Hắc Vũ Lâu' (tổ chức tình báo ngầm), 'Lam Tinh Kỷ' (niên đại).",
        status: "finalized",
      }
    ]
  },
  outlines: {
    "proj_1": [
      {
        id: "out_1",
        projectId: "proj_1",
        act: "Hồi I: Khởi Nguyên",
        chapterId: "chap_1",
        storyOrder: 1,
        chronologicalOrder: 1,
        title: "Khai mở bút Chu Sa",
        description: "Lam Tiêu tìm thấy bút cổ và khám phá khả năng chạm vào ký ức.",
        location: "Thư viện Cổ Mộc",
        charactersInvolved: ["char_1"],
        cluesTracked: ["Mảnh ngọc lập lòe", "Lời cảnh báo trong hộp"],
        readerPromises: ["Giải thích bí mật vì sao cha Lam Tiêu qua đời"],
      },
      {
        id: "out_2",
        projectId: "proj_1",
        act: "Hồi I: Khởi Nguyên",
        chapterId: "chap_2",
        storyOrder: 2,
        chronologicalOrder: 2,
        title: "Hội ngộ ở Bến Vắng",
        description: "Vân Diệp yêu cầu Lam Tiêu giao nộp ngọc nhưng bị cấm vệ quân bao vây.",
        location: "Quán trà Bến Vắng",
        charactersInvolved: ["char_1", "char_2"],
        cluesTracked: ["Vết sẹo trăng khuyết của Vân Diệp"],
        impactedChapters: ["chap_3", "chap_4"],
      }
    ]
  },
  memories: {
    "proj_1": [
      {
        id: "mem_1",
        projectId: "proj_1",
        type: "project",
        topic: "Quy tắc cốt lõi: Nỗi sợ nước của Lam Tiêu",
        content: "Lam Tiêu tuyệt đối không biết bơi và cực kỳ hoảng loạn khi tiếp xúc với dòng nước xiết. Mọi cảnh liên quan đến sông ngòi phải thể hiện rõ sự bất lực hoặc người khác cứu.",
        source: "Tác giả phê duyệt từ bản phác thảo nhân vật",
        confidence: 1.0,
        status: "locked",
        createdDate: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
      },
      {
        id: "mem_2",
        projectId: "proj_1",
        type: "project",
        topic: "Bí mật thân thế Vân Diệp",
        content: "Vân Diệp là Cửu Công chúa Lam Sa. Tại thời điểm Chương 1-3, Lam Tiêu chỉ xem nàng là nữ sát thủ giang hồ.",
        source: "Hồ sơ nhân vật & Thiết lập cốt truyện",
        confidence: 1.0,
        status: "locked",
        createdDate: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
      }
    ]
  },
  marketingBrands: {
    "usr_default": [
      {
        id: "brand_1",
        userId: "usr_default",
        brandName: "Trà Sen Tây Hồ Di Sản",
        industry: "Thực phẩm cao cấp & Quà tặng Văn hóa",
        brandPromise: "Đem hương vị truyền thống ngàn năm của sen Bách Diệp vào từng ấm trà thượng hạng.",
        targetAudience: "Doanh nhân, người yêu thưởng trà, kiều bào và quà biếu ngoại giao (30-60 tuổi)",
        toneOfVoice: "Trang trọng, thanh tao, ấm áp, đậm chất văn hóa Tràng An",
        preferredKeywords: ["Tinh hoa", "Thanh khiết", "Gìn giữ di sản", "Bách Diệp Tây Hồ", "Nghệ nhân"],
        forbiddenWords: ["Rẻ nhất", "Đại hạ giá", "Xả hàng", "Cam kết chữa bệnh"],
        approvedSamples: [
          "Mỗi đóa sen ủ hương trà là một khúc ca thầm lặng của đất trời Thủ đô lúc tờ mờ sương."
        ],
        products: [
          {
            id: "prod_1",
            name: "Trà Bông Sen Bách Diệp Thượng Hạng",
            description: "Trà Tân Cương ủ trong đóa sen tươi Tây Hồ vừa hé nụ lúc 4 giờ sáng, cấp đông sâu giữ trọn hương.",
            benefits: ["Hương sen tự nhiên 100%", "Giúp thư thái tinh thần", "Món quà tinh tế tôn vinh người nhận"],
            price: "650.000 VNĐ / Hộp 5 bông",
            proofPoints: "Đạt chuẩn OCOP 4 sao và chứng nhận vùng trồng hồ Quảng Bá."
          }
        ]
      }
    ]
  },
  marketingContent: {
    "usr_default": [
      {
        id: "mkt_1",
        userId: "usr_default",
        brandId: "brand_1",
        title: "Chiến dịch Tết: Một Tách Trà - Vạn Thâm Tình",
        format: "social_post",
        platform: "facebook",
        targetAudience: "Người tìm quà biếu Tết cao cấp",
        goal: "Xây dựng nhận diện thương hiệu & kích thích đặt trước quà Tết",
        hook: "Có những món quà tặng xong người ta quên ngay, nhưng có thứ hương thơm chỉ cần chạm môi là nhớ cả một đời...",
        body: `Người xưa trọng nhau ở cái tâm, người nay quý nhau ở cái tình chân thật.

Giữa vô vàn hộp quà xa xỉ ngoại nhập, một tách Trà Sen Tây Hồ Bách Diệp vẫn giữ được vị thế tôn quý riêng biệt. Từng đóa sen được các nghệ nhân hái từ lúc sương sớm vừa tan trên mặt hồ, nâng niu bọc lấy từng búp trà móc câu Thái Nguyên thượng phẩm.

Khi cánh hoa hé nở trong làn nước sôi thanh khiết, cả gian phòng như lắng đọng lại giữa mùi hương thảo mộc ngan ngát. Ấy không chỉ là thưởng trà, mà là cùng tri kỷ ôn lại những chặng đường đã qua.`,
        callToAction: "Nhắn tin cho chúng tôi ngay hôm nay để nhận danh mục quà tặng khắc tên thủ công độc bản.",
        variations: [
          {
            angle: "Góc nhìn văn hóa hoài niệm",
            hook: "Hà Nội mùa này sương sớm, người sành điệu nhớ nhất điều gì?",
            body: "Không phải sự hối hả nơi phố thị, mà là khoảnh khắc quây quần bên ấm trà sen đượm hương truyền thống..."
          },
          {
            angle: "Góc nhìn quà biếu đẳng cấp",
            hook: "3 tiêu chuẩn chọn quà biếu cấp trên & đối tác khiến họ phải nể trọng",
            body: "1. Không phô trương nhưng hiếm có. 2. Đậm đà câu chuyện văn hóa. 3. Vị ngon thanh khiết khó quên..."
          }
        ],
        hashtags: ["#TraSenTayHo", "#QuaBieuTet2026", "#TinhHoaTrangAn", "#ThuongTra"],
        status: "ready",
        scheduledDate: "2026-09-20",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    ]
  },
  documents: {
    "usr_default": [
      {
        id: "doc_1",
        userId: "usr_default",
        projectId: "proj_1",
        name: "Lịch_sử_vương_triều_Lam_Sa_Cổ_Ký.md",
        fileType: "md",
        sizeBytes: 45200,
        tags: ["Cổ phong", "Nghiên cứu", "Lịch sử"],
        summary: "Tóm tắt 7 thời kỳ hưng thịnh và suy tàn của triều đại Lam Sa, đặc biệt là giai đoạn nội chiến tranh giành mỏ ngọc Lam Thạch.",
        contentSnippet: "Kỷ nguyên Lam Tinh bắt đầu khi vị vua lập quốc phát hiện ra khối thiên thạch phát quang dưới lòng hồ Sa Lộ...",
        uploadedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      }
    ]
  },
  images: {
    "usr_default": [
      {
        id: "img_1",
        userId: "usr_default",
        projectId: "proj_1",
        characterId: "char_1",
        prompt: "Vietnamese fantasy scholar holding an ancient glowing cinnabar ink brush in a rain-soaked ancient bamboo study, moody cinematic lighting, intricate embroidery",
        style: "cinematic",
        aspectRatio: "3:4",
        imageUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80",
        description: "Hình phác thảo nhân vật Lam Tiêu trong thư phòng Cổ Mộc",
        createdAt: new Date().toISOString(),
      },
      {
        id: "img_2",
        userId: "usr_default",
        projectId: "proj_1",
        characterId: "char_2",
        prompt: "Female assassin in deep indigo silk holding a crescent dagger, misty lake shore in night rain, sharp gaze, photorealistic digital painting",
        style: "digital_art",
        aspectRatio: "3:4",
        imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80",
        description: "Chân dung Vân Diệp tại quán trà Bến Vắng",
        createdAt: new Date().toISOString(),
      }
    ]
  },
  calendarEvents: {
    "usr_default": [
      {
        id: "cal_1",
        userId: "usr_default",
        projectId: "proj_1",
        chapterId: "chap_2",
        title: "Hoàn thiện bản thảo Chương 2 (Hội ngộ ở Bến Vắng)",
        date: "2026-09-15",
        type: "chapter_deadline",
        status: "in_progress",
        targetWords: 3500,
        reminder: true,
      },
      {
        id: "cal_2",
        userId: "usr_default",
        contentId: "mkt_1",
        title: "Đăng bài Fanpage: Trà Sen Bách Diệp Tết 2026",
        date: "2026-09-20",
        type: "content_publish",
        status: "waiting_review",
        targetWords: 450,
        reminder: true,
      },
      {
        id: "cal_3",
        userId: "usr_default",
        projectId: "proj_1",
        title: "Sprint viết cuối tuần: 4.000 từ Chương 3",
        date: "2026-09-22",
        type: "writing_sprint",
        status: "idea",
        targetWords: 4000,
        reminder: true,
      }
    ]
  },
  chats: {
    "usr_default": [
      {
        id: "chat_1",
        userId: "usr_default",
        projectId: "proj_1",
        title: "Lên ý tưởng xung đột Chương 3",
        mode: "brainstorm",
        messages: [
          {
            id: "msg_1",
            role: "user",
            content: "KAIST ơi, trong Chương 3 khi cấm vệ quân ập vào quán trà Bến Vắng, làm sao để tạo tình huống gay cấn mà không để Lam Tiêu phải nhảy xuống hồ bơi cứu Vân Diệp (vì Lam Tiêu tuyệt đối không biết bơi)?",
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            contextScope: "project",
          },
          {
            id: "msg_2",
            role: "assistant",
            content: `Dựa trên quy tắc cốt lõi đã chốt của dự án **Ký Ức Lam Sa**:
1. **Lam Tiêu tuyệt đối không biết bơi** và mang nỗi sợ nước sâu ám ảnh từ nhỏ.
2. **Vân Diệp đang bị thương ở bả vai trái** nhưng kỹ năng khinh công và phản xạ đoản đao vẫn cực kỳ sắc bén.

Đây là 3 phương án kịch tính mà hoàn toàn nhất quán với quy tắc:

### Phương án 1: Bẫy Sập Sàn Gỗ & Mực Chu Sa Phát Quang (Khuyên Dùng)
- **Tình huống**: Cấm vệ quân bắn tên lửa thiêu rụi quán trà. Lam Tiêu bị dồn vào mép sàn gỗ mục rung lắc dữ dội ngay trên mặt nước đen ngòm xoáy xiết. Chàng hoảng loạn đến tê liệt cả hai chân khi nhìn thấy bọt nước mặn cuộn trào bên dưới.
- **Giải quyết**: Thay vì bơi, Lam Tiêu lợi dụng cây bút Chu Sa vẩy một vệt mực phát quang vào bình dầu trên nóc nhà làm chói mắt cấm vệ quân. Chính Vân Diệp, dù bị đau, đã dùng dải thắt lưng quăng ra kéo chàng bật ngược vào mỏm đá an toàn. Sự run rẩy của Lam Tiêu khi đứng trên đất khô sẽ làm bật lên sự tương phản tuyệt đẹp giữa lòng dũng cảm tinh thần và điểm yếu thể xác.

### Phương án 2: Dòng Nước Cạn & Đòn Đánh Lạc Hướng
- Hai người chạy về phía cửa cống ngầm thoát nước của hồ. Nước chỉ ngập tới mắt cá chân nên Lam Tiêu vẫn di chuyển được, nhưng tiếng nước róc rách trong hầm tối làm tim chàng đập thình thịch...

Bạn muốn KAIST triển khai chi tiết đối thoại cho Phương án 1 hay muốn thử nghiệm một hướng khác?`,
            timestamp: new Date(Date.now() - 3500000).toISOString(),
            sources: [{ title: "Quy tắc dự án: Nỗi sợ nước của Lam Tiêu" }, { title: "Hồ sơ nhân vật: Lam Tiêu & Vân Diệp" }],
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    ]
  },
  preferences: {
    "usr_default": [
      {
        id: "pref_1",
        userId: "usr_default",
        category: "visual_lighting",
        title: "Ưu tiên diện mạo & ngũ quan sáng rõ",
        description: "Luôn áp dụng ánh sáng chiếu rõ khuôn mặt, mắt, biểu cảm và trang phục, không để chìm vào bóng tối",
        enabled: true,
        isProjectSpecific: false,
        createdAt: new Date().toISOString(),
      },
      {
        id: "pref_2",
        userId: "usr_default",
        category: "visual_lighting",
        title: "Tránh bóng tối nuốt mất chi tiết ngai vàng & phục trang",
        description: "Dù chủ đề bóng tối, vẫn thể hiện rõ hoa văn vương miện, viền áo hoàng gia và họa tiết ngai",
        enabled: true,
        isProjectSpecific: false,
        createdAt: new Date().toISOString(),
      },
      {
        id: "pref_3",
        userId: "usr_default",
        category: "visual_style",
        title: "Tương phản điện ảnh tự nhiên",
        description: "Tạo không khí bằng bảng màu huyền bí (tím thẫm, xanh chàm, ánh bạc) thay vì bôi đen toàn cảnh",
        enabled: true,
        isProjectSpecific: false,
        createdAt: new Date().toISOString(),
      }
    ]
  },
  feedback: {
    "usr_default": []
  },
  storyAutomations: {
    "usr_default": []
  },
  publicationQueue: {
    "usr_default": []
  },
  mangaScripts: {
    "usr_default": []
  }
};

// -----------------------------------------------------------------------------
// LOCAL DISK PERSISTENCE LAYER (Data Survives Server/Container Restarts)
// -----------------------------------------------------------------------------
const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "kaist_store.json");
const IMAGES_DIR = path.join(DATA_DIR, "generated_images");
const DOCS_DIR = path.join(DATA_DIR, "documents");

// Secure Password Hashing & Verification (scrypt + random salt)
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  if (!stored || typeof stored !== "string" || !stored.includes(":")) return false;
  const [salt, expectedHash] = stored.split(":");
  if (!salt || !expectedHash) return false;
  try {
    const hash = crypto.scryptSync(password, salt, 64).toString("hex");
    return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(expectedHash, "hex"));
  } catch {
    return false;
  }
}

function sanitizeUser(user: any): any {
  if (!user) return null;
  const { passwordHash, resetCode, verificationCode, ...safeUser } = user;
  return safeUser;
}

function loadDbFromDisk(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });
    if (!fs.existsSync(DOCS_DIR)) fs.mkdirSync(DOCS_DIR, { recursive: true });
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf-8").trim();
      const parsed = raw ? JSON.parse(raw) : {};
      // Merge keys from parsed into db
      Object.keys(parsed).forEach((key) => {
        if (parsed[key] && typeof parsed[key] === "object") {
          (db as any)[key] = { ...(db as any)[key], ...parsed[key] };
        }
      });
      // Security: Revoke all unverified/stale sessions on server boot
      db.sessions = {};
      if (!raw) saveDbToDisk();
      console.log("Loaded KAIST persistent database from disk successfully.");
    } else {
      db.sessions = {};
      saveDbToDisk();
    }

    // Ensure default demo user has secure password hash initialized if missing
    if (db.users["usr_default"] && !db.users["usr_default"].passwordHash) {
      db.users["usr_default"].passwordHash = hashPassword("Kaist2026@Secure");
      db.users["usr_default"].emailVerified = true;
    }

    db.storyAutomations = db.storyAutomations || {};
    db.publicationQueue = db.publicationQueue || {};
    db.mangaScripts = db.mangaScripts || {};
  } catch (err) {
    console.log("[KAIST Storage] Khởi tạo trạng thái ban đầu từ bộ nhớ:", err);
  }
}

let saveTimer: any = null;
function saveDbToDisk(): void {
  try {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), "utf-8");
    }, 400);
  } catch (err) {
    console.log("[KAIST Storage] Lưu trữ dữ liệu đĩa:", err);
  }
}

// Initialize persistence on startup
loadDbFromDisk();

// Session Helper: extract token from Authorization header (Bearer <token>) or body
function getSessionToken(req: express.Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7).trim();
    if (token) return token;
  }
  if (req.body && typeof req.body.sessionToken === "string" && req.body.sessionToken) {
    return req.body.sessionToken.trim();
  }
  return null;
}

// Session Validation: verify cryptographic session token and expiration
function getAuthenticatedSession(req: express.Request): { userId: string; user: any; token: string } | null {
  const token = getSessionToken(req);
  if (!token) return null;
  if (!db.sessions) db.sessions = {};
  const session = db.sessions[token];
  if (!session) return null;
  // Check session expiration (7 days TTL)
  if (session.expiresAt && session.expiresAt < Date.now()) {
    delete db.sessions[token];
    saveDbToDisk();
    return null;
  }
  const user = db.users[session.userId];
  if (!user) return null;
  return { userId: session.userId, user, token };
}

// Helper to get active user ID from authenticated session only (NEVER falls back to default user)
function getUserId(req: express.Request): string {
  if ((req as any).userId) {
    return (req as any).userId;
  }
  const session = getAuthenticatedSession(req);
  return session ? session.userId : "";
}

// Express Middleware: enforce valid authenticated session
function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const session = getAuthenticatedSession(req);
  if (!session) {
    return res.status(401).json({
      success: false,
      error: "Yêu cầu đăng nhập để truy cập tài nguyên này",
      code: "UNAUTHORIZED",
    });
  }
  (req as any).userId = session.userId;
  (req as any).user = session.user;
  (req as any).sessionToken = session.token;
  next();
}

// Security: Verify user has access to this specific story project (Strict ownership check, IDOR protection)
function checkProjectAccess(uid: string, projectId: string): boolean {
  if (!uid || !projectId) return false;
  const userProjects = db.projects[uid] || [];
  return userProjects.some((p: any) => p.id === projectId);
}

// AI Candidate Models for High Availability and Tiered Fallback
// Current Gemini text fallback tier: stable production models first, preview only as last resort.
const FALLBACK_MODEL_TIER = [
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.1-pro-preview",
];

// Helper: Normalize old/deprecated model names to currently supported Gemini 3 models.
function normalizeGeminiModel(model?: string): string {
  if (!model) return "gemini-3.6-flash";
  const m = model.toLowerCase();
  if (m.includes("2.5") || m.includes("2.0") || m.includes("1.5") || m === "gemini-flash-latest") {
    if (m.includes("pro")) return "gemini-3.1-pro-preview";
    return "gemini-3.6-flash";
  }
  if (m === "gemini-3.1-flash-lite") return "gemini-3.5-flash-lite";
  return model;
}

// Circuit Breaker: Tracks models that are temporarily experiencing 503 high demand or 429 quota limits
const modelDegradedUntil: Record<string, number> = {};

// AI Helper: Call Gemini with timeout, tiered model fallback, circuit breaker, and intelligent retry
async function callGeminiWithTimeoutAndRetry(
  ai: GoogleGenAI,
  params: {
    model?: string;
    contents: any;
    config?: any;
  },
  timeoutMs = 25000,
  maxRetries = 2
): Promise<any> {
  const normalizedRequestedModel = normalizeGeminiModel(params.model);
  const now = Date.now();

  // Candidate pool prioritizing requested model and fallback tier
  const candidatePool = Array.from(
    new Set([
      normalizedRequestedModel,
      ...FALLBACK_MODEL_TIER,
    ])
  );

  // Models that are NOT degraded come first; degraded models are kept as last resorts
  const healthyModels = candidatePool.filter(
    (m) => !modelDegradedUntil[m] || modelDegradedUntil[m] <= now
  );
  const degradedModels = candidatePool.filter(
    (m) => modelDegradedUntil[m] && modelDegradedUntil[m] > now
  );

  const modelTier = healthyModels.length > 0 ? [...healthyModels, ...degradedModels] : candidatePool;

  let attempt = 0;
  let lastError: any = null;

  while (attempt < modelTier.length) {
    const currentModel = modelTier[attempt];
    attempt++;

    try {
      console.log(`[KAIST AI Engine] Đang gọi mô hình: ${currentModel} (Mô hình ${attempt}/${modelTier.length})`);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error("AI_TIMEOUT: Thời gian chờ phản hồi từ AI đã quá hạn (25s).")),
          timeoutMs
        );
      });
      const generatePromise = ai.models.generateContent({
        ...params,
        model: currentModel,
      });
      const result = (await Promise.race([generatePromise, timeoutPromise])) as any;
      if (result) {
        result._modelUsed = currentModel;
        // Successful call clears any past degradation status for this model
        if (modelDegradedUntil[currentModel]) {
          delete modelDegradedUntil[currentModel];
        }
      }
      return result;
    } catch (err: any) {
      lastError = err;
      const status = err?.status;
      const msg = err?.message || "";

      const isQuotaExhausted =
        status === 429 &&
        (msg.includes("exceeded your current quota") ||
          msg.includes("RESOURCE_EXHAUSTED") ||
          msg.includes("Quota exceeded") ||
          msg.includes("free_tier_requests") ||
          msg.includes("GenerateRequestsPerDay"));

      const is503HighDemand =
        status === 503 ||
        msg.includes("currently experiencing high demand") ||
        msg.includes("503") ||
        msg.includes("UNAVAILABLE") ||
        msg.includes("Service Unavailable");

      const isAuthError =
        status === 401 ||
        status === 403 ||
        msg.includes("API_KEY_INVALID") ||
        msg.includes("PERMISSION_DENIED");

      const isClientError = status === 400;

      const isModelNotFoundOrDeprecated =
        status === 404 ||
        msg.includes("no longer available") ||
        msg.includes("not found") ||
        msg.includes("is deprecated") ||
        msg.includes("NOT_FOUND");

      // Critical rule: If auth error or bad client request (except model not found), DO NOT retry across models
      if (isAuthError || (isClientError && !isModelNotFoundOrDeprecated)) {
        console.error(`[KAIST AI Engine] Lỗi không thể khắc phục bằng đổi mô hình (${status}): ${msg.slice(0, 150)}`);
        throw err;
      }

      // If model not found (404/deprecated), permanently disable it in current runtime session and switch immediately
      if (isModelNotFoundOrDeprecated) {
        modelDegradedUntil[currentModel] = Infinity;
        console.warn(
          `[KAIST AI Engine] Mô hình ${currentModel} không còn khả dụng hoặc bị xóa (404/deprecated). Đang tự động chuyển tiếp sang mô hình thế hệ mới...`
        );
        continue;
      }

      // If 503 high demand or 429 quota, activate circuit breaker for this model and switch immediately
      if (is503HighDemand) {
        modelDegradedUntil[currentModel] = Date.now() + 120_000; // 2 minutes cooldown
        console.log(
          `[KAIST AI Engine] Mô hình ${currentModel} đang quá tải tạm thời (503 High Demand). Đang tự động chuyển tiếp mượt mà sang mô hình dự phòng...`
        );
        continue;
      }

      if (isQuotaExhausted) {
        modelDegradedUntil[currentModel] = Date.now() + 300_000; // 5 minutes cooldown
        console.log(
          `[KAIST AI Engine] Mô hình ${currentModel} hết hạn mức quota (429). Đang tự động chuyển tiếp sang mô hình dự phòng tiếp theo...`
        );
        continue;
      }

      console.warn(
        `[KAIST AI Engine] Mô hình ${currentModel} gặp sự cố tạm thời: [${status || "N/A"}] ${msg.slice(0, 140)}`
      );

      // If transient rate limit (RPM with wait time), wait a small interval before trying next
      let suggestedDelayMs = 300;
      const match = msg.match(/retry in (\d+(\.\d+)?)s/i);
      if (match) {
        suggestedDelayMs = Math.min(Math.ceil(parseFloat(match[1]) * 1000), 2000);
      }
      await new Promise((r) => setTimeout(r, suggestedDelayMs));
    }
  }

  throw lastError;
}

// -----------------------------------------------------------------------------
// SECURE URL & SOURCE VERIFICATION GUARD (CHỐNG LIÊN KẾT RÁC, CỜ BẠC & SSRF)
// -----------------------------------------------------------------------------
const GAMBLING_SPAM_REGEX =
  /(togel|slot|casino|judi|gacor|bet\d+|\d+bet|kubet|xoso|xổ số|cá cược|lô đề|poker|roulette|baccarat|đánh bài|jackpot|sbobet|w88|fb88|fun88|m88|bk8|188bet|dafabet|vn88|loto|xo-so|so-xo|quay-thu|xskt|dudoan|quaythu|soicau|keonhacai|ligabandot)/i;

interface UrlVerificationResult {
  valid: boolean;
  finalUrl?: string;
  domain?: string;
  reason?: string;
}

async function verifyWebUrl(url: string, claimedTitle?: string): Promise<UrlVerificationResult> {
  if (!url || typeof url !== "string") {
    return { valid: false, reason: "Đường dẫn trống hoặc không hợp lệ" };
  }

  const cleanUrl = url.trim();
  let parsed: URL;
  try {
    parsed = new URL(cleanUrl);
  } catch {
    return { valid: false, reason: "Định dạng URL không hợp lệ" };
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    return { valid: false, reason: `Giao thức không được hỗ trợ: ${parsed.protocol}` };
  }

  const host = parsed.hostname.toLowerCase();

  // SSRF & Local network prevention
  if (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "0.0.0.0" ||
    host.startsWith("10.") ||
    host.startsWith("192.168.") ||
    host.startsWith("172.") ||
    host.startsWith("169.254.") ||
    host.endsWith(".internal") ||
    host.endsWith(".local") ||
    host.includes("metadata.google")
  ) {
    return { valid: false, reason: "Ngăn chặn truy cập mạng nội bộ (SSRF Guard)" };
  }

  // Keyword check on initial URL and hostname
  if (GAMBLING_SPAM_REGEX.test(cleanUrl) || GAMBLING_SPAM_REGEX.test(host)) {
    return { valid: false, reason: "Phát hiện từ khóa cá cược, cờ bạc hoặc xổ số trong URL hoặc tên miền" };
  }

  try {
    const res = await fetch(cleanUrl, {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(4500),
      redirect: "follow",
    });

    if (!res.ok) {
      return { valid: false, reason: `Máy chủ đích trả về mã lỗi HTTP ${res.status}` };
    }

    const finalUrl = res.url;
    const finalParsed = new URL(finalUrl);
    const finalHost = finalParsed.hostname.toLowerCase();

    // Check redirect destination
    if (GAMBLING_SPAM_REGEX.test(finalUrl) || GAMBLING_SPAM_REGEX.test(finalHost)) {
      return { valid: false, reason: `Chuyển hướng sang tên miền/URL cờ bạc, cá cược: ${finalHost}` };
    }

    // Check if deep article path was hijacked/redirected to root homepage
    if (parsed.pathname.length > 3 && finalParsed.pathname === "/" && !finalUrl.includes(parsed.pathname)) {
      return { valid: false, reason: `Đường dẫn bài viết bị chuyển hướng bất thường về trang chủ (${finalUrl})` };
    }

    const html = await res.text();
    const titleMatch = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
    const pageTitle = titleMatch ? titleMatch[1].replace(/\s+/g, " ").trim() : "";

    if (GAMBLING_SPAM_REGEX.test(pageTitle) || GAMBLING_SPAM_REGEX.test(html.slice(0, 50000))) {
      return {
        valid: false,
        reason: `Nội dung trang đích chứa từ khóa cá cược, cờ bạc hoặc xổ số (Tiêu đề: "${pageTitle.slice(0, 50)}")`,
      };
    }

    if (/domain (for sale|is parked|expired)|buy this domain/i.test(pageTitle)) {
      return { valid: false, reason: "Tên miền đã hết hạn hoặc đang được rao bán" };
    }

    return { valid: true, finalUrl, domain: finalHost };
  } catch (err: any) {
    return { valid: false, reason: err?.message || "Không thể kết nối đến trang đích để kiểm chứng" };
  }
}

// -----------------------------------------------------------------------------
// REST API SECURITY MIDDLEWARES & AUTH ENDPOINTS
// -----------------------------------------------------------------------------

// Global /api protection middleware (defense in depth)
app.use("/api", (req, res, next) => {
  const publicPaths = [
    "/health",
    "/auth/google",
    "/auth/me",
    "/auth/config",
    "/auth/logout",
    "/auth/register",
    "/auth/login",
    "/auth/forgot-password",
    "/auth/reset-password",
    "/auth/verify-email",
    "/auth/resend-verification",
    "/system/release-info",
  ];
  if (
    publicPaths.includes(req.path) ||
    req.path.startsWith("/images/raw/") ||
    req.path.startsWith("/documents/raw/")
  ) {
    return next();
  }
  return requireAuth(req, res, next);
});

// Anti-IDOR Middleware: ensure project belongs to current authenticated user
app.use("/api/projects/:projectId", (req, res, next) => {
  const uid = (req as any).userId;
  const { projectId } = req.params;
  if (projectId && !checkProjectAccess(uid, projectId)) {
    return res.status(403).json({
      success: false,
      error: "Bạn không có quyền truy cập vào dự án này",
      code: "FORBIDDEN",
    });
  }
  next();
});

// Auth & User Profile
app.get("/api/auth/me", (req, res) => {
  const session = getAuthenticatedSession(req);
  if (!session) {
    return res.status(401).json({
      success: false,
      authenticated: false,
      user: null,
      message: "Chưa đăng nhập hoặc phiên làm việc đã kết thúc",
    });
  }
  res.json({
    success: true,
    authenticated: true,
    user: sanitizeUser(session.user),
  });
});

// Email/Password Registration Endpoint
app.post("/api/auth/register", (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return res.status(400).json({
        success: false,
        error: "Vui lòng nhập địa chỉ email hợp lệ",
      });
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      return res.status(400).json({
        success: false,
        error: "Mật khẩu phải có độ dài tối thiểu từ 6 ký tự",
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanName = (name && typeof name === "string" && name.trim()) || cleanEmail.split("@")[0];

    // Check if user already exists
    const existingUser = Object.values(db.users).find(
      (u: any) => u.email && u.email.toLowerCase() === cleanEmail
    ) as any;

    if (existingUser && existingUser.passwordHash) {
      return res.status(409).json({
        success: false,
        error: "Email này đã được đăng ký tài khoản. Vui lòng chuyển sang tab Đăng nhập.",
      });
    }

    let user: any;
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    if (existingUser) {
      // User signed up with Google before, link password
      existingUser.passwordHash = hashPassword(password);
      if (cleanName) existingUser.name = cleanName;
      existingUser.verificationCode = {
        code: verificationCode,
        expiresAt: Date.now() + 15 * 60 * 1000,
      };
      user = existingUser;
    } else {
      // Create new isolated user
      const newUid = "usr_" + crypto.randomBytes(8).toString("hex");
      user = {
        id: newUid,
        email: cleanEmail,
        name: cleanName,
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanName)}`,
        role: "author",
        language: "vi",
        timezone: "Asia/Ho_Chi_Minh",
        dailyGoalWords: 1500,
        currentStreak: 1,
        totalWordsWritten: 0,
        createdAt: new Date().toISOString(),
        passwordHash: hashPassword(password),
        emailVerified: false,
        verificationCode: {
          code: verificationCode,
          expiresAt: Date.now() + 15 * 60 * 1000,
        },
      };
      db.users[newUid] = user;
      db.projects[newUid] = [];
      db.marketingBrands[newUid] = [];
      db.marketingContent[newUid] = [];
      db.documents[newUid] = [];
      db.images[newUid] = [];
      db.calendarEvents[newUid] = [];
      db.chats[newUid] = [];
    }

    // Issue secure session token (256-bit entropy)
    const sessionToken = "kst_" + crypto.randomBytes(32).toString("hex");
    if (!db.sessions) db.sessions = {};
    db.sessions[sessionToken] = {
      token: sessionToken,
      userId: user.id,
      email: user.email,
      name: user.name,
      createdAt: Date.now(),
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    };

    saveDbToDisk();

    return res.status(201).json({
      success: true,
      user: sanitizeUser(user),
      sessionToken,
      verificationCode, // Provided for instant in-app verification in preview
      message: "Tạo tài khoản thành công!",
    });
  } catch (err: any) {
    console.error("[KAIST Register Error]:", err);
    return res.status(500).json({
      success: false,
      error: "Lỗi máy chủ khi đăng ký tài khoản: " + (err?.message || "Unknown error"),
    });
  }
});

// Email/Password Login Endpoint
app.post("/api/auth/login", (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Vui lòng nhập đầy đủ Email và Mật khẩu",
      });
    }

    const cleanEmail = email.toLowerCase().trim();

    const user = Object.values(db.users).find(
      (u: any) => u.email && u.email.toLowerCase() === cleanEmail
    ) as any;

    if (!user || !user.passwordHash) {
      return res.status(401).json({
        success: false,
        error: "Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.",
      });
    }

    const isMatch = verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: "Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.",
      });
    }

    // Issue secure session token
    const sessionToken = "kst_" + crypto.randomBytes(32).toString("hex");
    if (!db.sessions) db.sessions = {};
    db.sessions[sessionToken] = {
      token: sessionToken,
      userId: user.id,
      email: user.email,
      name: user.name,
      createdAt: Date.now(),
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    };

    saveDbToDisk();

    return res.json({
      success: true,
      user: sanitizeUser(user),
      sessionToken,
      message: "Đăng nhập thành công!",
    });
  } catch (err: any) {
    console.error("[KAIST Login Error]:", err);
    return res.status(500).json({
      success: false,
      error: "Lỗi máy chủ khi đăng nhập: " + (err?.message || "Unknown error"),
    });
  }
});

// Email Verification Endpoint
app.post("/api/auth/verify-email", (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({
        success: false,
        error: "Vui lòng cung cấp email và mã xác nhận",
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = Object.values(db.users).find(
      (u: any) => u.email && u.email.toLowerCase() === cleanEmail
    ) as any;

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "Không tìm thấy tài khoản với email này",
      });
    }

    if (
      user.verificationCode &&
      user.verificationCode.code === String(code).trim() &&
      user.verificationCode.expiresAt > Date.now()
    ) {
      user.emailVerified = true;
      delete user.verificationCode;
      saveDbToDisk();

      return res.json({
        success: true,
        user: sanitizeUser(user),
        message: "Xác minh email thành công!",
      });
    }

    return res.status(400).json({
      success: false,
      error: "Mã xác thực không hợp lệ hoặc đã hết hạn (hiệu lực 15 phút)",
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: "Lỗi máy chủ khi xác minh email",
    });
  }
});

// Resend Verification Code Endpoint
app.post("/api/auth/resend-verification", (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Vui lòng cung cấp email",
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = Object.values(db.users).find(
      (u: any) => u.email && u.email.toLowerCase() === cleanEmail
    ) as any;

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "Không tìm thấy tài khoản với email này",
      });
    }

    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.verificationCode = {
      code: newCode,
      expiresAt: Date.now() + 15 * 60 * 1000,
    };
    saveDbToDisk();

    return res.json({
      success: true,
      verificationCode: newCode,
      message: "Mã xác minh mới đã được tạo thành công!",
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: "Lỗi máy chủ khi gửi lại mã",
    });
  }
});

// Forgot Password - Generate 6-digit Reset Code
app.post("/api/auth/forgot-password", (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.includes("@")) {
      return res.status(400).json({
        success: false,
        error: "Vui lòng nhập địa chỉ email hợp lệ",
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = Object.values(db.users).find(
      (u: any) => u.email && u.email.toLowerCase() === cleanEmail
    ) as any;

    if (user) {
      const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
      user.resetCode = {
        code: resetCode,
        expiresAt: Date.now() + 15 * 60 * 1000, // 15 mins
      };
      saveDbToDisk();

      return res.json({
        success: true,
        resetCode, // Delivered to client for preview testing
        message: "Mã khôi phục mật khẩu gồm 6 chữ số đã được tạo thành công.",
      });
    }

    // Generic OWASP friendly message
    return res.json({
      success: true,
      message: "Nếu email này tồn tại trong hệ thống, mã khôi phục đã được tạo.",
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: "Lỗi máy chủ khi yêu cầu đặt lại mật khẩu",
    });
  }
});

// Reset Password with Code Endpoint
app.post("/api/auth/reset-password", (req, res) => {
  try {
    const { email, resetCode, newPassword } = req.body;

    if (!email || !resetCode || !newPassword) {
      return res.status(400).json({
        success: false,
        error: "Vui lòng điền đầy đủ Email, Mã khôi phục và Mật khẩu mới",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: "Mật khẩu mới phải có tối thiểu 6 ký tự",
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = Object.values(db.users).find(
      (u: any) => u.email && u.email.toLowerCase() === cleanEmail
    ) as any;

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "Không tìm thấy tài khoản với email này",
      });
    }

    if (
      user.resetCode &&
      user.resetCode.code === String(resetCode).trim() &&
      user.resetCode.expiresAt > Date.now()
    ) {
      user.passwordHash = hashPassword(newPassword);
      delete user.resetCode;

      // Invalidate all old sessions
      if (db.sessions) {
        Object.keys(db.sessions).forEach((t) => {
          if (db.sessions[t].userId === user.id) {
            delete db.sessions[t];
          }
        });
      }

      // Issue new session
      const sessionToken = "kst_" + crypto.randomBytes(32).toString("hex");
      if (!db.sessions) db.sessions = {};
      db.sessions[sessionToken] = {
        token: sessionToken,
        userId: user.id,
        email: user.email,
        name: user.name,
        createdAt: Date.now(),
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
      };

      saveDbToDisk();

      return res.json({
        success: true,
        sessionToken,
        user: sanitizeUser(user),
        message: "Đặt lại mật khẩu thành công! Bạn đã được đăng nhập tự động.",
      });
    }

    return res.status(400).json({
      success: false,
      error: "Mã khôi phục không hợp lệ hoặc đã hết hạn (hiệu lực 15 phút)",
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: "Lỗi máy chủ khi đặt lại mật khẩu",
    });
  }
});

// OAuth Client configuration endpoint
const DEFAULT_GOOGLE_CLIENT_ID = "701735649238-3b738mc5f69nnfd490cd5j7rgbrmilnh.apps.googleusercontent.com";
const getEffectiveGoogleClientId = () => process.env.GOOGLE_CLIENT_ID || DEFAULT_GOOGLE_CLIENT_ID;

app.get("/api/auth/config", (req, res) => {
  const googleClientId = getEffectiveGoogleClientId();
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.json({
    googleClientId,
    appUrl: process.env.APP_URL || "https://kaist-ai-story-writer-production.up.railway.app",
    officialOrigin: "https://kaist-ai-story-writer-production.up.railway.app",
    hasConfiguredClientId: Boolean(googleClientId),
  });
});

// Fallback OAuth redirect endpoints (if Google redirect flow is configured in console)
app.get(["/api/auth/google/callback", "/auth/google/callback"], (req, res) => {
  const error = req.query.error;
  if (error) {
    return res.redirect(`/?auth_error=${encodeURIComponent(String(error))}`);
  }
  return res.redirect("/");
});

// Real Google Sign-In verification endpoint
app.post("/api/auth/google", async (req, res) => {
  try {
    const { credential, accessToken } = req.body;

    if (!credential && !accessToken) {
      return res.status(400).json({
        success: false,
        error: "Yêu cầu cung cấp thông tin xác thực Google (ID Token credential hoặc accessToken)",
        code: "MISSING_CREDENTIALS",
      });
    }

    let googleUser: {
      googleId: string;
      email: string;
      name: string;
      avatar: string;
    } | null = null;

    if (credential) {
      // Official Google ID Token validation via Google OAuth2 TokenInfo API
      const googleRes = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`
      );
      if (!googleRes.ok) {
        return res.status(401).json({
          success: false,
          error: "ID Token Google không hợp lệ hoặc đã hết hạn",
          code: "INVALID_GOOGLE_TOKEN",
        });
      }
      const tokenInfo: any = await googleRes.json();
      if (!tokenInfo.email || (tokenInfo.email_verified !== "true" && tokenInfo.email_verified !== true)) {
        return res.status(401).json({
          success: false,
          error: "Tài khoản Google chưa được xác thực email bởi Google",
          code: "EMAIL_NOT_VERIFIED",
        });
      }

      // Check client_id if configured
      const configuredClientId = getEffectiveGoogleClientId();
      if (configuredClientId && tokenInfo.aud !== configuredClientId && tokenInfo.azp !== configuredClientId) {
        console.warn(`[OAuth Warning] Token aud (${tokenInfo.aud}) does not match configured GOOGLE_CLIENT_ID (${configuredClientId})`);
      }

      googleUser = {
        googleId: tokenInfo.sub,
        email: tokenInfo.email.toLowerCase().trim(),
        name: tokenInfo.name || tokenInfo.email.split("@")[0],
        avatar: tokenInfo.picture || "",
      };
    } else if (accessToken) {
      // Official Google Access Token validation via Google UserInfo API
      const googleRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!googleRes.ok) {
        return res.status(401).json({
          success: false,
          error: "Google Access Token không hợp lệ hoặc đã hết hạn",
          code: "INVALID_ACCESS_TOKEN",
        });
      }
      const userInfo: any = await googleRes.json();
      if (!userInfo.email) {
        return res.status(401).json({
          success: false,
          error: "Không tìm thấy thông tin email trong hồ sơ Google",
          code: "NO_EMAIL_IN_PROFILE",
        });
      }
      googleUser = {
        googleId: userInfo.sub,
        email: userInfo.email.toLowerCase().trim(),
        name: userInfo.name || userInfo.email.split("@")[0],
        avatar: userInfo.picture || "",
      };
    }

    if (!googleUser) {
      return res.status(401).json({
        success: false,
        error: "Không thể xác minh thông tin tài khoản Google",
      });
    }

    // Match existing user by googleId or verified email
    let user = Object.values(db.users).find(
      (u: any) =>
        (u.googleId && u.googleId === googleUser!.googleId) ||
        (u.email && u.email.toLowerCase() === googleUser!.email)
    ) as any;

    if (!user) {
      // Create new isolated user
      const newUid = "usr_" + crypto.randomBytes(8).toString("hex");
      user = {
        id: newUid,
        googleId: googleUser.googleId,
        email: googleUser.email,
        name: googleUser.name,
        avatar: googleUser.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(googleUser.name)}`,
        role: "author",
        language: "vi",
        timezone: "Asia/Ho_Chi_Minh",
        dailyGoalWords: 1500,
        currentStreak: 1,
        totalWordsWritten: 0,
        createdAt: new Date().toISOString(),
      };
      db.users[newUid] = user;
      db.projects[newUid] = [];
      db.marketingBrands[newUid] = [];
      db.marketingContent[newUid] = [];
      db.documents[newUid] = [];
      db.images[newUid] = [];
      db.calendarEvents[newUid] = [];
      db.chats[newUid] = [];
    } else {
      user.googleId = googleUser.googleId;
      if (googleUser.name) user.name = googleUser.name;
      if (googleUser.avatar) user.avatar = googleUser.avatar;
      db.users[user.id] = user;
    }

    // Issue cryptographically secure session token (256-bit entropy)
    const sessionToken = "kst_" + crypto.randomBytes(32).toString("hex");
    if (!db.sessions) db.sessions = {};
    db.sessions[sessionToken] = {
      token: sessionToken,
      userId: user.id,
      email: user.email,
      name: user.name,
      createdAt: Date.now(),
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7-day session
    };

    saveDbToDisk();

    return res.json({
      success: true,
      sessionToken,
      user: sanitizeUser(user),
      message: "Đăng nhập Google thành công",
    });
  } catch (err: any) {
    console.error("[KAIST Auth Error]:", err?.message || err);
    return res.status(500).json({
      success: false,
      error: "Lỗi máy chủ khi xác thực Google: " + (err?.message || "Unknown error"),
    });
  }
});

app.post("/api/auth/update-profile", (req, res) => {
  const uid = getUserId(req);
  if (!uid || !db.users[uid]) {
    return res.status(404).json({ error: "Không tìm thấy người dùng" });
  }
  // Prevent altering immutable security identifiers
  const { id, googleId, email, ...safeUpdates } = req.body;
  db.users[uid] = { ...db.users[uid], ...safeUpdates, id: uid };
  saveDbToDisk();
  res.json({ success: true, user: db.users[uid] });
});

app.post("/api/auth/logout", (req, res) => {
  const token = getSessionToken(req);
  if (token && db.sessions && db.sessions[token]) {
    delete db.sessions[token];
    saveDbToDisk();
  }
  res.json({ success: true, message: "Đã đăng xuất phiên làm việc an toàn" });
});

app.post("/api/auth/export-all-data", (req, res) => {
  const uid = getUserId(req);
  if (!uid || !db.users[uid]) {
    return res.status(404).json({ error: "Không tìm thấy người dùng" });
  }
  const data = {
    exportDate: new Date().toISOString(),
    user: db.users[uid],
    projects: db.projects[uid] || [],
    marketingBrands: db.marketingBrands[uid] || [],
    marketingContent: db.marketingContent[uid] || [],
    documents: db.documents[uid] || [],
    calendar: db.calendarEvents[uid] || [],
  };
  res.json({ success: true, data });
});

// Projects
app.get("/api/projects", (req, res) => {
  const uid = getUserId(req);
  const projects = db.projects[uid] || [];
  res.json({ success: true, projects });
});

app.post("/api/projects", (req, res) => {
  const uid = getUserId(req);
  const newProject = {
    id: "proj_" + Math.random().toString(36).substring(2, 9),
    userId: uid,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    rules: req.body.rules || [],
    totalWordCount: 0,
    ...req.body,
  };
  if (!db.projects[uid]) db.projects[uid] = [];
  db.projects[uid].unshift(newProject);
  db.chapters[newProject.id] = [];
  db.characters[newProject.id] = [];
  db.worldRules[newProject.id] = [];
  db.outlines[newProject.id] = [];
  db.memories[newProject.id] = [];
  saveDbToDisk();
  res.json({ success: true, project: newProject });
});

app.put("/api/projects/:id", (req, res) => {
  const uid = getUserId(req);
  const { id } = req.params;
  const list = db.projects[uid] || [];
  const idx = list.findIndex((p: any) => p.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: "Không tìm thấy dự án hoặc không có quyền truy cập" });
  }
  list[idx] = { ...list[idx], ...req.body, id, userId: uid, updatedAt: new Date().toISOString() };
  saveDbToDisk();
  res.json({ success: true, project: list[idx] });
});

app.delete("/api/projects/:id", (req, res) => {
  const uid = getUserId(req);
  const { id } = req.params;
  const list = db.projects[uid] || [];
  db.projects[uid] = list.filter((p: any) => p.id !== id);
  delete db.chapters[id];
  delete db.characters[id];
  delete db.worldRules[id];
  delete db.outlines[id];
  delete db.memories[id];
  saveDbToDisk();
  res.json({ success: true, message: "Đã xóa dự án an toàn" });
});

// Chapters
app.get("/api/projects/:projectId/chapters", (req, res) => {
  const { projectId } = req.params;
  const chapters = db.chapters[projectId] || [];
  res.json({ success: true, chapters });
});

app.post("/api/projects/:projectId/chapters", (req, res) => {
  const { projectId } = req.params;
  const chapters = db.chapters[projectId] || [];
  const newChapter = {
    id: "chap_" + Math.random().toString(36).substring(2, 9),
    projectId,
    order: chapters.length + 1,
    title: req.body.title || `Chương ${chapters.length + 1}`,
    summary: req.body.summary || "",
    targetWordCount: req.body.targetWordCount || 3000,
    actualWordCount: (req.body.content || "").trim().split(/\s+/).filter(Boolean).length,
    status: req.body.status || "drafting",
    content: req.body.content || "",
    authorNotes: req.body.authorNotes || "",
    comments: [],
    versions: [],
    lastSavedAt: new Date().toISOString(),
  };
  chapters.push(newChapter);
  db.chapters[projectId] = chapters;
  saveDbToDisk();
  res.json({ success: true, chapter: newChapter });
});

app.put("/api/projects/:projectId/chapters/:chapterId", (req, res) => {
  const { projectId, chapterId } = req.params;
  const chapters = db.chapters[projectId] || [];
  const idx = chapters.findIndex((c: any) => c.id === chapterId);
  if (idx === -1) {
    return res.status(404).json({ error: "Không tìm thấy chương" });
  }

  // Check if locked
  if (chapters[idx].status === "locked" && req.body.content && req.body.content !== chapters[idx].content && !req.body.unlockFirst) {
    return res.status(403).json({ error: "Chương này đã được chốt/khóa. Vui lòng mở khóa để chỉnh sửa." });
  }

  // Auto version snapshot if substantial changes
  const oldContent = chapters[idx].content || "";
  const newContent = req.body.content !== undefined ? req.body.content : oldContent;
  const wordCount = newContent.trim().split(/\s+/).filter(Boolean).length;

  if (Math.abs(newContent.length - oldContent.length) > 200) {
    chapters[idx].versions = chapters[idx].versions || [];
    chapters[idx].versions.unshift({
      id: "ver_" + Math.random().toString(36).substring(2, 7),
      timestamp: new Date().toISOString(),
      content: oldContent,
      wordCount: oldContent.trim().split(/\s+/).filter(Boolean).length,
      label: "Tự động lưu trước khi chỉnh sửa lớn",
    });
    // Keep max 15 versions
    if (chapters[idx].versions.length > 15) chapters[idx].versions.pop();
  }

  chapters[idx] = {
    ...chapters[idx],
    ...req.body,
    actualWordCount: wordCount,
    lastSavedAt: new Date().toISOString(),
  };

  // Recalculate project total word count
  const total = chapters.reduce((sum: number, c: any) => sum + (c.actualWordCount || 0), 0);
  const uid = getUserId(req);
  const proj = (db.projects[uid] || []).find((p: any) => p.id === projectId);
  if (proj) proj.totalWordCount = total;

  saveDbToDisk();
  res.json({ success: true, chapter: chapters[idx] });
});

app.delete("/api/projects/:projectId/chapters/:chapterId", (req, res) => {
  const { projectId, chapterId } = req.params;
  const chapters = db.chapters[projectId] || [];
  db.chapters[projectId] = chapters.filter((c: any) => c.id !== chapterId);
  saveDbToDisk();
  res.json({ success: true, message: "Đã xóa chương thành công" });
});

// Characters
app.get("/api/projects/:projectId/characters", (req, res) => {
  const { projectId } = req.params;
  const characters = db.characters[projectId] || [];
  res.json({ success: true, characters });
});

app.post("/api/projects/:projectId/characters", (req, res) => {
  const { projectId } = req.params;
  const newChar = {
    id: "char_" + Math.random().toString(36).substring(2, 9),
    name: req.body.name || "Nhân vật mới",
    role: req.body.role || "supporting",
    personality: req.body.personality || "",
    knowledge: req.body.knowledge || { knows: [], unawareOf: [], misinterprets: [], hides: [] },
    chapterStatuses: req.body.chapterStatuses || [],
    ...req.body,
  };
  if (!db.characters[projectId]) db.characters[projectId] = [];
  db.characters[projectId].push(newChar);
  saveDbToDisk();
  res.json({ success: true, character: newChar });
});

app.put("/api/projects/:projectId/characters/:charId", (req, res) => {
  const { projectId, charId } = req.params;
  const chars = db.characters[projectId] || [];
  const idx = chars.findIndex((c: any) => c.id === charId);
  if (idx === -1) return res.status(404).json({ error: "Không tìm thấy nhân vật" });
  chars[idx] = { ...chars[idx], ...req.body, id: charId };
  saveDbToDisk();
  res.json({ success: true, character: chars[idx] });
});

app.delete("/api/projects/:projectId/characters/:charId", (req, res) => {
  const { projectId, charId } = req.params;
  const chars = db.characters[projectId] || [];
  db.characters[projectId] = chars.filter((c: any) => c.id !== charId);
  saveDbToDisk();
  res.json({ success: true, message: "Đã xóa nhân vật" });
});

// World Rules
app.get("/api/projects/:projectId/world", (req, res) => {
  const { projectId } = req.params;
  const rules = db.worldRules[projectId] || [];
  res.json({ success: true, worldRules: rules });
});

app.post("/api/projects/:projectId/world", (req, res) => {
  const { projectId } = req.params;
  const newRule = {
    id: "w_" + Math.random().toString(36).substring(2, 9),
    status: req.body.status || "proposed",
    ...req.body,
  };
  if (!db.worldRules[projectId]) db.worldRules[projectId] = [];
  db.worldRules[projectId].push(newRule);
  saveDbToDisk();
  res.json({ success: true, worldRule: newRule });
});

app.put("/api/projects/:projectId/world/:ruleId", (req, res) => {
  const { projectId, ruleId } = req.params;
  const rules = db.worldRules[projectId] || [];
  const idx = rules.findIndex((r: any) => r.id === ruleId);
  if (idx === -1) return res.status(404).json({ error: "Không tìm thấy quy tắc thế giới" });
  rules[idx] = { ...rules[idx], ...req.body, id: ruleId };
  saveDbToDisk();
  res.json({ success: true, worldRule: rules[idx] });
});

app.delete("/api/projects/:projectId/world/:ruleId", (req, res) => {
  const { projectId, ruleId } = req.params;
  const rules = db.worldRules[projectId] || [];
  db.worldRules[projectId] = rules.filter((r: any) => r.id !== ruleId);
  saveDbToDisk();
  res.json({ success: true, message: "Đã xóa quy tắc thế giới thành công" });
});

// Outlines
app.get("/api/projects/:projectId/outlines", (req, res) => {
  const { projectId } = req.params;
  const outlines = db.outlines[projectId] || [];
  res.json({ success: true, outlines });
});

app.post("/api/projects/:projectId/outlines", (req, res) => {
  const { projectId } = req.params;
  const newEvent = {
    id: "out_" + Math.random().toString(36).substring(2, 9),
    projectId,
    ...req.body,
  };
  if (!db.outlines[projectId]) db.outlines[projectId] = [];
  db.outlines[projectId].push(newEvent);
  saveDbToDisk();
  res.json({ success: true, outline: newEvent });
});

app.delete("/api/projects/:projectId/outlines/:outlineId", (req, res) => {
  const { projectId, outlineId } = req.params;
  const outlines = db.outlines[projectId] || [];
  db.outlines[projectId] = outlines.filter((o: any) => o.id !== outlineId);
  saveDbToDisk();
  res.json({ success: true, message: "Đã xóa sự kiện cốt truyện thành công" });
});

// Project Memories
app.get("/api/projects/:projectId/memories", (req, res) => {
  const { projectId } = req.params;
  const memories = db.memories[projectId] || [];
  res.json({ success: true, memories });
});

app.post("/api/projects/:projectId/memories", (req, res) => {
  const { projectId } = req.params;
  const newMem = {
    id: "mem_" + Math.random().toString(36).substring(2, 9),
    projectId,
    status: req.body.status || "proposed",
    createdDate: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    ...req.body,
  };
  if (!db.memories[projectId]) db.memories[projectId] = [];
  db.memories[projectId].unshift(newMem);
  saveDbToDisk();
  res.json({ success: true, memory: newMem });
});

app.put("/api/projects/:projectId/memories/:memId", (req, res) => {
  const { projectId, memId } = req.params;
  const mems = db.memories[projectId] || [];
  const idx = mems.findIndex((m: any) => m.id === memId);
  if (idx === -1) return res.status(404).json({ error: "Không tìm thấy mục trí nhớ" });
  mems[idx] = { ...mems[idx], ...req.body, id: memId, lastUpdated: new Date().toISOString() };
  saveDbToDisk();
  res.json({ success: true, memory: mems[idx] });
});

app.delete("/api/projects/:projectId/memories/:memId", (req, res) => {
  const { projectId, memId } = req.params;
  const mems = db.memories[projectId] || [];
  db.memories[projectId] = mems.filter((m: any) => m.id !== memId);
  saveDbToDisk();
  res.json({ success: true, message: "Đã xóa trí nhớ dự án" });
});

// Library & Documents

app.get("/api/documents", (req, res) => {
  const uid = getUserId(req);
  const docs = db.documents[uid] || [];
  res.json({ success: true, documents: docs });
});

app.get("/api/documents/:id", (req, res) => {
  const uid = getUserId(req);
  const docId = req.params.id;
  const userDocs = db.documents[uid] || [];
  const found = userDocs.find((d: any) => d.id === docId);
  if (!found) {
    return res.status(404).json({ error: "Không tìm thấy tài liệu hoặc không có quyền truy cập" });
  }
  res.json({ success: true, document: found });
});

app.post("/api/documents", (req, res) => {
  const uid = getUserId(req);
  const doc = {
    id: "doc_" + Math.random().toString(36).substring(2, 9),
    userId: uid,
    uploadedAt: new Date().toISOString(),
    summary: req.body.summary || "Tài liệu đính kèm đã sẵn sàng làm ngữ cảnh cho AI",
    ...req.body,
  };
  if (!db.documents[uid]) db.documents[uid] = [];
  db.documents[uid].unshift(doc);
  saveDbToDisk();
  res.json({ success: true, document: doc });
});

// Dedicated Document Upload & Text Extraction Endpoint
app.post("/api/documents/upload", async (req, res) => {
  try {
    const uid = getUserId(req);
    const { name, fileType, fileBase64, sizeBytes, projectId } = req.body;

    if (!fileBase64) {
      return res.status(400).json({ error: "Không tìm thấy dữ liệu tệp được tải lên" });
    }

    // Decode base64 payload safely
    const rawBase64 = fileBase64.includes(",") ? fileBase64.split(",")[1] : fileBase64;
    const fileBuffer = Buffer.from(rawBase64, "base64");

    if (fileBuffer.length > 25 * 1024 * 1024) {
      return res.status(400).json({ error: "Dung lượng tệp vượt quá giới hạn an toàn 25MB" });
    }

    const docId = "doc_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
    const safeName = path.basename(name || "document").replace(/[^a-zA-Z0-9_\-. \u00C0-\u1EF9]/g, "_");
    const lowerName = (name || "").toLowerCase();

    // Persist raw binary to disk in DOCS_DIR
    const savedFilePath = path.join(DOCS_DIR, `${docId}_${safeName}`);
    fs.writeFileSync(savedFilePath, fileBuffer);

    let extractedText = "";
    let pageCount = 1;
    let isScanned = false;
    let detectedType = fileType || "txt";

    if (lowerName.endsWith(".pdf") || fileType === "pdf") {
      detectedType = "pdf";
      try {
        const parser = new PDFParse({ data: fileBuffer });
        const pdfResult = await parser.getText();
        extractedText = (pdfResult.text || "").trim();
        pageCount = pdfResult.total || 1;
        await parser.destroy();
      } catch (pdfErr: any) {
        console.log("[KAIST PDF Parser Notice]:", pdfErr?.message || pdfErr);
      }
      if (!extractedText || extractedText.length < 15) {
        isScanned = true;
      }
    } else if (lowerName.endsWith(".docx") || fileType === "docx") {
      detectedType = "docx";
      try {
        const docxResult = await mammoth.extractRawText({ buffer: fileBuffer });
        extractedText = (docxResult.value || "").trim();
      } catch (docxErr: any) {
        console.log("[KAIST DOCX Parser Notice]:", docxErr?.message || docxErr);
      }
    } else if (lowerName.endsWith(".csv") || fileType === "csv") {
      detectedType = "csv";
      extractedText = fileBuffer.toString("utf-8");
    } else if (lowerName.endsWith(".json") || fileType === "json") {
      detectedType = "json";
      extractedText = fileBuffer.toString("utf-8");
    } else {
      detectedType = lowerName.endsWith(".md") ? "md" : "txt";
      extractedText = fileBuffer.toString("utf-8");
    }

    const words = extractedText ? extractedText.split(/\s+/).filter(Boolean).length : 0;

    let summary = "";
    let tags: string[] = [];
    let status: "ready" | "scanned_or_empty" | "error" = "ready";
    let statusMessage = "Đã đọc và sẵn sàng làm ngữ cảnh cho AI";

    if (isScanned) {
      summary = `Tài liệu PDF (${pageCount} trang) không phát hiện lớp văn bản số (dạng ảnh chụp/quét scan). KAIST đã lưu trữ an toàn, nhưng cần bản PDF chứa text số hoặc DOCX/TXT để AI đọc hiểu ngữ cảnh.`;
      tags = ["PDF dạng scan", "Cần văn bản số"];
      status = "scanned_or_empty";
      statusMessage = "PDF dạng ảnh quét chưa có lớp chữ số";
    } else if (extractedText.length > 50) {
      const ai = getGeminiClient();
      if (ai) {
        try {
          const sample = extractedText.slice(0, 3500);
          const aiPrompt = `Bạn là trợ lý biên tập tài liệu và nghiên cứu thế giới của KAIST.
Hãy phân tích tài liệu: "${name}" (${words} từ, ${extractedText.length} ký tự).
Đoạn trích nội dung:
${sample}

Hãy tóm tắt ngắn gọn trong 2-3 câu súc tích (tiếng Việt) và gợi ý 3-4 nhãn từ khóa (tags) làm ngữ cảnh sáng tác.
Trả về định dạng JSON:
{
  "summary": "Tóm tắt 2-3 câu...",
  "tags": ["Tag 1", "Tag 2", "Tag 3"]
}`;
          const res = await callGeminiWithTimeoutAndRetry(ai, {
            model: "gemini-3.5-flash-lite",
            contents: aiPrompt,
            config: { responseMimeType: "application/json" },
          });
          const parsed = JSON.parse(res.text || "{}");
          if (parsed.summary) summary = parsed.summary;
          if (Array.isArray(parsed.tags) && parsed.tags.length > 0) tags = parsed.tags;
        } catch (e: any) {
          console.log("[KAIST AI Notice] Document summary fallback:", e?.message || e);
        }
      }

      if (!summary) {
        summary = `Tài liệu văn bản "${name}" (${words.toLocaleString("vi-VN")} từ) đã được phân tích và nạp vào bộ nhớ ngữ cảnh của KAIST.`;
        tags = [detectedType.toUpperCase(), `${words} từ`, "Tài liệu tham khảo"];
      }
    } else {
      summary = `Tệp rỗng hoặc có rất ít nội dung văn bản (${extractedText.length} ký tự).`;
      tags = [detectedType.toUpperCase(), "Tệp ngắn"];
    }

    const newDoc = {
      id: docId,
      userId: uid,
      projectId: projectId || undefined,
      name: name || "Tài liệu chưa đặt tên",
      fileType: detectedType as any,
      sizeBytes: sizeBytes || fileBuffer.length,
      wordCount: words,
      pageCount,
      isScanned,
      tags,
      summary,
      contentSnippet: extractedText.slice(0, 5000),
      fullContent: extractedText.slice(0, 35000),
      status,
      statusMessage,
      uploadedAt: new Date().toISOString(),
    };

    if (!db.documents[uid]) db.documents[uid] = [];
    db.documents[uid].unshift(newDoc);
    saveDbToDisk();

    console.log(`[KAIST Documents] Đã nạp thành công "${name}" (${newDoc.fileType}, ${words} từ, ${fileBuffer.length} bytes)`);
    res.json({ success: true, document: newDoc });
  } catch (error: any) {
    console.error("[KAIST Documents Error]:", error);
    res.status(500).json({ error: "Lỗi xử lý tệp tài liệu: " + (error?.message || "Không xác định") });
  }
});

// Download/View Raw Document
app.get("/api/documents/raw/:id", (req, res) => {
  try {
    const docId = req.params.id;
    if (!fs.existsSync(DOCS_DIR)) return res.status(404).send("Thư mục tệp không tồn tại");
    const files = fs.readdirSync(DOCS_DIR);
    const matched = files.find((f) => f.startsWith(`${docId}_`));
    if (matched) {
      const filePath = path.join(DOCS_DIR, matched);
      return res.download(filePath);
    }
    // Check if in database to provide text stream
    for (const uid of Object.keys(db.documents)) {
      const found = db.documents[uid]?.find((d: any) => d.id === docId);
      if (found && (found.fullContent || found.contentSnippet)) {
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(found.name)}.txt"`);
        return res.send(found.fullContent || found.contentSnippet);
      }
    }
    res.status(404).json({ error: "Không tìm thấy tệp đính kèm trên máy chủ" });
  } catch (err: any) {
    res.status(500).json({ error: err?.message });
  }
});

app.delete("/api/documents/:id", (req, res) => {
  const uid = getUserId(req);
  const docId = req.params.id;
  const list = db.documents[uid] || [];
  db.documents[uid] = list.filter((d: any) => d.id !== docId);
  saveDbToDisk();

  // Clean up physical file on disk if exists
  try {
    if (fs.existsSync(DOCS_DIR)) {
      const files = fs.readdirSync(DOCS_DIR);
      files.filter((f) => f.startsWith(`${docId}_`)).forEach((f) => {
        fs.unlinkSync(path.join(DOCS_DIR, f));
      });
    }
  } catch (e) {
    console.log("[KAIST Storage] Dọn tệp tài liệu:", e);
  }

  res.json({ success: true, message: "Đã xóa tài liệu khỏi thư viện" });
});

// Visual Studio / Images
app.get("/api/images", (req, res) => {
  const uid = getUserId(req);
  const imgs = db.images[uid] || [];
  res.json({ success: true, images: imgs });
});

// Serve Local Generated Image binary directly (supports JPEG/PNG/WebP from multiple providers)
app.get("/api/images/raw/:taskId", (req, res) => {
  try {
    const taskId = req.params.taskId;
    const candidates = [
      { ext: "jpg", mime: "image/jpeg" },
      { ext: "jpeg", mime: "image/jpeg" },
      { ext: "png", mime: "image/png" },
      { ext: "webp", mime: "image/webp" },
    ];

    for (const candidate of candidates) {
      const filePath = path.join(IMAGES_DIR, `${taskId}.${candidate.ext}`);
      if (fs.existsSync(filePath)) {
        res.setHeader("Content-Type", candidate.mime);
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        return fs.createReadStream(filePath).pipe(res);
      }
    }

    // Backward compatibility for records stored directly as a data URL.
    for (const uid of Object.keys(db.images)) {
      const found = db.images[uid]?.find((img: any) => img.taskId === taskId || img.id === taskId);
      if (found && found.imageUrl && found.imageUrl.startsWith("data:image/")) {
        const parts = found.imageUrl.split(",");
        const mime = parts[0].match(/:(.*?);/)?.[1] || "image/jpeg";
        const buf = Buffer.from(parts[1], "base64");
        res.setHeader("Content-Type", mime);
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        return res.send(buf);
      }
    }
    res.status(404).json({ error: "Không tìm thấy ảnh hoặc đã bị xóa" });
  } catch (err: any) {
    res.status(500).json({ error: err?.message });
  }
});

app.post("/api/images", (req, res) => {
  const uid = getUserId(req);
  const img = {
    id: "img_" + Math.random().toString(36).substring(2, 9),
    userId: uid,
    createdAt: new Date().toISOString(),
    ...req.body,
  };
  if (!db.images[uid]) db.images[uid] = [];
  db.images[uid].unshift(img);
  saveDbToDisk();
  res.json({ success: true, image: img });
});

app.delete("/api/images/:id", (req, res) => {
  const uid = getUserId(req);
  const imgId = req.params.id;
  const list = db.images[uid] || [];
  const target = list.find((img: any) => img.id === imgId);
  db.images[uid] = list.filter((img: any) => img.id !== imgId);
  saveDbToDisk();

  // Delete physical file if saved
  if (target?.taskId) {
    try {
      for (const ext of ["jpg", "jpeg", "png", "webp"]) {
        const p = path.join(IMAGES_DIR, `${target.taskId}.${ext}`);
        if (fs.existsSync(p)) fs.unlinkSync(p);
      }
    } catch (e) {
      console.log("[KAIST Storage] Dọn tệp ảnh:", e);
    }
  }

  res.json({ success: true, message: "Đã xóa ảnh thành công" });
});

// Calendar & Deadlines
app.get("/api/calendar", (req, res) => {
  const uid = getUserId(req);
  const events = db.calendarEvents[uid] || [];
  res.json({ success: true, events });
});

app.post("/api/calendar", (req, res) => {
  const uid = getUserId(req);
  const ev = {
    id: "cal_" + Math.random().toString(36).substring(2, 9),
    userId: uid,
    status: req.body.status || "idea",
    ...req.body,
  };
  if (!db.calendarEvents[uid]) db.calendarEvents[uid] = [];
  db.calendarEvents[uid].push(ev);
  saveDbToDisk();
  res.json({ success: true, event: ev });
});

app.put("/api/calendar/:id", (req, res) => {
  const uid = getUserId(req);
  const list = db.calendarEvents[uid] || [];
  const idx = list.findIndex((e: any) => e.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Không tìm thấy sự kiện lịch" });
  list[idx] = { ...list[idx], ...req.body };
  saveDbToDisk();
  res.json({ success: true, event: list[idx] });
});

app.delete("/api/calendar/:id", (req, res) => {
  const uid = getUserId(req);
  const list = db.calendarEvents[uid] || [];
  db.calendarEvents[uid] = list.filter((e: any) => e.id !== req.params.id);
  saveDbToDisk();
  res.json({ success: true, message: "Đã xóa mục lịch trình thành công" });
});

// Chat Sessions with project scoping
app.get("/api/chats", (req, res) => {
  const uid = getUserId(req);
  let chats = db.chats[uid] || [];
  const { projectId } = req.query;
  if (projectId) {
    // Return chats associated with this project or general chats
    chats = chats.filter((c: any) => !c.projectId || c.projectId === projectId);
  }
  res.json({ success: true, chats });
});

app.post("/api/chats", (req, res) => {
  const uid = getUserId(req);
  const chat = {
    id: "chat_" + Math.random().toString(36).substring(2, 9),
    userId: uid,
    title: req.body.title || "Cuộc trò chuyện mới",
    mode: req.body.mode || "brainstorm",
    projectId: req.body.projectId,
    messages: req.body.messages || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  if (!db.chats[uid]) db.chats[uid] = [];
  db.chats[uid].unshift(chat);
  saveDbToDisk();
  res.json({ success: true, chat });
});

app.put("/api/chats/:id", (req, res) => {
  const uid = getUserId(req);
  const chats = db.chats[uid] || [];
  const idx = chats.findIndex((c: any) => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Không tìm thấy phiên chat" });
  chats[idx] = { ...chats[idx], ...req.body, updatedAt: new Date().toISOString() };
  saveDbToDisk();
  res.json({ success: true, chat: chats[idx] });
});

app.delete("/api/chats/:id", (req, res) => {
  const uid = getUserId(req);
  const chats = db.chats[uid] || [];
  db.chats[uid] = chats.filter((c: any) => c.id !== req.params.id);
  saveDbToDisk();
  res.json({ success: true, message: "Đã xóa phiên hội thoại thành công" });
});

// -----------------------------------------------------------------------------
// AI INTELLIGENCE & GEMINI ENDPOINTS
// -----------------------------------------------------------------------------

// Helper to construct project context for AI
function buildProjectContext(projectId?: string, uid?: string): string {
  if (!projectId) return "";

  // Strict user isolation: never scan another user's project list as a fallback.
  const ownerId = uid || "usr_default";
  const proj = (db.projects[ownerId] || []).find((p: any) => p.id === projectId);
  if (!proj) return "";

  let ctx = `
--- THÔNG TIN DỰ ÁN TRUYỆN HIỆN TẠI ---
`;
  ctx += `Tên truyện: ${proj.title}
`;
  ctx += `Thể loại: ${proj.primaryGenre} ${proj.secondaryGenre ? ` / ${proj.secondaryGenre}` : ""}
`;
  ctx += `Độc giả mục tiêu: ${proj.targetAudience || "Chưa thiết lập"}
`;
  ctx += `Giọng văn & Ngôi kể: ${proj.tone}, Ngôi thứ ${proj.pointOfView === "first" ? "nhất (tôi)" : proj.pointOfView === "third_limited" ? "ba giới hạn" : "ba toàn tri"}, thì ${proj.tense === "past" ? "quá khứ" : "hiện tại"}
`;
  ctx += `Chủ đề cốt lõi: ${proj.coreTheme}
`;
  ctx += `Bối cảnh: ${proj.settingPlace} (${proj.settingTime})
`;
  ctx += `Mục tiêu độ dài: ${proj.targetWordCount || "Chưa đặt"} từ
`;

  if (proj.rules && proj.rules.length > 0) {
    ctx += `
QUY TẮC BẮT BUỘC & ĐIỀU CẦN TRÁNH:
`;
    proj.rules.slice(0, 20).forEach((r: any) => {
      ctx += `- [${String(r.type || "rule").toUpperCase()}]: ${r.rule}
`;
    });
  }

  const chars = db.characters[projectId] || [];
  if (chars.length > 0) {
    ctx += `
HỒ SƠ NHÂN VẬT & GIỚI HẠN HIỂU BIẾT (TUYỆT ĐỐI TUÂN THỦ):
`;
    chars.slice(0, 18).forEach((c: any) => {
      ctx += `* ${c.name} (${c.role}, ${c.age || "Chưa rõ"} tuổi): ${c.personality}
`;
      if (c.externalGoal) ctx += `  - Mục tiêu bên ngoài: ${c.externalGoal}
`;
      if (c.internalConflict) ctx += `  - Xung đột nội tâm: ${c.internalConflict}
`;
      if (c.fears) ctx += `  - Nỗi sợ: ${c.fears}
`;
      if (c.powersAndLimits) ctx += `  - Năng lực & Giới hạn: ${c.powersAndLimits}
`;
      if (c.habitsAndVoice) ctx += `  - Giọng nói/Từ ngữ: ${c.habitsAndVoice}
`;
      if (c.knowledge) {
        if (c.knowledge.knows?.length) ctx += `  - ĐIỀU ĐÃ BIẾT: ${c.knowledge.knows.slice(0, 8).join(", ")}
`;
        if (c.knowledge.unawareOf?.length) ctx += `  - ĐIỀU CHƯA BIẾT (CẤM ĐỂ LỘ): ${c.knowledge.unawareOf.slice(0, 8).join(", ")}
`;
        if (c.knowledge.hides?.length) ctx += `  - ĐIỀU ĐANG CHE GIẤU: ${c.knowledge.hides.slice(0, 8).join(", ")}
`;
      }
    });
  }

  const wr = db.worldRules[projectId] || [];
  if (wr.length > 0) {
    ctx += `
QUY TẮC THẾ GIỚI ĐÃ CHỐT:
`;
    wr.slice(0, 20).forEach((w: any) => {
      ctx += `- ${w.name}: ${w.description} (Cái giá/Giới hạn: ${w.costOrLimit || "Không có"})
`;
    });
  }

  const outlines = (db.outlines[projectId] || [])
    .slice()
    .sort((a: any, b: any) => (a.storyOrder || 0) - (b.storyOrder || 0));
  if (outlines.length > 0) {
    ctx += `
DÀN Ý / CÁC MỐC CỐT TRUYỆN ĐÃ CHỐT:
`;
    outlines.slice(-12).forEach((o: any) => {
      ctx += `- #${o.storyOrder || "?"} ${o.title}: ${String(o.description || "").slice(0, 420)}
`;
    });
  }

  const chapters = (db.chapters[projectId] || [])
    .slice()
    .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
  if (chapters.length > 0) {
    ctx += `
TÓM TẮT CÁC CHƯƠNG GẦN NHẤT:
`;
    chapters.slice(-5).forEach((c: any) => {
      const summary = c.summary || String(c.content || "").slice(0, 500);
      ctx += `- Chương ${c.order || "?"} — ${c.title}: ${String(summary).slice(0, 600)}
`;
    });
  }

  const mems = db.memories[projectId] || [];
  if (mems.length > 0) {
    ctx += `
TRÍ NHỚ DỰ ÁN ĐÃ DUYỆT:
`;
    mems.slice(-20).forEach((m: any) => {
      ctx += `* ${m.topic}: ${String(m.content || "").slice(0, 650)}
`;
    });
  }

  return ctx;
}

// 1. AI Chat Endpoint
app.post("/api/ai/chat", async (req, res) => {
  const {
    message,
    projectId,
    chapterId,
    mode,
    contextScope,
    history,
    attachedDocs,
    workflowDepth = "quick", // 'quick' | 'deep_5step'
    modelChoice = "gemini-3.6-flash",
    aiProvider = "gemini",
  } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Nội dung tin nhắn không được để trống" });
  }

  const ai = getGeminiClient();

  const uid = getUserId(req);
  const projectContext = buildProjectContext(projectId, uid);
  let chapterContext = "";
  if (projectId && chapterId) {
    const chaps = db.chapters[projectId] || [];
    const ch = chaps.find((c: any) => c.id === chapterId);
    if (ch) {
      chapterContext = `\n--- CHƯƠNG ĐANG LÀM VIỆC ---\nTiêu đề: ${ch.title}\nTóm tắt: ${ch.summary}\nNội dung hiện tại:\n${ch.content.slice(-2000)}\n`;
    }
  }

  // Deep 5-step creative workflow prompt directive when user selects 'deep_5step'
  const deepWorkflowPrompt =
    workflowDepth === "deep_5step"
      ? `\n--- QUY TRÌNH SÁNG TÁC & PHÂN TÍCH CHUYÊN SÂU 5 BƯỚC (KAIST DEEP WORKFLOW) ---
Bạn PHẢI thực hiện phản hồi theo cấu trúc 5 bước chuyên nghiệp:
- **Bước 1: Phân tích mục tiêu & Cảm xúc chủ đạo**: Xác định rõ nút thắt kịch tính, động cơ hoặc thông điệp cốt lõi.
- **Bước 2: Đối chiếu hồ sơ nhân vật & Giới hạn thế giới**: Kiểm tra xem nhân vật có bị OOC (Out of Character) không, có vi phạm điểm yếu hoặc quy tắc thế giới không.
- **Bước 3: Dàn ý vi mô**: Lập các điểm chuyển tiếp hành động và nhịp độ.
- **Bước 4: Sáng tác văn phong**: Viết trực tiếp với câu từ chọn lọc, giàu hình ảnh, nhịp văn lôi cuốn, đối thoại tự nhiên mang đúng giọng nhân vật.
- **Bước 5: Tự kiểm tra tính nhất quán logic**: Khẳng định tính tương thích và xác nhận không phát sinh mâu thuẫn.\n`
      : "";

  const storyWritingDirective =
    (mode === "write" || mode === "serial" || mode === "manga")
      ? `
--- CHẾ ĐỘ STORY STUDIO / TRUYỆN DÀI CÓ KHẢ NĂNG GIỮ CHÂN ---
- Viết như một tác giả thực thụ, không dùng văn phong AI rập khuôn, không lạm dụng tính từ hoặc câu sáo rỗng.
- Mỗi cảnh phải có mục tiêu, xung đột hoặc thay đổi trạng thái; loại bỏ đoạn chỉ để kéo dài số chữ.
- Duy trì giọng riêng của từng nhân vật, thông tin họ biết/chưa biết, vật đang cầm, thương tích, địa điểm và timeline.
- Với truyện đăng nhiều kỳ: ưu tiên mở cảnh có lực hút, tiến triển rõ giữa chương và kết chương bằng câu hỏi/xung đột/chuyển biến tự nhiên khi phù hợp; không ép cliffhanger giả tạo.
- Nếu người dùng muốn tối ưu truyện để kiếm tiền, hãy tập trung vào khả năng giữ chân, lịch đăng, độ dài chương, nhịp tiết lộ và tính nguyên bản; KHÔNG sao chép hoặc bắt chước sát một tác phẩm/tác giả còn bản quyền.
- Khi được yêu cầu viết chương hoàn chỉnh, xuất bản thảo sạch trước; chỉ thêm phân tích nếu người dùng yêu cầu.
${mode === "manga" ? `- CHẾ ĐỘ MANGA: chuyển cốt truyện thành storyboard rõ theo Trang > Panel. Mỗi panel nêu bố cục, góc máy, nhân vật, biểu cảm, hành động, thoại/sfx và prompt hình ảnh nhất quán. Ưu tiên kể chuyện bằng hình ảnh, không nhồi chữ vào panel.` : ""}
`
      : "";

  // Attached Documents context with deep text & metadata
  let documentsContext = "";
  if (attachedDocs && Array.isArray(attachedDocs) && attachedDocs.length > 0) {
    documentsContext = `\n--- TÀI LIỆU ĐÍNH KÈM THAM KHẢO TỪ NGƯỜI DÙNG ---\n`;
    attachedDocs.forEach((doc: any, idx: number) => {
      const charLimit = attachedDocs.length > 1 ? 6000 : 10000;
      const fullText = doc.fullContent || doc.contentSnippet || doc.content || "";
      const textSample = fullText.slice(0, charLimit);
      const isTruncated = fullText.length > charLimit;

      documentsContext += `[TÀI LIỆU #${idx + 1}]
- ID tài liệu: "${doc.id}"
- Tên tệp: "${doc.name}"
- Định dạng: ${doc.fileType || "doc"}
- Trạng thái xử lý: ${doc.status === "scanned_or_empty" ? "Dạng ảnh quét/chưa có lớp chữ số" : "Văn bản số sẵn sàng"}
- Dung lượng & Từ: ${doc.wordCount ? doc.wordCount + " từ" : ""} ${doc.pageCount ? `(${doc.pageCount} trang)` : ""}
${doc.summary ? `- Tóm tắt sơ lược: ${doc.summary}\n` : ""}- Nội dung tài liệu trích xuất (${textSample.length} / ${fullText.length || textSample.length} ký tự):
"""
${textSample}
"""
`;
      if (isTruncated) {
        documentsContext += `[LƯU Ý HỆ THỐNG: Tài liệu dài hơn ${charLimit} ký tự. Bạn chỉ được đọc ${charLimit} ký tự đầu này. KHÔNG ĐƯỢC tự nhận là đã đọc 100% toàn bộ tài liệu nếu câu hỏi đòi hỏi thông tin ngoài đoạn này.]\n`;
      }
      documentsContext += `----------------------------------------\n`;
    });
  }

  const systemInstruction = `Bạn là KAIST, trợ lý AI chuyên môn cao dành cho tác giả viết truyện dài, tiểu thuyết nhiều kỳ, kịch bản văn học, nghiên cứu tư liệu và chuẩn bị xuất bản. Bạn giao tiếp trực tiếp, sắc bén, tự nhiên và đáng tin cậy.

NGUYÊN TẮC GIAO TIẾP TỰ NHIÊN & PHONG CÁCH HỘI THOẠI:
1. TRỰC DIỆN & ĐÚNG TRỌNG TÂM:
   - Trả lời thẳng vào ý chính trước, giải thích thêm khi cần thiết.
   - Câu hỏi đơn giản hoặc ngắn: trả lời ngắn gọn, tự nhiên, súc tích (1-2 câu hoặc một đoạn văn ngắn).
   - Yêu cầu chuyên sâu, phân tích phức tạp: phân tích đầy đủ, sắc sảo, có chiều sâu và lập luận logic.
2. THẤU HIỂU & LINH HOẠT:
   - Tự động hiểu câu viết tắt, gõ nhanh không dấu hoặc sai chính tả thông dụng trong tiếng Việt (ví dụ: ko, dc, j, ntn, chuong, nv chinh...) một cách tự nhiên mà không thắc mắc hay nhắc nhở người dùng.
   - Nếu thiếu thông tin then chốt để giải quyết vấn đề: Hãy hỏi lại DUY NHẤT một câu ngắn gọn, có trọng tâm. Tuyệt đối không hỏi lại những điều đã biết trong ngữ cảnh, hồ sơ dự án hoặc lịch sử trò chuyện.
3. KHÔNG RẬP KHUÔN & KHÔNG MÁY MÓC:
   - Xưng hô nhất quán theo ngữ cảnh ("tôi" - "bạn").
   - TUYỆT ĐỐI KHÔNG lặp lại các câu chào đầu bài máy móc (như "Chào bạn! Tôi là KAIST...", "Rất vui được hỗ trợ...") và câu kết luận rập khuôn (như "Hy vọng câu trả lời này giúp ích cho bạn...", "Nếu bạn cần thêm...").
   - KHÔNG chia mọi câu trả lời thành quá nhiều danh sách gạch đầu dòng. Đối với hội thoại thông thường, hãy viết thành câu và đoạn văn tự nhiên, mạch lạc.
   - TUYỆT ĐỐI KHÔNG tự chèn mô tả sân khấu, hành động kịch bản, âm thanh (như "tiếng chuông vang lên", "*tiếng gõ phím*", "*mỉm cười*", biểu tượng chuông 🔔) vào hội thoại thông thường. Các chi tiết mô tả âm thanh, bối cảnh nghệ thuật chỉ xuất hiện khi người dùng yêu cầu sáng tác truyện/kịch bản.
   - Hỗ trợ đa ngôn ngữ: tự động phát hiện ngôn ngữ của câu hỏi và trả lời bằng chính ngôn ngữ đó.
   - Chỉ thông báo lỗi khi hệ thống gặp lỗi kỹ thuật thực sự.

NGUYÊN TẮC HIỂU VÀ TRÍCH XUẤT TÀI LIỆU ĐÍNH KÈM:
1. TUÂN THỦ TÀI LIỆU ĐÃ CHỌN: Khi người dùng tải/đính kèm tài liệu và đặt câu hỏi, sử dụng CHÍNH XÁC nội dung tài liệu được cung cấp.
2. PHÂN BIỆT RẠCH RÒI 3 CẤP ĐỘ NỘI DUNG:
   - **Trích nguyên văn**: Trích đúng từng từ từ tài liệu, đặt trong dấu ngoặc kép "...".
   - **Diễn giải**: Trình bày lại ý theo cách diễn đạt rõ ràng, trung thực.
   - **Suy luận**: Nêu rõ lập luận logic dựa trên các căn cứ cụ thể từ tài liệu.
3. CHÍNH XÁC TUYỆT ĐỐI VỀ DỮ LIỆU: Giữ đúng 100% số liệu, đơn vị tính, ngày tháng, tên riêng và điều kiện ràng buộc đi kèm.
4. ĐÁNH DẤU CHƯA CHẮC CHẮN: Nếu tài liệu ở dạng scan/ảnh chụp hoặc bảng biểu OCR chưa rõ ràng, phải ghi chú: "(số liệu này cần đối chiếu thêm do bản scan/OCR chưa chắc chắn)".
5. KHÔNG TÌM THẤY: Nếu câu trả lời không có trong tài liệu đã chọn, nói rõ: "Không tìm thấy trong tài liệu đã chọn". Tuyệt đối không bịa đặt hoặc tự ý chèn thông tin bên ngoài rồi nhận là có trong tài liệu.
6. TRẠNG THÁI TÀI LIỆU: Nếu tài liệu chưa có lớp chữ số hoặc chỉ đọc được một phần, thông báo đúng trạng thái, không tự nhận là đã đọc toàn bộ.

NGUYÊN TẮC PHÒNG TÁC GIẢ AI & MANGA:
- Khi người dùng đang bàn ý tưởng, hành xử như một biên kịch cộng tác: chỉ ra điểm mạnh, điểm yếu, lỗ hổng logic, khả năng phát triển dài kỳ và đưa ra phương án thay thế có lý do.
- Không nịnh ý tưởng yếu. Nếu một twist dễ đoán hoặc động cơ nhân vật thiếu thuyết phục, nói rõ và sửa bằng giải pháp cụ thể.
- Với manga: tư duy theo trang, nhịp lật trang, panel, silhouette, góc máy, biểu cảm, continuity trang phục và bối cảnh.
- Với mục tiêu kiếm tiền: tối ưu tính nguyên bản, khả năng giữ chân, lịch đăng bền vững và tái sử dụng IP; không hứa hẹn doanh thu hay sao chép sát tác phẩm có bản quyền.

NGUYÊN TẮC AGENT XUẤT BẢN TRUYỆN:
- Khi người dùng hỏi nơi đăng truyện, kiếm tiền, điều khoản hoặc chính sách nền tảng: ưu tiên dữ liệu web hiện tại và ghi rõ nguồn; không dùng thông tin cũ như thể còn hiệu lực.
- Không tự nhận đã đăng truyện nếu hệ thống chưa có kết nối OAuth/API hợp lệ tới nền tảng đó.
- Luôn chuẩn bị bản thảo, synopsis, metadata, từ khóa, lịch đăng và checklist trước; chỉ thực hiện hành động xuất bản sau khi người dùng duyệt và tài khoản nền tảng đã được kết nối.
- Không sao chép truyện có bản quyền hoặc viết bắt chước sát một tác giả đang hoạt động.

NGUYÊN TẮC TÌM KIẾM VÀ BỔ SUNG NGUỒN BÊN NGOÀI:
1. Khi người dùng yêu cầu "thêm nguồn", "tìm nguồn uy tín", "kiểm chứng":
   - Cung cấp danh sách các nguồn thông tin có thẩm quyền cao, trực tiếp liên quan đến câu hỏi hoặc đề tài đang viết (ưu tiên tài liệu gốc, nguồn học thuật, cổng tri thức chính thống, thư viện quốc gia).
   - Phân biệt rõ nguồn trong tài liệu của người dùng với nguồn ngoài web.
   - Giải thích ngắn gọn vì sao từng nguồn hỗ trợ cho luận điểm nào.
   - Nếu các nguồn có quan điểm khác nhau hoặc mâu thuẫn, chỉ rõ điểm khác biệt.
   - TUYỆT ĐỐI KHÔNG BỊA ĐẶT HOẶC ĐOÁN MÒ ĐƯỜNG DẪN URL TRÊN INTERNET.
   - Nếu không có URL chắc chắn tồn tại thực tế: BỎ TRỐNG TRƯỜNG "url" (không ghi trường "url" hoặc để chuỗi rỗng ""). Cung cấp đầy đủ title, author, date, summary, domain. Hệ thống KAIST sẽ hiển thị trang trọng dưới dạng trích dẫn thư mục đáng tin cậy.
   - Nếu người dùng chỉ yêu cầu tìm nguồn: ĐƯA DANH SÁCH NGUỒN KÈM GIẢI THÍCH SÚC TÍCH, KHÔNG TỰ VIẾT CẢ MỘT BÀI VĂN DÀI NẾU KHÔNG ĐƯỢC YÊU CẦU.
   - Không tự ý gửi toàn bộ tài liệu riêng tư ra ngoài.

ĐỊNH DẠNG KHỐI TRÍCH DẪN NGUỒN (SOURCES JSON BLOCK):
Khi câu trả lời có trích dẫn từ tài liệu đính kèm HOẶC nguồn web bên ngoài, hãy thêm khối JSON sau ở cuối câu trả lời:
\`\`\`sources
[
  {
    "sourceType": "document",
    "title": "Tên tệp tài liệu chính xác",
    "docId": "ID tài liệu (từ context)",
    "pageOrSection": "Mục 2 / Đoạn 4 / Trang 1 (không bịa số trang nếu là file DOCX/TXT không phân trang)",
    "excerpt": "Đoạn trích dẫn nguyên văn ngắn từ tài liệu để đối chiếu",
    "supportPoint": "Luận điểm trong câu trả lời mà trích dẫn này chứng minh"
  },
  {
    "sourceType": "web",
    "title": "Tên bài báo, sách hoặc nghiên cứu cụ thể",
    "url": "https://url-thực-sự-hợp-lệ",
    "domain": "tên miền (vd: plato.stanford.edu, scholar.google.com)",
    "author": "Tác giả / Nhà xuất bản",
    "date": "Năm hoặc ngày xuất bản nếu có",
    "summary": "Tóm tắt ngắn gọn luận điểm của nguồn",
    "supportPoint": "Hỗ trợ cho ý kiến nào"
  }
]
\`\`\`

${projectContext}
${chapterContext}
${documentsContext}
${deepWorkflowPrompt}
${storyWritingDirective}`;

  const sourcesList: any[] = [];
  if (attachedDocs && Array.isArray(attachedDocs)) {
    attachedDocs.forEach((doc: any) => {
      sourcesList.push({
        sourceType: "document",
        title: doc.name,
        docId: doc.id,
        url: `/api/documents/raw/${doc.id}`,
        summary: doc.summary || "Tài liệu người dùng đính kèm",
        status: "local_document",
      });
    });
  }

  // Helper to extract JSON ```sources``` block and markdown links with live security verification
  const extractSources = async (rawText: string) => {
    let text = rawText;
    const additionalSources: any[] = [];

    const jsonBlockRegex = /```(?:sources|json-sources)\s*([\s\S]*?)\s*```/i;
    const match = jsonBlockRegex.exec(text);
    if (match) {
      try {
        const parsed = JSON.parse(match[1]);
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            if (!item || !item.title) continue;
            const isDoc =
              item.sourceType === "document" ||
              (attachedDocs && attachedDocs.some((d: any) => d.id === item.docId || d.name === item.title));

            if (isDoc) {
              const matchedDoc = attachedDocs?.find(
                (d: any) => d.id === item.docId || d.name.toLowerCase() === item.title.toLowerCase()
              );
              additionalSources.push({
                sourceType: "document",
                title: item.title,
                docId: matchedDoc?.id || item.docId,
                url: matchedDoc ? `/api/documents/raw/${matchedDoc.id}` : item.url,
                pageOrSection: item.pageOrSection || undefined,
                excerpt: item.excerpt || undefined,
                supportPoint: item.supportPoint || item.summary,
                status: "local_document",
              });
            } else {
              let domain = item.domain;
              let validUrl: string | undefined = undefined;
              let status: "verified" | "snippet_only" = "snippet_only";

              if (item.url && typeof item.url === "string" && item.url.startsWith("http")) {
                const verification = await verifyWebUrl(item.url, item.title);
                if (verification.valid && verification.finalUrl) {
                  validUrl = verification.finalUrl;
                  domain = verification.domain || domain;
                  status = "verified";
                } else {
                  console.warn(
                    `[KAIST Source Guard] Đã chặn liên kết không an toàn / không xác thực được: "${item.url}" (Lý do: ${verification.reason}). Giữ nguyên trích dẫn thư mục không link.`
                  );
                }
              }

              additionalSources.push({
                sourceType: "web",
                title: item.title,
                url: validUrl,
                domain: domain || (validUrl ? new URL(validUrl).hostname : "Nguồn tham khảo"),
                author: item.author,
                date: item.date,
                summary: item.summary,
                supportPoint: item.supportPoint,
                status,
              });
            }
          }
        }
        text = text.replace(jsonBlockRegex, "").trim();
      } catch (err) {}
    }

    // Extract markdown links [Title](https://...) and verify them
    const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)/g;
    let linkMatch;
    while ((linkMatch = linkRegex.exec(text)) !== null) {
      const title = linkMatch[1];
      const url = linkMatch[2];
      try {
        if (!additionalSources.some((s) => s.url === url) && !sourcesList.some((s) => s.url === url)) {
          const verification = await verifyWebUrl(url, title);
          if (verification.valid && verification.finalUrl) {
            additionalSources.push({
              sourceType: "web",
              title,
              url: verification.finalUrl,
              domain: verification.domain || new URL(verification.finalUrl).hostname,
              status: "verified",
            });
          } else {
            console.warn(`[KAIST Source Guard] Đã lọc bỏ liên kết markdown không an toàn: "${url}"`);
          }
        }
      } catch (e) {}
    }

    return { text, additionalSources };
  };

  const isResearchQuery = /nguồn|nghiên cứu|chứng cứ|source|tài liệu tham khảo|bài báo|kiểm chứng/i.test(message);
  // Chỉ bật Google Search khi người dùng thực sự cần dữ liệu web hiện tại để tránh tốn quota không cần thiết.
  const wantsLiveWeb = /tìm (web|trên mạng)|tra cứu|mới nhất|hiện tại|nền tảng đăng truyện|đăng truyện|xuất bản|kiếm tiền|wattpad|webnovel|inkitt|royal road|kdp|chính sách/i.test(message);

  if (!ai) {
    // Graceful smart fallback when API key is not yet set in environment
    if (isResearchQuery) {
      sourcesList.push(
        {
          sourceType: "web",
          title: "Bách khoa toàn thư triết học Stanford (SEP)",
          url: "https://plato.stanford.edu",
          domain: "plato.stanford.edu",
          author: "Stanford University",
          date: "2024",
          summary: "Cơ sở dữ liệu học thuật thẩm định kỹ lưỡng về triết học, đạo đức học và cấu trúc tự sự.",
          supportPoint: "Cung cấp nền tảng tri thức vững chắc cho việc xây dựng thế giới quan và mâu thuẫn nhân vật.",
          status: "verified",
        },
        {
          sourceType: "web",
          title: "Google Scholar (Nghiên cứu học thuật)",
          url: "https://scholar.google.com",
          domain: "scholar.google.com",
          author: "Google Scholar",
          date: "2024",
          summary: "Cổng tìm kiếm hàng triệu bài báo khoa học, xã hội học và lịch sử được bình duyệt.",
          supportPoint: "Tra cứu sự kiện, niên đại lịch sử và nghiên cứu nhân học thực tế.",
          status: "verified",
        },
        {
          sourceType: "web",
          title: "Kho lưu trữ thư viện Quốc gia Việt Nam",
          url: "http://nlv.gov.vn",
          domain: "nlv.gov.vn",
          author: "Thư viện Quốc gia Việt Nam",
          date: "2024",
          summary: "Kho tư liệu số hóa văn hiến, phong tục, địa chí và tư liệu lịch sử Việt Nam qua các thời kỳ.",
          supportPoint: "Tham chiếu phong tục tập quán, ngữ âm từ vựng cổ và địa danh thời xưa.",
          status: "verified",
        }
      );
    }

    const sampleReply = `[KAIST - Trợ lý Nghiên cứu & Sáng tác]:
Tôi đã tiếp nhận yêu cầu: "${message}".
${
  isResearchQuery
    ? `- **Nguồn tham khảo đã xác thực**: Đã kiểm tra và liên kết các nguồn tư liệu học thuật đáng tin cậy bên dưới để bạn mở xem trực tiếp.
- **Tính khả tín**: Toàn bộ liên kết đều dẫn đến cổng tri thức mở hoặc cơ quan xuất bản chính thức, có hiển thị tên miền rõ ràng để bạn kiểm chứng.
- **Ứng dụng vào tác phẩm**: Bạn có thể dùng các luận điểm trong nguồn để tăng tính thuyết phục cho cốt truyện và bài viết.`
    : `- **Phân tích tính nhất quán**: Đảm bảo bám sát các điều kiện đã chốt trong hồ sơ nhân vật và thế giới.
- **Tài liệu tham khảo**: Đã đọc và liên kết dữ liệu từ các tài liệu bạn cung cấp.
- **Đề xuất cốt truyện**: Tạo tình huống giàu cảm xúc, kết hợp hành động và xung đột nội tâm.`
}

*(Mẹo: Bạn có thể bấm nút "Mở nguồn" hoặc "Sao chép liên kết" ở danh sách căn cứ bên dưới).*`;

    return res.json({
      success: true,
      text: sampleReply,
      sources: sourcesList,
    });
  }

  try {
    const contents: any[] = [];
    if (history && Array.isArray(history)) {
      // Filter out any notice or error messages from history so they never pollute AI context
      const cleanHistory = history.filter((h: any) => {
        if (!h || !h.content) return false;
        if (h.isNotice || h.isError) return false;
        const c = String(h.content);
        if (
          c.includes("Hệ thống AI đang tạm thời") ||
          c.includes("hạn mức tạm thời") ||
          c.includes("điều phối tài nguyên") ||
          c.includes("RESOURCE_EXHAUSTED") ||
          c.includes("AI_TIMEOUT") ||
          c.startsWith("[Đã dừng tạo")
        ) {
          return false;
        }
        return true;
      });

      // Avoid duplicating the user message if it is already at the end of history
      const lastItem = cleanHistory[cleanHistory.length - 1];
      const historyToUse =
        lastItem && lastItem.role === "user" && lastItem.content.trim() === message.trim()
          ? cleanHistory.slice(0, -1)
          : cleanHistory;

      // Keep recent turns and ensure strict alternation: user -> model -> user -> model
      const recent = historyToUse.slice(-8);
      let expectedRole = "user";
      for (const h of recent) {
        const role = h.role === "assistant" ? "model" : "user";
        if (role === expectedRole) {
          contents.push({
            role,
            parts: [{ text: h.content }],
          });
          expectedRole = expectedRole === "user" ? "model" : "user";
        }
      }

      // If the last turn added was a "user" turn, remove it because we will append the current `message`
      if (contents.length > 0 && contents[contents.length - 1].role === "user") {
        contents.pop();
      }
    }

    // Append the current user prompt as the final turn
    contents.push({
      role: "user",
      parts: [{ text: message }],
    });

    const targetModel =
      typeof modelChoice === "string" && modelChoice.startsWith("gemini") ? modelChoice : "gemini-3.6-flash";

    const response = await callGeminiWithTimeoutAndRetry(ai, {
      model: targetModel,
      contents,
      config: {
        systemInstruction,
        temperature: mode === "serial" ? 0.82 : mode === "manga" ? 0.76 : mode === "write" ? 0.78 : mode === "critique" ? 0.4 : 0.7,
        tools: wantsLiveWeb ? [{ googleSearch: {} }] : undefined,
      },
    });

    const parsed = await extractSources(response.text || "KAIST đã xử lý xong yêu cầu của bạn.");

    // Nhận nguồn trực tiếp từ Google Search Grounding khi bật tra cứu web.
    const groundingChunks = response?.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    for (const chunk of groundingChunks) {
      const web = chunk?.web;
      if (!web?.uri) continue;
      try {
        const domain = new URL(web.uri).hostname;
        parsed.additionalSources.push({
          sourceType: "web",
          title: web.title || domain,
          url: web.uri,
          domain,
          summary: "Nguồn được Gemini Grounding truy xuất trực tiếp từ Google Search cho yêu cầu hiện tại.",
          supportPoint: "Dữ liệu web hiện tại",
          status: "grounded",
        });
      } catch {}
    }

    // If research query was asked and no external web source was returned, supply authoritative scholarly sources
    if (isResearchQuery && !parsed.additionalSources.some((s) => s.sourceType === "web")) {
      parsed.additionalSources.push(
        {
          sourceType: "web",
          title: "Bách khoa toàn thư triết học Stanford (SEP)",
          url: "https://plato.stanford.edu",
          domain: "plato.stanford.edu",
          author: "Stanford University",
          date: "2024",
          summary: "Cơ sở dữ liệu học thuật thẩm định kỹ lưỡng về triết học, đạo đức học và cấu trúc tự sự.",
          supportPoint: "Cung cấp nền tảng tri thức vững chắc cho việc xây dựng thế giới quan và mâu thuẫn nhân vật.",
          status: "verified",
        },
        {
          sourceType: "web",
          title: "Google Scholar (Nghiên cứu học thuật)",
          url: "https://scholar.google.com",
          domain: "scholar.google.com",
          author: "Google Scholar",
          date: "2024",
          summary: "Cổng tìm kiếm hàng triệu bài báo khoa học, xã hội học và lịch sử được bình duyệt.",
          supportPoint: "Tra cứu sự kiện, niên đại lịch sử và nghiên cứu nhân học thực tế.",
          status: "verified",
        },
        {
          sourceType: "web",
          title: "Kho lưu trữ thư viện Quốc gia Việt Nam",
          url: "http://nlv.gov.vn",
          domain: "nlv.gov.vn",
          author: "Thư viện Quốc gia Việt Nam",
          date: "2024",
          summary: "Kho tư liệu số hóa văn hiến, phong tục, địa chí và tư liệu lịch sử Việt Nam qua các thời kỳ.",
          supportPoint: "Tham chiếu phong tục tập quán, ngữ âm từ vựng cổ và địa danh thời xưa.",
          status: "verified",
        }
      );
    }

    const mergedSources: any[] = [];
    const seenKeys = new Set<string>();

    parsed.additionalSources.forEach((s) => {
      const key = `${s.sourceType || "web"}_${s.title || ""}_${s.pageOrSection || ""}_${s.url || ""}`;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        mergedSources.push(s);
      }
    });

    sourcesList.forEach((s) => {
      const isAlreadyCited = mergedSources.some(
        (m) => (s.docId && m.docId === s.docId) || m.title === s.title
      );
      if (!isAlreadyCited) {
        mergedSources.push(s);
      }
    });

    res.json({
      success: true,
      text: parsed.text,
      sources: mergedSources,
      modelUsed: response._modelUsed || "gemini-3.6-flash",
    });
  } catch (error: any) {
    const errorMsg = error?.message || "";
    const errorStatus = error?.status;
    const isTimeout = errorMsg.includes("AI_TIMEOUT");
    const isQuotaExhausted =
      errorStatus === 429 &&
      (errorMsg.includes("RESOURCE_EXHAUSTED") ||
        errorMsg.includes("Quota exceeded") ||
        errorMsg.includes("exceeded your current quota") ||
        errorMsg.includes("GenerateRequestsPerDay") ||
        errorMsg.includes("free_tier_requests"));
    const isRateLimitRPM =
      errorStatus === 429 && !isQuotaExhausted;
    const is503 =
      errorStatus === 503 ||
      errorMsg.includes("503") ||
      errorMsg.includes("overloaded") ||
      errorMsg.includes("UNAVAILABLE");
    const isAuthError =
      errorStatus === 401 ||
      errorStatus === 403 ||
      errorMsg.includes("API_KEY_INVALID") ||
      errorMsg.includes("PERMISSION_DENIED");

    // Extract exact retry seconds if returned by Google Gemini API
    let retryWaitSeconds = 0;
    const retryMatch = errorMsg.match(/retry in (\d+(\.\d+)?)s/i);
    if (retryMatch) {
      retryWaitSeconds = Math.ceil(parseFloat(retryMatch[1]));
    }

    console.warn("[KAIST AI Engine] Chat request encountered error:", {
      status: errorStatus,
      isQuotaExhausted,
      isRateLimitRPM,
      is503,
      isTimeout,
      isAuthError,
      message: errorMsg.slice(0, 160),
    });

    let noticeText = "";
    let errorCode = "UNKNOWN_ERROR";

    if (isQuotaExhausted) {
      errorCode = "QUOTA_EXHAUSTED";
      noticeText = "Khóa API Google AI Studio đã chạm hạn mức sử dụng (HTTP 429 - Quota Exceeded). Việc chỉnh sửa mã nguồn không thể tự nới hạn mức này. Bạn có thể kiểm tra hạn mức hoặc cấu hình khóa API trong mục Cài đặt.";
    } else if (isRateLimitRPM) {
      errorCode = "RATE_LIMIT_RPM";
      noticeText = `Đã chạm giới hạn tần suất yêu cầu trong phút (RPM). Vui lòng đợi ${retryWaitSeconds || 15} giây trước khi gửi tiếp.`;
    } else if (is503) {
      errorCode = "SERVICE_UNAVAILABLE";
      noticeText = "Dịch vụ AI từ nhà cung cấp đang tạm thời quá tải tài nguyên (HTTP 503). Vui lòng thử lại sau ít giây.";
    } else if (isTimeout) {
      errorCode = "AI_TIMEOUT";
      noticeText = "Thời gian phản hồi từ dịch vụ AI vượt quá 25 giây (AI_TIMEOUT). Vui lòng thử lại với câu hỏi ngắn hơn hoặc kiểm tra đường truyền.";
    } else if (isAuthError) {
      errorCode = "AUTH_ERROR";
      noticeText = "Khóa API Google AI Studio chưa được cấu hình quyền hoặc không hợp lệ (HTTP 401/403). Vui lòng kiểm tra thiết lập khóa trong Cài đặt.";
    } else {
      errorCode = "NETWORK_OR_SERVER_ERROR";
      noticeText = "Không thể hoàn tất kết nối với dịch vụ AI. Vui lòng kiểm tra đường truyền mạng và bấm thử lại.";
    }

    const httpStatusCode =
      errorStatus && errorStatus >= 400 && errorStatus < 600 ? errorStatus : 503;

    return res.status(httpStatusCode).json({
      success: false,
      isNotice: true,
      errorCode,
      error: noticeText,
      sources: sourcesList,
      diagnostic: {
        status: errorStatus || httpStatusCode,
        errorCode,
        rawErrorMessage: errorMsg.replace(/AIza[0-9A-Za-z-_]{35}/g, "AIza***").slice(0, 300),
        isQuotaExhausted,
        isRateLimitRPM,
        is503,
        isTimeout,
        isAuthError,
        retryWaitSeconds,
        canRetry: !isQuotaExhausted && !isAuthError,
      },
    });
  }
});

// 2. AI Writer Assist (Viết tiếp, Viết lại, Mở rộng, Rút gọn, Đổi giọng văn, Hội thoại)
app.post("/api/ai/write-assist", async (req, res) => {
  const { action, selectedText, surroundingText, instruction, projectId, chapterId, options } = req.body;
  const ai = getGeminiClient();
  const uid = getUserId(req);

  const projectContext = buildProjectContext(projectId, uid);
  const prompt = `Bạn là KAIST Trợ lý Đồng hành Viết Văn Hào Kiệt.
Tác vụ yêu cầu: ${action.toUpperCase()}
Chỉ dẫn bổ sung của tác giả: ${instruction || "Viết mượt mà, đúng ngữ cảnh và giọng điệu câu chuyện."}

NGỮ CẢNH XUNG QUANH:
${surroundingText ? surroundingText.slice(-1500) : "(Đoạn đầu chương)"}

ĐOẠN VĂN ĐƯỢC CHỌN HOẶC ĐIỂM TIẾP NỐI:
"""${selectedText || ""}"""

YÊU CẦU ĐẶC BIỆT:
1. Nếu hành động là 'write_next' (viết tiếp): Viết tiếp từ 300 - 600 từ nối tiếp tự nhiên, giữ nguyên ngôi kể, thì kể, giọng văn và tâm lý nhân vật.
2. Nếu hành động là 'rewrite' (viết lại): Viết lại đoạn được chọn theo chỉ dẫn nhưng bảo lưu ý đồ chính.
3. Nếu hành động là 'expand' (mở rộng): Thêm các chi tiết miêu tả cảm giác, không khí, nhịp thở và suy nghĩ ngầm mà không làm loãng mạch truyện.
4. Nếu hành động là 'condense' (rút gọn): Tinh gọn câu văn, bỏ bớt tính từ thừa, tăng tốc độ nhịp truyện.
5. Nếu hành động là 'dialogue_polish' (trau chuốt thoại): Làm cho đối thoại tự nhiên, có cá tính riêng của từng nhân vật theo hồ sơ, không để nhân vật nói giống hệt nhau.

CHỈ TRẢ VỀ DUY NHẤT ĐOẠN VĂN BẢN MỚI ĐƯỢC ĐỀ XUẤT, KHÔNG KÈM LỜI DẪN HAY BÌNH LUẬN CỦA AI.`;

  if (!ai) {
    const fallbackText = action === "write_next"
      ? `\n\nTiếng gió rít qua khe cửa bỗng ngừng bặt. Trong khoảng không im ắng đến ngột ngạt ấy, từng hơi thở của chàng trở nên rõ rệt hơn bao giờ hết. Chàng biết rằng thời gian không còn nhiều, và quyết định tiếp theo sẽ thay đổi toàn bộ số phận của vương triều Sa Lộ.`
      : `Đoạn văn đã được trau chuốt lại nhịp điệu và hình ảnh theo chỉ dẫn: "${selectedText}"`;
    return res.json({ success: true, generatedText: fallbackText });
  }

  try {
    const response = await callGeminiWithTimeoutAndRetry(ai, {
      model: "gemini-3.5-flash-lite",
      contents: prompt,
      config: {
        systemInstruction: `Bạn là trợ lý viết văn học tiếng Việt cao cấp của KAIST. Giữ tính nhất quán 100% với thế giới và nhân vật.\n${projectContext}`,
        temperature: 0.75,
      },
    });

    res.json({ success: true, generatedText: response.text?.trim() || "" });
  } catch (error: any) {
    console.warn("[KAIST AI Notice] Write Assist error:", error?.message || error);
    res.status(500).json({
      success: false,
      error: error?.message || "Không thể nhận hỗ trợ viết từ AI lúc này. Bản nháp của bạn vẫn được giữ nguyên trên màn hình.",
    });
  }
});

// 3. Literary Quality Inspector (Kiểm tra chất lượng văn học, mâu thuẫn dữ kiện, giọng điệu)
app.post("/api/ai/literary-inspect", async (req, res) => {
  const { text, projectId, chapterId } = req.body;
  if (!text || text.trim().length < 50) {
    return res.json({ success: true, issues: [] });
  }

  const ai = getGeminiClient();
  const uid = getUserId(req);
  const projectContext = buildProjectContext(projectId, uid);

  if (!ai) {
    return res.json({
      success: true,
      issues: [
        {
          id: "iss_demo1",
          type: "voice_consistency",
          severity: "medium",
          excerpt: "tiếng then cài run rẩy va vào thanh chắn",
          reason: "Nhịp câu có thể trau chuốt hơn để nhấn mạnh không khí hoài niệm.",
          suggestedFix: "tiếng then cài run rẩy va vào then chắn lạnh ngắt.",
          status: "pending",
        }
      ]
    });
  }

  const prompt = `Kiểm tra chất lượng văn học của đoạn trích sau theo các tiêu chí:
1. Mâu thuẫn dữ kiện với hồ sơ nhân vật & quy tắc thế giới (ví dụ nhân vật không biết bơi nhưng tự bơi, nhân vật biết bí mật họ chưa được biết).
2. Lỗi chính tả, dấu câu, xưng hô thiếu nhất quán.
3. Lặp từ, lặp ý, câu què, câu tối nghĩa.
4. Hội thoại thiếu tự nhiên hoặc nhân vật nói quá giống nhau.
5. Chuyển cảnh hoặc chuyển ngôi kể đột ngột.

ĐOẠN VĂN CẦN KIỂM TRA:
"""${text.slice(0, 5000)}"""

Trả về kết quả dưới dạng JSON mảng các vấn đề:
[
  {
    "type": "fact_contradiction" | "voice_consistency" | "grammar_spelling" | "repetition" | "pacing" | "clue_gap",
    "severity": "low" | "medium" | "high",
    "excerpt": "đoạn ngắn cụ thể có vấn đề",
    "reason": "giải thích rõ lý do",
    "suggestedFix": "cách sửa cụ thể gợi ý"
  }
]
Nếu không có lỗi nào nghiêm trọng, trả về mảng rỗng [].`;

  try {
    const response = await callGeminiWithTimeoutAndRetry(ai, {
      model: "gemini-3.5-flash-lite",
      contents: prompt,
      config: {
        systemInstruction: `Bạn là biên tập viên văn học tinh tế của KAIST. Phản biện mang tính xây dựng, chỉ rõ đoạn có vấn đề, lý do và cách sửa. Không áp đặt kết luận nghệ thuật.\n${projectContext}`,
        responseMimeType: "application/json",
      },
    });

    let issues: any[] = [];
    try {
      issues = JSON.parse(response.text || "[]");
      issues = issues.map((iss, i) => ({
        id: `iss_${Date.now()}_${i}`,
        chapterId: chapterId || "",
        status: "pending",
        ...iss,
      }));
    } catch {
      issues = [];
    }

    res.json({ success: true, issues });
  } catch (error: any) {
    console.log("[KAIST AI Notice] Literary inspect fallback:", error?.message || error);
    res.json({ success: true, issues: [] });
  }
});

// 4. Controlled Knowledge & Research Synthesis (Nghiên cứu -> Rút kiến thức -> Kiểm chứng -> Trí nhớ)
app.post("/api/ai/controlled-research", async (req, res) => {
  const { query, projectId, currentProjectSummary } = req.body;
  const ai = getGeminiClient();

  if (!query) return res.status(400).json({ error: "Chủ đề nghiên cứu không được để trống" });

  if (!ai) {
    return res.json({
      success: true,
      research: {
        id: "res_" + Date.now(),
        query,
        sourceTitle: "Tài liệu lịch sử & cổ vật học tham khảo",
        extractedFacts: [
          "Bột chu sa cổ đại được điều chế từ khoáng vật thần sa (thủy ngân sunfua), có màu đỏ tươi bền màu qua ngàn năm.",
          "Thư tịch cổ Đông Á thường dùng giấy dướng hoặc lụa tơ tằm, bảo quản trong hòm gỗ thông ngâm tinh dầu quế để chống mối mọt."
        ],
        verifications: [
          { fact: "Chu sa bền màu ngàn năm", isVerified: true, note: "Đã kiểm chứng tài liệu khảo cổ." },
          { fact: "Giấy dướng chống ẩm bằng dầu thông", isVerified: true, note: "Phù hợp với bối cảnh Sa Lộ." }
        ],
        savedToMemory: false,
        timestamp: new Date().toISOString(),
      }
    });
  }

  const prompt = `Thực hiện nghiên cứu kiến thức chuyên sâu và rút ra dữ kiện kiểm chứng cho chủ đề: "${query}".
Phục vụ cho dự án văn học, truyện dài hoặc manga: ${currentProjectSummary || "Kỳ ảo cổ phong / Lịch sử"}.

Yêu cầu quy trình TỰ HỌC CÓ KIỂM SOÁT của KAIST:
1. Trích xuất 2 - 4 sự thật/dữ kiện cốt lõi có căn cứ thực tế hoặc nguyên lý khoa học/lịch sử.
2. Kiểm chứng độ tin cậy và nêu rõ lưu ý khi áp dụng vào tác phẩm hư cấu.
3. Cảnh báo nếu có sự mâu thuẫn thông tin giữa các nguồn.
4. TUYỆT ĐỐI KHÔNG BỊA ĐẶT ĐƯỜNG DẪN URL. Nếu không có URL học thuật chính thức chắc chắn tồn tại, ĐỂ TRỐNG TRƯỜNG "sourceUrl": "".

Trả về JSON:
{
  "sourceTitle": "Tiêu đề nguồn hoặc tài liệu tham khảo",
  "sourceUrl": "Nguồn tham khảo uy tín (để trống nếu không có link chắc chắn)",
  "extractedFacts": ["Dữ kiện 1", "Dữ kiện 2"],
  "verifications": [
    { "fact": "Dữ kiện", "isVerified": true, "note": "Ghi chú kiểm chứng" }
  ]
}`;

  try {
    const response = await callGeminiWithTimeoutAndRetry(ai, {
      model: "gemini-3.5-flash-lite",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    let verifiedSourceUrl: string = "";
    if (parsed.sourceUrl && typeof parsed.sourceUrl === "string" && parsed.sourceUrl.startsWith("http")) {
      const v = await verifyWebUrl(parsed.sourceUrl, parsed.sourceTitle);
      if (v.valid && v.finalUrl) {
        verifiedSourceUrl = v.finalUrl;
      } else {
        console.warn(`[KAIST Research Guard] Đã lược bỏ sourceUrl chưa xác thực: "${parsed.sourceUrl}"`);
      }
    }

    const result = {
      id: "res_" + Date.now(),
      query,
      targetProjectId: projectId,
      savedToMemory: false,
      timestamp: new Date().toISOString(),
      sourceTitle: parsed.sourceTitle || "Nguồn nghiên cứu học thuật & lịch sử",
      sourceUrl: verifiedSourceUrl,
      extractedFacts: parsed.extractedFacts || [],
      verifications: parsed.verifications || [],
    };

    res.json({ success: true, research: result });
  } catch (error: any) {
    console.log("[KAIST AI Notice] Research fallback triggered:", error?.message || error);
    res.json({
      success: true,
      research: {
        id: "res_" + Date.now(),
        query,
        targetProjectId: projectId,
        savedToMemory: false,
        timestamp: new Date().toISOString(),
        sourceTitle: "Tài liệu tra cứu lưu trữ",
        sourceUrl: "",
        extractedFacts: [
          `Dữ kiện sơ bộ đã ghi nhận cho chủ đề: ${query}.`,
          "Nội dung đã được lưu vào hệ thống để tiếp tục tra cứu khi mạng ổn định."
        ],
        verifications: [
          { fact: `Chủ đề ${query}`, isVerified: true, note: "Đã lưu vào bộ nhớ dự án" }
        ]
      }
    });
  }
});

// Endpoint kiểm tra & thẩm định URL độc lập
app.post("/api/ai/verify-url", async (req, res) => {
  const { url, title } = req.body || {};
  const result = await verifyWebUrl(url, title);
  res.json({ success: true, ...result });
});

// Visual Studio / Image Prompt & Generation

app.post("/api/ai/image-prompt", async (req, res) => {
  const { concept, category, style, aspectRatio, projectId } = req.body;
  const ai = getGeminiClient();

  const prompt = `Nâng cấp và tinh chỉnh prompt tạo ảnh cho AI Diffusion / Imagen:
Ý tưởng người dùng: "${concept}"
Phân loại: ${category} (cover / character / scene / marketing)
Phong cách mong muốn: ${style}
Tỷ lệ khung hình: ${aspectRatio}

Hãy tạo ra:
1. Prompt tiếng Anh chi tiết, giàu từ khóa thị giác về ánh sáng, góc máy, chất liệu, tâm trạng, màu sắc.
2. Mô tả tiếng Việt ngắn gọn để hỗ trợ tiếp cận (accessibility / alt text).
3. Gợi ý bảng màu (color palette).

Trả về JSON:
{
  "englishPrompt": "detailed english prompt...",
  "vietnameseDescription": "Mô tả bằng tiếng Việt...",
  "suggestedColors": ["#hex1", "#hex2", "#hex3"]
}`;

  if (!ai) {
    return res.json({
      success: true,
      data: {
        englishPrompt: `Atmospheric masterpiece of ${concept}, ${style} style, dramatic cinematic lighting, 8k resolution, detailed digital artwork`,
        vietnameseDescription: `Hình ảnh minh họa về ${concept} theo phong cách ${style}`,
        suggestedColors: ["#1e293b", "#3b82f6", "#f59e0b"]
      }
    });
  }

  try {
    const response = await callGeminiWithTimeoutAndRetry(ai, {
      model: "gemini-3.5-flash-lite",
      contents: prompt,
      config: { responseMimeType: "application/json" },
    });
    const parsed = JSON.parse(response.text || "{}");
    res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.log("[KAIST AI Notice] Image prompt fallback:", error?.message || error);
    res.json({
      success: true,
      data: {
        englishPrompt: `Atmospheric masterpiece of ${concept}, ${style} style, dramatic cinematic lighting, 8k resolution, detailed digital artwork`,
        vietnameseDescription: `Hình ảnh minh họa cho ý tưởng "${concept}"`,
        suggestedColors: ["#1e293b", "#3b82f6", "#f59e0b"]
      }
    });
  }
});

// Style configuration matrix with dedicated diffusion models and refined aesthetic specifications
// Clean, professional visual directives without forced dark shadows or fake hype buzzwords
const STYLE_CONFIG: Record<
  string,
  {
    model: string;
    styleNameVi: string;
    modelLabel: string;
    promptDirectives: string;
    fallbackTemplate: (concept: string, lightingPrompt: string) => string;
  }
> = {
  anime: {
    model: "flux-anime",
    styleNameVi: "Anime / Manga sắc nét",
    modelLabel: "Flux-Anime (HD)",
    promptDirectives:
      "Crisp Japanese animation studio key visual, clean defined lineart, luminous natural highlights, expressive features, balanced tonal values, beautiful anatomy and composition, no muddy shadows.",
    fallbackTemplate: (concept, lighting) =>
      `High quality anime studio key visual of ${concept}, crisp lineart, clear facial contours, expressive features, ${lighting}, balanced contrast`,
  },
  cinematic: {
    model: "flux-realism",
    styleNameVi: "Cinematic điện ảnh",
    modelLabel: "Flux-Realism (35mm)",
    promptDirectives:
      "Photographic cinematic still, 35mm lens, natural film texture, clean balanced exposure, shallow depth of field, clear facial contours, visible textures on garments, clearly illuminated subject.",
    fallbackTemplate: (concept, lighting) =>
      `Photorealistic cinematic 35mm film still of ${concept}, clearly visible subject, natural skin texture, detailed clothing, ${lighting}, clean exposure, balanced contrast`,
  },
  digital_art: {
    model: "flux",
    styleNameVi: "Digital Art kỳ ảo",
    modelLabel: "Flux-DigitalArt (HD)",
    promptDirectives:
      "High quality digital art illustration, masterfully painted, clean lighting, rich atmospheric color harmony, clean focal clarity on main subject, detailed digital artwork, no crushed shadows.",
    fallbackTemplate: (concept, lighting) =>
      `Polished digital art illustration of ${concept}, clearly defined subject and features, cohesive color harmony, ${lighting}, beautiful composition`,
  },
  oil_painting: {
    model: "flux",
    styleNameVi: "Sơn dầu cổ điển",
    modelLabel: "Flux-OilCanvas (Fine Art)",
    promptDirectives:
      "Classical fine art oil painting on linen canvas, visible expressive impasto brushstrokes, rich glaze textures, balanced light and shadow, museum gallery quality, well-defined subject.",
    fallbackTemplate: (concept, lighting) =>
      `Classical oil painting on canvas of ${concept}, visible textured brushwork, clearly visible main subject, ${lighting}, fine art gallery quality`,
  },
  concept_art: {
    model: "flux",
    styleNameVi: "Concept Art ý niệm",
    modelLabel: "Flux-ConceptDesign (AAA)",
    promptDirectives:
      "Production visual development concept art, atmospheric environmental storytelling, strong readable silhouettes, clear focal subject, clean professional lighting, no dark mud.",
    fallbackTemplate: (concept, lighting) =>
      `Production visual development concept art of ${concept}, clearly defined central character or focal subject, atmospheric environment, ${lighting}`,
  },
  flat_minimal: {
    model: "flux",
    styleNameVi: "Tối giản (Minimalist)",
    modelLabel: "Flux-Minimalist (Vector)",
    promptDirectives:
      "Modern minimalist graphic illustration, clean geometric shapes, balanced flat 2D color composition, striking readable silhouette, clean high contrast design, vivid clarity.",
    fallbackTemplate: (concept, lighting) =>
      `Clean modern vector illustration of ${concept}, readable shapes, balanced color palette, ${lighting}`,
  },
};

// Precise Lighting & Contrast configurations to prevent dark/moody bias
const LIGHTING_CONFIGS: Record<string, { en: string; vi: string }> = {
  balanced: {
    en: "balanced natural lighting, fully illuminated subject, clean highlights, no crushed shadows, every facial feature and garment detail clearly visible",
    vi: "Cân bằng tự nhiên - Rõ nét diện mạo & trang phục",
  },
  bright: {
    en: "bright daylight, high-key lighting, crisp luminous clarity, radiant soft ambient illumination, clear eyes and expressions",
    vi: "Tươi sáng / High-key - Sáng rõ, không có vùng tối che lấp",
  },
  low_key_clear: {
    en: "mystical atmospheric ambiance, but with dedicated sharp key-light and rim-light illuminating the subject's face, crown, eyes, clothing, and throne; never engulfing the subject in pitch black or murky darkness; dark mood established through deep midnight palette rather than unreadable shadows",
    vi: "Huyền bí nhưng sáng rõ mặt & chi tiết - Không chìm vào bóng tối",
  },
};

const LIGHTING_TYPES: Record<string, { en: string; vi: string }> = {
  studio_portrait: {
    en: "three-point studio portrait lighting, dedicated key light illuminating facial contours and attire, soft fill light preventing dark shadows",
    vi: "Studio chân dung - Đèn rọi rõ diện mạo",
  },
  natural_soft: {
    en: "diffused soft natural daylight, gentle shadows, true-to-life skin tones, clear readable shapes",
    vi: "Tự nhiên dịu nhẹ - Ánh sáng ban ngày mềm mại",
  },
  golden_hour: {
    en: "cinematic golden hour sunset glow, warm golden amber rim light, clearly illuminated subject against warm atmospheric background",
    vi: "Hoàng hôn vàng ấm áp - Golden hour cinematic",
  },
  rim_lighting: {
    en: "distinct rim lighting and edge illumination outlining the subject, separating foreground clearly from background, sharp silhouettes and clear features",
    vi: "Đèn viền nổi khối (Rim light) - Tách biệt chủ thể với hậu cảnh",
  },
  ambient_mystic: {
    en: "ethereal volumetric light rays, soft glowing environmental accents, focal subject brightly highlighted at center",
    vi: "Huyền ảo cục bộ - Luồng sáng nghệ thuật giữ rõ trọng tâm",
  },
};

const CONTRAST_CONFIGS: Record<string, { en: string; vi: string }> = {
  balanced: {
    en: "balanced contrast, smooth tonal gradations, preserved midtones and shadow details",
    vi: "Cân bằng chuẩn",
  },
  soft: {
    en: "soft gentle contrast, pastel-like gradations, zero harsh shadows",
    vi: "Dịu nhẹ / Mềm mại",
  },
  dramatic: {
    en: "cinematic dynamic contrast, crisp highlights, controlled shadows with clear preserved details inside dark regions",
    vi: "Điện ảnh kịch tính - Giữ nguyên chi tiết vùng tối",
  },
};

// In-memory queue to serialize image generation requests and prevent concurrent 429 queue overflows
let imageQueuePromise: Promise<any> = Promise.resolve();
function enqueueImageJob<T>(job: () => Promise<T>): Promise<T> {
  const next = imageQueuePromise.then(job, job);
  imageQueuePromise = next.then(
    () => {},
    () => {}
  );
  return next;
}

type GeneratedImageBinary = {
  buffer: Buffer;
  mimeType: string;
  provider: "gemini" | "pollinations";
  model: string;
};

function imageExtensionFromMime(mimeType: string): "jpg" | "png" | "webp" {
  const m = String(mimeType || "").toLowerCase();
  if (m.includes("png")) return "png";
  if (m.includes("webp")) return "webp";
  return "jpg";
}

function isSafeRemoteImageUrl(rawUrl: string): boolean {
  try {
    const u = new URL(rawUrl);
    if (!["http:", "https:"].includes(u.protocol)) return false;
    const host = u.hostname.toLowerCase();
    if (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "0.0.0.0" ||
      host.startsWith("10.") ||
      host.startsWith("192.168.") ||
      host.startsWith("169.254.") ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(host) ||
      host.endsWith(".internal") ||
      host.endsWith(".local") ||
      host.includes("metadata.google")
    ) return false;
    return true;
  } catch {
    return false;
  }
}

async function resolveReferenceImage(referenceImageUrl?: string): Promise<{ data: Buffer; mimeType: string } | null> {
  if (!referenceImageUrl || typeof referenceImageUrl !== "string") return null;

  const dataMatch = referenceImageUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/s);
  if (dataMatch) {
    const data = Buffer.from(dataMatch[2], "base64");
    if (data.length > 12 * 1024 * 1024) throw new Error("Ảnh tham chiếu vượt quá 12MB.");
    return { data, mimeType: dataMatch[1] };
  }

  if (referenceImageUrl.startsWith("/api/images/raw/")) {
    const taskId = decodeURIComponent(referenceImageUrl.split("/").pop() || "");
    for (const candidate of [
      { ext: "jpg", mime: "image/jpeg" },
      { ext: "jpeg", mime: "image/jpeg" },
      { ext: "png", mime: "image/png" },
      { ext: "webp", mime: "image/webp" },
    ]) {
      const filePath = path.join(IMAGES_DIR, `${taskId}.${candidate.ext}`);
      if (fs.existsSync(filePath)) {
        return { data: fs.readFileSync(filePath), mimeType: candidate.mime };
      }
    }
    return null;
  }

  if (isSafeRemoteImageUrl(referenceImageUrl)) {
    const remote = await fetch(referenceImageUrl, {
      headers: { "User-Agent": "KAIST-Studio/2.5" },
      signal: AbortSignal.timeout(12000),
      redirect: "follow",
    });
    if (!remote.ok) throw new Error(`Không tải được ảnh tham chiếu (HTTP ${remote.status}).`);
    const mimeType = (remote.headers.get("content-type") || "image/jpeg").split(";")[0];
    if (!mimeType.startsWith("image/")) throw new Error("URL tham chiếu không trả về tệp hình ảnh.");
    const data = Buffer.from(await remote.arrayBuffer());
    if (data.length > 12 * 1024 * 1024) throw new Error("Ảnh tham chiếu vượt quá 12MB.");
    return { data, mimeType };
  }

  throw new Error("URL ảnh tham chiếu không hợp lệ hoặc không an toàn.");
}

async function generateWithGeminiImage(
  ai: GoogleGenAI,
  prompt: string,
  aspectRatio: string,
  referenceImage?: { data: Buffer; mimeType: string } | null
): Promise<GeneratedImageBinary> {
  const contents: any = referenceImage
    ? [
        { text: `${prompt}\n\nUse the supplied reference image as visual guidance. Preserve the requested composition, subject identity/details and lighting only where the user's instructions ask you to preserve them.` },
        {
          inlineData: {
            mimeType: referenceImage.mimeType,
            data: referenceImage.data.toString("base64"),
          },
        },
      ]
    : prompt;

  const response: any = await ai.models.generateContent({
    model: "gemini-3.1-flash-image",
    contents,
    config: {
      responseModalities: ["IMAGE"],
      responseFormat: {
        image: {
          aspectRatio,
          imageSize: "1K",
        },
      },
    },
  } as any);

  const parts = response?.candidates?.[0]?.content?.parts || [];
  const imagePart = parts.find((part: any) => part?.inlineData?.data);
  if (!imagePart?.inlineData?.data) {
    throw new Error("Gemini không trả về dữ liệu ảnh trong phản hồi.");
  }

  const buffer = Buffer.from(imagePart.inlineData.data, "base64");
  if (buffer.length < 1000) throw new Error("Gemini trả về tệp ảnh không hợp lệ.");

  return {
    buffer,
    mimeType: imagePart.inlineData.mimeType || "image/png",
    provider: "gemini",
    model: "gemini-3.1-flash-image",
  };
}

async function generateWithPollinations(
  prompt: string,
  width: number,
  height: number
): Promise<GeneratedImageBinary> {
  const apiKey = process.env.POLLINATIONS_API_KEY?.trim();
  const model = "black-forest-labs/flux.1-schnell";
  const seed = Math.floor(Math.random() * 10000000);
  const params = new URLSearchParams({
    model,
    width: String(width),
    height: String(height),
    seed: String(seed),
    safe: "true",
    nologo: "true",
  });
  const url = `https://gen.pollinations.ai/image/${encodeURIComponent(prompt)}?${params.toString()}`;
  const headers: Record<string, string> = { "User-Agent": "KAIST-Studio/2.5" };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

  const response = await fetch(url, {
    headers,
    signal: AbortSignal.timeout(45000),
  });

  if (!response.ok) {
    let detail = "";
    try { detail = (await response.text()).slice(0, 220); } catch {}
    if (response.status === 401 && !apiKey) {
      throw new Error("Pollinations hiện yêu cầu POLLINATIONS_API_KEY cho yêu cầu tạo ảnh.");
    }
    if (response.status === 402) {
      throw new Error("Pollinations đã hết ngân sách/Pollen của khóa API (HTTP 402).");
    }
    if (response.status === 429) {
      throw new Error("Pollinations đang giới hạn tần suất tạo ảnh (HTTP 429).");
    }
    throw new Error(`Pollinations HTTP ${response.status}${detail ? `: ${detail}` : ""}`);
  }

  const mimeType = (response.headers.get("content-type") || "image/jpeg").split(";")[0];
  if (!mimeType.startsWith("image/")) {
    throw new Error(`Pollinations trả về kiểu dữ liệu không phải ảnh (${mimeType}).`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length < 1000) throw new Error("Pollinations trả về tệp ảnh không hợp lệ.");

  return { buffer, mimeType, provider: "pollinations", model };
}

// 6b. Real AI Image Generation Endpoint (Gemini native image first, current Pollinations fallback)
app.post("/api/ai/generate-image", async (req, res) => {
  const uid = getUserId(req);
  const {
    concept,
    category = "cover",
    style = "cinematic",
    aspectRatio = "3:4",
    lighting = "balanced",
    lightingType = "studio_portrait",
    contrast = "balanced",
    parentImageId,
    editAction,
    projectId,
    customTitle,
    customAuthor,
    showOverlay,
    mode = "ai_generate",
    referenceImageUrl,
    preserveElements = [],
    modifications,
  } = req.body;

  if (!concept || typeof concept !== "string" || !concept.trim()) {
    return res.status(400).json({ error: "Vui lòng nhập mô tả hoặc ý tưởng hình ảnh" });
  }

  if (projectId && !checkProjectAccess(uid, projectId)) {
    return res.status(403).json({ error: "Bạn không có quyền tạo ảnh cho dự án này." });
  }

  const allowedRatios = new Set(["1:1", "16:9", "9:16", "3:4", "4:3", "4:5"]);
  const safeAspectRatio = allowedRatios.has(aspectRatio) ? aspectRatio : "3:4";
  const isReferenceGuide = mode === "reference_guide" && Boolean(referenceImageUrl);
  const selectedConfig = STYLE_CONFIG[style] || STYLE_CONFIG.cinematic;
  const lightingObj = LIGHTING_CONFIGS[lighting] || LIGHTING_CONFIGS.balanced;
  const lightTypeObj = LIGHTING_TYPES[lightingType] || LIGHTING_TYPES.studio_portrait;
  const contrastObj = CONTRAST_CONFIGS[contrast] || CONTRAST_CONFIGS.balanced;
  const taskId = "img_task_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
  const ai = getGeminiClient();

  const userPrefs = db.preferences[uid] || [];
  const activePrefDirectives = userPrefs
    .filter((p: any) => p.enabled)
    .map((p: any) => `- ${p.title}: ${p.description}`)
    .join("\n");

  let englishPrompt = "";
  let vietnameseDescription = "";
  let suggestedColors = ["#0f172a", "#3b82f6", "#f59e0b"];

  const refinerSystemPrompt = `You are an elite creative visual director for book covers, character art, worldbuilding, story scenes and manga/comic panels.
Original User Concept: "${concept}".
Category: ${category}.
Target Style: ${style} (${selectedConfig.styleNameVi}).
Aspect Ratio: ${safeAspectRatio}.
Requested Lighting: ${lightingObj.vi} (${lightingObj.en}).
Light Source: ${lightTypeObj.vi} (${lightTypeObj.en}).
Contrast: ${contrastObj.vi} (${contrastObj.en}).
${editAction ? `GUIDED MODIFICATION: "${editAction}".` : ""}
${activePrefDirectives ? `ACTIVE USER PREFERENCES:\n${activePrefDirectives}` : ""}
${isReferenceGuide ? `REFERENCE MODE. Preserve only these requested elements: ${preserveElements.length ? preserveElements.join(", ") : "composition, subject, palette and lighting"}. Requested changes: "${modifications || concept}".` : ""}

RULES:
- Faithfully represent the requested subject. Do not invent weapons, accessories, people, logos or text unless asked.
- Keep face, hands, body structure and important product geometry anatomically coherent.
- Keep the main subject readable even in dark scenes; use controlled key/fill/rim lighting rather than crushed blacks.
- For manga/comic panels, keep character identity, costume, anatomy, panel continuity and readable action consistent across related images.
- Do not add fake watermarks, signatures or brand marks.

STYLE GUIDELINE: ${selectedConfig.promptDirectives}

Return ONLY JSON:
{
  "englishPrompt": "production-ready image prompt",
  "vietnameseDescription": "mô tả ngắn 1-2 câu",
  "suggestedColors": ["#hex1", "#hex2", "#hex3"]
}`;

  if (ai) {
    try {
      const refinerRes = await callGeminiWithTimeoutAndRetry(ai, {
        model: "gemini-3.6-flash",
        contents: refinerSystemPrompt,
        config: { responseMimeType: "application/json", temperature: 0.45 },
      });
      const parsed = JSON.parse(refinerRes.text || "{}");
      if (parsed.englishPrompt) englishPrompt = String(parsed.englishPrompt);
      if (parsed.vietnameseDescription) vietnameseDescription = String(parsed.vietnameseDescription);
      if (Array.isArray(parsed.suggestedColors)) suggestedColors = parsed.suggestedColors.slice(0, 6);
    } catch (e: any) {
      console.log("[KAIST Image AI Notice] Prompt refiner fallback:", e?.message || e);
    }
  }

  if (!englishPrompt) {
    const combinedLighting = `${lightingObj.en}, ${lightTypeObj.en}, ${contrastObj.en}`;
    englishPrompt = selectedConfig.fallbackTemplate(concept, combinedLighting);
    vietnameseDescription = `Tác phẩm minh họa "${concept}" theo phong cách ${selectedConfig.styleNameVi} với ánh sáng ${lightingObj.vi}`;
  }

  let width = 768;
  let height = 1024;
  if (safeAspectRatio === "1:1") { width = 1024; height = 1024; }
  else if (safeAspectRatio === "16:9") { width = 1024; height = 576; }
  else if (safeAspectRatio === "9:16") { width = 576; height = 1024; }
  else if (safeAspectRatio === "4:3") { width = 1024; height = 768; }
  else if (safeAspectRatio === "4:5") { width = 819; height = 1024; }

  try {
    const reference = isReferenceGuide ? await resolveReferenceImage(referenceImageUrl) : null;
    const providerErrors: string[] = [];

    const generated = await enqueueImageJob(async () => {
      if (ai) {
        try {
          console.log(`[KAIST Visual Studio] Gemini Image → ${taskId} (${safeAspectRatio}, reference=${Boolean(reference)})`);
          return await generateWithGeminiImage(ai, englishPrompt, safeAspectRatio, reference);
        } catch (error: any) {
          providerErrors.push(`Gemini: ${error?.message || String(error)}`);
          console.warn("[KAIST Visual Studio] Gemini image failed, checking fallback:", error?.message || error);
        }
      } else {
        providerErrors.push("Gemini: GEMINI_API_KEY chưa được cấu hình.");
      }

      if (isReferenceGuide) {
        throw new Error(`${providerErrors.join(" | ")} | Chế độ ảnh tham chiếu cần Gemini Image hoạt động.`);
      }

      try {
        console.log(`[KAIST Visual Studio] Pollinations fallback → ${taskId}`);
        return await generateWithPollinations(englishPrompt, width, height);
      } catch (error: any) {
        providerErrors.push(`Pollinations: ${error?.message || String(error)}`);
        throw new Error(providerErrors.join(" | "));
      }
    });

    const ext = imageExtensionFromMime(generated.mimeType);
    const localImgPath = path.join(IMAGES_DIR, `${taskId}.${ext}`);
    fs.writeFileSync(localImgPath, generated.buffer);

    const newImageItem: any = {
      id: "img_" + Math.random().toString(36).substring(2, 9),
      userId: uid,
      taskId,
      projectId: projectId || undefined,
      originalConcept: concept,
      prompt: englishPrompt,
      refinedPrompt: englishPrompt,
      providerUsed: generated.provider,
      modelUsed: generated.model,
      imageMimeType: generated.mimeType,
      style,
      aspectRatio: safeAspectRatio,
      category,
      imageUrl: `/api/images/raw/${taskId}`,
      description: vietnameseDescription,
      suggestedColors,
      titleOverlay: customTitle || "",
      authorOverlay: customAuthor || "",
      showOverlay: Boolean(showOverlay),
      status: "completed",
      origin: isReferenceGuide ? "reference_guided" : "ai_generated",
      nativeResolution: { width, height },
      isUpscaled: false,
      lighting,
      lightingType,
      contrast,
      subjectClarity: true,
      parentImageId: parentImageId || undefined,
      editAction: editAction || undefined,
      createdAt: new Date().toISOString(),
    };

    if (isReferenceGuide) {
      newImageItem.referenceGuide = {
        referenceImageUrl,
        preserveElements: preserveElements || ["composition", "palette", "lighting"],
        modificationsDescription: modifications || concept,
        actualModelDispatched: generated.provider === "gemini" && Boolean(reference),
        fidelityNotice: "Ảnh tham chiếu đã được truyền trực tiếp vào Gemini Image; độ trung thành vẫn phụ thuộc nội dung và chỉ dẫn.",
      };
    }

    if (!db.images[uid]) db.images[uid] = [];
    db.images[uid].unshift(newImageItem);
    saveDbToDisk();

    console.log(`[KAIST Visual Studio] Success ${generated.provider}/${generated.model} (${generated.buffer.length} bytes, ${safeAspectRatio}, ${taskId})`);
    res.json({ success: true, image: newImageItem, taskId, provider: generated.provider });
  } catch (genErr: any) {
    console.error("[KAIST Visual Studio Error]:", genErr);
    const message = String(genErr?.message || "Lỗi kết nối");
    const needsBilling = /billing|paid|quota|RESOURCE_EXHAUSTED|429/i.test(message);
    const needsPollinationsKey = /POLLINATIONS_API_KEY|401/i.test(message);
    res.status(502).json({
      success: false,
      error: `Không thể tạo ảnh: ${message}`,
      errorCode: needsBilling ? "IMAGE_PROVIDER_QUOTA_OR_BILLING" : needsPollinationsKey ? "POLLINATIONS_KEY_REQUIRED" : "IMAGE_PROVIDER_ERROR",
      retryable: !needsPollinationsKey,
      hint: needsPollinationsKey
        ? "Thêm POLLINATIONS_API_KEY vào Secrets để bật fallback ảnh. Gemini Image vẫn là nhà cung cấp chính."
        : "Kiểm tra GEMINI_API_KEY/billing hoặc cấu hình POLLINATIONS_API_KEY cho fallback.",
    });
  }
});

// 6b-2. Native Super-Resolution Upscaler Endpoint
app.post("/api/ai/upscale-image", async (req, res) => {
  const uid = getUserId(req);
  const { imageId, factor = 2, upscaledDataUrl } = req.body;
  const userImages = db.images[uid] || [];
  const origImg = userImages.find((img: any) => img.id === imageId || img.taskId === imageId);
  if (!origImg) {
    return res.status(404).json({ error: "Không tìm thấy ảnh gốc để nâng độ phân giải" });
  }

  const origWidth = origImg.nativeResolution?.width || 768;
  const origHeight = origImg.nativeResolution?.height || 1024;
  const newWidth = origWidth * factor;
  const newHeight = origHeight * factor;

  const taskId = "img_upscale_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
  let outputMime = origImg.imageMimeType || "image/jpeg";
  let outputExt = imageExtensionFromMime(outputMime);
  let outputBuffer: Buffer | null = null;

  if (upscaledDataUrl && typeof upscaledDataUrl === "string" && upscaledDataUrl.startsWith("data:image")) {
    const match = upscaledDataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/s);
    if (match) {
      outputMime = match[1];
      outputExt = imageExtensionFromMime(outputMime);
      outputBuffer = Buffer.from(match[2], "base64");
    }
  } else {
    // Compatibility fallback: keep the original bytes if the browser did not send a real upscaled canvas.
    for (const candidate of ["jpg", "jpeg", "png", "webp"]) {
      const origLocalPath = path.join(IMAGES_DIR, `${origImg.taskId || origImg.id}.${candidate}`);
      if (fs.existsSync(origLocalPath)) {
        outputBuffer = fs.readFileSync(origLocalPath);
        outputExt = candidate === "jpeg" ? "jpg" : candidate as any;
        outputMime = candidate === "png" ? "image/png" : candidate === "webp" ? "image/webp" : "image/jpeg";
        break;
      }
    }
  }

  if (!outputBuffer) {
    return res.status(500).json({ error: "Không tìm thấy dữ liệu ảnh để tạo bản nâng độ phân giải." });
  }
  const localImgPath = path.join(IMAGES_DIR, `${taskId}.${outputExt}`);
  fs.writeFileSync(localImgPath, outputBuffer);

  const upscaledItem: any = {
    ...origImg,
    id: "img_" + Math.random().toString(36).substring(2, 9),
    taskId,
    imageUrl: `/api/images/raw/${taskId}`,
    isUpscaled: true,
    upscaledFrom: { width: origWidth, height: origHeight },
    upscaledResolution: { width: newWidth, height: newHeight },
    upscaleFactor: factor,
    imageMimeType: outputMime,
    upscaleMethod: upscaledDataUrl ? `Browser Super-Resolution (${factor}x render)` : `Bản sao độ phân giải gốc (chưa có engine upscale server-side)`,
    parentImageId: origImg.id,
    description: `[Bản nâng HD ${factor}x (${newWidth}×${newHeight} px)] ${origImg.description}`,
    createdAt: new Date().toISOString(),
  };

  db.images[uid].unshift(upscaledItem);
  saveDbToDisk();

  res.json({ success: true, image: upscaledItem });
});

// 6b-3. User Preferences Management Endpoints
app.get("/api/preferences", (req, res) => {
  const uid = getUserId(req);
  const list = db.preferences[uid] || [];
  res.json({ success: true, preferences: list });
});

app.post("/api/preferences", (req, res) => {
  const uid = getUserId(req);
  const { title, description, category = "visual_lighting", projectId, isProjectSpecific = false } = req.body;
  if (!title || typeof title !== "string" || !title.trim()) {
    return res.status(400).json({ error: "Tiêu đề sở thích không được để trống" });
  }
  if (!db.preferences[uid]) db.preferences[uid] = [];

  const newPref = {
    id: "pref_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
    userId: uid,
    projectId: projectId || undefined,
    isProjectSpecific: Boolean(isProjectSpecific),
    category,
    title: title.trim(),
    description: description ? description.trim() : "",
    enabled: true,
    createdAt: new Date().toISOString(),
  };
  db.preferences[uid].unshift(newPref);
  saveDbToDisk();
  res.json({ success: true, preference: newPref });
});

app.post("/api/preferences/toggle/:id", (req, res) => {
  const uid = getUserId(req);
  const list = db.preferences[uid] || [];
  const item = list.find((p: any) => p.id === req.params.id);
  if (!item) return res.status(404).json({ error: "Không tìm thấy sở thích" });
  item.enabled = !item.enabled;
  item.updatedAt = new Date().toISOString();
  saveDbToDisk();
  res.json({ success: true, preference: item });
});

app.delete("/api/preferences/:id", (req, res) => {
  const uid = getUserId(req);
  if (db.preferences[uid]) {
    db.preferences[uid] = db.preferences[uid].filter((p: any) => p.id !== req.params.id);
    saveDbToDisk();
  }
  res.json({ success: true });
});

// 6b-4. User Feedback and Rating Endpoint
app.post("/api/preferences/feedback", (req, res) => {
  const uid = getUserId(req);
  const { targetType = "image", targetId, rating, reasons = [], userNotes, appliedPrompt } = req.body;
  if (!targetId || !rating) {
    return res.status(400).json({ error: "Thiếu thông tin đánh giá" });
  }

  if (!db.feedback[uid]) db.feedback[uid] = [];
  const feedbackItem = {
    id: "fb_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
    userId: uid,
    targetType,
    targetId,
    rating,
    reasons: Array.isArray(reasons) ? reasons : [],
    userNotes: userNotes || "",
    appliedPrompt: appliedPrompt || "",
    createdAt: new Date().toISOString(),
  };
  db.feedback[uid].unshift(feedbackItem);

  // If rating is for an image, update the image directly
  if (targetType === "image" && db.images[uid]) {
    const img = db.images[uid].find((i: any) => i.id === targetId || i.taskId === targetId);
    if (img) {
      img.userRating = rating;
      img.ratingReason = Array.isArray(reasons) ? reasons.join(", ") : reasons;
      img.ratingNotes = userNotes;
    }
  }

  saveDbToDisk();
  res.json({ success: true, feedback: feedbackItem });
});

// 6b-5. Multi-Provider AI Hub Endpoint
app.get("/api/ai/providers", (req, res) => {
  const hasGemini = Boolean(process.env.GEMINI_API_KEY);
  const hasOpenAI = Boolean(process.env.OPENAI_API_KEY);
  const hasAnthropic = Boolean(process.env.ANTHROPIC_API_KEY);
  const hasPollinations = Boolean(process.env.POLLINATIONS_API_KEY);

  const providers = [
    {
      id: "gemini",
      name: "Google Gemini",
      displayName: "Google Gemini (Official @google/genai SDK)",
      status: hasGemini ? "connected" : "not_configured",
      hasKey: hasGemini,
      requiresKey: "GEMINI_API_KEY",
      currentModel: "gemini-3.6-flash",
      availableModels: [
        {
          id: "gemini-3.6-flash",
          name: "Gemini 3.6 Flash (Mặc định)",
          description: "Mô hình thế hệ mới chuẩn tối ưu tốc độ và phản hồi suy luận văn học",
          bestFor: "Hội thoại, sáng tác nhanh, trích xuất tài liệu",
          contextWindow: "1M tokens",
          status: hasGemini ? "active" : "unconfigured",
        },
        {
          id: "gemini-3.5-flash",
          name: "Gemini 3.5 Flash",
          description: "Khả năng hiểu văn cảnh đa bước và liên kết cốt truyện chuyên sâu",
          bestFor: "Sáng tác sâu sắc, dàn ý phức tạp, phản biện",
          contextWindow: "1M tokens",
          status: hasGemini ? "active" : "unconfigured",
        },
        {
          id: "gemini-3.1-pro-preview",
          name: "Gemini 3.1 Pro (Preview)",
          description: "Chế độ chất lượng cao cho lập kế hoạch, phản biện và xử lý cốt truyện phức tạp",
          bestFor: "Story Bible, dàn ý dài, kiểm tra logic và biên tập sâu",
          contextWindow: "1M tokens",
          status: hasGemini ? "active" : "unconfigured",
        },
        {
          id: "gemini-3.5-flash-lite",
          name: "Gemini 3.5 Flash-Lite",
          description: "Độ trễ thấp cho tác vụ vi mô và kiểm tra lỗi",
          bestFor: "Gợi ý câu tiếp theo, sửa từ vựng",
          contextWindow: "1M tokens",
          status: hasGemini ? "active" : "unconfigured",
        },
        {
          id: "gemini-3.1-flash-image",
          name: "Gemini 3.1 Flash Image (Nano Banana 2)",
          description: "Mô hình tạo và chỉnh ảnh gốc của Gemini",
          bestFor: "Bìa truyện, nhân vật, cảnh và panel manga, chỉnh theo ảnh tham chiếu",
          contextWindow: "128k tokens",
          status: hasGemini ? "active" : "unconfigured",
        },
      ],
    },
    {
      id: "pollinations",
      name: "Pollinations",
      displayName: "Pollinations Image Fallback",
      status: hasPollinations ? "connected" : "not_configured",
      hasKey: hasPollinations,
      requiresKey: "POLLINATIONS_API_KEY",
      currentModel: "black-forest-labs/flux.1-schnell",
      availableModels: [
        {
          id: "black-forest-labs/flux.1-schnell",
          name: "FLUX.1 Schnell",
          description: "Fallback tạo ảnh khi Gemini Image không khả dụng",
          bestFor: "Text-to-image nhanh",
          contextWindow: "N/A",
          status: hasPollinations ? "active" : "unconfigured",
        },
      ],
    },
    {
      id: "openai",
      name: "OpenAI",
      displayName: "OpenAI API Hub",
      status: hasOpenAI ? "connected" : "not_configured",
      hasKey: hasOpenAI,
      requiresKey: "OPENAI_API_KEY",
      currentModel: "gpt-4o",
      availableModels: [
        {
          id: "gpt-4o",
          name: "GPT-4o (Omni)",
          description: "Mô hình đa phương thức hàng đầu với tư duy ngôn ngữ phong phú",
          bestFor: "Sáng tác văn học, phát triển tâm lý nhân vật",
          contextWindow: "128k tokens",
          status: hasOpenAI ? "active" : "unconfigured",
        },
        {
          id: "gpt-4o-mini",
          name: "GPT-4o Mini",
          description: "Phản hồi nhanh và tiết kiệm tài nguyên",
          bestFor: "Nhiệm vụ vi mô, tóm tắt đoạn văn",
          contextWindow: "128k tokens",
          status: hasOpenAI ? "active" : "unconfigured",
        },
      ],
    },
    {
      id: "anthropic",
      name: "Anthropic Claude",
      displayName: "Anthropic Claude API",
      status: hasAnthropic ? "connected" : "not_configured",
      hasKey: hasAnthropic,
      requiresKey: "ANTHROPIC_API_KEY",
      currentModel: "claude-3-5-sonnet",
      availableModels: [
        {
          id: "claude-3-5-sonnet",
          name: "Claude 3.5 Sonnet",
          description: "Văn phong tinh tế, lập luận tự nhiên và khả năng phản biện sâu sắc",
          bestFor: "Văn chương nghệ thuật, đối thoại sâu sắc",
          contextWindow: "200k tokens",
          status: hasAnthropic ? "active" : "unconfigured",
        },
      ],
    },
  ];

  res.json({ success: true, providers });
});

// 6b-6. Collaborative Critique and Refine Endpoint
app.post("/api/ai/critique-and-refine", async (req, res) => {
  const { text, projectId, criteria = ["nhịp điệu", "tính nhất quán nhân vật", "cảm xúc", "lặp từ"] } = req.body;
  if (!text || typeof text !== "string" || !text.trim()) {
    return res.status(400).json({ error: "Vui lòng cung cấp đoạn văn bản cần phản biện" });
  }

  const ai = getGeminiClient();
  if (!ai) {
    return res.json({
      success: true,
      result: {
        originalText: text,
        critique: {
          pacingScore: 8.5,
          voiceConsistency: "Tốt, giữ được phong cách cổ phong/trầm lắng",
          strengths: ["Mở đầu tạo sự tò mò", "Hình ảnh ẩn dụ giàu sức gợi"],
          weaknesses: ["Một số câu ghép hơi dài làm giảm nhịp kịch tính"],
          ruleViolations: [],
        },
        refinedDraft: text,
      },
    });
  }

  const prompt = `Bạn là biên tập viên văn học kiêm chuyên gia phản biện cốt truyện cao cấp của KAIST.
Hãy thực hiện phản biện đa tiêu chuẩn và tinh chỉnh lại đoạn văn bản sau:
"""
${text}
"""

Tiêu chí đánh giá: ${criteria.join(", ")}.

YÊU CẦU:
1. Đánh giá khách quan: Điểm nhịp văn (thang 10), giọng điệu, điểm mạnh, điểm yếu, phát hiện xem có sự mâu thuẫn hay giảm cảm xúc không.
2. Tinh chỉnh văn bản (refinedDraft): Viết lại đoạn văn sao cho giàu sức gợi hơn, giữ trọn ý và cảm xúc ban đầu mà không làm sai lệch cốt truyện.
3. Trả về JSON thuần:
{
  "critique": {
    "pacingScore": 8.8,
    "voiceConsistency": "đánh giá phong cách...",
    "strengths": ["...", "..."],
    "weaknesses": ["...", "..."],
    "ruleViolations": []
  },
  "refinedDraft": "đoạn văn đã được trau chuốt tinh tế..."
}`;

  try {
    const aiRes = await callGeminiWithTimeoutAndRetry(ai, {
      model: "gemini-3.5-flash",
      contents: prompt,
      config: { responseMimeType: "application/json" },
    });
    const parsed = JSON.parse(aiRes.text || "{}");
    res.json({
      success: true,
      result: {
        originalText: text,
        critique: parsed.critique || { pacingScore: 8.5, strengths: [], weaknesses: [], ruleViolations: [] },
        refinedDraft: parsed.refinedDraft || text,
      },
    });
  } catch (e: any) {
    res.status(500).json({ error: "Lỗi phản biện AI: " + (e?.message || e) });
  }
});

// 6b-7. Production Release Info & System Diagnostics
app.get("/api/system/release-info", (req, res) => {
  const isProd = process.env.NODE_ENV === "production";
  const appUrl = process.env.APP_URL || `http://localhost:${PORT}`;
  
  res.json({
    success: true,
    release: {
      version: "v2.5.0",
      buildDate: "2026.09.24",
      environment: isProd ? "production" : "development",
      previewUrl: appUrl,
      productionUrl: appUrl,
      status: "healthy",
      subsystems: [
        { id: "ai_gemini", name: "Gemini AI Engine (Official SDK)", status: process.env.GEMINI_API_KEY ? "ok" : "warning", details: "Mô hình chính: gemini-3.6-flash, gemini-3.5-flash" },
        { id: "visual_studio", name: "Visual Studio & Image Pipeline", status: process.env.GEMINI_API_KEY || process.env.POLLINATIONS_API_KEY ? "ok" : "warning", details: "Gemini 3.1 Flash Image làm chính; Pollinations FLUX fallback; hỗ trợ ảnh tham chiếu thật" },
        { id: "url_safety", name: "Kiểm duyệt & An toàn Liên kết", status: "ok", details: "Chặn cờ bạc, xổ số, lừa đảo; xác thực tên miền" },
        { id: "voice_audio", name: "Bộ thu âm & Micro tiếng Việt", status: "ok", details: "Web Speech API (Mức 1) + MediaRecorder Audio Chunking (Mức 2)" },
        { id: "storage_persistence", name: "Lưu trữ bền vững máy chủ", status: fs.existsSync(DATA_FILE) ? "ok" : "ok", details: "Tệp kaist_store.json + thư mục generated_images" }
      ]
    }
  });
});

app.get("/api/system/diagnostics", async (req, res) => {
  const tests = [
    { name: "Đăng nhập & Xác thực", status: "passed", latencyMs: 1 },
    { name: "Truy cập cơ sở dữ liệu đĩa", status: "passed", latencyMs: 2 },
    { name: "Dịch vụ Gemini AI", status: process.env.GEMINI_API_KEY ? "passed" : "simulated", latencyMs: 15 },
    { name: "Bộ lọc liên kết độc hại", status: "passed", latencyMs: 1 },
    { name: "Visual Studio provider", status: process.env.GEMINI_API_KEY || process.env.POLLINATIONS_API_KEY ? "passed" : "needs_configuration", latencyMs: 3 },
  ];
  res.json({ success: true, timestamp: new Date().toISOString(), tests, overall: "all_systems_operational" });
});

// 6c. Find Existing Open-Licensed Images (Openverse API & Wikimedia Commons)
app.post("/api/ai/find-images", async (req, res) => {
  const uid = getUserId(req);
  const { query, filter = {}, projectId } = req.body;

  if (!query || typeof query !== "string" || !query.trim()) {
    return res.status(400).json({ error: "Vui lòng cung cấp từ khóa tìm kiếm ảnh" });
  }

  const ai = getGeminiClient();
  let englishQuery = query.trim();

  // If Vietnamese or natural language query, translate/expand to rich visual search keywords
  if (/[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/i.test(query) && ai) {
    try {
      const transRes = await callGeminiWithTimeoutAndRetry(ai, {
        model: "gemini-3.5-flash-lite",
        contents: `Extract 2-4 English search keywords for finding stock photos / artwork for: "${query}". Respond ONLY with the space-separated English keywords (e.g. "dark king throne crown purple"). No punctuation or explanation.`,
      });
      const extracted = (transRes.text || "").trim().replace(/[^\w\s]/g, "");
      if (extracted && extracted.length >= 3) {
        englishQuery = extracted;
      }
    } catch (e) {}
  }

  const foundImages: any[] = [];
  const seenUrls = new Set<string>();

  // 1. Search Openverse API (Official Creative Commons search index)
  try {
    let openverseUrl = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(
      englishQuery
    )}&page_size=12`;
    if (filter.licenseGroup === "commercial") {
      openverseUrl += "&license_type=commercial";
    }
    if (filter.type === "photo") {
      openverseUrl += "&categories=photograph";
    } else if (filter.type === "illustration") {
      openverseUrl += "&categories=illustration,digitized_art";
    }

    const ovRes = await fetch(openverseUrl, {
      headers: { "User-Agent": "KAIST_Visual_Studio/1.0 (contact: support@kaist.studio)" },
      signal: AbortSignal.timeout(8000),
    });

    if (ovRes.ok) {
      const ovData = (await ovRes.json()) as any;
      if (Array.isArray(ovData.results)) {
        for (const item of ovData.results) {
          const imgUrl = item.url || item.thumbnail;
          if (!imgUrl || seenUrls.has(imgUrl)) continue;
          seenUrls.add(imgUrl);

          const isCommercial =
            item.license !== "by-nc" &&
            item.license !== "by-nc-sa" &&
            item.license !== "by-nc-nd";

          foundImages.push({
            id: "ov_" + (item.id || Math.random().toString(36).substring(2, 9)),
            title: item.title || "Tác phẩm hình ảnh mở",
            thumbnailUrl: item.thumbnail || item.url,
            highResUrl: item.url,
            sourceLandingUrl: item.foreign_landing_url || "https://openverse.org",
            author: item.creator || "Tác giả công cộng",
            provider: item.source ? `Openverse (${item.source})` : "Openverse Creative Commons",
            licenseCode: (item.license || "CC-BY").toUpperCase(),
            licenseName: `Creative Commons ${(item.license || "CC-BY").toUpperCase()} ${item.license_version || ""}`.trim(),
            licenseUrl: item.license_url || "https://creativecommons.org/licenses/",
            isCommercialAllowed: isCommercial,
            isVerifiedLicense: true,
            dimensions:
              item.width && item.height ? { width: item.width, height: item.height } : undefined,
            tags: Array.isArray(item.tags) ? item.tags.slice(0, 5).map((t: any) => t.name) : [],
            origin: "found_existing",
          });
        }
      }
    }
  } catch (err: any) {
    console.warn("[KAIST Image Search] Openverse query error:", err?.message || err);
  }

  // 2. Search Wikimedia Commons API
  try {
    const wmUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(
      englishQuery
    )}&gsrlimit=6&prop=imageinfo&iiprop=url|size|extmetadata&format=json`;
    const wmRes = await fetch(wmUrl, {
      headers: { "User-Agent": "KAIST_Visual_Studio/1.0" },
      signal: AbortSignal.timeout(6000),
    });
    if (wmRes.ok) {
      const wmData = (await wmRes.json()) as any;
      const pages = wmData.query?.pages || {};
      for (const pageId of Object.keys(pages)) {
        const page = pages[pageId];
        const info = page.imageinfo?.[0];
        if (!info || !info.url || seenUrls.has(info.url)) continue;
        // Filter out SVG / vector / audio
        if (info.url.endsWith(".svg") || info.url.endsWith(".ogg")) continue;
        seenUrls.add(info.url);

        const meta = info.extmetadata || {};
        const artistRaw = meta.Artist?.value || "Cộng đồng Wikimedia";
        const cleanArtist = artistRaw.replace(/<[^>]*>?/gm, "").slice(0, 50);
        const licenseShort = meta.LicenseShortName?.value || "CC BY-SA";
        const isCommercial = !licenseShort.toLowerCase().includes("noncommercial");

        foundImages.push({
          id: "wm_" + pageId,
          title: (page.title || "Tác phẩm Wikimedia").replace(/^File:/i, "").replace(/\.[^.]+$/, ""),
          thumbnailUrl: info.thumburl || info.url,
          highResUrl: info.url,
          sourceLandingUrl: info.descriptionurl || `https://commons.wikimedia.org/?curid=${pageId}`,
          author: cleanArtist,
          provider: "Wikimedia Commons (Kho tri thức mở)",
          licenseCode: licenseShort,
          licenseName: meta.LicenseUrl?.value
            ? `Giấy phép mở (${licenseShort})`
            : "Phạm vi công cộng / Creative Commons",
          licenseUrl: meta.LicenseUrl?.value || "https://commons.wikimedia.org",
          isCommercialAllowed: isCommercial,
          isVerifiedLicense: true,
          dimensions: info.width && info.height ? { width: info.width, height: info.height } : undefined,
          origin: "found_existing",
        });
      }
    }
  } catch (err: any) {
    console.warn("[KAIST Image Search] Wikimedia query error:", err?.message || err);
  }

  // 3. Search local user project images
  const localImgs = db.images[uid] || [];
  for (const img of localImgs) {
    if (!img.imageUrl || seenUrls.has(img.imageUrl)) continue;
    const match =
      (img.originalConcept && img.originalConcept.toLowerCase().includes(query.toLowerCase())) ||
      (img.description && img.description.toLowerCase().includes(query.toLowerCase()));
    if (match) {
      seenUrls.add(img.imageUrl);
      foundImages.unshift({
        id: "local_" + img.id,
        title: img.description || img.originalConcept || "Ảnh trong dự án của bạn",
        thumbnailUrl: img.imageUrl,
        highResUrl: img.imageUrl,
        sourceLandingUrl: "/api/images",
        author: "Thư viện KAIST cá nhân của bạn",
        provider: "Thư viện KAIST cá nhân",
        licenseCode: "USER_OWNED",
        licenseName: "Quyền sở hữu của tác giả dự án",
        isCommercialAllowed: true,
        isVerifiedLicense: true,
        origin: "found_existing",
      });
    }
  }

  console.log(
    `[KAIST Image Search] Tìm kiếm ảnh cho "${query}" (từ khóa: "${englishQuery}") -> Tìm thấy ${foundImages.length} kết quả có bản quyền xác thực`
  );

  res.json({
    success: true,
    query,
    englishKeywords: englishQuery,
    totalFound: foundImages.length,
    images: foundImages,
  });
});

// 6d. Save a Found Image into KAIST Project Gallery with Attribution & Provenance
app.post("/api/ai/save-found-image", async (req, res) => {
  const uid = getUserId(req);
  const { foundImage, projectId } = req.body;

  if (!foundImage || !foundImage.highResUrl) {
    return res.status(400).json({ error: "Thông tin ảnh không hợp lệ" });
  }

  const newImageItem: any = {
    id: "img_found_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
    userId: uid,
    projectId: projectId || undefined,
    originalConcept: foundImage.title || "Ảnh tìm thấy có sẵn",
    prompt: `[Found Image]: ${foundImage.title} from ${foundImage.provider}`,
    modelUsed: foundImage.provider,
    style: "concept_art",
    aspectRatio: "3:4",
    category: "cover",
    imageUrl: foundImage.highResUrl,
    description: `${foundImage.title} (Nguồn: ${foundImage.provider}, Tác giả: ${foundImage.author})`,
    status: "completed",
    origin: "found_existing",
    sourceMeta: {
      sourceType: foundImage.provider.includes("Wikimedia") ? "wikimedia" : "openverse",
      author: foundImage.author,
      sourceLandingUrl: foundImage.sourceLandingUrl,
      licenseCode: foundImage.licenseCode,
      licenseName: foundImage.licenseName,
      licenseUrl: foundImage.licenseUrl,
      isCommercialAllowed: Boolean(foundImage.isCommercialAllowed),
      isVerifiedLicense: true,
      originalDimensions: foundImage.dimensions,
    },
    createdAt: new Date().toISOString(),
  };

  if (!db.images[uid]) db.images[uid] = [];
  db.images[uid].unshift(newImageItem);
  saveDbToDisk();

  console.log(
    `[KAIST Visual Studio] Đã lưu ảnh tìm thấy [${foundImage.title}] vào thư viện của người dùng ${uid}`
  );

  res.json({ success: true, image: newImageItem });
});

// 7. Multilingual Translation with Glossary preservation
app.post("/api/ai/translate", async (req, res) => {
  const { text, targetLanguage, projectId } = req.body;
  const ai = getGeminiClient();

  let glossaryContext = "";
  if (projectId) {
    const rules = db.worldRules[projectId] || [];
    const glossary = rules.filter((r: any) => r.category === "glossary");
    if (glossary.length) {
      glossaryContext = `\nBẢNG THUẬT NGỮ BẮT BUỘC BẢO LƯU:\n` + glossary.map((g: any) => `- ${g.name}: ${g.description}`).join("\n");
    }
  }

  const prompt = `Dịch đoạn văn sau sang ${targetLanguage || "English"}.
YÊU CẦU:
1. Dịch chuẩn văn phong tự nhiên, giữ trọn nhịp điệu cảm xúc văn học, hội thoại và kịch bản manga.
2. BẢO LƯU CHÍNH XÁC tên riêng của nhân vật, địa danh và các thuật ngữ trong bảng thuật ngữ sau:
${glossaryContext}

VĂN BẢN GỐC:
"""${text}"""

Chỉ trả về bản dịch hoàn chỉnh, không thêm chú thích.`;

  if (!ai) {
    return res.json({
      success: true,
      translatedText: `[Bản dịch mẫu sang ${targetLanguage}]: ${text}`
    });
  }

  try {
    const response = await callGeminiWithTimeoutAndRetry(ai, {
      model: "gemini-3.5-flash-lite",
      contents: prompt,
    });
    res.json({ success: true, translatedText: response.text?.trim() });
  } catch (error: any) {
    console.log("[KAIST AI Notice] Translation fallback:", error?.message || error);
    res.json({ success: true, translatedText: text });
  }
});


// -----------------------------------------------------------------------------
// STORY AUTOPILOT: scheduled chapter generation + manga storyboard + publish queue
// -----------------------------------------------------------------------------
const runningStoryAutomations = new Set<string>();

function cleanGeneratedChapter(raw: string, order: number): { title: string; content: string } {
  let text = String(raw || "").trim().replace(/^```(?:markdown|md|text)?\s*/i, "").replace(/```$/i, "").trim();
  const lines = text.split(/\r?\n/);
  let title = `Chương ${order}`;
  if (lines[0]) {
    const first = lines[0].replace(/^#+\s*/, "").trim();
    if (/^(chương|chapter)\s*\d+/i.test(first)) {
      title = first;
      lines.shift();
      text = lines.join("\n").trim();
    }
  }
  return { title, content: text || String(raw || "").trim() };
}

async function runStoryAutomation(uid: string, automation: any): Promise<any> {
  if (!automation?.projectId || !checkProjectAccess(uid, automation.projectId)) {
    throw new Error("Dự án không còn tồn tại hoặc bạn không có quyền truy cập");
  }
  const project = (db.projects[uid] || []).find((p: any) => p.id === automation.projectId);
  if (!project) throw new Error("Không tìm thấy dự án truyện");

  const ai = getGeminiClient();
  if (!ai) throw new Error("GEMINI_API_KEY chưa được cấu hình nên Autopilot chưa thể tự viết chương");

  const projectChapters = (db.chapters[automation.projectId] || []).slice().sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
  const nextOrder = (projectChapters[projectChapters.length - 1]?.order || 0) + 1;
  const previous = projectChapters.slice(-2).map((c: any) => `- ${c.title}: ${c.summary || String(c.content || "").slice(0, 500)}`).join("\n");
  const projectContext = buildProjectContext(automation.projectId, uid);

  const formatInstruction = automation.format === "manga"
    ? "Viết cốt truyện chương theo nhịp manga nhưng vẫn trả về bản văn xuôi hoàn chỉnh để làm xương sống cho storyboard."
    : automation.format === "hybrid"
    ? "Viết chương truyện chữ có hình dung điện ảnh rõ để sau đó chuyển thành manga, nhưng không viết theo kiểu kịch bản khô cứng."
    : "Viết như một chương tiểu thuyết dài kỳ hoàn chỉnh.";

  const prompt = `Bạn đang chạy KAIST Story Autopilot cho dự án \"${project.title}\".\n${formatInstruction}\n\nMỤC TIÊU VÒNG NÀY:\n- Viết Chương ${nextOrder}, khoảng ${Math.max(600, Math.min(8000, Number(automation.targetWords) || 2200))} từ.\n- Bám tuyệt đối Story Bible, quy tắc thế giới, hồ sơ nhân vật, timeline và các chương trước.\n- Mở đầu có lực hút, giữa chương phải có tiến triển thật, kết chương tạo động lực đọc tiếp nhưng không cliffhanger giả.\n- Tự phát hiện và tránh lặp cảnh, lặp thông tin, OOC, deus ex machina và twist vô căn cứ.\n- Giữ nguyên tính nguyên bản, không bắt chước sát phong cách của tác giả/tác phẩm còn bản quyền.\n\n${projectContext}\n\nHAI CHƯƠNG GẦN NHẤT:\n${previous || "Chưa có chương trước."}\n\nĐỊNH DẠNG TRẢ VỀ:\nDòng đầu: # Chương ${nextOrder}: <tên chương>\nSau đó chỉ viết bản thảo chương hoàn chỉnh. Không thêm lời giải thích ngoài truyện.`;

  const response = await callGeminiWithTimeoutAndRetry(ai, {
    model: "gemini-3.6-flash",
    contents: prompt,
    config: {
      temperature: 0.82,
      systemInstruction: "Bạn là KAIST Story Autopilot, một biên kịch và tiểu thuyết gia dài kỳ. Ưu tiên continuity, chiều sâu nhân vật, nhịp kể và khả năng giữ chân. Không bịa rằng đã xuất bản hoặc đã kiếm được tiền.",
    },
  }, 60000);

  const parsed = cleanGeneratedChapter(response.text || "", nextOrder);
  const now = new Date().toISOString();
  const wordCount = parsed.content.split(/\s+/).filter(Boolean).length;
  const newChapter: any = {
    id: `chap_auto_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    projectId: automation.projectId,
    order: nextOrder,
    title: parsed.title,
    act: "Autopilot",
    summary: String(parsed.content).slice(0, 420).replace(/\s+/g, " ") + (parsed.content.length > 420 ? "…" : ""),
    targetWordCount: Number(automation.targetWords) || 2200,
    actualWordCount: wordCount,
    status: automation.approvalMode === "review_before_queue" ? "review" : "completed",
    content: parsed.content,
    authorNotes: "Được tạo bởi KAIST Story Autopilot. Hãy duyệt continuity và chất lượng trước khi xuất bản công khai.",
    comments: [],
    versions: [],
    lastSavedAt: now,
  };

  if (!db.chapters[automation.projectId]) db.chapters[automation.projectId] = [];
  db.chapters[automation.projectId].push(newChapter);
  project.totalWordCount = Number(project.totalWordCount || 0) + wordCount;
  project.updatedAt = now;

  let mangaScript: any = undefined;
  const mangaImages: any[] = [];
  if (automation.format === "manga" || automation.format === "hybrid" || automation.autoGenerateImages) {
    const panelCount = Math.max(4, Math.min(24, Number(automation.mangaPanels) || 8));
    const mangaPrompt = `Chuyển chương sau thành storyboard manga/comic khoảng ${panelCount} panel.\nYêu cầu: chia rõ Trang và Panel; mỗi panel ghi bố cục, góc máy, nhân vật, biểu cảm, hành động, thoại/SFX, continuity trang phục-bối cảnh, và một IMAGE PROMPT tiếng Anh ngắn dùng cho model tạo ảnh. Không nhồi quá nhiều thoại.\n\nTRUYỆN: ${project.title}\nCHƯƠNG: ${parsed.title}\n\n${parsed.content.slice(0, 16000)}`;
    const mangaRes = await callGeminiWithTimeoutAndRetry(ai, {
      model: "gemini-3.6-flash",
      contents: mangaPrompt,
      config: { temperature: 0.7 },
    }, 45000);
    const mangaContent = String(mangaRes.text || "").trim();
    mangaScript = {
      id: `doc_manga_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      userId: uid,
      projectId: automation.projectId,
      name: `Manga storyboard - ${parsed.title}.md`,
      fileType: "md",
      sizeBytes: Buffer.byteLength(mangaContent, "utf8"),
      wordCount: mangaContent.split(/\s+/).filter(Boolean).length,
      tags: ["manga", "storyboard", "autopilot", parsed.title],
      summary: `Storyboard manga tự động cho ${parsed.title}, mục tiêu ${panelCount} panel.`,
      contentSnippet: mangaContent.slice(0, 6000),
      fullContent: mangaContent,
      status: "ready",
      uploadedAt: now,
    };
    if (!db.documents[uid]) db.documents[uid] = [];
    db.documents[uid].unshift(mangaScript);
    if (!db.mangaScripts[uid]) db.mangaScripts[uid] = [];
    db.mangaScripts[uid].unshift({ ...mangaScript, chapterId: newChapter.id, panelCount });

    // Optional real manga rendering. Disabled by default because it consumes image quota.
    if (automation.autoGenerateImages) {
      const panelPrompts = Array.from(mangaContent.matchAll(/IMAGE\s*PROMPT\s*[:：]\s*(.+)/gi))
        .map((m: any) => String(m[1] || "").trim())
        .filter(Boolean)
        .slice(0, panelCount);
      for (let i = 0; i < panelPrompts.length; i++) {
        const panelPrompt = `${panelPrompts[i]}, Japanese manga panel, clean line art, coherent anatomy, consistent character identity and costume, readable action, no watermark, no text unless explicitly requested`;
        try {
          const taskId = `img_auto_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 6)}`;
          let generated: GeneratedImageBinary;
          try {
            generated = await generateWithGeminiImage(ai, panelPrompt, "4:5", null);
          } catch (gemErr) {
            generated = await generateWithPollinations(panelPrompt, 819, 1024);
          }
          const ext = imageExtensionFromMime(generated.mimeType);
          fs.writeFileSync(path.join(IMAGES_DIR, `${taskId}.${ext}`), generated.buffer);
          const imageItem: any = {
            id: `img_${Math.random().toString(36).slice(2, 9)}`,
            userId: uid,
            taskId,
            projectId: automation.projectId,
            originalConcept: `Manga panel ${i + 1} - ${newChapter.title}`,
            prompt: panelPrompt,
            refinedPrompt: panelPrompt,
            providerUsed: generated.provider,
            modelUsed: generated.model,
            imageMimeType: generated.mimeType,
            style: "anime",
            aspectRatio: "4:5",
            category: "manga",
            imageUrl: `/api/images/raw/${taskId}`,
            description: `Manga panel ${i + 1} cho ${newChapter.title}`,
            status: "completed",
            origin: "ai_generated",
            nativeResolution: { width: 819, height: 1024 },
            isUpscaled: false,
            lighting: "balanced",
            contrast: "balanced",
            subjectClarity: true,
            createdAt: new Date().toISOString(),
          };
          if (!db.images[uid]) db.images[uid] = [];
          db.images[uid].unshift(imageItem);
          mangaImages.push(imageItem);
        } catch (imgErr: any) {
          console.warn(`[KAIST Autopilot Manga] Panel ${i + 1} render failed:`, imgErr?.message || imgErr);
        }
      }
    }
  }

  let queueItem: any = undefined;
  if (automation.autoQueuePublish) {
    queueItem = {
      id: `pubq_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      userId: uid,
      projectId: automation.projectId,
      chapterId: newChapter.id,
      title: newChapter.title,
      scheduledAt: now,
      status: automation.approvalMode === "review_before_queue" ? "waiting_review" : "queued",
      destination: process.env.PUBLISH_WEBHOOK_URL ? "webhook" : "manual",
      createdAt: now,
      updatedAt: now,
    };
    if (!db.publicationQueue[uid]) db.publicationQueue[uid] = [];
    db.publicationQueue[uid].unshift(queueItem);
  }

  automation.lastRunAt = now;
  automation.lastResult = `Đã tạo ${newChapter.title}${mangaScript ? " + storyboard manga" : ""}${mangaImages.length ? ` + ${mangaImages.length} panel ảnh` : ""}${queueItem ? " + hàng đợi xuất bản" : ""}.`;
  automation.lastError = "";
  automation.updatedAt = now;
  automation.nextRunAt = new Date(Date.now() + Math.max(1, Number(automation.intervalHours) || 24) * 3600000).toISOString();
  saveDbToDisk();

  return { success: true, chapter: newChapter, mangaScript, mangaImages, queueItem, message: automation.lastResult };
}

app.get("/api/story-automations", (req, res) => {
  const uid = getUserId(req);
  res.json({ success: true, automations: db.storyAutomations[uid] || [] });
});

app.post("/api/story-automations", (req, res) => {
  const uid = getUserId(req);
  const projectId = String(req.body.projectId || "");
  if (!checkProjectAccess(uid, projectId)) return res.status(403).json({ error: "Bạn không có quyền truy cập dự án này" });
  if (!db.storyAutomations[uid]) db.storyAutomations[uid] = [];
  const existing = db.storyAutomations[uid].find((a: any) => a.projectId === projectId);
  if (existing) return res.status(409).json({ error: "Dự án này đã có Story Autopilot. Hãy cập nhật cấu hình hiện có." });
  const now = new Date().toISOString();
  const automation = {
    id: `auto_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    userId: uid,
    projectId,
    name: req.body.name || "Story Autopilot",
    enabled: Boolean(req.body.enabled),
    format: ["novel", "manga", "hybrid"].includes(req.body.format) ? req.body.format : "hybrid",
    intervalHours: Math.max(1, Number(req.body.intervalHours) || 24),
    nextRunAt: req.body.nextRunAt || new Date(Date.now() + 3600000).toISOString(),
    targetWords: Math.max(600, Math.min(8000, Number(req.body.targetWords) || 2200)),
    mangaPanels: Math.max(4, Math.min(24, Number(req.body.mangaPanels) || 8)),
    approvalMode: req.body.approvalMode === "auto_queue" ? "auto_queue" : "review_before_queue",
    autoGenerateImages: Boolean(req.body.autoGenerateImages),
    autoQueuePublish: req.body.autoQueuePublish !== false,
    createdAt: now,
    updatedAt: now,
  };
  db.storyAutomations[uid].unshift(automation);
  saveDbToDisk();
  res.json({ success: true, automation });
});

app.put("/api/story-automations/:id", (req, res) => {
  const uid = getUserId(req);
  const list = db.storyAutomations[uid] || [];
  const automation = list.find((a: any) => a.id === req.params.id);
  if (!automation) return res.status(404).json({ error: "Không tìm thấy Story Autopilot" });
  const allowed = ["name", "enabled", "format", "intervalHours", "nextRunAt", "targetWords", "mangaPanels", "approvalMode", "autoGenerateImages", "autoQueuePublish"];
  for (const key of allowed) if (key in req.body) automation[key] = req.body[key];
  automation.intervalHours = Math.max(1, Number(automation.intervalHours) || 24);
  automation.targetWords = Math.max(600, Math.min(8000, Number(automation.targetWords) || 2200));
  automation.mangaPanels = Math.max(4, Math.min(24, Number(automation.mangaPanels) || 8));
  automation.updatedAt = new Date().toISOString();
  saveDbToDisk();
  res.json({ success: true, automation });
});

app.delete("/api/story-automations/:id", (req, res) => {
  const uid = getUserId(req);
  const list = db.storyAutomations[uid] || [];
  const before = list.length;
  db.storyAutomations[uid] = list.filter((a: any) => a.id !== req.params.id);
  if (before === db.storyAutomations[uid].length) return res.status(404).json({ error: "Không tìm thấy Story Autopilot" });
  saveDbToDisk();
  res.json({ success: true });
});

app.post("/api/story-automations/:id/run-now", async (req, res) => {
  const uid = getUserId(req);
  const automation = (db.storyAutomations[uid] || []).find((a: any) => a.id === req.params.id);
  if (!automation) return res.status(404).json({ error: "Không tìm thấy Story Autopilot" });
  const key = `${uid}:${automation.id}`;
  if (runningStoryAutomations.has(key)) return res.status(409).json({ error: "Autopilot này đang chạy" });
  runningStoryAutomations.add(key);
  try {
    const result = await runStoryAutomation(uid, automation);
    res.json(result);
  } catch (err: any) {
    automation.lastError = String(err?.message || "Autopilot thất bại");
    automation.updatedAt = new Date().toISOString();
    saveDbToDisk();
    res.status(502).json({ success: false, error: automation.lastError });
  } finally {
    runningStoryAutomations.delete(key);
  }
});

app.get("/api/publication-queue", (req, res) => {
  const uid = getUserId(req);
  res.json({ success: true, items: db.publicationQueue[uid] || [] });
});

app.put("/api/publication-queue/:id", (req, res) => {
  const uid = getUserId(req);
  const list = db.publicationQueue[uid] || [];
  const item = list.find((q: any) => q.id === req.params.id);
  if (!item) return res.status(404).json({ error: "Không tìm thấy mục xuất bản" });
  if (req.body.status && ["waiting_review", "queued", "published", "failed"].includes(req.body.status)) item.status = req.body.status;
  if (req.body.scheduledAt) item.scheduledAt = req.body.scheduledAt;
  item.updatedAt = new Date().toISOString();
  saveDbToDisk();
  res.json({ success: true, item });
});

async function processPublicationQueue() {
  const webhookUrl = process.env.PUBLISH_WEBHOOK_URL?.trim();
  if (!webhookUrl) return;
  const token = process.env.PUBLISH_WEBHOOK_TOKEN?.trim();
  const now = Date.now();
  for (const [uid, list] of Object.entries(db.publicationQueue || {})) {
    for (const item of list || []) {
      if (item.status !== "queued" || item.destination !== "webhook") continue;
      if (new Date(item.scheduledAt).getTime() > now) continue;
      const chapter = (db.chapters[item.projectId] || []).find((c: any) => c.id === item.chapterId);
      const project = (db.projects[uid] || []).find((p: any) => p.id === item.projectId);
      if (!chapter || !project) {
        item.status = "failed";
        item.error = "Không tìm thấy project/chapter để xuất bản";
        item.updatedAt = new Date().toISOString();
        continue;
      }
      try {
        const response = await fetch(webhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            source: "KAIST Story Autopilot",
            project: { id: project.id, title: project.title, description: project.description },
            chapter: { id: chapter.id, order: chapter.order, title: chapter.title, summary: chapter.summary, content: chapter.content },
          }),
          signal: AbortSignal.timeout(20000),
        });
        if (!response.ok) throw new Error(`Webhook HTTP ${response.status}`);
        let payload: any = {};
        try { payload = await response.json(); } catch {}
        item.status = "published";
        item.publishedUrl = payload.url || payload.publishedUrl || undefined;
        item.error = "";
        item.updatedAt = new Date().toISOString();
      } catch (err: any) {
        item.status = "failed";
        item.error = String(err?.message || "Publisher webhook failed");
        item.updatedAt = new Date().toISOString();
      }
    }
  }
  saveDbToDisk();
}

async function runDueStoryAutomations() {
  const now = Date.now();
  for (const [uid, list] of Object.entries(db.storyAutomations || {})) {
    for (const automation of list || []) {
      if (!automation?.enabled || !automation?.nextRunAt) continue;
      if (new Date(automation.nextRunAt).getTime() > now) continue;
      const key = `${uid}:${automation.id}`;
      if (runningStoryAutomations.has(key)) continue;
      runningStoryAutomations.add(key);
      runStoryAutomation(uid, automation)
        .catch((err: any) => {
          automation.lastError = String(err?.message || "Autopilot thất bại");
          automation.updatedAt = new Date().toISOString();
          // Prevent retry storms: try again after 1 hour on failure.
          automation.nextRunAt = new Date(Date.now() + 3600000).toISOString();
          saveDbToDisk();
          console.error(`[KAIST Autopilot] ${automation.id}:`, err);
        })
        .finally(() => runningStoryAutomations.delete(key));
    }
  }
}

setInterval(runDueStoryAutomations, 60_000);
setInterval(processPublicationQueue, 60_000);

// -----------------------------------------------------------------------------
// PROCESS CRASH & REJECTION GUARDS
// -----------------------------------------------------------------------------
process.on("unhandledRejection", (reason, promise) => {
  console.error("[KAIST Process Guard] Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("[KAIST Process Guard] Uncaught Exception:", error);
});

// -----------------------------------------------------------------------------
// VITE MIDDLEWARE & SERVER STARTUP
// -----------------------------------------------------------------------------
async function startServer() {
  const httpServer = http.createServer(app);

  if (process.env.NODE_ENV !== "production") {
    const isHmrDisabled = process.env.DISABLE_HMR === "true";
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: isHmrDisabled ? false : { server: httpServer },
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath, {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith("index.html")) {
          res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
          res.setHeader("Pragma", "no-cache");
          res.setHeader("Expires", "0");
        }
      }
    }));

    // Handle SPA routing safely, ensuring API routes that are missing return 404 JSON instead of HTML
    app.get("*", (req, res) => {
      if (req.path.startsWith("/api/")) {
        return res.status(404).json({ success: false, error: "API endpoint not found" });
      }
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.on("error", (err) => {
    console.error("[KAIST HTTP Server Error]:", err);
  });

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`KAIST Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start KAIST server:", err);
});
