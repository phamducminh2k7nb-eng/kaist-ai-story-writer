import React, { useState } from "react";
import { BookOpen, ChevronDown, Menu, Mic, Moon, Settings, Sparkles, Sun, LogOut, CheckCircle2 } from "lucide-react";
import { StoryProject, UserProfile, ThemePreference } from "../types";

export type { ThemePreference };

interface HeaderProps {
  user: UserProfile | null;
  projects: StoryProject[];
  activeProject: StoryProject | null;
  onSelectProject: (proj: StoryProject) => void;
  onOpenVoiceModal: () => void;
  onOpenSettings: () => void;
  onOpenGovernance: () => void;
  theme: "light" | "dark";
  themeMode?: ThemePreference;
  onToggleTheme: (newTheme: ThemePreference) => void;
  onLogout: () => void;
  onOpenMobileNav?: () => void;
  onToggleSidebar?: () => void;
  isNavHidden?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  user, projects, activeProject, onSelectProject, onOpenVoiceModal,
  onOpenSettings, themeMode = "light", onToggleTheme, onLogout,
  onOpenMobileNav, onToggleSidebar, isNavHidden = false,
}) => {
  const [showProjectMenu, setShowProjectMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const nextTheme: ThemePreference = themeMode === "light" ? "dark" : "light";

  return (
    <header className="h-14 border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-[#121215]/95 backdrop-blur-md px-3 flex items-center justify-between sticky top-0 z-30 select-none">
      <div className="flex items-center gap-2.5 min-w-0">
        <button onClick={() => window.innerWidth < 768 ? onOpenMobileNav?.() : onToggleSidebar?.()} className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800" title={isNavHidden ? "Mở menu" : "Thu gọn menu"}><Menu className="w-5 h-5" /></button>
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center"><Sparkles className="w-3.5 h-3.5" /></div>
          <span className="font-extrabold text-sm text-zinc-900 dark:text-white">KAIST <span className="text-indigo-600 dark:text-indigo-400">Story</span></span>
        </div>
        <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800 hidden sm:block" />
        <div className="relative min-w-0">
          <button onClick={() => setShowProjectMenu(!showProjectMenu)} className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 max-w-[220px]">
            <BookOpen className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span className="truncate">{activeProject ? activeProject.title : "Chọn truyện..."}</span>
            <ChevronDown className="w-3 h-3 text-zinc-400 shrink-0" />
          </button>
          {showProjectMenu && (
            <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-[#18181b] rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 py-1.5 z-40">
              <div className="px-3 py-1.5 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Truyện đang viết</div>
              <div className="max-h-60 overflow-y-auto">
                {projects.map((p) => (
                  <button key={p.id} onClick={() => { onSelectProject(p); setShowProjectMenu(false); }} className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/60 ${activeProject?.id === p.id ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300" : "text-zinc-700 dark:text-zinc-300"}`}>
                    <span className="truncate">{p.title}</span>{activeProject?.id === p.id && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <button onClick={onOpenVoiceModal} title="Nói để AI viết" className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium"><Mic className="w-3.5 h-3.5" /><span className="hidden sm:inline">Nói</span></button>
        <button onClick={() => onToggleTheme(nextTheme)} title={themeMode === "dark" ? "Chuyển sang sáng" : "Chuyển sang tối"} className="p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800">{themeMode === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}</button>
        <div className="relative">
          <button onClick={() => setShowUserMenu(!showUserMenu)} className="p-0.5 rounded-full hover:ring-2 hover:ring-indigo-500/50">
            <img src={user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user?.name || "KAIST")}`} alt={user?.name || "Người dùng"} className="w-7 h-7 rounded-full object-cover border border-zinc-300 dark:border-zinc-700" />
          </button>
          {showUserMenu && (
            <div className="absolute right-0 top-full mt-1.5 w-56 bg-white dark:bg-[#18181b] rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 py-2 z-50">
              <div className="px-3.5 py-2 border-b border-zinc-100 dark:border-zinc-800"><div className="font-semibold text-xs truncate">{user?.name}</div><div className="text-[11px] text-zinc-500 truncate">{user?.email}</div></div>
              <button onClick={() => { setShowUserMenu(false); onOpenSettings(); }} className="w-full px-3.5 py-2 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-2"><Settings className="w-3.5 h-3.5" />Cài đặt AI & tài khoản</button>
              <button onClick={() => { setShowUserMenu(false); onLogout(); }} className="w-full px-3.5 py-2 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-2"><LogOut className="w-3.5 h-3.5" />Đăng xuất</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};