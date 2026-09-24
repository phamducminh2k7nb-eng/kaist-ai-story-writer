import React, { useState } from "react";
import { BookOpen, PenTool, Users, Compass } from "lucide-react";
import { StoryProject, Chapter, Character, WorldRule, OutlineEvent } from "../types";
import { ManuscriptEditor } from "./ManuscriptEditor";
import { ProjectsView } from "./ProjectsView";
import { CharacterCodex } from "./CharacterCodex";
import { WorldbuildingView } from "./WorldbuildingView";

interface StoryHubViewProps {
  projects: StoryProject[];
  activeProject: StoryProject | null;
  chapters: Chapter[];
  activeChapter: Chapter | null;
  characters: Character[];
  worldRules: WorldRule[];
  outlines: OutlineEvent[];
  onSelectProject: (project: StoryProject) => void;
  onProjectsUpdated: (projects: StoryProject[]) => void;
  onChaptersUpdated: (chapters: Chapter[]) => void;
  onActiveChapterUpdated: (chapter: Chapter | null) => void;
  onCharactersUpdated: (characters: Character[]) => void;
  onRulesUpdated: (rules: WorldRule[]) => void;
  onOutlinesUpdated: (outlines: OutlineEvent[]) => void;
  onOpenVoiceModal: () => void;
}

type StoryTab = "manuscript" | "projects" | "characters" | "world";

export const StoryHubView: React.FC<StoryHubViewProps> = ({
  projects,
  activeProject,
  chapters,
  activeChapter,
  characters,
  worldRules,
  outlines,
  onSelectProject,
  onProjectsUpdated,
  onChaptersUpdated,
  onActiveChapterUpdated,
  onCharactersUpdated,
  onRulesUpdated,
  onOutlinesUpdated,
  onOpenVoiceModal,
}) => {
  const [tab, setTab] = useState<StoryTab>(activeProject ? "manuscript" : "projects");

  const tabs = [
    { id: "manuscript" as const, label: "Bản thảo", icon: PenTool },
    { id: "projects" as const, label: "Truyện", icon: BookOpen },
    { id: "characters" as const, label: "Nhân vật", icon: Users },
    { id: "world" as const, label: "Thế giới & Dàn ý", icon: Compass },
  ];

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-zinc-50 dark:bg-[#0d0d10]">
      <div className="px-3 sm:px-5 py-2 border-b border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-[#121215]/90 backdrop-blur flex items-center gap-1 overflow-x-auto shrink-0">
        {tabs.map((item) => {
          const Icon = item.icon;
          const disabled = !activeProject && item.id !== "projects";
          return (
            <button
              key={item.id}
              disabled={disabled}
              onClick={() => setTab(item.id)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                tab === item.id
                  ? "bg-indigo-600 text-white"
                  : "text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
            >
              <Icon className="w-3.5 h-3.5" />
              {item.label}
            </button>
          );
        })}
        <div className="ml-auto pl-3 text-[11px] text-zinc-400 hidden md:block truncate">
          {activeProject ? activeProject.title : "Tạo hoặc chọn truyện để bắt đầu"}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
        {tab === "projects" && (
          <ProjectsView
            projects={projects}
            activeProject={activeProject}
            chapters={chapters}
            onSelectProject={(p) => {
              onSelectProject(p);
              setTab("manuscript");
            }}
            onProjectsUpdated={onProjectsUpdated}
            onOpenEditor={(ch) => {
              onActiveChapterUpdated(ch);
              setTab("manuscript");
            }}
            onChaptersUpdated={onChaptersUpdated}
          />
        )}

        {tab === "manuscript" && activeProject && (
          <ManuscriptEditor
            project={activeProject}
            chapters={chapters}
            currentChapter={activeChapter}
            onSelectChapter={onActiveChapterUpdated}
            onChapterCreated={(newCh) => {
              onChaptersUpdated([...chapters, newCh]);
              onActiveChapterUpdated(newCh);
            }}
            onChapterUpdated={(updated) => {
              onChaptersUpdated(chapters.map((c) => (c.id === updated.id ? updated : c)));
              onActiveChapterUpdated(updated);
            }}
            onOpenVoiceModal={onOpenVoiceModal}
          />
        )}

        {tab === "characters" && activeProject && (
          <CharacterCodex
            project={activeProject}
            characters={characters}
            onCharactersUpdated={onCharactersUpdated}
          />
        )}

        {tab === "world" && activeProject && (
          <WorldbuildingView
            project={activeProject}
            worldRules={worldRules}
            outlines={outlines}
            onRulesUpdated={onRulesUpdated}
            onOutlinesUpdated={onOutlinesUpdated}
          />
        )}
      </div>
    </div>
  );
};