import React from "react";
import {
  BookOpen,
  PenTool,
  Sparkles,
  Flame,
  Clock,
  ArrowRight,
  Plus,
  Compass,
  Image as ImageIcon,
  Send,
  CheckCircle2,
  Layers,
  ChevronRight,
} from "lucide-react";
import { StoryProject, UserProfile, Chapter } from "../types";

interface DashboardViewProps {
  user: UserProfile | null;
  projects: StoryProject[];
  activeProject: StoryProject | null;
  recentChapters: Chapter[];
  onSelectProject: (p: StoryProject) => void;
  onNavigate: (view: any) => void;
  onCreateNewProject: () => void;
  onContinueWriting: (chap: Chapter) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  projects,
  activeProject,
  recentChapters,
  onSelectProject,
  onNavigate,
  onCreateNewProject,
  onContinueWriting,
}) => {
  const currentWords = user?.totalWordsWritten || 42800;
  const dailyGoal = user?.dailyGoalWords || 1500;
  const todayWritten = 940; // demo today progress
  const progressPercent = Math.min(100, Math.round((todayWritten / dailyGoal) * 100));

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto flex flex-col gap-6 font-ui overflow-y-auto w-full">
      {/* Welcome Banner */}
      <div className="bg-[#121215] border border-zinc-800/90 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/15 via-transparent to-transparent pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Không gian sáng tác thông minh KAIST</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-100">
              Chào mừng trở lại, {user?.name?.split(" ")[0] || "Tác giả"}!
            </h1>
            <p className="text-zinc-400 text-sm mt-1.5 max-w-xl leading-relaxed">
              KAIST tập trung vào một việc: giúp bạn viết truyện dài nhất quán, tạo minh họa cần thiết và chuẩn bị để xuất bản.
            </p>

            {/* Quick action buttons */}
            <div className="flex flex-wrap items-center gap-3 mt-5">
              {recentChapters.length > 0 && (
                <button
                  onClick={() => onContinueWriting(recentChapters[0])}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-sm shadow-indigo-500/20 transition-transform active:scale-95 cursor-pointer"
                >
                  <PenTool className="w-4 h-4" />
                  <span>Tiếp tục viết: {recentChapters[0].title}</span>
                </button>
              )}
              <button
                onClick={() => onNavigate("chat")}
                className="px-4 py-2 bg-zinc-800/80 hover:bg-zinc-700/80 border border-zinc-700/60 text-zinc-200 text-xs font-medium rounded-xl flex items-center gap-1.5 backdrop-blur-xs transition-colors cursor-pointer"
              >
                <span>Hỏi đáp cùng Trợ lý AI</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onNavigate("publish")}
                className="px-4 py-2 bg-zinc-800/80 hover:bg-zinc-700/80 border border-zinc-700/60 text-zinc-200 text-xs font-medium rounded-xl flex items-center gap-1.5 backdrop-blur-xs transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5 text-indigo-400" />
                <span>Xuất bản truyện</span>
              </button>
            </div>
          </div>

          {/* Daily Sprint Card */}
          <div className="bg-zinc-900/80 backdrop-blur-md rounded-xl p-4 border border-zinc-800 flex flex-col justify-between min-w-[240px]">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span className="font-medium flex items-center gap-1.5 text-zinc-300">
                <Flame className="w-4 h-4 text-amber-400" />
                Mục tiêu hôm nay
              </span>
              <span className="font-bold text-zinc-100">{todayWritten} / {dailyGoal} từ</span>
            </div>

            <div className="w-full bg-zinc-800 rounded-full h-2 mt-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="mt-3 flex items-center justify-between text-[11px] text-zinc-400">
              <span>Tiến độ: {progressPercent}%</span>
              <span className="text-indigo-400 font-medium">Streak 7 ngày liên tiếp</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Projects and Quick Access */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Projects Overview */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Dự án truyện đang tiến hành ({projects.length})
            </h2>
            <button
              onClick={onCreateNewProject}
              className="px-3 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-xl border border-indigo-200 dark:border-indigo-800/60 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Tạo truyện mới
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((proj) => {
              const isActive = activeProject?.id === proj.id;
              const target = proj.targetWordCount || 80000;
              const current = proj.totalWordCount || 0;
              const pct = Math.min(100, Math.round((current / target) * 100));

              return (
                <div
                  key={proj.id}
                  onClick={() => onSelectProject(proj)}
                  className={`bg-white dark:bg-[#121215] rounded-xl p-4 border transition-all cursor-pointer hover:shadow-md flex flex-col justify-between group ${
                    isActive
                      ? "border-indigo-500 ring-1 ring-indigo-500/50"
                      : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-semibold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60">
                          {proj.primaryGenre}
                        </span>
                        <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm mt-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {proj.title}
                        </h3>
                      </div>
                      {isActive && (
                        <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800/60">
                          Đang mở
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 line-clamp-2 leading-relaxed">
                      {proj.description || "Chưa có mô tả chi tiết cho tác phẩm."}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400">
                      <span>Đã viết: <strong className="text-zinc-900 dark:text-zinc-200">{current.toLocaleString()}</strong> từ</span>
                      <span className="text-zinc-400 dark:text-zinc-500">Mục tiêu: {target.toLocaleString()} từ</span>
                    </div>
                    <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-600 dark:bg-indigo-500 h-full rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-zinc-400 dark:text-zinc-500 pt-1">
                      <span>Ngôi kể: {proj.pointOfView === "first" ? "Ngôi 1 (Tôi)" : "Ngôi 3"}</span>
                      <span className="font-medium text-zinc-600 dark:text-zinc-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                        Vào viết bản thảo <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Recent Chapters */}
          <div className="mt-2 bg-white dark:bg-[#121215] rounded-xl p-4 border border-zinc-200 dark:border-zinc-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-zinc-400" />
              Các chương gần đây
            </h3>
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
              {recentChapters.map((ch) => (
                <div
                  key={ch.id}
                  onClick={() => onContinueWriting(ch)}
                  className="py-2.5 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/40 px-2 rounded-lg transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center font-bold text-xs">
                      {ch.order}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">{ch.title}</div>
                      <div className="text-[11px] text-zinc-400 line-clamp-1">{ch.summary || "Đang soạn thảo"}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                      {ch.actualWordCount || 0} từ
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        ch.status === "locked"
                          ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                          : ch.status === "completed"
                          ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300"
                          : "bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300"
                      }`}
                    >
                      {ch.status === "locked" ? "Đã khóa" : ch.status === "completed" ? "Hoàn thành" : "Đang viết"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Sidebar widgets & Core Studio Shortcuts */}
        <div className="flex flex-col gap-4">
          {/* Studio Functional Quicklinks */}
          <div className="bg-white dark:bg-[#121215] rounded-xl p-4 border border-zinc-200 dark:border-zinc-800 flex flex-col gap-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              Công cụ sáng tác chuyên sâu
            </h3>

            <button
              onClick={() => onNavigate("characters")}
              className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 hover:bg-zinc-100 dark:hover:bg-zinc-800/70 text-left transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Hồ sơ & Giới hạn nhân vật</div>
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400">Kiểm soát bí mật & kiến thức nhân vật</div>
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
            </button>

            <button
              onClick={() => onNavigate("world")}
              className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 hover:bg-zinc-100 dark:hover:bg-zinc-800/70 text-left transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 flex items-center justify-center">
                  <Compass className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Quy tắc thế giới & Dàn ý</div>
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400">Quy tắc phép thuật, thuật ngữ, dòng thời gian</div>
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
            </button>

            <button
              onClick={() => onNavigate("visual")}
              className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 hover:bg-zinc-100 dark:hover:bg-zinc-800/70 text-left transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5"><div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center"><ImageIcon className="w-4 h-4" /></div><div><div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Bìa & minh họa truyện</div><div className="text-[11px] text-zinc-500 dark:text-zinc-400">Bìa sách, nhân vật, cảnh truyện, manga</div></div></div><ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
            </button>

            <button
              onClick={() => onNavigate("publish")}
              className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 hover:bg-zinc-100 dark:hover:bg-zinc-800/70 text-left transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5"><div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center"><Send className="w-4 h-4" /></div><div><div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Xuất bản & Thu nhập</div><div className="text-[11px] text-zinc-500 dark:text-zinc-400">Chuẩn bị metadata, lịch đăng và gói bản thảo</div></div></div><ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
            </button>
          </div>
          <div className="bg-white dark:bg-[#121215] rounded-xl p-4 border border-zinc-200 dark:border-zinc-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">Quy trình gọn</h3>
            <div className="space-y-2 text-xs text-zinc-600 dark:text-zinc-400">
              <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/40">1. AI lên dàn ý & viết chương</div>
              <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/40">2. Kiểm tra nhân vật & logic thế giới</div>
              <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/40">3. Tạo bìa / minh họa khi cần</div>
              <button onClick={() => onNavigate("publish")} className="w-full p-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-left">4. Chuẩn bị xuất bản & đăng truyện →</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
