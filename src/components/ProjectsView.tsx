import React, { useState } from "react";
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  Download,
  Copy,
  Lock,
  Unlock,
  CheckCircle,
  FileText,
  Clock,
  Sparkles,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import { StoryProject, Chapter, ProjectRule } from "../types";
import { api } from "../services/api";

interface ProjectsViewProps {
  projects: StoryProject[];
  activeProject: StoryProject | null;
  chapters: Chapter[];
  onSelectProject: (p: StoryProject) => void;
  onProjectsUpdated: (projs: StoryProject[]) => void;
  onOpenEditor: (chap: Chapter) => void;
  onChaptersUpdated: (chaps: Chapter[]) => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  projects,
  activeProject,
  chapters,
  onSelectProject,
  onProjectsUpdated,
  onOpenEditor,
  onChaptersUpdated,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProject, setNewProject] = useState<Partial<StoryProject>>({
    title: "",
    description: "",
    primaryGenre: "Huyền Huyễn",
    targetAudience: "Độc giả trẻ 18-35",
    pointOfView: "third_limited",
    tone: "Trầm hùng, triết lý",
    targetWordCount: 80000,
    rules: [
      { id: "r1", rule: "Xung đột tư tưởng rõ ràng", type: "must_have", status: "active" },
      { id: "r2", rule: "Phép thuật có giới hạn và giá phải trả", type: "must_have", status: "active" },
      { id: "r3", rule: "Tình tiết deus ex machina", type: "forbidden", status: "active" },
      { id: "r4", rule: "Hồi sinh nhân vật vô lý", type: "forbidden", status: "active" },
    ],
  });

  const handleCreateProject = async () => {
    if (!newProject.title?.trim()) return;
    try {
      const created = await api.createProject(newProject);
      onProjectsUpdated([created, ...projects]);
      onSelectProject(created);
      setShowCreateModal(false);
      setNewProject({
        title: "",
        description: "",
        primaryGenre: "Huyền Huyễn",
        targetAudience: "Độc giả 18-35",
        pointOfView: "third_limited",
        tone: "Trầm hùng",
        targetWordCount: 80000,
        rules: [],
      });
    } catch (err: any) {
      alert(err.message || "Lỗi tạo dự án");
    }
  };

  const handleExportMarkdown = () => {
    if (!activeProject) return;
    let md = `# ${activeProject.title}\n\n`;
    md += `*Thể loại:* ${activeProject.primaryGenre}\n`;
    md += `*Mô tả:* ${activeProject.description}\n\n`;
    md += `---\n\n`;

    chapters.forEach((c) => {
      md += `## ${c.title}\n\n`;
      md += `${c.content || "(Chưa có nội dung)"}\n\n`;
      md += `* * *\n\n`;
    });

    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeProject.title.replace(/\s+/g, "_")}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCreateChapter = async () => {
    if (!activeProject) return;
    const num = chapters.length + 1;
    const newChap = await api.createChapter(activeProject.id, {
      title: `Chương ${num}: Tiêu đề mới`,
      targetWordCount: 3000,
      content: "",
      status: "drafting",
    });
    onChaptersUpdated([...chapters, newChap]);
  };

  const mustHaveRules = (activeProject?.rules || []).filter((r) => r.type === "must_have");
  const forbiddenRules = (activeProject?.rules || []).filter((r) => r.type === "forbidden");

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col bg-stone-50/50 font-ui overflow-hidden">
      {/* Top Bar */}
      <div className="px-6 py-4 bg-white border-b border-stone-200 flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-stone-900">Quản Lý Dự Án Truyện & Chương</h2>
            <p className="text-xs text-stone-500">
              Kiểm soát cấu trúc hồi chương, quy tắc phong cách bắt buộc và xuất bản tác phẩm
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeProject && (
            <button
              onClick={handleExportMarkdown}
              className="px-3.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Xuất Markdown / Word
            </button>
          )}
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Tạo dự án mới
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 overflow-y-auto p-6 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Projects list */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider text-stone-500">
            Tất cả tác phẩm ({projects.length})
          </h3>
          <div className="flex flex-col gap-2">
            {projects.map((p) => {
              const isActive = activeProject?.id === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => onSelectProject(p)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isActive
                      ? "bg-white border-amber-500 ring-2 ring-amber-500/20 shadow-sm"
                      : "bg-white border-stone-200 hover:border-stone-300"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        {p.primaryGenre}
                      </span>
                      <h4 className="font-bold text-stone-900 text-sm mt-1">{p.title}</h4>
                    </div>
                    {isActive && (
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        Đang chọn
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-500 mt-2 line-clamp-2 leading-relaxed">
                    {p.description}
                  </p>
                  <div className="mt-3 pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400">
                    <span>Mục tiêu: {p.targetWordCount?.toLocaleString()} từ</span>
                    <span className="capitalize">
                      {p.pointOfView === "first" ? "Ngôi 1" : "Ngôi 3"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Active Project Details & Chapters */}
        {activeProject ? (
          <div className="lg:col-span-8 flex flex-col gap-5">
            {/* Project Overview Card */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-2xs flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-extrabold text-stone-900">{activeProject.title}</h3>
                  <p className="text-xs text-stone-600 mt-1 leading-relaxed max-w-2xl">
                    {activeProject.description}
                  </p>
                </div>
              </div>

              {/* Tags & Settings */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2 border-t border-stone-100">
                <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-150">
                  <span className="text-stone-400 block text-[10px]">Thể loại</span>
                  <strong className="text-stone-800">{activeProject.primaryGenre}</strong>
                </div>
                <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-150">
                  <span className="text-stone-400 block text-[10px]">Ngôi kể</span>
                  <strong className="text-stone-800">
                    {activeProject.pointOfView === "first" ? "Ngôi 1 (Tôi)" : "Ngôi 3 (Khách quan)"}
                  </strong>
                </div>
                <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-150">
                  <span className="text-stone-400 block text-[10px]">Âm hưởng / Tone</span>
                  <strong className="text-stone-800">{activeProject.tone}</strong>
                </div>
                <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-150">
                  <span className="text-stone-400 block text-[10px]">Tiến độ từ</span>
                  <strong className="text-stone-800">
                    {(activeProject.totalWordCount || 0).toLocaleString()} / {activeProject.targetWordCount?.toLocaleString()}
                  </strong>
                </div>
              </div>

              {/* Mandatory Project Rules */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200 text-xs">
                  <div className="font-bold text-emerald-900 mb-1.5 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    Yếu tố bắt buộc phải có (Must-have):
                  </div>
                  <ul className="list-disc list-inside text-stone-700 space-y-1">
                    {mustHaveRules.length > 0 ? (
                      mustHaveRules.map((m) => <li key={m.id}>{m.rule}</li>)
                    ) : (
                      <li>Chưa thiết lập</li>
                    )}
                  </ul>
                </div>

                <div className="p-3.5 bg-red-50/60 rounded-xl border border-red-200 text-xs">
                  <div className="font-bold text-red-900 mb-1.5 flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                    Điều cấm kỵ / Cần tránh (Forbidden):
                  </div>
                  <ul className="list-disc list-inside text-stone-700 space-y-1">
                    {forbiddenRules.length > 0 ? (
                      forbiddenRules.map((f) => <li key={f.id}>{f.rule}</li>)
                    ) : (
                      <li>Chưa thiết lập</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>

            {/* Chapter Management Card */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-2xs flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-stone-900 text-sm">
                    Danh Sách Các Chương ({chapters.length})
                  </h4>
                  <p className="text-xs text-stone-500">
                    Bấm vào từng chương để mở trình biên tập bản thảo chuyên nghiệp
                  </p>
                </div>
                <button
                  onClick={handleCreateChapter}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Thêm chương
                </button>
              </div>

              <div className="divide-y divide-stone-100">
                {chapters.map((chap) => (
                  <div
                    key={chap.id}
                    className="py-3 flex items-center justify-between hover:bg-stone-50 px-2 rounded-xl transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-stone-100 text-stone-700 flex items-center justify-center font-bold text-xs">
                        {chap.order}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-stone-900 group-hover:text-amber-600 transition-colors">
                          {chap.title}
                        </div>
                        <div className="text-[11px] text-stone-400 mt-0.5">
                          {chap.summary || "Chưa có tóm tắt sự kiện"}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs text-stone-500 font-mono">
                        {chap.actualWordCount || 0} từ
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          chap.status === "locked"
                            ? "bg-stone-200 text-stone-700"
                            : chap.status === "completed"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {chap.status === "locked" ? "Đã khóa" : chap.status === "completed" ? "Hoàn thành" : "Bản thảo"}
                      </span>
                      <button
                        onClick={() => onOpenEditor(chap)}
                        className="px-3 py-1 bg-stone-100 hover:bg-amber-500 hover:text-white rounded-lg text-xs font-semibold transition-colors"
                      >
                        Mở viết
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-8 flex items-center justify-center p-12 text-stone-400 text-xs">
            Chọn một dự án để xem chi tiết
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl border border-stone-200 flex flex-col gap-4 text-xs font-ui">
            <h3 className="font-extrabold text-stone-900 text-sm">Tạo Dự Án Tiểu Thuyết Mới</h3>

            <div>
              <label className="font-semibold text-stone-700 block mb-1">Tên tác phẩm:</label>
              <input
                type="text"
                value={newProject.title}
                onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                placeholder="Ví dụ: Vạn Cổ Trường Sinh Kiếm..."
                className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-stone-700 block mb-1">Thể loại chính:</label>
                <input
                  type="text"
                  value={newProject.primaryGenre}
                  onChange={(e) => setNewProject({ ...newProject, primaryGenre: e.target.value })}
                  placeholder="Huyền Huyễn, Tiên Hiệp, Trinh Thám..."
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-900"
                />
              </div>
              <div>
                <label className="font-semibold text-stone-700 block mb-1">Ngôi kể:</label>
                <select
                  value={newProject.pointOfView}
                  onChange={(e) => setNewProject({ ...newProject, pointOfView: e.target.value as any })}
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-900"
                >
                  <option value="third_limited">Ngôi 3 (Toàn tri / Hạn tri)</option>
                  <option value="first">Ngôi 1 (Tôi)</option>
                  <option value="second">Ngôi 2</option>
                </select>
              </div>
            </div>

            <div>
              <label className="font-semibold text-stone-700 block mb-1">Mô tả tác phẩm:</label>
              <textarea
                rows={3}
                value={newProject.description}
                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                placeholder="Tóm tắt tiền đề cốt truyện, bối cảnh thời không, động lực của nhân vật..."
                className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-900 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-stone-700 block mb-1">Âm hưởng (Tone):</label>
                <input
                  type="text"
                  value={newProject.tone}
                  onChange={(e) => setNewProject({ ...newProject, tone: e.target.value })}
                  placeholder="Trầm buồn, Hùng tráng, Hài hước..."
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-900"
                />
              </div>
              <div>
                <label className="font-semibold text-stone-700 block mb-1">Mục tiêu số từ:</label>
                <input
                  type="number"
                  value={newProject.targetWordCount}
                  onChange={(e) => setNewProject({ ...newProject, targetWordCount: Number(e.target.value) })}
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-900"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-stone-600 hover:text-stone-900"
              >
                Hủy
              </button>
              <button
                onClick={handleCreateProject}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg shadow-xs"
              >
                Tạo dự án
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};