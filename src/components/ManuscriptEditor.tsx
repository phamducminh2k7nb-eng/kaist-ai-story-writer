import React, { useState, useEffect, useRef } from "react";
import {
  PenTool,
  Save,
  Sparkles,
  Lock,
  Unlock,
  History,
  CheckCircle,
  AlertTriangle,
  FileCheck,
  ChevronRight,
  Plus,
  ArrowRight,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  RotateCcw,
  BookOpen,
  MessageSquare,
  HelpCircle,
  Clock,
  Eye,
  Settings2,
  Mic,
  Sliders,
  Send,
  X,
} from "lucide-react";
import { StoryProject, Chapter, LiteraryIssue, ChapterVersion } from "../types";
import { api } from "../services/api";

interface ManuscriptEditorProps {
  project: StoryProject;
  chapters: Chapter[];
  currentChapter: Chapter | null;
  onSelectChapter: (chap: Chapter) => void;
  onChapterCreated: (newChap: Chapter) => void;
  onChapterUpdated: (updatedChap: Chapter) => void;
  onOpenVoiceModal: () => void;
}

export const ManuscriptEditor: React.FC<ManuscriptEditorProps> = ({
  project,
  chapters,
  currentChapter,
  onSelectChapter,
  onChapterCreated,
  onChapterUpdated,
  onOpenVoiceModal,
}) => {
  const [content, setContent] = useState(currentChapter?.content || "");
  const [authorNotes, setAuthorNotes] = useState(currentChapter?.authorNotes || "");
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const [fontSize, setFontSize] = useState<"sm" | "base" | "lg" | "xl">("base");
  const [fontFamily, setFontFamily] = useState<"manuscript" | "ui">("manuscript");
  const [focusMode, setFocusMode] = useState(false);
  const [selectedText, setSelectedText] = useState("");

  // AI Assist State
  const [aiAction, setAiAction] = useState<"write_next" | "expand" | "condense" | "rewrite" | "dialogue_polish">("write_next");
  const [customInstruction, setCustomInstruction] = useState("");
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [proposedText, setProposedText] = useState<string | null>(null);

  // Literary Quality Inspector
  const [isInspecting, setIsInspecting] = useState(false);
  const [issues, setIssues] = useState<LiteraryIssue[]>([]);
  const [activeTab, setActiveTab] = useState<"assistant" | "inspector" | "versions" | "notes">("assistant");

  const saveTimeoutRef = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (currentChapter) {
      setContent(currentChapter.content || "");
      setAuthorNotes(currentChapter.authorNotes || "");
      setSaveStatus("saved");
      setProposedText(null);
      setIssues([]);
    }
  }, [currentChapter?.id]);

  // Auto-save: 1-3 seconds after stop typing
  const handleContentChange = (newVal: string) => {
    setContent(newVal);
    setSaveStatus("unsaved");

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(async () => {
      if (!currentChapter) return;
      setSaveStatus("saving");
      try {
        const updated = await api.updateChapter(project.id, currentChapter.id, {
          content: newVal,
          authorNotes,
        });
        onChapterUpdated(updated);
        setSaveStatus("saved");
      } catch (err: any) {
        console.error("Auto-save failed:", err);
        setSaveStatus("unsaved");
      }
    }, 1800);
  };

  const handleManualSave = async () => {
    if (!currentChapter) return;
    setSaveStatus("saving");
    try {
      const updated = await api.updateChapter(project.id, currentChapter.id, {
        content,
        authorNotes,
      });
      onChapterUpdated(updated);
      setSaveStatus("saved");
    } catch (err: any) {
      alert(err.message || "Không thể lưu chương");
      setSaveStatus("unsaved");
    }
  };

  const handleToggleLock = async () => {
    if (!currentChapter) return;
    const newStatus = currentChapter.status === "locked" ? "drafting" : "locked";
    try {
      const updated = await api.updateChapter(project.id, currentChapter.id, {
        status: newStatus,
        unlockFirst: currentChapter.status === "locked",
      });
      onChapterUpdated(updated);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateChapter = async () => {
    const num = chapters.length + 1;
    const newChap = await api.createChapter(project.id, {
      title: `Chương ${num}: Tiêu đề mới`,
      act: "Hồi I: Khởi Nguyên",
      targetWordCount: 3000,
      content: "",
      summary: "Tóm tắt sự kiện chương...",
    });
    onChapterCreated(newChap);
  };

  // AI Assist Execute
  const handleRunAiAssist = async () => {
    if (!currentChapter || isAiGenerating) return;
    setIsAiGenerating(true);
    setProposedText(null);

    try {
      const result = await api.assistWriting({
        action: aiAction,
        selectedText: selectedText || undefined,
        surroundingText: content,
        instruction: customInstruction,
        projectId: project.id,
        chapterId: currentChapter.id,
      });
      setProposedText(result);
    } catch (err: any) {
      alert(err.message || "Lỗi tạo nội dung từ AI");
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleAcceptProposal = () => {
    if (!proposedText) return;
    let newContent = content;
    if (selectedText && aiAction !== "write_next") {
      newContent = content.replace(selectedText, proposedText);
    } else {
      newContent = (content + "\n\n" + proposedText).trim();
    }
    handleContentChange(newContent);
    setProposedText(null);
    setSelectedText("");
  };

  // Run Literary Inspector
  const handleRunInspector = async () => {
    if (!currentChapter || isInspecting) return;
    setIsInspecting(true);
    try {
      const foundIssues = await api.inspectLiterary({
        text: content,
        projectId: project.id,
        chapterId: currentChapter.id,
      });
      setIssues(foundIssues);
      setActiveTab("inspector");
    } catch (err) {
      console.error(err);
    } finally {
      setIsInspecting(false);
    }
  };

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const readingTimeMins = Math.max(1, Math.round(wordCount / 220));

  if (!currentChapter) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-stone-500 font-ui">
        <BookOpen className="w-12 h-12 text-stone-300 mb-3" />
        <h3 className="text-base font-semibold text-stone-800">Chưa chọn chương nào để viết</h3>
        <p className="text-xs text-stone-400 mt-1 max-w-sm">
          Chọn một chương từ danh sách bên trái hoặc tạo chương mới để bắt đầu bản thảo.
        </p>
        <button
          onClick={handleCreateChapter}
          className="mt-4 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Tạo Chương 1 ngay
        </button>
      </div>
    );
  }

  const isLocked = currentChapter.status === "locked";

  return (
    <div className={`h-[calc(100vh-3.5rem)] flex font-ui bg-stone-100 overflow-hidden ${focusMode ? "fixed inset-0 z-50 bg-stone-900" : ""}`}>
      {/* Left Column: Chapter tree navigation */}
      {!focusMode && (
        <div className="w-64 border-r border-stone-200 bg-white flex flex-col shrink-0 hidden md:flex">
          <div className="p-3 border-b border-stone-200 flex items-center justify-between">
            <span className="text-xs font-bold text-stone-900 uppercase tracking-wider">
              Các chương ({chapters.length})
            </span>
            <button
              onClick={handleCreateChapter}
              className="p-1.5 rounded-lg bg-stone-100 hover:bg-amber-100 text-stone-700 hover:text-amber-800 text-xs flex items-center gap-1 transition-colors"
              title="Thêm chương mới"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Chương</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
            {chapters.map((chap) => {
              const isSelected = chap.id === currentChapter.id;
              return (
                <button
                  key={chap.id}
                  onClick={() => onSelectChapter(chap)}
                  className={`w-full text-left p-2.5 rounded-xl text-xs transition-all flex items-start justify-between group ${
                    isSelected
                      ? "bg-amber-50 text-amber-950 font-semibold border border-amber-300 shadow-2xs"
                      : "text-stone-700 hover:bg-stone-50 border border-transparent"
                  }`}
                >
                  <div className="truncate flex-1 pr-2">
                    <div className="flex items-center gap-1.5 truncate">
                      {chap.status === "locked" && <Lock className="w-3 h-3 text-stone-400 shrink-0" />}
                      <span className="truncate">{chap.title}</span>
                    </div>
                    <div className="text-[10px] text-stone-400 font-mono mt-0.5">
                      {chap.actualWordCount || 0} / {chap.targetWordCount || 3000} từ
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Middle Column: The Manuscript Writing Canvas */}
      <div className={`flex-1 flex flex-col h-full overflow-hidden transition-all ${focusMode ? "bg-[#faf8f5] max-w-4xl mx-auto shadow-2xl my-4 rounded-2xl" : "bg-white"}`}>
        {/* Editor Topbar */}
        <div className="px-4 py-2 border-b border-stone-200 flex flex-wrap items-center justify-between gap-3 text-xs bg-stone-50/70">
          <div className="flex items-center gap-3">
            <h2 className="font-bold text-stone-900 text-sm truncate max-w-xs sm:max-w-md">
              {currentChapter.title}
            </h2>

            {/* Lock Chapter Toggle */}
            <button
              onClick={handleToggleLock}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border transition-colors ${
                isLocked
                  ? "bg-stone-200 text-stone-800 border-stone-300"
                  : "bg-white text-stone-600 border-stone-200 hover:text-stone-900"
              }`}
              title={isLocked ? "Chương đã chốt (Bấm để mở khóa)" : "Khóa chương để tránh AI ghi đè"}
            >
              {isLocked ? <Lock className="w-3 h-3 text-stone-600" /> : <Unlock className="w-3 h-3 text-stone-400" />}
              <span>{isLocked ? "Đã khóa" : "Chưa khóa"}</span>
            </button>
          </div>

          {/* Right Stats & Controls */}
          <div className="flex items-center gap-3">
            {/* Auto-save status */}
            <div className="flex items-center gap-1.5 text-[11px]">
              {saveStatus === "saving" && (
                <span className="text-amber-600 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  Đang lưu...
                </span>
              )}
              {saveStatus === "saved" && (
                <span className="text-stone-400 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-emerald-500" />
                  Đã lưu
                </span>
              )}
              {saveStatus === "unsaved" && (
                <span className="text-amber-700 font-medium">Chưa lưu</span>
              )}
            </div>

            {/* Word Count */}
            <div className="text-stone-500 font-mono text-[11px]">
              <strong>{wordCount.toLocaleString()}</strong> từ (~{readingTimeMins} phút đọc)
            </div>

            {/* Typography Controls */}
            <div className="flex items-center gap-1 bg-stone-200/60 p-0.5 rounded-lg text-stone-600">
              <button
                onClick={() => setFontFamily(fontFamily === "manuscript" ? "ui" : "manuscript")}
                className="px-1.5 py-0.5 text-[10px] rounded hover:bg-white font-medium"
                title="Đổi font: Có chân (Serif) / Không chân (Sans)"
              >
                {fontFamily === "manuscript" ? "Serif" : "Sans"}
              </button>
              <button
                onClick={() => setFontSize(fontSize === "sm" ? "base" : fontSize === "base" ? "lg" : fontSize === "lg" ? "xl" : "sm")}
                className="px-1.5 py-0.5 text-[10px] rounded hover:bg-white font-bold"
                title="Đổi cỡ chữ"
              >
                {fontSize.toUpperCase()}
              </button>
            </div>

            {/* Focus Mode Toggle */}
            <button
              onClick={() => setFocusMode(!focusMode)}
              className="p-1 text-stone-500 hover:text-stone-900 rounded hover:bg-stone-200/60 transition-colors"
              title={focusMode ? "Thoát chế độ tập trung" : "Chế độ tập trung toàn màn hình"}
            >
              {focusMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Manual Save Button */}
            <button
              onClick={handleManualSave}
              className="px-2.5 py-1 bg-stone-800 hover:bg-stone-900 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-2xs"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Lưu</span>
            </button>
          </div>
        </div>

        {/* Writing Paper Area */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-12 flex justify-center bg-[#faf9f6]">
          <div className="w-full max-w-3xl flex flex-col">
            {isLocked && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center justify-between">
                <span>Chương này đã được khóa. Để viết hoặc sửa, bạn hãy bấm vào nút "Đã khóa" ở góc trên.</span>
              </div>
            )}

            <textarea
              ref={textareaRef}
              disabled={isLocked}
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              onSelect={(e) => {
                const target = e.target as HTMLTextAreaElement;
                const sel = target.value.substring(target.selectionStart, target.selectionEnd);
                setSelectedText(sel);
              }}
              placeholder="Bắt đầu gõ câu chuyện của bạn tại đây... KAIST sẽ tự động lưu sau mỗi nhịp gõ."
              className={`w-full flex-1 min-h-[500px] bg-transparent border-0 focus:outline-none resize-none leading-relaxed text-stone-900 placeholder-stone-400 ${
                fontFamily === "manuscript" ? "font-manuscript" : "font-ui"
              } ${
                fontSize === "sm"
                  ? "text-sm leading-6"
                  : fontSize === "base"
                  ? "text-base leading-7"
                  : fontSize === "lg"
                  ? "text-lg leading-8"
                  : "text-xl leading-9"
              }`}
            />
          </div>
        </div>
      </div>

      {/* Right Column: AI Co-Writer & Literary Quality Inspector */}
      {!focusMode && (
        <div className="w-80 border-l border-stone-200 bg-white flex flex-col shrink-0 hidden lg:flex">
          {/* Tabs */}
          <div className="flex border-b border-stone-200 text-xs">
            <button
              onClick={() => setActiveTab("assistant")}
              className={`flex-1 py-2.5 font-semibold text-center border-b-2 transition-colors ${
                activeTab === "assistant"
                  ? "border-amber-500 text-amber-700 bg-amber-50/50"
                  : "border-transparent text-stone-500 hover:text-stone-900"
              }`}
            >
              AI Đồng Hành
            </button>
            <button
              onClick={() => setActiveTab("inspector")}
              className={`flex-1 py-2.5 font-semibold text-center border-b-2 transition-colors relative ${
                activeTab === "inspector"
                  ? "border-amber-500 text-amber-700 bg-amber-50/50"
                  : "border-transparent text-stone-500 hover:text-stone-900"
              }`}
            >
              Biên Tập Văn Học
              {issues.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-red-500 text-white font-bold">
                  {issues.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("notes")}
              className={`flex-1 py-2.5 font-semibold text-center border-b-2 transition-colors ${
                activeTab === "notes"
                  ? "border-amber-500 text-amber-700 bg-amber-50/50"
                  : "border-transparent text-stone-500 hover:text-stone-900"
              }`}
            >
              Ghi Chú
            </button>
          </div>

          {/* Tab 1: AI Assistant */}
          {activeTab === "assistant" && (
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
              <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200/60 text-xs text-amber-900">
                <div className="font-bold flex items-center gap-1.5 mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  Quy trình viết an toàn
                </div>
                <p className="text-[11px] leading-relaxed text-amber-800">
                  AI chỉ đề xuất bản thảo. Bạn xem lại trong bảng so sánh (diff) và tự quyết định chấp nhận hay từ chối.
                </p>
              </div>

              {/* Action selection */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-stone-700">Tác vụ bạn muốn:</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: "write_next", label: "Viết tiếp mạch truyện" },
                    { id: "expand", label: "Mở rộng chi tiết" },
                    { id: "condense", label: "Rút gọn nhịp nhanh" },
                    { id: "rewrite", label: "Viết lại đoạn chọn" },
                    { id: "dialogue_polish", label: "Trau chuốt hội thoại" },
                  ].map((act) => (
                    <button
                      key={act.id}
                      onClick={() => setAiAction(act.id as any)}
                      className={`p-2 rounded-lg text-xs text-left border transition-all ${
                        aiAction === act.id
                          ? "bg-amber-500 text-white font-medium border-amber-600 shadow-2xs"
                          : "bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200"
                      }`}
                    >
                      {act.label}
                    </button>
                  ))}
                </div>
              </div>

              {selectedText && (
                <div className="p-2.5 bg-stone-50 rounded-lg border border-stone-200 text-xs">
                  <div className="font-semibold text-stone-600 mb-1">Đoạn đang chọn ({selectedText.length} ký tự):</div>
                  <div className="text-stone-500 italic line-clamp-3">"{selectedText}"</div>
                </div>
              )}

              {/* Custom instruction */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-stone-700">Chỉ dẫn bổ sung cho AI:</label>
                  <button
                    onClick={onOpenVoiceModal}
                    title="Nói chỉ dẫn bằng giọng nói"
                    className="text-stone-400 hover:text-amber-600"
                  >
                    <Mic className="w-3.5 h-3.5" />
                  </button>
                </div>
                <textarea
                  rows={2}
                  value={customInstruction}
                  onChange={(e) => setCustomInstruction(e.target.value)}
                  placeholder="Ví dụ: Thêm chi tiết mùi hương hoa quỳnh, nhịp văn chậm lại, Lam Tiêu cảm thấy bất an..."
                  className="w-full text-xs p-2.5 bg-white border border-stone-200 rounded-lg text-stone-800 placeholder-stone-400 focus:ring-1 focus:ring-amber-500 focus:outline-none resize-none"
                />
              </div>

              {/* Run Action */}
              <button
                disabled={isAiGenerating || isLocked}
                onClick={handleRunAiAssist}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all"
              >
                {isAiGenerating ? (
                  <>
                    <span className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    <span>KAIST đang chắp bút...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Thực hiện tác vụ viết</span>
                  </>
                )}
              </button>

              {/* Proposed Text Diff / Comparison */}
              {proposedText && (
                <div className="mt-2 p-3 bg-white border-2 border-amber-400 rounded-xl shadow-md flex flex-col gap-2 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between text-xs font-bold text-amber-900 border-b border-amber-100 pb-2">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      Bản nháp AI đề xuất:
                    </span>
                    <button onClick={() => setProposedText(null)} className="text-stone-400 hover:text-stone-700">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-xs text-stone-800 leading-relaxed font-manuscript max-h-60 overflow-y-auto whitespace-pre-wrap p-2 bg-amber-50/40 rounded-lg">
                    {proposedText}
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={handleAcceptProposal}
                      className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center justify-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Chấp nhận & Chèn
                    </button>
                    <button
                      onClick={() => setProposedText(null)}
                      className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-medium"
                    >
                      Từ chối
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Literary Quality Inspector */}
          {activeTab === "inspector" && (
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-800">Soát lỗi & Phản biện văn học</span>
                <button
                  disabled={isInspecting}
                  onClick={handleRunInspector}
                  className="px-3 py-1 bg-stone-800 hover:bg-stone-900 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
                >
                  <FileCheck className="w-3.5 h-3.5" />
                  {isInspecting ? "Đang quét..." : "Quét lỗi"}
                </button>
              </div>

              {issues.length === 0 ? (
                <div className="text-center py-8 text-stone-400 text-xs">
                  Chưa phát hiện mâu thuẫn hay lỗi văn học nào. Bấm "Quét lỗi" để kiểm tra tính nhất quán với hồ sơ nhân vật & quy tắc truyện.
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {issues.map((iss) => (
                    <div
                      key={iss.id}
                      className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex flex-col gap-1.5 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            iss.severity === "high"
                              ? "bg-red-100 text-red-800"
                              : iss.severity === "medium"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {iss.type === "fact_contradiction"
                            ? "Mâu thuẫn dữ kiện"
                            : iss.type === "voice_consistency"
                            ? "Giọng nhân vật"
                            : "Văn phong / Lặp từ"}
                        </span>
                      </div>
                      <div className="font-semibold text-stone-800">
                        Đoạn: <span className="italic text-stone-600 font-normal">"{iss.excerpt}"</span>
                      </div>
                      <div className="text-stone-600 text-[11px]">{iss.reason}</div>
                      {iss.suggestedFix && (
                        <div className="p-2 bg-white rounded-md border border-stone-200 text-emerald-800 font-medium text-[11px]">
                          Gợi ý sửa: {iss.suggestedFix}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Author Notes */}
          {activeTab === "notes" && (
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              <div className="text-xs font-bold text-stone-800">
                Ghi chú của tác giả (Tách riêng khỏi bản xuất bản):
              </div>
              <textarea
                rows={12}
                value={authorNotes}
                onChange={(e) => {
                  setAuthorNotes(e.target.value);
                  handleContentChange(content);
                }}
                placeholder="Ghi chú ý đồ tác giả, manh mối cần giải đáp sau này, hoặc lời dặn dò riêng..."
                className="w-full text-xs p-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none font-ui"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};