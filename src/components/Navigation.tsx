import React from "react";
import {
  MessageSquareText,
  BookOpen,
  PanelsTopLeft,
  Bot,
  Send,
  ChevronLeft,
  ChevronRight,
  X,
  EyeOff,
  LogOut,
} from "lucide-react";
import { UserProfile } from "../types";

export type NavView =
  | "chat"
  | "story"
  | "visual"
  | "automation"
  | "publish"
  // legacy internal routes kept for compatibility with old saved state/deep links
  | "dashboard"
  | "projects"
  | "editor"
  | "characters"
  | "world"
  | "library";

interface NavigationProps {
  currentView: NavView;
  onSelectView: (view: NavView) => void;
  isCollapsed: boolean;
  isHidden?: boolean;
  onToggleCollapse: () => void;
  onToggleHidden?: () => void;
  activeProjectTitle?: string;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  user?: UserProfile | null;
  onLogout?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentView,
  onSelectView,
  isCollapsed,
  isHidden = false,
  onToggleCollapse,
  onToggleHidden,
  activeProjectTitle,
  isMobileOpen = false,
  onCloseMobile,
  user,
  onLogout,
}) => {
  const navItems = [
    { id: "chat", label: "AI Tác giả", icon: MessageSquareText },
    { id: "story", label: "Viết truyện", icon: BookOpen },
    { id: "visual", label: "Manga Studio", icon: PanelsTopLeft },
    { id: "automation", label: "Tự động hóa", icon: Bot },
    { id: "publish", label: "Tự đăng", icon: Send },
  ] as const;

  const handleItemClick = (id: NavView) => {
    onSelectView(id);
    if (isMobileOpen && onCloseMobile) onCloseMobile();
  };

  const items = (
    <div className="py-2 px-2 flex flex-col gap-1 overflow-y-auto">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = currentView === item.id;
        return (
          <button
            key={item.id}
            onClick={() => handleItemClick(item.id)}
            className={`w-full flex items-center ${isCollapsed ? "justify-center" : "justify-start"} gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
              active
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/70"
            }`}
            title={isCollapsed ? item.label : undefined}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span className="truncate">{item.label}</span>}
          </button>
        );
      })}
    </div>
  );

  return (
    <>
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="fixed inset-0 bg-black/60" onClick={onCloseMobile} />
          <div className="relative w-72 max-w-[86vw] h-full bg-white dark:bg-[#101014] border-r border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col">
            <div className="h-14 px-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-black">KAIST Story</div>
                <div className="text-[10px] text-zinc-400 truncate max-w-[210px]">{activeProjectTitle || "AI Story Automation"}</div>
              </div>
              <button onClick={onCloseMobile} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"><X className="w-5 h-5" /></button>
            </div>
            {items}
            <div className="mt-auto p-3 border-t border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-400">Chỉ giữ 5 khu vực cốt lõi để sáng tác và tự động hóa.</div>
          </div>
        </div>
      )}

      <aside className={`border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50/90 dark:bg-[#0d0d10]/95 backdrop-blur flex-col justify-between transition-all duration-200 z-20 shrink-0 hidden md:flex ${isHidden ? "!hidden" : isCollapsed ? "w-16" : "w-52"}`}>
        <div>
          {!isCollapsed && activeProjectTitle && (
            <div className="mx-2 mt-3 px-3 py-2 bg-indigo-50/70 dark:bg-indigo-950/40 rounded-xl border border-indigo-100 dark:border-indigo-900/40">
              <div className="text-[10px] uppercase font-bold text-indigo-700 dark:text-indigo-400 tracking-wider">Đang sáng tác</div>
              <div className="text-xs font-semibold truncate mt-0.5">{activeProjectTitle}</div>
            </div>
          )}
          {items}
        </div>

        <div className="p-2 border-t border-zinc-200/80 dark:border-zinc-800/80 flex flex-col gap-1.5">
          {user && onLogout && (
            <button onClick={onLogout} className={`w-full flex items-center ${isCollapsed ? "justify-center" : "justify-between"} gap-2 p-2 rounded-lg text-zinc-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40`} title="Đăng xuất">
              {!isCollapsed && <span className="text-[11px] truncate">{user.name || "Tác giả"}</span>}
              <LogOut className="w-4 h-4" />
            </button>
          )}
          <button onClick={onToggleCollapse} className="w-full flex items-center justify-center gap-2 p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60 text-xs" title={isCollapsed ? "Mở rộng menu" : "Thu gọn menu"}>
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            {!isCollapsed && <span className="text-[11px]">Thu gọn</span>}
          </button>
          {!isCollapsed && onToggleHidden && (
            <button onClick={onToggleHidden} className="w-full flex items-center justify-center gap-2 p-1 rounded-lg text-zinc-400 hover:bg-zinc-200/40 dark:hover:bg-zinc-800/40 text-[11px]" title="Ẩn menu">
              <EyeOff className="w-3.5 h-3.5" /><span>Ẩn menu</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
};