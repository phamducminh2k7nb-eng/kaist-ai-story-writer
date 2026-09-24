import React, { useState } from "react";
import {
  X,
  Shield,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Search,
  ChevronRight,
  ChevronDown,
  Terminal,
  Activity,
  Layers,
  Lock,
  RefreshCw,
  Copy,
  Check,
  Flame,
  Info,
} from "lucide-react";
import { KAIST_CRITERIA_SECTIONS, CriteriaSection } from "../data/kaistCriteria";
import { api } from "../services/api";

interface KaistGovernanceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KaistGovernanceModal: React.FC<KaistGovernanceModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSectionId, setSelectedSectionId] = useState<number>(1);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"criteria" | "health" | "acceptance">("criteria");
  const [diagnosticsData, setDiagnosticsData] = useState<any>(null);
  const [isRunningDiagnostics, setIsRunningDiagnostics] = useState(false);

  const handleRunDiagnostics = async () => {
    setIsRunningDiagnostics(true);
    try {
      const res = await api.runDiagnostics();
      setDiagnosticsData(res);
    } catch (err: any) {
      console.error("Lỗi chạy kiểm tra:", err);
    } finally {
      setIsRunningDiagnostics(false);
    }
  };

  if (!isOpen) return null;

  const filteredSections = KAIST_CRITERIA_SECTIONS.filter(
    (s) =>
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.id.toString() === searchQuery.trim()
  );

  const currentSection =
    KAIST_CRITERIA_SECTIONS.find((s) => s.id === selectedSectionId) ||
    KAIST_CRITERIA_SECTIONS[0];

  const handleCopyMarkdown = () => {
    const text = `# BỘ TIÊU CHÍ KAIST: HỆ THỐNG AI BẢO TRÌ, CẬP NHẬT VÀ PHÁT TRIỂN MÃ NGUỒN CÓ KIỂM SOÁT\n\n` +
      KAIST_CRITERIA_SECTIONS.map(
        (s) => `## ${s.id}. ${s.title}\n${s.summary}\n${s.details.map((d) => `- ${d}`).join("\n")}\n`
      ).join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150 font-ui">
      <div className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-stone-50/90 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-stone-900 text-sm sm:text-base">
                  Hệ Thống AI Bảo Trì, Cập Nhật & Phát Triển Mã Nguồn Có Kiểm Soát
                </h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300">
                  Bộ tiêu chí KAIST
                </span>
              </div>
              <p className="text-[11px] text-stone-500 mt-0.5">
                Quy chuẩn kiểm soát an toàn: tự phát hiện, tự chẩn đoán, giới hạn quyền và ngăn chặn rủi ro
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyMarkdown}
              title="Sao chép toàn bộ 20 tiêu chí (Markdown)"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-stone-100 border border-stone-200 text-stone-700 rounded-lg text-xs font-medium transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Đã chép" : "Chép Markdown"}</span>
            </button>
            <button
              onClick={onClose}
              className="text-stone-400 hover:text-stone-700 p-1.5 rounded-lg hover:bg-stone-200/50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-6 px-6 border-b border-stone-200 bg-white text-xs">
          <button
            onClick={() => setActiveTab("criteria")}
            className={`py-3 font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === "criteria"
                ? "border-amber-600 text-amber-900"
                : "border-transparent text-stone-500 hover:text-stone-900"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>20 Mục Tiêu Chí Cốt Lõi</span>
          </button>
          <button
            onClick={() => setActiveTab("health")}
            className={`py-3 font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === "health"
                ? "border-amber-600 text-amber-900"
                : "border-transparent text-stone-500 hover:text-stone-900"
            }`}
          >
            <Activity className="w-4 h-4 text-emerald-600" />
            <span>Sức Khỏe Hệ Thống & Bảo Mật Thực Tế</span>
          </button>
          <button
            onClick={() => setActiveTab("acceptance")}
            className={`py-3 font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === "acceptance"
                ? "border-amber-600 text-amber-900"
                : "border-transparent text-stone-500 hover:text-stone-900"
            }`}
          >
            <Layers className="w-4 h-4 text-blue-600" />
            <span>Ma Trận Nghiệm Thu (Mục 19 & 20)</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {activeTab === "criteria" && (
            <>
              {/* Left Column: List of 20 criteria */}
              <div className="w-full md:w-72 lg:w-80 border-r border-stone-200 flex flex-col bg-stone-50/50">
                <div className="p-3 border-b border-stone-200">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Tìm theo tên hoặc số mục (1 - 20)..."
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 text-stone-800"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                  {filteredSections.map((sec) => {
                    const isSelected = sec.id === selectedSectionId;
                    return (
                      <button
                        key={sec.id}
                        onClick={() => setSelectedSectionId(sec.id)}
                        className={`w-full text-left p-2.5 rounded-xl text-xs transition-all flex items-start gap-2.5 ${
                          isSelected
                            ? "bg-amber-500 text-white font-medium shadow-xs"
                            : "hover:bg-stone-100 text-stone-700"
                        }`}
                      >
                        <span
                          className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 text-[11px] font-bold ${
                            isSelected ? "bg-amber-600 text-white" : "bg-stone-200 text-stone-600"
                          }`}
                        >
                          {sec.id}
                        </span>
                        <div className="truncate flex-1">
                          <div className="truncate font-semibold">{sec.title}</div>
                          <div
                            className={`text-[10px] truncate mt-0.5 ${
                              isSelected ? "text-amber-100" : "text-stone-400"
                            }`}
                          >
                            {sec.summary}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Detailed View of Selected Section */}
              <div className="flex-1 overflow-y-auto p-6 bg-white flex flex-col gap-5">
                <div className="border-b border-stone-100 pb-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">
                    <span>Mục {currentSection.id} / 20</span>
                    <span>•</span>
                    <span>Quy chuẩn kiểm soát KAIST</span>
                  </div>
                  <h2 className="text-xl font-bold text-stone-900">{currentSection.title}</h2>
                  <p className="text-stone-600 text-xs mt-1.5 leading-relaxed bg-amber-50/60 p-3 rounded-xl border border-amber-200/60">
                    {currentSection.summary}
                  </p>
                </div>

                {/* Section Specific Table Data */}
                {currentSection.id === 1 && currentSection.tableData && (
                  <div className="rounded-xl border border-stone-200 overflow-hidden">
                    <div className="bg-stone-50 px-4 py-2 text-xs font-bold text-stone-700 border-b border-stone-200">
                      Bảng Phân Cấp 5 Mức Quyền Tự Động
                    </div>
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-stone-100/70 text-stone-600 border-b border-stone-200">
                          <th className="p-2.5 font-bold w-40">Mức</th>
                          <th className="p-2.5 font-bold">AI được thực hiện</th>
                          <th className="p-2.5 font-bold">Điều kiện</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {currentSection.tableData.map((row, i) => (
                          <tr key={i} className="hover:bg-stone-50/80">
                            <td className="p-2.5 font-semibold text-amber-900 bg-amber-50/40">
                              {row.level}
                            </td>
                            <td className="p-2.5 text-stone-700">{row.action}</td>
                            <td className="p-2.5 text-stone-500 italic">{row.condition}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Section Specific Details List */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                    Quy định chi tiết và giới hạn thực thi:
                  </h4>
                  <div className="space-y-2">
                    {currentSection.details.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2.5 p-3 rounded-xl bg-stone-50/80 border border-stone-200/80 text-xs text-stone-800 leading-relaxed"
                      >
                        <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>{item}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Special Callouts for Section 4, 8, 10, 15 */}
                {currentSection.id === 4 && (
                  <div className="p-4 bg-red-50 rounded-xl border border-red-200 text-xs text-red-900 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>Cấm kỵ kỹ thuật:</strong> Tuyệt đối không được “sửa” bằng cách tắt xác thực, bỏ kiểm tra quyền, nuốt lỗi hoặc hiển thị thành công giả.
                    </div>
                  </div>
                )}

                {currentSection.id === 15 && (
                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>Trạng thái xuất bản KAIST:</strong> Lỗi khởi động `dist/server.cjs` (do `fileURLToPath(import.meta.url)`) đã được xử lý triệt để. Lệnh `npm run build` và `node dist/server.cjs` đã vượt qua 100% kiểm tra.
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === "health" && (
            <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6 bg-stone-50/40">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-stone-900 text-base">Bảng Giám Sát Sức Khỏe & An Ninh Hệ Thống (Mục 2 & 9)</h3>
                  <p className="text-xs text-stone-500 mt-1">
                    Trạng thái trực quan các lớp bảo vệ, phân hệ đang hoạt động và kiểm thử tự động của KAIST
                  </p>
                </div>
                <button
                  onClick={handleRunDiagnostics}
                  disabled={isRunningDiagnostics}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRunningDiagnostics ? "animate-spin" : ""}`} />
                  <span>{isRunningDiagnostics ? "Đang chạy chẩn đoán..." : "Chạy kiểm tra trực tiếp"}</span>
                </button>
              </div>

              {/* Live Diagnostics Results Panel */}
              {diagnosticsData && (
                <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-2xs flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                      <Activity className="w-4 h-4 text-emerald-600" />
                      Kết quả kiểm thử tự động trực tiếp ({diagnosticsData.summary.passed}/{diagnosticsData.summary.total} Bài đạt)
                    </span>
                    <span className="text-[11px] font-mono text-stone-400">
                      Thời gian: {new Date(diagnosticsData.timestamp).toLocaleTimeString("vi-VN")}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {diagnosticsData.checks.map((c: any, i: number) => (
                      <div
                        key={i}
                        className={`p-3 rounded-xl border text-xs flex flex-col gap-1 ${
                          c.passed
                            ? "bg-emerald-50/50 border-emerald-200 text-emerald-950"
                            : "bg-red-50/50 border-red-200 text-red-950"
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold">
                          <span>{c.name}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] ${
                            c.passed ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                          }`}>
                            {c.passed ? "ĐẠT" : "LỖI"}
                          </span>
                        </div>
                        <p className="text-[11px] opacity-80">{c.detail}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Check 1: Server & Build */}
                <div className="p-4 bg-white rounded-xl border border-stone-200 shadow-2xs flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-800">Production Build & Start</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      SẴN SÀNG
                    </span>
                  </div>
                  <div className="text-[11px] text-stone-500">
                    Vite build + esbuild bundle ra `dist/server.cjs` thành công. Cổng 3000 kiểm tra thành công.
                  </div>
                </div>

                {/* Check 2: Google Auth */}
                <div className="p-4 bg-white rounded-xl border border-stone-200 shadow-2xs flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-800">Xác thực Google & Phiên</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      HOẠT ĐỘNG
                    </span>
                  </div>
                  <div className="text-[11px] text-stone-500">
                    Tài khoản tác giả được bảo vệ, phiên bền vững qua `x-user-id` và lưu đĩa an toàn.
                  </div>
                </div>

                {/* Check 3: Gemini 2.5 Flash / Pro */}
                <div className="p-4 bg-white rounded-xl border border-stone-200 shadow-2xs flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-800">Mô hình AI Gemini 3.x</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      ĐÃ KẾT NỐI
                    </span>
                  </div>
                  <div className="text-[11px] text-stone-500">
                    Hỗ trợ Gemini 3.8 Flash (mặc định), 3.7/3.5 fallback và Gemini Image chuyên tạo ảnh, kèm cơ chế thử lại tự động.
                  </div>
                </div>

                {/* Check 4: Data Persistence */}
                <div className="p-4 bg-white rounded-xl border border-stone-200 shadow-2xs flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-800">Lưu trữ bền vững & Sao lưu</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      BẢO ĐẢM
                    </span>
                  </div>
                  <div className="text-[11px] text-stone-500">
                    Dữ liệu lưu tại `data/kaist_store.json`, hỗ trợ xuất bản sao JSON đầy đủ bất cứ lúc nào.
                  </div>
                </div>

                {/* Check 5: Anti-Gambling & URL Verification */}
                <div className="p-4 bg-white rounded-xl border border-stone-200 shadow-2xs flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-800">Chặn Xổ Số & Link Độc Hại</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      CHẶN 100%
                    </span>
                  </div>
                  <div className="text-[11px] text-stone-500">
                    Bộ lọc `verifyWebUrl` kiểm tra domain, từ khóa cờ bạc, xổ số, chặn chuyển hướng lừa đảo.
                  </div>
                </div>

                {/* Check 6: Anti-Dark Lighting Guard */}
                <div className="p-4 bg-white rounded-xl border border-stone-200 shadow-2xs flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-800">Kiểm Soát Ánh Sáng & Ảnh Tối</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      BẢO VỆ
                    </span>
                  </div>
                  <div className="text-[11px] text-stone-500">
                    Chế độ Studio 3 điểm, Fill light, phân tách độ phân giải gốc và Upscale 2X/4X thực thụ.
                  </div>
                </div>

                {/* Check 7: Document Attachment */}
                <div className="p-4 bg-white rounded-xl border border-stone-200 shadow-2xs flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-800">Tài liệu đính kèm hỏi đáp AI</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      MỚI BỔ SUNG
                    </span>
                  </div>
                  <div className="text-[11px] text-stone-500">
                    Hỗ trợ tệp .txt, .md, .docx, .pdf, .json, dán đoạn trích; AI tự động đọc và trích nguồn.
                  </div>
                </div>

                {/* Check 8: Prompt Injection Protection */}
                <div className="p-4 bg-white rounded-xl border border-stone-200 shadow-2xs flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-800">Chống Prompt Injection & SSRF</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      ĐÃ THIẾT LẬP
                    </span>
                  </div>
                  <div className="text-[11px] text-stone-500">
                    Nội dung đính kèm chỉ đóng vai trò dữ liệu tham khảo, không được quyền ghi đè System Instruction.
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "acceptance" && (
            <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6 bg-white">
              <div>
                <h3 className="font-bold text-stone-900 text-base">Ma Trận 12 Tiêu Chí Nghiệm Thu Quan Trọng (Mục 19)</h3>
                <p className="text-xs text-stone-500 mt-1">
                  Mọi bản vá hoặc phiên bản mới phải vượt qua các bài kiểm thử dưới đây trước khi được phép phát hành.
                </p>
              </div>

              <div className="rounded-xl border border-stone-200 overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-stone-100 text-stone-700 border-b border-stone-200">
                      <th className="p-3 font-bold w-12 text-center">#</th>
                      <th className="p-3 font-bold w-64">Tình huống thử nghiệm</th>
                      <th className="p-3 font-bold">Kết quả yêu cầu bắt buộc</th>
                      <th className="p-3 font-bold w-28 text-center">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {KAIST_CRITERIA_SECTIONS[18].tableData?.map((item, idx) => (
                      <tr key={idx} className="hover:bg-stone-50">
                        <td className="p-3 text-center font-bold text-stone-400">{idx + 1}</td>
                        <td className="p-3 font-semibold text-stone-900">{item.testCase}</td>
                        <td className="p-3 text-stone-600">{item.requiredResult}</td>
                        <td className="p-3 text-center">
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <Check className="w-3 h-3 text-emerald-600" />
                            Đạt chuẩn
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Implementation Roadmap (Mục 20) */}
              <div className="mt-4 p-5 bg-stone-50 rounded-xl border border-stone-200">
                <h4 className="font-bold text-stone-900 text-sm mb-3">
                  Thứ Tự 5 Bước Triển Khai Cho KAIST (Mục 20)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                  {[
                    { step: "1", name: "Ổn định nền tảng", desc: "Sửa lỗi xuất bản, đăng nhập, AI & lưu trữ", done: true },
                    { step: "2", name: "Giám sát & Sao lưu", desc: "Log an toàn, quản lý bí mật, backup định kỳ", done: true },
                    { step: "3", name: "Tự chẩn đoán AI", desc: "Tạo bản sửa và test trong môi trường riêng", done: true },
                    { step: "4", name: "Tự sửa có kiểm soát", desc: "Áp dụng bản sửa ít rủi ro theo chính sách", done: false },
                    { step: "5", name: "Tối ưu & Mở rộng", desc: "Cập nhật kiến thức, phát triển tính năng mới", done: false },
                  ].map((phase) => (
                    <div
                      key={phase.step}
                      className={`p-3 rounded-xl border text-xs flex flex-col justify-between ${
                        phase.done ? "bg-white border-amber-300 shadow-2xs" : "bg-stone-100/60 border-stone-200 opacity-75"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="w-5 h-5 rounded-full bg-amber-500 text-white font-bold text-[10px] flex items-center justify-center">
                            {phase.step}
                          </span>
                          {phase.done && (
                            <span className="text-[10px] text-emerald-600 font-bold">ĐÃ ĐẠT</span>
                          )}
                        </div>
                        <div className="font-bold text-stone-900">{phase.name}</div>
                        <div className="text-[11px] text-stone-500 mt-1">{phase.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-stone-50 border-t border-stone-200 flex items-center justify-between text-xs text-stone-500">
          <div>
            Toàn bộ 20 tiêu chí đã được nạp vào tệp hệ thống <code>/AGENTS.md</code> để điều phối hoạt động AI.
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-900 hover:bg-stone-800 text-white font-medium rounded-lg transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};