import React, { useState } from "react";
import {
  Brain,
  Search,
  CheckCircle,
  AlertTriangle,
  Lock,
  Unlock,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Plus,
  Trash2,
} from "lucide-react";
import { ProjectMemoryItem, ControlledKnowledgeResearch, StoryProject, MemoryCategory } from "../types";
import { api } from "../services/api";

interface MemoryViewProps {
  project: StoryProject;
  memories: ProjectMemoryItem[];
  onMemoriesUpdated: (mems: ProjectMemoryItem[]) => void;
}

export const MemoryView: React.FC<MemoryViewProps> = ({
  project,
  memories,
  onMemoriesUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<"memories" | "research">("memories");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<MemoryCategory | "all">("all");

  // Research State
  const [researchQuery, setResearchQuery] = useState("");
  const [researchDomain, setResearchDomain] = useState("Lịch sử, vũ khí cổ phong");
  const [isResearching, setIsResearching] = useState(false);
  const [researchResult, setResearchResult] = useState<ControlledKnowledgeResearch | null>(null);

  const handleRunResearch = async () => {
    if (!researchQuery.trim() || isResearching) return;
    setIsResearching(true);
    try {
      const data = await api.researchKnowledge({
        query: researchQuery,
        domain: researchDomain,
        projectId: project.id,
      });
      setResearchResult(data);
    } catch (err: any) {
      alert(err.message || "Lỗi nghiên cứu tư liệu");
    } finally {
      setIsResearching(false);
    }
  };

  const handleSaveResearchToMemory = async () => {
    if (!researchResult) return;
    try {
      const newMemory = await api.createMemory(project.id, {
        topic: researchResult.query,
        type: "reference",
        content: researchResult.extractedFacts?.join("\n• ") || "",
        source: researchResult.sourceTitle || "Nghiên cứu có kiểm chứng",
        confidence: 0.95,
        status: "verified",
      });
      onMemoriesUpdated([newMemory, ...memories]);
      alert("Đã lưu phát hiện nghiên cứu vào Bộ nhớ dự án thành công!");
    } catch (err: any) {
      alert(err.message || "Lỗi lưu bộ nhớ");
    }
  };

  const handleToggleLock = async (mem: ProjectMemoryItem) => {
    const nextStatus = mem.status === "locked" ? "verified" : "locked";
    try {
      const updated = await api.updateMemory(project.id, mem.id, { status: nextStatus });
      onMemoriesUpdated(memories.map((m) => (m.id === updated.id ? updated : m)));
    } catch (err: any) {
      alert(err.message || "Lỗi cập nhật");
    }
  };

  const handleDeleteMemory = async (id: string) => {
    if (!confirm("Xóa mục bộ nhớ này?")) return;
    await api.deleteMemory(project.id, id);
    onMemoriesUpdated(memories.filter((m) => m.id !== id));
  };

  const filteredMemories = memories.filter((m) => {
    const matchSearch =
      m.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchType = filterType === "all" || m.type === filterType;
    return matchSearch && matchType;
  });

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col bg-stone-50/50 font-ui overflow-hidden">
      {/* Top Bar */}
      <div className="px-6 py-4 bg-white border-b border-stone-200 flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-stone-900">
              Bộ Nhớ Dự Án & Nghiên Cứu Có Kiểm Chứng
            </h2>
            <p className="text-xs text-stone-500">
              Ngăn chặn tuyệt đối hiện tượng ảo giác (hallucination), kiểm tra mâu thuẫn trước khi nạp vào AI
            </p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center bg-stone-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("memories")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "memories"
                ? "bg-white text-stone-900 shadow-2xs"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            Mục Bộ Nhớ ({memories.length})
          </button>
          <button
            onClick={() => setActiveTab("research")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
              activeTab === "research"
                ? "bg-white text-purple-700 shadow-2xs"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Nghiên cứu tài liệu
          </button>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 overflow-y-auto p-6 max-w-6xl mx-auto w-full">
        {activeTab === "research" ? (
          <div className="flex flex-col gap-6">
            {/* Controlled Knowledge Research Form */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-2xs flex flex-col gap-4">
              <div className="flex items-center gap-2 text-sm font-bold text-stone-900">
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                Quy Trình Nghiên Cứu Kiểm Chứng Độc Lập
              </div>
              <p className="text-xs text-stone-500 -mt-2 leading-relaxed">
                Khi cần bối cảnh lịch sử, cấu tạo binh khí, độc dược hay vật lý thần bí, KAIST sẽ trích xuất sự kiện, đánh dấu độ tin cậy và phân tích mâu thuẫn tiềm ẩn trước khi bạn quyết định kết nạp.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Chủ đề / Câu hỏi nghiên cứu:
                  </label>
                  <input
                    type="text"
                    value={researchQuery}
                    onChange={(e) => setResearchQuery(e.target.value)}
                    placeholder="Ví dụ: Kỹ thuật rèn thép Damascus thời trung cổ và sự khác biệt với thép gập Nhật Bản..."
                    className="w-full text-xs p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">Lĩnh vực:</label>
                  <input
                    type="text"
                    value={researchDomain}
                    onChange={(e) => setResearchDomain(e.target.value)}
                    className="w-full text-xs p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  disabled={isResearching || !researchQuery.trim()}
                  onClick={handleRunResearch}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  {isResearching ? (
                    <>
                      <span className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      <span>Đang thu thập & kiểm chứng dữ kiện...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-3.5 h-3.5" />
                      <span>Bắt đầu nghiên cứu có kiểm chứng</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Research Results */}
            {researchResult && (
              <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-md flex flex-col gap-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                  <div>
                    <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
                      Kết quả kiểm chứng
                    </span>
                    <h3 className="font-extrabold text-stone-900 text-base mt-1">
                      {researchResult.query}
                    </h3>
                  </div>
                  <button
                    onClick={handleSaveResearchToMemory}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Lưu vào Bộ nhớ cốt lõi
                  </button>
                </div>

                {/* Facts Extracted */}
                <div className="p-4 bg-stone-50 rounded-xl border border-stone-150">
                  <div className="text-xs font-bold text-stone-900 mb-2">Các dữ kiện đã xác minh:</div>
                  <ul className="list-disc list-inside text-xs text-stone-700 space-y-1.5">
                    {researchResult.extractedFacts?.map((fact: string, i: number) => (
                      <li key={i}>{fact}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Memories List */
          <div className="flex flex-col gap-4">
            {/* Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-stone-200">
              <div className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-stone-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm trong trí nhớ..."
                  className="text-xs text-stone-800 bg-transparent focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-1 text-xs">
                {(["all", "project", "chapter", "reference", "personal"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setFilterType(t)}
                    className={`px-2.5 py-1 rounded-lg capitalize ${
                      filterType === t
                        ? "bg-purple-100 text-purple-800 font-bold"
                        : "text-stone-600 hover:bg-stone-100"
                    }`}
                  >
                    {t === "all" ? "Tất cả" : t}
                  </button>
                ))}
              </div>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredMemories.map((mem) => {
                const isLocked = mem.status === "locked";
                return (
                  <div
                    key={mem.id}
                    className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs flex flex-col justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                            {mem.type}
                          </span>
                          <h4 className="font-bold text-stone-900 text-sm mt-1.5">{mem.topic}</h4>
                        </div>
                        <button
                          onClick={() => handleToggleLock(mem)}
                          className={`p-1.5 rounded-lg border ${
                            isLocked
                              ? "bg-stone-800 text-white border-stone-800"
                              : "bg-white text-stone-400 border-stone-200 hover:text-stone-700"
                          }`}
                          title={isLocked ? "Đã khóa bất biến" : "Chưa khóa"}
                        >
                          {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      <p className="text-xs text-stone-600 mt-2 leading-relaxed bg-stone-50 p-3 rounded-xl border border-stone-100 whitespace-pre-wrap">
                        {mem.content}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400">
                      <span>Độ tin cậy: {((mem.confidence || 0.9) * 100).toFixed(0)}%</span>
                      <button
                        onClick={() => handleDeleteMemory(mem.id)}
                        className="text-stone-300 hover:text-red-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};