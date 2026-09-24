import {
  UserProfile,
  StoryProject,
  Chapter,
  Character,
  WorldRule,
  OutlineEvent,
  ProjectMemoryItem,
  DocumentItem,
  GeneratedImageItem,
  FoundImageItem,
  CalendarEvent,
  ChatSession,
  LiteraryIssue,
  ControlledKnowledgeResearch,
  UserPreference,
  UserFeedback,
  StoryAutomation,
  PublicationQueueItem,
  AutomationRunResult,
  AIProviderConfig,
  CritiqueRefineResult,
  SystemReleaseInfo,
} from "../types";
import { disableGoogleAutoSelect } from "./googleAuth";

const getHeaders = () => {
  const token = localStorage.getItem("kaist_session_token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
};

export const api = {
  // Auth
  async getMe(): Promise<{ authenticated: boolean; user: UserProfile | null }> {
    const token = localStorage.getItem("kaist_session_token");
    if (!token) {
      return { authenticated: false, user: null };
    }
    try {
      const res = await fetch("/api/auth/me", { headers: getHeaders() });
      if (!res.ok) {
        localStorage.removeItem("kaist_session_token");
        return { authenticated: false, user: null };
      }
      const data = await res.json();
      if (!data.authenticated || !data.user) {
        localStorage.removeItem("kaist_session_token");
        return { authenticated: false, user: null };
      }
      return { authenticated: true, user: data.user };
    } catch {
      return { authenticated: false, user: null };
    }
  },

  async loginWithGoogle(payload: { credential?: string; accessToken?: string }): Promise<{ success: boolean; user: UserProfile; sessionToken: string }> {
    const res = await fetch("/api/auth/google", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || "Xác thực Google không thành công");
    }
    if (data.sessionToken) {
      localStorage.setItem("kaist_session_token", data.sessionToken);
      localStorage.setItem("kaist_user_id", data.user.id);
    }
    return data;
  },

  async registerWithEmail(payload: { email: string; password: string; name?: string }): Promise<{ success: boolean; user: UserProfile; sessionToken: string; verificationCode?: string; message: string }> {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || "Đăng ký không thành công");
    }
    if (data.sessionToken) {
      localStorage.setItem("kaist_session_token", data.sessionToken);
      localStorage.setItem("kaist_user_id", data.user.id);
    }
    return data;
  },

  async loginWithEmail(payload: { email: string; password: string }): Promise<{ success: boolean; user: UserProfile; sessionToken: string; message: string }> {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || "Đăng nhập không thành công");
    }
    if (data.sessionToken) {
      localStorage.setItem("kaist_session_token", data.sessionToken);
      localStorage.setItem("kaist_user_id", data.user.id);
    }
    return data;
  },

  async verifyEmail(payload: { email: string; code: string }): Promise<{ success: boolean; user: UserProfile; message: string }> {
    const res = await fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || "Xác minh email không thành công");
    }
    return data;
  },

  async resendVerificationCode(payload: { email: string }): Promise<{ success: boolean; verificationCode: string; message: string }> {
    const res = await fetch("/api/auth/resend-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || "Không thể gửi lại mã xác thực");
    }
    return data;
  },

  async forgotPassword(payload: { email: string }): Promise<{ success: boolean; resetCode?: string; message: string }> {
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || "Không thể gửi yêu cầu quên mật khẩu");
    }
    return data;
  },

  async resetPassword(payload: { email: string; resetCode: string; newPassword: string }): Promise<{ success: boolean; user: UserProfile; sessionToken: string; message: string }> {
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || "Đặt lại mật khẩu không thành công");
    }
    if (data.sessionToken) {
      localStorage.setItem("kaist_session_token", data.sessionToken);
      localStorage.setItem("kaist_user_id", data.user.id);
    }
    return data;
  },

  async logout(): Promise<void> {
    const token = localStorage.getItem("kaist_session_token");
    if (token) {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ sessionToken: token }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Lỗi máy chủ (${res.status}) khi hủy phiên. Vui lòng thử lại.`);
      }
    }
    try {
      disableGoogleAutoSelect();
    } catch {}
    localStorage.removeItem("kaist_session_token");
    localStorage.removeItem("kaist_user_id");
  },

  async getAuthConfig(): Promise<{ googleClientId: string; appUrl: string; officialOrigin?: string; hasConfiguredClientId: boolean }> {
    const DEFAULT_ID = "701735649238-3b738mc5f69nnfd490cd5j7rgbrmilnh.apps.googleusercontent.com";
    try {
      const res = await fetch("/api/auth/config", {
        headers: { "Cache-Control": "no-cache" },
      });
      if (res.ok) {
        const data = await res.json();
        return {
          googleClientId: data.googleClientId || DEFAULT_ID,
          appUrl: data.appUrl || "https://kaist-content-marketing.ai.studio",
          officialOrigin: data.officialOrigin || "https://kaist-content-marketing.ai.studio",
          hasConfiguredClientId: Boolean(data.googleClientId || DEFAULT_ID),
        };
      }
    } catch {}
    return {
      googleClientId: DEFAULT_ID,
      appUrl: "https://kaist-content-marketing.ai.studio",
      officialOrigin: "https://kaist-content-marketing.ai.studio",
      hasConfiguredClientId: true,
    };
  },

  async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    const res = await fetch("/api/auth/update-profile", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    return data.user;
  },

  async exportAllData(): Promise<any> {
    const res = await fetch("/api/auth/export-all-data", { headers: getHeaders() });
    const data = await res.json();
    return data.data;
  },

  // Projects
  async getProjects(): Promise<StoryProject[]> {
    const res = await fetch("/api/projects", { headers: getHeaders() });
    const data = await res.json();
    return data.projects || [];
  },

  async createProject(project: Partial<StoryProject>): Promise<StoryProject> {
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(project),
    });
    const data = await res.json();
    return data.project;
  },

  async updateProject(id: string, project: Partial<StoryProject>): Promise<StoryProject> {
    const res = await fetch(`/api/projects/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(project),
    });
    const data = await res.json();
    return data.project;
  },

  async deleteProject(id: string): Promise<void> {
    await fetch(`/api/projects/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
  },

  // Chapters
  async getChapters(projectId: string): Promise<Chapter[]> {
    const res = await fetch(`/api/projects/${projectId}/chapters`, { headers: getHeaders() });
    const data = await res.json();
    return data.chapters || [];
  },

  async createChapter(projectId: string, chapter: Partial<Chapter>): Promise<Chapter> {
    const res = await fetch(`/api/projects/${projectId}/chapters`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(chapter),
    });
    const data = await res.json();
    return data.chapter;
  },

  async updateChapter(projectId: string, chapterId: string, chapter: Partial<Chapter> & { unlockFirst?: boolean }): Promise<Chapter> {
    const res = await fetch(`/api/projects/${projectId}/chapters/${chapterId}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(chapter),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Không thể lưu chương");
    }
    return data.chapter;
  },

  async deleteChapter(projectId: string, chapterId: string): Promise<void> {
    await fetch(`/api/projects/${projectId}/chapters/${chapterId}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
  },

  // Characters
  async getCharacters(projectId: string): Promise<Character[]> {
    const res = await fetch(`/api/projects/${projectId}/characters`, { headers: getHeaders() });
    const data = await res.json();
    return data.characters || [];
  },

  async createCharacter(projectId: string, char: Partial<Character>): Promise<Character> {
    const res = await fetch(`/api/projects/${projectId}/characters`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(char),
    });
    const data = await res.json();
    return data.character;
  },

  async updateCharacter(projectId: string, charId: string, char: Partial<Character>): Promise<Character> {
    const res = await fetch(`/api/projects/${projectId}/characters/${charId}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(char),
    });
    const data = await res.json();
    return data.character;
  },

  async deleteCharacter(projectId: string, charId: string): Promise<void> {
    await fetch(`/api/projects/${projectId}/characters/${charId}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
  },

  // World Rules
  async getWorldRules(projectId: string): Promise<WorldRule[]> {
    const res = await fetch(`/api/projects/${projectId}/world`, { headers: getHeaders() });
    const data = await res.json();
    return data.worldRules || [];
  },

  async createWorldRule(projectId: string, rule: Partial<WorldRule>): Promise<WorldRule> {
    const res = await fetch(`/api/projects/${projectId}/world`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(rule),
    });
    const data = await res.json();
    return data.worldRule;
  },

  async updateWorldRule(projectId: string, ruleId: string, rule: Partial<WorldRule>): Promise<WorldRule> {
    const res = await fetch(`/api/projects/${projectId}/world/${ruleId}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(rule),
    });
    const data = await res.json();
    return data.worldRule;
  },

  async deleteWorldRule(projectId: string, ruleId: string): Promise<void> {
    await fetch(`/api/projects/${projectId}/world/${ruleId}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
  },

  // Outlines
  async getOutlines(projectId: string): Promise<OutlineEvent[]> {
    const res = await fetch(`/api/projects/${projectId}/outlines`, { headers: getHeaders() });
    const data = await res.json();
    return data.outlines || [];
  },

  async createOutline(projectId: string, event: Partial<OutlineEvent>): Promise<OutlineEvent> {
    const res = await fetch(`/api/projects/${projectId}/outlines`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(event),
    });
    const data = await res.json();
    return data.outline;
  },

  async deleteOutline(projectId: string, outlineId: string): Promise<void> {
    await fetch(`/api/projects/${projectId}/outlines/${outlineId}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
  },

  // Project Memories
  async getMemories(projectId: string): Promise<ProjectMemoryItem[]> {
    const res = await fetch(`/api/projects/${projectId}/memories`, { headers: getHeaders() });
    const data = await res.json();
    return data.memories || [];
  },

  async createMemory(projectId: string, mem: Partial<ProjectMemoryItem>): Promise<ProjectMemoryItem> {
    const res = await fetch(`/api/projects/${projectId}/memories`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(mem),
    });
    const data = await res.json();
    return data.memory;
  },

  async updateMemory(projectId: string, memId: string, mem: Partial<ProjectMemoryItem>): Promise<ProjectMemoryItem> {
    const res = await fetch(`/api/projects/${projectId}/memories/${memId}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(mem),
    });
    const data = await res.json();
    return data.memory;
  },

  async deleteMemory(projectId: string, memId: string): Promise<void> {
    await fetch(`/api/projects/${projectId}/memories/${memId}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
  },

  // Documents
  async getDocuments(): Promise<DocumentItem[]> {
    const res = await fetch("/api/documents", { headers: getHeaders() });
    const data = await res.json();
    return data.documents || [];
  },

  async createDocument(doc: Partial<DocumentItem>): Promise<DocumentItem> {
    const res = await fetch("/api/documents", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(doc),
    });
    const data = await res.json();
    return data.document;
  },

  async uploadDocument(payload: {
    name: string;
    fileType: string;
    fileBase64: string;
    sizeBytes: number;
    projectId?: string;
  }): Promise<DocumentItem> {
    const res = await fetch("/api/documents/upload", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || "Không thể tải lên tài liệu");
    }
    return data.document;
  },

  async deleteDocument(id: string): Promise<void> {
    await fetch(`/api/documents/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
  },

  // Images
  async getImages(): Promise<GeneratedImageItem[]> {
    const res = await fetch("/api/images", { headers: getHeaders() });
    const data = await res.json();
    return data.images || [];
  },

  async createImage(img: Partial<GeneratedImageItem>): Promise<GeneratedImageItem> {
    const res = await fetch("/api/images", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(img),
    });
    const data = await res.json();
    return data.image;
  },

  async deleteImage(id: string): Promise<void> {
    await fetch(`/api/images/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
  },

  // Calendar
  async getCalendarEvents(): Promise<CalendarEvent[]> {
    const res = await fetch("/api/calendar", { headers: getHeaders() });
    const data = await res.json();
    return data.events || [];
  },

  async createCalendarEvent(ev: Partial<CalendarEvent>): Promise<CalendarEvent> {
    const res = await fetch("/api/calendar", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(ev),
    });
    const data = await res.json();
    return data.event;
  },

  async updateCalendarEvent(id: string, ev: Partial<CalendarEvent>): Promise<CalendarEvent> {
    const res = await fetch(`/api/calendar/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(ev),
    });
    const data = await res.json();
    return data.event;
  },

  async deleteCalendarEvent(id: string): Promise<void> {
    await fetch(`/api/calendar/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
  },

  // Chat
  async getChats(projectId?: string): Promise<ChatSession[]> {
    const url = projectId ? `/api/chats?projectId=${encodeURIComponent(projectId)}` : "/api/chats";
    const res = await fetch(url, { headers: getHeaders() });
    const data = await res.json();
    return data.chats || [];
  },

  async createChat(chat: Partial<ChatSession>): Promise<ChatSession> {
    const res = await fetch("/api/chats", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(chat),
    });
    const data = await res.json();
    return data.chat;
  },

  async updateChat(id: string, chat: Partial<ChatSession>): Promise<ChatSession> {
    const res = await fetch(`/api/chats/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(chat),
    });
    const data = await res.json();
    return data.chat;
  },

  async deleteChat(id: string): Promise<void> {
    await fetch(`/api/chats/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
  },

  // AI Actions
  async sendChatMessage(
    payload: {
      message: string;
      projectId?: string;
      chapterId?: string;
      mode?: string;
      contextScope?: string;
      history?: any[];
      attachedDocs?: any[];
      workflowDepth?: "quick" | "deep_5step";
      modelChoice?: string;
      aiProvider?: string;
    },
    signal?: AbortSignal
  ): Promise<{
    text: string;
    sources?: any[];
    isNotice?: boolean;
    diagnostic?: any;
    modelUsed?: string;
  }> {
    const res = await fetch("/api/ai/chat", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
      signal,
    });

    let data: any = {};
    const rawText = await res.text();
    try {
      data = JSON.parse(rawText);
    } catch {
      data = {
        error: `Máy chủ phản hồi với mã HTTP ${res.status}: ${res.statusText || "Phản hồi không đúng định dạng JSON"}`,
      };
    }

    if (!res.ok) {
      const err = new Error(data.error || "Lỗi giao tiếp với AI") as any;
      err.status = res.status;
      err.errorCode = data.errorCode;
      err.diagnostic = data.diagnostic;
      throw err;
    }
    return data;
  },

  async assistWriting(payload: {
    action: "write_next" | "expand" | "condense" | "rewrite" | "dialogue_polish";
    selectedText?: string;
    surroundingText?: string;
    instruction?: string;
    projectId?: string;
    chapterId?: string;
  }): Promise<string> {
    const res = await fetch("/api/ai/write-assist", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Không thể xử lý viết AI");
    }
    return data.generatedText;
  },

  async inspectLiterary(payload: {
    text: string;
    projectId?: string;
    chapterId?: string;
  }): Promise<LiteraryIssue[]> {
    const res = await fetch("/api/ai/literary-inspect", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    return data.issues || [];
  },

  async performControlledResearch(payload: {
    query: string;
    projectId?: string;
    currentProjectSummary?: string;
  }): Promise<ControlledKnowledgeResearch> {
    const res = await fetch("/api/ai/controlled-research", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Nghiên cứu thất bại");
    }
    return data.research;
  },

  async researchKnowledge(payload: {
    query: string;
    domain?: string;
    projectId?: string;
  }): Promise<ControlledKnowledgeResearch> {
    return this.performControlledResearch({
      query: payload.domain ? `${payload.query} (Lĩnh vực: ${payload.domain})` : payload.query,
      projectId: payload.projectId,
    });
  },

  async refineImagePrompt(payload: {
    concept: string;
    category: string;
    style: string;
    aspectRatio: string;
    projectId?: string;
  }): Promise<any> {
    const res = await fetch("/api/ai/image-prompt", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    return data.data;
  },

  async generateImage(payload: {
    concept: string;
    category: string;
    style: string;
    aspectRatio: string;
    projectId?: string;
    customTitle?: string;
    customAuthor?: string;
    showOverlay?: boolean;
    mode?: "ai_generate" | "reference_guide";
    referenceImageUrl?: string;
    preserveElements?: string[];
    modifications?: string;
    lighting?: string;
    lightingType?: string;
    contrast?: string;
    parentImageId?: string;
    editAction?: "light_up" | "soften_contrast" | "change_mood" | "recompose";
  }): Promise<{ image: GeneratedImageItem; taskId: string }> {
    const res = await fetch("/api/ai/generate-image", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      const message = data.hint ? `${data.error || "Không thể tạo hình ảnh từ AI"} — ${data.hint}` : (data.error || "Không thể tạo hình ảnh từ AI");
      const err = new Error(message) as any;
      err.errorCode = data.errorCode;
      err.retryable = data.retryable;
      throw err;
    }
    return { image: data.image, taskId: data.taskId };
  },

  async upscaleImage(payload: {
    imageId: string;
    factor: 2 | 4;
    upscaledDataUrl?: string;
  }): Promise<{ success: boolean; image: GeneratedImageItem; message: string }> {
    const res = await fetch("/api/ai/upscale-image", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || "Không thể nâng cấp độ phân giải hình ảnh");
    }
    return data;
  },

  // Preferences & Feedback
  async getPreferences(): Promise<UserPreference[]> {
    const res = await fetch("/api/preferences", { headers: getHeaders() });
    const data = await res.json();
    return data.preferences || [];
  },

  async createPreference(pref: Partial<UserPreference>): Promise<UserPreference> {
    const res = await fetch("/api/preferences", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(pref),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || "Không thể lưu tuỳ chọn phong cách");
    }
    return data.preference;
  },

  async togglePreference(id: string): Promise<UserPreference> {
    const res = await fetch(`/api/preferences/toggle/${id}`, {
      method: "PATCH",
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || "Không thể đổi trạng thái tuỳ chọn");
    }
    return data.preference;
  },

  async deletePreference(id: string): Promise<void> {
    const res = await fetch(`/api/preferences/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || "Không thể xoá tuỳ chọn");
    }
  },

  async submitFeedback(feedback: Partial<UserFeedback>): Promise<UserFeedback> {
    const res = await fetch("/api/preferences/feedback", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(feedback),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || "Không thể gửi phản hồi đánh giá");
    }
    return data.feedback;
  },

  // Multi-Provider AI Hub
  async getAIProviders(): Promise<{ activeProvider: string; providers: Record<string, AIProviderConfig> }> {
    const res = await fetch("/api/ai/providers", { headers: getHeaders() });
    const data = await res.json();
    return data;
  },

  // Critique & 5-Step Refine
  async critiqueAndRefine(payload: {
    draftText: string;
    category: string;
    goals?: string[];
    projectId?: string;
  }): Promise<CritiqueRefineResult> {
    const res = await fetch("/api/ai/critique-and-refine", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || "Không thể phân tích và thẩm định bản thảo");
    }
    return data.result;
  },

  // System Release & Diagnostics
  async getReleaseInfo(): Promise<SystemReleaseInfo> {
    const res = await fetch("/api/system/release-info", { headers: getHeaders() });
    const data = await res.json();
    return data;
  },

  async runDiagnostics(): Promise<any> {
    const res = await fetch("/api/system/diagnostics", { headers: getHeaders() });
    const data = await res.json();
    return data;
  },

  async findImages(payload: {
    query: string;
    filter?: {
      type?: "all" | "photo" | "illustration";
      licenseGroup?: "all" | "commercial";
    };
    projectId?: string;
  }): Promise<{ images: FoundImageItem[]; totalFound: number }> {
    const res = await fetch("/api/ai/find-images", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || "Không thể tìm kiếm hình ảnh");
    }
    return { images: data.images || [], totalFound: data.totalFound || 0 };
  },

  async saveFoundImage(
    foundImage: FoundImageItem,
    projectId?: string
  ): Promise<{ success: boolean; image: GeneratedImageItem }> {
    const res = await fetch("/api/ai/save-found-image", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ foundImage, projectId }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || "Không thể lưu ảnh vào thư viện");
    }
    return { success: true, image: data.image };
  },

  async translateText(payload: {
    text: string;
    targetLanguage: string;
    projectId?: string;
  }): Promise<string> {
    const res = await fetch("/api/ai/translate", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    return data.translatedText || "";
  },

  // Story Autopilot
  async getStoryAutomations(): Promise<StoryAutomation[]> {
    const res = await fetch("/api/story-automations", { headers: getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Không thể tải Story Autopilot");
    return data.automations || [];
  },

  async createStoryAutomation(payload: Partial<StoryAutomation>): Promise<StoryAutomation> {
    const res = await fetch("/api/story-automations", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Không thể tạo lịch tự động");
    return data.automation;
  },

  async updateStoryAutomation(id: string, payload: Partial<StoryAutomation>): Promise<StoryAutomation> {
    const res = await fetch(`/api/story-automations/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Không thể cập nhật Story Autopilot");
    return data.automation;
  },

  async deleteStoryAutomation(id: string): Promise<void> {
    const res = await fetch(`/api/story-automations/${id}`, { method: "DELETE", headers: getHeaders() });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Không thể xóa lịch tự động");    }
  },

  async runStoryAutomationNow(id: string): Promise<AutomationRunResult> {
    const res = await fetch(`/api/story-automations/${id}/run-now`, {
      method: "POST",
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || data.message || "Không thể chạy Story Autopilot");
    return data;
  },

  async getPublicationQueue(): Promise<PublicationQueueItem[]> {
    const res = await fetch("/api/publication-queue", { headers: getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Không thể tải hàng đợi xuất bản");
    return data.items || [];
  },

  async updatePublicationQueueItem(id: string, payload: Partial<PublicationQueueItem>): Promise<PublicationQueueItem> {
    const res = await fetch(`/api/publication-queue/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Không thể cập nhật hàng đợi xuất bản");
    return data.item;
  },

};