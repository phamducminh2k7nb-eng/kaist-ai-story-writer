import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { Navigation, NavView } from "./components/Navigation";
import { DashboardView } from "./components/DashboardView";
import { ChatView } from "./components/ChatView";
import { ManuscriptEditor } from "./components/ManuscriptEditor";
import { ProjectsView } from "./components/ProjectsView";
import { CharacterCodex } from "./components/CharacterCodex";
import { WorldbuildingView } from "./components/WorldbuildingView";
import { LibraryView } from "./components/LibraryView";
import { VisualStudio } from "./components/VisualStudio";
import { PublishingView } from "./components/PublishingView";
import { StoryHubView } from "./components/StoryHubView";
import { AutopilotView } from "./components/AutopilotView";
import { SettingsModal } from "./components/SettingsModal";
import { VoiceInputModal } from "./components/VoiceInputModal";
import { KaistGovernanceModal } from "./components/KaistGovernanceModal";
import { LogoutModal } from "./components/LogoutModal";
import { LoginView } from "./components/LoginView";
import { api } from "./services/api";
import {
  UserProfile,
  StoryProject,
  Chapter,
  Character,
  WorldRule,
  OutlineEvent,
  DocumentItem,
  GeneratedImageItem,
  ThemePreference,
} from "./types";

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [projects, setProjects] = useState<StoryProject[]>([]);
  const [activeProject, setActiveProject] = useState<StoryProject | null>(null);

  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [activeChapter, setActiveChapter] = useState<Chapter | null>(null);

  const [characters, setCharacters] = useState<Character[]>([]);
  const [worldRules, setWorldRules] = useState<WorldRule[]>([]);
  const [outlines, setOutlines] = useState<OutlineEvent[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [images, setImages] = useState<GeneratedImageItem[]>([]);

  const [currentView, setCurrentView] = useState<NavView>("chat");
  
  // Navigation sidebar states with local persistence
  const [isNavCollapsed, setIsNavCollapsed] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("kaist_sidebar_collapsed");
      return saved === null ? true : saved === "true";
    } catch {
      return false;
    }
  });
  const [isNavHidden, setIsNavHidden] = useState<boolean>(() => {
    try {
      return localStorage.getItem("kaist_sidebar_hidden") === "true";
    } catch {
      return false;
    }
  });
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const handleToggleNavCollapse = () => {
    setIsNavCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("kaist_sidebar_collapsed", String(next));
      } catch {}
      return next;
    });
    // If it was hidden, unhide it
    if (isNavHidden) {
      setIsNavHidden(false);
      try {
        localStorage.setItem("kaist_sidebar_hidden", "false");
      } catch {}
    }
  };

  const handleToggleNavHidden = () => {
    setIsNavHidden((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("kaist_sidebar_hidden", String(next));
      } catch {}
      return next;
    });
  };

  const handleHeaderNavToggle = () => {
    if (isNavHidden) {
      setIsNavHidden(false);
      try {
        localStorage.setItem("kaist_sidebar_hidden", "false");
      } catch {}
    } else if (!isNavCollapsed) {
      setIsNavCollapsed(true);
      try {
        localStorage.setItem("kaist_sidebar_collapsed", "true");
      } catch {}
    } else {
      setIsNavCollapsed(false);
      try {
        localStorage.setItem("kaist_sidebar_collapsed", "false");
      } catch {}
    }
  };

  const getSavedThemeMode = (): ThemePreference => {
    try {
      const saved = localStorage.getItem("kaist_theme_mode") as ThemePreference;
      if (saved && ["light", "dark", "system"].includes(saved)) {
        return saved;
      }
    } catch {}
    return "system";
  };

  const [themeMode, setThemeMode] = useState<ThemePreference>(getSavedThemeMode);
  const [systemIsDark, setSystemIsDark] = useState<boolean>(() => {
    if (typeof window !== "undefined" && window.matchMedia) {
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });

  // Calculate effective theme
  const effectiveTheme: "light" | "dark" =
    themeMode === "system" ? (systemIsDark ? "dark" : "light") : themeMode;

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = (e: MediaQueryListEvent) => {
      setSystemIsDark(e.matches);
    };
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("dark", "sepia-theme");
    if (effectiveTheme === "dark") {
      root.classList.add("dark");
    }
    root.setAttribute("data-theme", effectiveTheme);
    root.setAttribute("data-theme-mode", themeMode);
  }, [effectiveTheme, themeMode]);

  const handleToggleTheme = (newMode: ThemePreference) => {
    setThemeMode(newMode);
    try {
      localStorage.setItem("kaist_theme_mode", newMode);
    } catch {}
  };

  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGovernanceModalOpen, setIsGovernanceModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initial Data Load
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const auth = await api.getMe();
      if (!auth.authenticated || !auth.user) {
        setUser(null);
        setIsLoading(false);
        return;
      }
      setUser(auth.user);
      await loadUserData();
    } catch (err) {
      console.error("Failed to load initial data:", err);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserData = async () => {
    try {
      const [projs, docs, imgs] = await Promise.all([
        api.getProjects(),
        api.getDocuments(),
        api.getImages(),
      ]);

      setProjects(projs || []);
      setDocuments(docs || []);
      setImages(imgs || []);

      if (projs && projs.length > 0) {
        const first = projs[0];
        setActiveProject(first);
        await loadProjectDetails(first.id);
      } else {
        setActiveProject(null);
        setActiveChapter(null);
      }
    } catch (err) {
      console.error("Failed to load user data:", err);
    }
  };

  const handleOpenLogout = () => {
    setLogoutError(null);
    setIsLogoutModalOpen(true);
  };

  const handleExecuteLogout = async () => {
    setIsLoggingOut(true);
    setLogoutError(null);
    try {
      await api.logout();
      // Clear in-memory sensitive data
      setUser(null);
      setProjects([]);
      setActiveProject(null);
      setChapters([]);
      setActiveChapter(null);
      setCharacters([]);
      setWorldRules([]);
      setOutlines([]);
      setDocuments([]);
      setImages([]);
      setCurrentView("chat");
      setIsLogoutModalOpen(false);
    } catch (err: any) {
      console.error("Logout error:", err);
      setLogoutError(err?.message || "Không thể hủy phiên làm việc trên máy chủ. Vui lòng thử lại.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const loadProjectDetails = async (projectId: string) => {
    try {
      const [chaps, chars, wrs, outs] = await Promise.all([
        api.getChapters(projectId),
        api.getCharacters(projectId),
        api.getWorldRules(projectId),
        api.getOutlines(projectId),
      ]);
      setChapters(chaps || []);
      setCharacters(chars || []);
      setWorldRules(wrs || []);
      setOutlines(outs || []);

      if (chaps && chaps.length > 0) {
        setActiveChapter(chaps[0]);
      } else {
        setActiveChapter(null);
      }
    } catch (err) {
      console.error("Failed to load project details:", err);
    }
  };

  const handleSelectProject = async (p: StoryProject) => {
    setActiveProject(p);
    await loadProjectDetails(p.id);
  };

  const [voiceTranscribedForChat, setVoiceTranscribedForChat] = useState<string | null>(null);

  const handleVoiceTranscribed = (text: string) => {
    if (!text || !text.trim()) return;
    const cleanText = text.trim();
    if (currentView === "editor" && activeChapter) {
      const updatedContent = (activeChapter.content ? activeChapter.content + "\n\n" : "") + cleanText;
      setActiveChapter({ ...activeChapter, content: updatedContent });
    } else if (currentView === "chat") {
      setVoiceTranscribedForChat(cleanText);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#09090b] text-zinc-100 font-ui gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20 animate-pulse">
          <span className="font-bold text-lg font-serif">K</span>
        </div>
        <div className="text-sm font-semibold tracking-wide text-zinc-300">
          Đang khởi tạo không gian sáng tác KAIST...
        </div>
      </div>
    );
  }

  // Not logged in: Show secure authentication screen
  if (!user) {
    return (
      <LoginView
        onLoginSuccess={async (loggedInUser) => {
          setUser(loggedInUser);
          setIsLoading(true);
          await loadUserData();
          setIsLoading(false);
        }}
      />
    );
  }

  return (
    <div
      className={`min-h-screen flex flex-col font-ui ${
        effectiveTheme === "dark"
          ? "bg-[#09090b] text-zinc-100"
          : "bg-[#f9fafb] text-zinc-900"
      }`}
    >
      {/* Top Bar */}
      <Header
        user={user}
        projects={projects}
        activeProject={activeProject}
        onSelectProject={handleSelectProject}
        onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenGovernance={() => setIsGovernanceModalOpen(true)}
        theme={effectiveTheme}
        themeMode={themeMode}
        onToggleTheme={handleToggleTheme}
        onLogout={handleOpenLogout}
        onOpenMobileNav={() => setIsMobileNavOpen(true)}
        onToggleSidebar={handleHeaderNavToggle}
        isNavHidden={isNavHidden}
      />

      {/* Main Layout (Sidebar + Active View) */}
      <div className="flex-1 flex overflow-hidden relative">
        <Navigation
          currentView={currentView}
          onSelectView={(v) => setCurrentView(v)}
          isCollapsed={isNavCollapsed}
          isHidden={isNavHidden}
          onToggleCollapse={handleToggleNavCollapse}
          onToggleHidden={handleToggleNavHidden}
          activeProjectTitle={activeProject?.title}
          isMobileOpen={isMobileNavOpen}
          onCloseMobile={() => setIsMobileNavOpen(false)}
          user={user}
          onLogout={handleOpenLogout}
        />

        {/* View Switcher Container */}
        <main className="flex-1 overflow-hidden flex flex-col">
          {currentView === "dashboard" && (
            <DashboardView
              user={user}
              projects={projects}
              activeProject={activeProject}
              recentChapters={chapters}
              onSelectProject={handleSelectProject}
              onNavigate={(v) => setCurrentView(v)}
              onCreateNewProject={() => setCurrentView("projects")}
              onContinueWriting={(ch) => {
                setActiveChapter(ch);
                setCurrentView("editor");
              }}
            />
          )}

          {currentView === "chat" && (
            <ChatView
              activeProject={activeProject}
              activeChapter={activeChapter}
              onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
              voiceTranscribedText={voiceTranscribedForChat}
              onClearVoiceTranscribedText={() => setVoiceTranscribedForChat(null)}
              documents={documents}
              onDocumentsUpdated={setDocuments}
            />
          )}

          {currentView === "story" && (
            <StoryHubView
              projects={projects}
              activeProject={activeProject}
              chapters={chapters}
              activeChapter={activeChapter}
              characters={characters}
              worldRules={worldRules}
              outlines={outlines}
              onSelectProject={handleSelectProject}
              onProjectsUpdated={setProjects}
              onChaptersUpdated={setChapters}
              onActiveChapterUpdated={setActiveChapter}
              onCharactersUpdated={setCharacters}
              onRulesUpdated={setWorldRules}
              onOutlinesUpdated={setOutlines}
              onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
            />
          )}

          {currentView === "automation" && (
            <AutopilotView
              activeProject={activeProject}
              onProjectChanged={async () => {
                if (activeProject?.id) await loadProjectDetails(activeProject.id);
                const [freshDocs, freshImages] = await Promise.all([api.getDocuments(), api.getImages()]);
                setDocuments(freshDocs || []);
                setImages(freshImages || []);
              }}
            />
          )}

          {currentView === "editor" && activeProject && (
            <ManuscriptEditor
              project={activeProject}
              chapters={chapters}
              currentChapter={activeChapter}
              onSelectChapter={(ch) => setActiveChapter(ch)}
              onChapterCreated={(newCh) => {
                setChapters([...chapters, newCh]);
                setActiveChapter(newCh);
              }}
              onChapterUpdated={(upCh) => {
                setChapters(chapters.map((c) => (c.id === upCh.id ? upCh : c)));
                setActiveChapter(upCh);
              }}
              onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
            />
          )}

          {currentView === "projects" && (
            <ProjectsView
              projects={projects}
              activeProject={activeProject}
              chapters={chapters}
              onSelectProject={handleSelectProject}
              onProjectsUpdated={setProjects}
              onOpenEditor={(ch) => {
                setActiveChapter(ch);
                setCurrentView("editor");
              }}
              onChaptersUpdated={setChapters}
            />
          )}

          {currentView === "characters" && activeProject && (
            <CharacterCodex
              project={activeProject}
              characters={characters}
              onCharactersUpdated={setCharacters}
            />
          )}

          {currentView === "world" && activeProject && (
            <WorldbuildingView
              project={activeProject}
              worldRules={worldRules}
              outlines={outlines}
              onRulesUpdated={setWorldRules}
              onOutlinesUpdated={setOutlines}
            />
          )}

          {currentView === "visual" && (
            <VisualStudio
              images={images}
              activeProject={activeProject}
              onImagesUpdated={setImages}
            />
          )}

          {currentView === "publish" && (
            <PublishingView activeProject={activeProject} chapters={chapters} />
          )}

          {currentView === "library" && (
            <LibraryView
              documents={documents}
              onDocumentsUpdated={setDocuments}
            />
          )}
        </main>
      </div>

      {/* Micro Mức 1 Voice Input Modal */}
      <VoiceInputModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onConfirm={handleVoiceTranscribed}
        targetLabel={
          currentView === "editor"
            ? "Chèn vào bản thảo đang viết"
            : currentView === "chat"
            ? "Soạn câu hỏi gửi cho AI Copilot"
            : "Soạn thảo nội dung"
        }
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        user={user}
        onUserUpdated={setUser}
        onOpenGovernance={() => setIsGovernanceModalOpen(true)}
      />

      {/* KAIST Governance Modal */}
      <KaistGovernanceModal
        isOpen={isGovernanceModalOpen}
        onClose={() => setIsGovernanceModalOpen(false)}
      />

      {/* Logout Confirmation & Session Termination Modal */}
      <LogoutModal
        isOpen={isLogoutModalOpen}
        isLoggingOut={isLoggingOut}
        error={logoutError}
        userName={user?.name}
        userEmail={user?.email}
        onConfirm={handleExecuteLogout}
        onCancel={() => {
          if (!isLoggingOut) {
            setIsLogoutModalOpen(false);
            setLogoutError(null);
          }
        }}
        onRetry={handleExecuteLogout}
      />
    </div>
  );
}