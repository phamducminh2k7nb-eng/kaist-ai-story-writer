import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Sparkles,
  Bot,
  User,
  RotateCcw,
  Copy,
  Check,
  Split,
  Mic,
  MicOff,
  Search,
  Plus,
  Trash2,
  Bookmark,
  AlertCircle,
  FileText,
  HelpCircle,
  BookOpen,
  Paperclip,
  Upload,
  X,
  File,
  CheckCircle2,
  FolderArchive,
  ExternalLink,
  Globe,
  Link2,
  Square,
  Volume2,
  VolumeX,
  Edit3,
  Loader2,
  ChevronLeft,
  ChevronDown,
  MessageSquare,
} from "lucide-react";
import { ChatSession, ChatMessage, StoryProject, Chapter, DocumentItem } from "../types";
import { api } from "../services/api";
import { SourceCitationList } from "./SourceCitationList";
import { DocumentReaderModal } from "./DocumentReaderModal";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { AiBrandLogo } from "./AiBrandLogo";

interface ChatViewProps {
  activeProject: StoryProject | null;
  activeChapter: Chapter | null;
  onOpenVoiceModal: () => void;
  voiceTranscribedText?: string | null;
  onClearVoiceTranscribedText?: () => void;
  documents?: DocumentItem[];
  onDocumentsUpdated?: (docs: DocumentItem[]) => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  activeProject,
  activeChapter,
  onOpenVoiceModal,
  voiceTranscribedText,
  onClearVoiceTranscribedText,
  documents: externalDocs = [],
  onDocumentsUpdated,
}) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // Session list visibility & responsiveness (persisted in localStorage)
  const [isSessionListVisible, setIsSessionListVisible] = useState<boolean>(() => {
    try {
      return localStorage.getItem("kaist_chat_sessions_visible") === "true";
    } catch {
      return true;
    }
  });
  const [isMobileSessionDrawerOpen, setIsMobileSessionDrawerOpen] = useState(false);

  const toggleSessionList = () => {
    setIsSessionListVisible((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("kaist_chat_sessions_visible", String(next));
      } catch {}
      return next;
    });
  };

  const [inputMessage, setInputMessage] = useState("");
  const [mode, setMode] = useState<"brainstorm" | "write" | "serial" | "manga" | "edit" | "critique" | "research">("brainstorm");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [contextScope, setContextScope] = useState<"project" | "chapter" | "library" | "selection">("project");
  const [workflowDepth, setWorkflowDepth] = useState<"quick" | "deep_5step">("quick");
  const [modelChoice, setModelChoice] = useState<string>("gemini-3.8-flash");
  const [isLoading, setIsLoading] = useState(false);
  const [errorInfo, setErrorInfo] = useState<{ message: string; errorCode?: string; canRetry?: boolean } | null>(null);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastSentPromptRef = useRef<string>("");
  const lastSentAttachedDocsRef = useRef<DocumentItem[]>([]);
  const isSendingRef = useRef<boolean>(false);

  // Micro Mức 1 - Inline Speech Recognition
  const [isVoiceListening, setIsVoiceListening] = useState<boolean>(false);
  const [interimVoiceText, setInterimVoiceText] = useState<string>("");
  const [voiceToast, setVoiceToast] = useState<string | null>(null);
  const speechRecognitionRef = useRef<any>(null);
  const speechSessionIdRef = useRef<number>(0);

  // Đồng bộ kết quả nhận dạng từ Modal hoặc nguồn ngoài vào ô nhập
  useEffect(() => {
    if (voiceTranscribedText && voiceTranscribedText.trim()) {
      const incoming = voiceTranscribedText.trim();
      setInputMessage((prev) => {
        const trimmedPrev = prev.trim();
        return trimmedPrev ? `${trimmedPrev} ${incoming}` : incoming;
      });
      setVoiceToast("Đã chèn nội dung micro vào ô nhập. Bạn có thể sửa hoặc bấm Gửi.");
      setTimeout(() => setVoiceToast(null), 3500);
      onClearVoiceTranscribedText?.();
    }
  }, [voiceTranscribedText, onClearVoiceTranscribedText]);

  // Document Attachment State for AI Q&A
  const [internalDocs, setInternalDocs] = useState<DocumentItem[]>([]);
  const [attachedDocs, setAttachedDocs] = useState<DocumentItem[]>([]);
  const [isAttachModalOpen, setIsAttachModalOpen] = useState(false);
  const [attachTab, setAttachTab] = useState<"library" | "upload" | "snippet">("library");
  const [searchDocQuery, setSearchDocQuery] = useState("");
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [snippetTitle, setSnippetTitle] = useState("");
  const [snippetContent, setSnippetContent] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Document Reader Modal State
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
  const [selectedExcerpt, setSelectedExcerpt] = useState<string | undefined>(undefined);
  const [selectedSection, setSelectedSection] = useState<string | undefined>(undefined);

  // Sound notification toggle (default: false, saved to localStorage)
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem("kaist_chat_sound") === "true";
    } catch (e) {
      return false;
    }
  });

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    try {
      localStorage.setItem("kaist_chat_sound", String(next));
    } catch (e) {}
  };

  const handleOpenDocument = async (
    docId?: string,
    title?: string,
    excerpt?: string,
    pageOrSection?: string
  ) => {
    let found = allDocuments.find(
      (d) => (docId && d.id === docId) || (title && d.name.toLowerCase() === title.toLowerCase())
    );
    if (!found && docId) {
      try {
        const res = await fetch(`/api/documents/${docId}`);
        const data = await res.json();
        if (data && data.document) {
          found = data.document;
        }
      } catch (err) {
        console.warn("Could not fetch document details:", err);
      }
    }

    if (found) {
      setSelectedDoc(found);
      setSelectedExcerpt(excerpt);
      setSelectedSection(pageOrSection);
      setIsDocModalOpen(true);
    } else {
      setSelectedDoc({
        id: docId || "temp_doc",
        userId: "current_user",
        name: title || "Tài liệu tham khảo",
        fileType: "docx",
        uploadedAt: new Date().toISOString(),
        sizeBytes: 1024,
        tags: ["tham-khao"],
        contentSnippet: excerpt ? excerpt.slice(0, 150) : "Nội dung trích dẫn.",
        fullContent: excerpt || "Nội dung trích dẫn từ tài liệu tham khảo.",
        summary: excerpt ? `Trích dẫn: ${excerpt}` : "Tài liệu tham khảo",
      });
      setSelectedExcerpt(excerpt);
      setSelectedSection(pageOrSection);
      setIsDocModalOpen(true);
    }
  };

  const allDocuments = externalDocs.length > 0 ? externalDocs : internalDocs;

  // Load chat sessions & documents on mount
  useEffect(() => {
    loadSessions();
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const docs = await api.getDocuments();
      setInternalDocs(docs);
      if (onDocumentsUpdated && externalDocs.length === 0) {
        onDocumentsUpdated(docs);
      }
    } catch (err) {
      console.error("Failed to load documents:", err);
    }
  };

  const isErrorMessageContent = (content: string) => {
    if (!content) return false;
    return (
      content.includes("Hệ thống AI đang tạm thời") ||
      content.includes("hạn mức tạm thời") ||
      content.includes("điều phối tài nguyên") ||
      content.includes("RESOURCE_EXHAUSTED") ||
      content.includes("AI_TIMEOUT") ||
      content.includes("Quota exceeded")
    );
  };

  const loadSessions = async () => {
    try {
      const data = await api.getChats();
      // Auto-cleanse any legacy false assistant error notices from loaded sessions
      const cleansed = (data || []).map((s) => ({
        ...s,
        messages: (s.messages || []).filter(
          (m) => !(m.role === "assistant" && isErrorMessageContent(m.content))
        ),
      }));
      setSessions(cleansed);
      if (cleansed.length > 0 && !activeSessionId) {
        setActiveSessionId(cleansed[0].id);
      }
    } catch (err) {
      console.error("Failed to load chats:", err);
    }
  };

  const [sessionSearchQuery, setSessionSearchQuery] = useState("");
  const [isScrolledUp, setIsScrolledUp] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  const activeSession = sessions.find((s) => s.id === activeSessionId);

  const scrollToBottom = (smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
      setIsScrolledUp(false);
    }
  };

  const handleMessagesScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const distanceToBottom = scrollHeight - scrollTop - clientHeight;
    setIsScrolledUp(distanceToBottom > 150);
  };

  useEffect(() => {
    if (!isScrolledUp) {
      scrollToBottom(true);
    }
  }, [activeSession?.messages?.length, isLoading]);

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.deleteChat(sessionId);
      const remaining = sessions.filter((s) => s.id !== sessionId);
      setSessions(remaining);
      if (activeSessionId === sessionId) {
        setActiveSessionId(remaining[0]?.id || null);
      }
    } catch (err) {
      console.error("Lỗi xóa phiên chat:", err);
    }
  };

  const handleCreateNewSession = async () => {
    try {
      const newSession = await api.createChat({
        title: "Cuộc trò chuyện mới",
        mode,
        projectId: activeProject?.id,
        messages: [
          {
            id: "msg_init",
            role: "assistant",
            content: `Tôi đã nạp Story Bible của dự án "${
              activeProject?.title || "Sáng tác tự do"
            }". Bạn có thể tranh luận ý tưởng với tôi như một phòng biên kịch: tôi sẽ phản biện, tìm điểm yếu, đề xuất twist, viết chương dài hoặc chuyển chương thành kịch bản manga theo panel.`,
            timestamp: new Date().toISOString(),
          },
        ],
      });
      setSessions([newSession, ...sessions]);
      setActiveSessionId(newSession.id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleAttachDoc = (doc: DocumentItem) => {
    if (attachedDocs.some((d) => d.id === doc.id)) {
      setAttachedDocs(attachedDocs.filter((d) => d.id !== doc.id));
    } else {
      setAttachedDocs([...attachedDocs, doc]);
    }
  };

  const handleRemoveAttached = (docId: string) => {
    setAttachedDocs(attachedDocs.filter((d) => d.id !== docId));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploadingDoc(true);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        let fileType: "pdf" | "docx" | "txt" | "md" | "image" = "txt";
        if (file.name.endsWith(".pdf")) fileType = "pdf";
        else if (file.name.endsWith(".docx")) fileType = "docx";
        else if (file.name.endsWith(".md")) fileType = "md";
        else if (file.type.includes("image")) fileType = "image";

        let textContent = `Tài liệu: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
        if (file.type.includes("text") || file.name.endsWith(".txt") || file.name.endsWith(".md") || file.name.endsWith(".json") || file.name.endsWith(".csv")) {
          textContent = await file.text();
        }

        const newDoc = await api.createDocument({
          name: file.name,
          fileType,
          sizeBytes: file.size,
          summary: `Tài liệu tải lên trực tiếp trong Hỏi đáp AI: ${file.name}`,
          contentSnippet: textContent.slice(0, 6000),
          tags: ["Hỏi đáp AI", "Tham khảo"],
        });

        const updated = [newDoc, ...allDocuments];
        setInternalDocs(updated);
        if (onDocumentsUpdated) onDocumentsUpdated(updated);
        // Auto attach the uploaded document
        setAttachedDocs((prev) => [newDoc, ...prev]);
      }
      setIsAttachModalOpen(false);
    } catch (err) {
      console.error("Upload error:", err);
      alert("Lỗi khi tải tài liệu");
    } finally {
      setIsUploadingDoc(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleCreateSnippetDoc = async () => {
    if (!snippetTitle.trim() || !snippetContent.trim()) return;
    setIsUploadingDoc(true);
    try {
      const newDoc = await api.createDocument({
        name: snippetTitle.trim(),
        fileType: "txt",
        sizeBytes: new Blob([snippetContent]).size,
        summary: `Đoạn trích kiến thức tạo trực tiếp trong chat: ${snippetTitle.trim()}`,
        contentSnippet: snippetContent.trim().slice(0, 6000),
        tags: ["Ghi chú AI", "Đoạn trích"],
      });

      const updated = [newDoc, ...allDocuments];
      setInternalDocs(updated);
      if (onDocumentsUpdated) onDocumentsUpdated(updated);
      setAttachedDocs((prev) => [newDoc, ...prev]);
      setSnippetTitle("");
      setSnippetContent("");
      setIsAttachModalOpen(false);
    } catch (err) {
      console.error(err);
      alert("Không thể lưu đoạn trích");
    } finally {
      setIsUploadingDoc(false);
    }
  };

  const handleStopGenerating = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
    isSendingRef.current = false;
  };

  // Dừng nhận diện giọng nói và chốt văn bản tạm thời vào ô nhập
  const stopInlineVoice = (commitInterim = true) => {
    speechSessionIdRef.current += 1;
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch (e) {}
      speechRecognitionRef.current = null;
    }
    if (commitInterim && interimVoiceText) {
      const commit = interimVoiceText.trim();
      if (commit) {
        setInputMessage((prev) => {
          const trimmedPrev = prev.trim();
          return trimmedPrev ? `${trimmedPrev} ${commit}` : commit;
        });
      }
    }
    setInterimVoiceText("");
    setIsVoiceListening(false);
  };

  // Kích hoạt nhận diện giọng nói Micro Mức 1
  const startInlineVoice = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      // Nếu trình duyệt chưa hỗ trợ Web Speech trực tiếp, mở Modal micro dự phòng
      onOpenVoiceModal();
      return;
    }

    try {
      stopInlineVoice(false);
      speechSessionIdRef.current += 1;
      const currentSessionId = speechSessionIdRef.current;

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "vi-VN";

      recognition.onstart = () => {
        if (speechSessionIdRef.current === currentSessionId) {
          setIsVoiceListening(true);
          setVoiceToast("Micro đang lắng nghe... Bạn có thể nói tiếng Việt và sửa lại bằng bàn phím bất kỳ lúc nào.");
          setTimeout(() => setVoiceToast(null), 3500);
        }
      };

      recognition.onresult = (event: any) => {
        if (speechSessionIdRef.current !== currentSessionId) return;

        let finalChunk = "";
        let interimChunk = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            finalChunk += item[0].transcript + " ";
          } else {
            interimChunk += item[0].transcript;
          }
        }

        if (finalChunk.trim()) {
          setInputMessage((prev) => {
            const trimmedPrev = prev.trim();
            const chunk = finalChunk.trim();
            return trimmedPrev ? `${trimmedPrev} ${chunk}` : chunk;
          });
        }
        setInterimVoiceText(interimChunk.trim());
      };

      recognition.onerror = (event: any) => {
        if (speechSessionIdRef.current !== currentSessionId) return;
        if (event.error === "no-speech") return;
        console.warn("[Micro KAIST] Lỗi nhận diện:", event.error);
        if (event.error === "not-allowed") {
          setVoiceToast("Trình duyệt từ chối quyền micro. Vui lòng cấp quyền micro để sử dụng.");
          setTimeout(() => setVoiceToast(null), 4000);
        }
        stopInlineVoice(true);
      };

      recognition.onend = () => {
        if (speechSessionIdRef.current === currentSessionId) {
          stopInlineVoice(true);
        }
      };

      speechRecognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn("[Micro KAIST] Không thể khởi tạo inline speech, chuyển sang modal:", err);
      onOpenVoiceModal();
    }
  };

  const handleToggleVoice = () => {
    if (isVoiceListening) {
      stopInlineVoice(true);
    } else {
      startInlineVoice();
    }
  };

  const handleSendMessage = async (textToSend?: string, retryMsgId?: string) => {
    // 1. Chốt nội dung: Nếu micro còn đang nghe, lập tức thu nạp phần tạm thời và dừng micro
    let finalPrompt = "";
    if (textToSend !== undefined) {
      finalPrompt = textToSend.trim();
    } else {
      if (isVoiceListening) {
        const interim = interimVoiceText.trim();
        const base = inputMessage.trim();
        finalPrompt = (base ? (interim ? `${base} ${interim}` : base) : interim).trim();
        stopInlineVoice(false);
      } else {
        finalPrompt = inputMessage.trim();
      }
    }

    if (!finalPrompt) return;

    // 2. Chặn gửi trùng khi bấm nhanh nhiều lần
    if (isSendingRef.current || isLoading) return;
    isSendingRef.current = true;

    setErrorInfo(null);
    lastSentPromptRef.current = finalPrompt;
    lastSentAttachedDocsRef.current = [...attachedDocs];

    // Clone session/message objects để không mutate React state cũ.
    let currentSession: ChatSession | null = activeSession
      ? {
          ...activeSession,
          messages: (activeSession.messages || []).map((m) => ({ ...m })),
        }
      : null;

    if (!currentSession) {
      currentSession = await api.createChat({
        title: finalPrompt.slice(0, 30) + "...",
        mode,
        projectId: activeProject?.id,
        messages: [],
      });
      currentSession = {
        ...currentSession,
        messages: [...(currentSession.messages || [])],
      };
      setActiveSessionId(currentSession.id);
    }

    const syncSessionToState = (session: ChatSession) => {
      const snapshot: ChatSession = {
        ...session,
        messages: (session.messages || []).map((m) => ({ ...m })),
      };
      setSessions((prev) => {
        const exists = prev.some((s) => s.id === snapshot.id);
        return exists
          ? prev.map((s) => (s.id === snapshot.id ? snapshot : s))
          : [snapshot, ...prev];
      });
    };

    const persistSessionSafely = async (session: ChatSession, title?: string) => {
      try {
        await api.updateChat(session.id, {
          messages: session.messages || [],
          title: title || session.title,
        });
      } catch (persistError) {
        // Không được làm mất tin nhắn/AI response chỉ vì lưu lịch sử tạm thời thất bại.
        console.warn("[KAIST Chat] Không thể đồng bộ lịch sử chat ngay lúc này:", persistError);
      }
    };

    const currentAttached = [...attachedDocs];
    let userMsg: ChatMessage;

    if (retryMsgId) {
      const existingIndex = (currentSession.messages || []).findIndex((m) => m.id === retryMsgId);
      if (existingIndex >= 0) {
        userMsg = {
          ...currentSession.messages[existingIndex],
          status: "sending",
          errorMessage: undefined,
        };
        currentSession.messages = (currentSession.messages || []).map((m, idx) =>
          idx === existingIndex ? userMsg : m
        );
      } else {
        userMsg = {
          id: "msg_u_" + Date.now(),
          role: "user",
          content: finalPrompt,
          timestamp: new Date().toISOString(),
          contextScope,
          sources: currentAttached.map((d) => ({ title: d.name })),
          status: "sending",
          attachedDocsSnapshot: currentAttached,
        };
        currentSession.messages = [...(currentSession.messages || []), userMsg];
      }
    } else {
      userMsg = {
        id: "msg_u_" + Date.now(),
        role: "user",
        content: finalPrompt,
        timestamp: new Date().toISOString(),
        contextScope,
        sources: currentAttached.map((d) => ({ title: d.name })),
        status: "sending",
        attachedDocsSnapshot: currentAttached,
      };
      currentSession.messages = [...(currentSession.messages || []), userMsg];
    }

    // Hiển thị tin nhắn ngay và lưu nó lên server TRƯỚC khi gọi AI.
    // Như vậy Gemini chậm/lỗi/503 cũng không thể làm "mất" tin người dùng.
    syncSessionToState(currentSession);
    setInputMessage("");
    setInterimVoiceText("");
    setIsLoading(true);

    await persistSessionSafely(
      currentSession,
      (currentSession.messages || []).length <= 1 ? finalPrompt.slice(0, 30) : currentSession.title
    );

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await api.sendChatMessage(
        {
          message: finalPrompt,
          projectId: activeProject?.id,
          chapterId: activeChapter?.id,
          mode,
          contextScope,
          workflowDepth,
          modelChoice,
          history: currentSession.messages || [],
          attachedDocs: currentAttached.map((d) => ({
            id: d.id,
            name: d.name,
            summary: d.summary,
            contentSnippet: d.contentSnippet,
          })),
        },
        controller.signal
      );

      if (response.isNotice || !response.text || isErrorMessageContent(response.text)) {
        userMsg = {
          ...userMsg,
          status: "failed",
          errorMessage: response.text || "Dịch vụ AI không thể hoàn tất câu trả lời.",
        };
        currentSession.messages = (currentSession.messages || []).map((m) =>
          m.id === userMsg.id ? userMsg : m
        );
        syncSessionToState(currentSession);
        await persistSessionSafely(currentSession);

        setErrorInfo({
          message: userMsg.errorMessage,
          errorCode: (response as any).errorCode,
          canRetry: (response as any).diagnostic?.canRetry !== false,
        });
        return;
      }

      userMsg = { ...userMsg, status: "sent", errorMessage: undefined };
      currentSession.messages = (currentSession.messages || []).map((m) =>
        m.id === userMsg.id ? userMsg : m
      );

      const assistantMsg: ChatMessage = {
        id: "msg_ai_" + Date.now(),
        role: "assistant",
        content: response.text,
        timestamp: new Date().toISOString(),
        sources: response.sources,
        modelUsed: response.modelUsed,
        diagnostic: response.diagnostic,
      };

      currentSession.messages = [...(currentSession.messages || []), assistantMsg];

      // Render AI response trước; persistence là best-effort và không được làm mất UI.
      syncSessionToState(currentSession);
      await persistSessionSafely(
        currentSession,
        currentSession.messages.length <= 3 ? finalPrompt.slice(0, 30) : currentSession.title
      );

      if (soundEnabled && typeof window !== "undefined") {
        try {
          const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioCtx) {
            const ctx = new AudioCtx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(587.33, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
            gain.gain.setValueAtTime(0.08, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.35);
          }
        } catch (e) {}
      }
    } catch (err: any) {
      if (err.name === "AbortError" || err.message?.includes("aborted")) {
        userMsg = {
          ...userMsg,
          status: "failed",
          errorMessage: "Đã dừng tạo phản hồi. Tin nhắn của bạn vẫn được lưu.",
        };
        currentSession.messages = (currentSession.messages || []).map((m) =>
          m.id === userMsg.id ? userMsg : m
        );
        syncSessionToState(currentSession);
        await persistSessionSafely(currentSession);
        console.log("[KAIST Chat] Đã dừng tạo phản hồi theo yêu cầu của người dùng.");
      } else {
        console.error("Chat Error:", err);
        const isNetworkError =
          err.message?.includes("Failed to fetch") ||
          err.message?.includes("NetworkError") ||
          err.message?.includes("mã HTTP") ||
          !navigator.onLine;

        userMsg = {
          ...userMsg,
          status: "failed",
          errorMessage: isNetworkError
            ? "Máy chủ chưa nhận được phản hồi AI (lỗi mạng/kết nối). Tin nhắn của bạn vẫn được lưu để thử lại."
            : err.message || "Không thể nhận phản hồi từ AI. Tin nhắn của bạn vẫn được lưu.",
        };

        currentSession.messages = (currentSession.messages || []).map((m) =>
          m.id === userMsg.id ? userMsg : m
        );
        syncSessionToState(currentSession);
        await persistSessionSafely(currentSession);

        setErrorInfo({
          message: userMsg.errorMessage,
          errorCode: err.errorCode || (isNetworkError ? "NETWORK_ERROR" : "SERVICE_ERROR"),
          canRetry: err.diagnostic?.canRetry !== false,
        });
      }
    } finally {
      abortControllerRef.current = null;
      setIsLoading(false);
      isSendingRef.current = false;
    }
  };

  const handleRetryFailedMessage = (msg: ChatMessage) => {
    if (msg.attachedDocsSnapshot && msg.attachedDocsSnapshot.length > 0) {
      setAttachedDocs(msg.attachedDocsSnapshot);
    }
    handleSendMessage(msg.content, msg.id);
  };

  const handleRestoreDraftToInput = (msg: ChatMessage) => {
    setInputMessage((prev) => {
      const trimmed = prev.trim();
      if (!trimmed) return msg.content;
      return `${trimmed}\n\n${msg.content}`;
    });
    if (msg.attachedDocsSnapshot && msg.attachedDocsSnapshot.length > 0) {
      setAttachedDocs(msg.attachedDocsSnapshot);
    }
    setVoiceToast("Đã khôi phục tin nhắn vào ô soạn thảo kèm tài liệu.");
    setTimeout(() => setVoiceToast(null), 3000);
  };

  const handleCopyMessage = (id: string, text: string) => {
    // Strip any SVG tags, HTML tags, or unwanted markup
    const cleanText = (text || "")
      .replace(/<svg[\s\S]*?<\/svg>/gi, "")
      .replace(/<[^>]+>/g, "")
      .trim();
    navigator.clipboard.writeText(cleanText);
    setCopiedMsgId(id);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const handleBranchMessage = (msg: ChatMessage) => {
    // Strictly forbid branching from error notices, stopped notices, or system notifications
    if (
      msg.isNotice ||
      msg.isError ||
      isErrorMessageContent(msg.content) ||
      msg.content.startsWith("[Đã dừng tạo")
    ) {
      return;
    }
    // Clean any SVG tags, HTML tags, or prior branch prefixes
    const cleanContent = msg.content
      .replace(/<svg[\s\S]*?<\/svg>/gi, "")
      .replace(/<[^>]+>/g, "")
      .replace(/\[Phát triển nhánh.*?\]:?/gi, "")
      .trim();
    if (!cleanContent) return;
    const promptBranch = `[Phát triển nhánh từ tin nhắn]: ${cleanContent.slice(0, 80)}...`;
    setInputMessage(promptBranch);
  };

  const modeDescriptions = {
    brainstorm: "Phòng biên kịch: bàn ý tưởng, chiến lược cốt truyện, twist và hướng kiếm tiền",
    manga: "Biên kịch manga: chia cảnh, page beat, panel, thoại, biểu cảm, prompt hình ảnh",
    write: "Viết bản thảo phân cảnh, đối thoại nhân vật sống động",
    serial: "Truyện dài đăng nhiều kỳ: hook, nhịp chương, cliffhanger và giữ chân độc giả",
    edit: "Biên tập câu chữ, cắt tỉa từ thừa, làm mượt nhịp điệu",
    critique: "Phản biện tính logic, mâu thuẫn nhân vật & quy tắc",
    research: "Nghiên cứu dữ kiện lịch sử, phong tục, bối cảnh thực tế",
  };

  const filteredLibraryDocs = allDocuments.filter((d) =>
    (d.name || "").toLowerCase().includes(searchDocQuery.toLowerCase()) ||
    (d.tags || []).some((t) => t.toLowerCase().includes(searchDocQuery.toLowerCase()))
  );

  const filteredSessions = sessions.filter((s) =>
    (s.title || "").toLowerCase().includes(sessionSearchQuery.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-3.5rem)] flex bg-zinc-50 dark:bg-[#0d0d10] font-ui overflow-hidden w-full relative">
      {/* 1. Mobile Sessions Overlay Drawer */}
      {isMobileSessionDrawerOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden" role="dialog" aria-modal="true">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileSessionDrawerOpen(false)}
            aria-hidden="true"
          />
          <div className="relative w-80 max-w-[85vw] h-full bg-white dark:bg-[#121215] border-r border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col z-10">
            <div className="p-3.5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-[#16161a]">
              <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                Cuộc trò chuyện ({sessions.length})
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    handleCreateNewSession();
                    setIsMobileSessionDrawerOpen(false);
                  }}
                  className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs flex items-center gap-1 shadow-2xs font-semibold cursor-pointer"
                  title="Tạo phiên chat mới"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Mới</span>
                </button>
                <button
                  onClick={() => setIsMobileSessionDrawerOpen(false)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  title="Đóng"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Mobile Search */}
            <div className="p-2 border-b border-zinc-200 dark:border-zinc-800">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  value={sessionSearchQuery}
                  onChange={(e) => setSessionSearchQuery(e.target.value)}
                  placeholder="Tìm cuộc trò chuyện..."
                  className="w-full bg-zinc-100 dark:bg-zinc-800/70 text-xs pl-8 pr-3 py-1.5 rounded-lg border border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-900 focus:outline-none text-zinc-800 dark:text-zinc-200 placeholder-zinc-400"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
              {filteredSessions.map((s) => {
                const isSelected = s.id === activeSessionId;
                return (
                  <div
                    key={s.id}
                    onClick={() => {
                      setActiveSessionId(s.id);
                      setIsMobileSessionDrawerOpen(false);
                    }}
                    className={`w-full text-left p-2.5 rounded-xl text-xs transition-all flex items-center justify-between group cursor-pointer ${
                      isSelected
                        ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-200 font-semibold shadow-2xs border border-indigo-200 dark:border-indigo-800/60"
                        : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 border border-transparent"
                    }`}
                  >
                    <div className="truncate flex-1 pr-2">
                      <div className="truncate font-medium">{s.title || "Cuộc trò chuyện"}</div>
                      <div className="text-[10px] text-zinc-400 dark:text-zinc-500 capitalize mt-0.5">
                        Chế độ: {s.mode || "brainstorm"}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteSession(s.id, e)}
                      className="p-1 text-zinc-400 hover:text-red-500 rounded transition-colors"
                      title="Xóa đoạn chat này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 2. Desktop Left/Middle Column: Chat Sessions List */}
      {isSessionListVisible && (
        <div className="w-64 lg:w-72 border-r border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-[#121215]/80 flex flex-col shrink-0 hidden md:flex transition-all duration-200">
          <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider truncate">
              Cuộc trò chuyện ({sessions.length})
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={handleCreateNewSession}
                className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs flex items-center gap-1 shadow-2xs font-semibold transition-colors cursor-pointer"
                title="Tạo phiên chat mới"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Mới</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSessionList();
                }}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Thu gọn danh sách cuộc trò chuyện"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Desktop Search */}
          <div className="p-2 border-b border-zinc-200 dark:border-zinc-800">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={sessionSearchQuery}
                onChange={(e) => setSessionSearchQuery(e.target.value)}
                placeholder="Tìm cuộc trò chuyện..."
                className="w-full bg-zinc-100 dark:bg-zinc-800/70 text-xs pl-8 pr-3 py-1.5 rounded-lg border border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-900 focus:outline-none text-zinc-800 dark:text-zinc-200 placeholder-zinc-400"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
            {filteredSessions.map((s) => {
              const isSelected = s.id === activeSessionId;
              return (
                <div
                  key={s.id}
                  onClick={() => setActiveSessionId(s.id)}
                  className={`w-full text-left p-2.5 rounded-xl text-xs transition-all flex items-center justify-between group cursor-pointer ${
                    isSelected
                      ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-200 font-semibold shadow-2xs border border-indigo-200 dark:border-indigo-800/60"
                      : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 border border-transparent"
                  }`}
                >
                  <div className="truncate flex-1 pr-2">
                    <div className="truncate font-medium">{s.title || "Cuộc trò chuyện"}</div>
                    <div className="text-[10px] text-zinc-400 dark:text-zinc-500 capitalize mt-0.5">
                      Chế độ: {s.mode || "brainstorm"}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => handleDeleteSession(s.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-red-500 rounded transition-all hover:bg-zinc-200/60 dark:hover:bg-zinc-700/60 shrink-0"
                    title="Xóa đoạn chat này"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Main Chat Conversation */}
      <div className="flex-1 min-w-0 w-full flex flex-col h-full overflow-hidden bg-zinc-50/50 dark:bg-[#0d0d10] relative">
        {/* Story Room Toolbar */}
        <div className="px-3 sm:px-4 py-2.5 bg-white dark:bg-[#121215] border-b border-zinc-200 dark:border-zinc-800 text-xs">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 min-w-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.innerWidth < 768) setIsMobileSessionDrawerOpen(!isMobileSessionDrawerOpen);
                  else toggleSessionList();
                }}
                className="px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#16161a] text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5 font-medium"
                title="Mở lịch sử và tạo đoạn chat mới"
              >
                <MessageSquare className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span className="hidden sm:inline">Đoạn chat</span>
                <span className="text-zinc-400">{sessions.length}</span>
              </button>
              <div className="hidden lg:block min-w-0">
                <div className="font-extrabold text-zinc-900 dark:text-white truncate">Phòng tác giả AI</div>
                <div className="text-[10px] text-zinc-400 truncate">Bàn luận · phản biện · viết truyện · chuyển manga</div>
              </div>
            </div>

            <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800/70 p-1 rounded-xl overflow-x-auto max-w-full">
              {(["brainstorm", "serial", "manga", "critique"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  title={modeDescriptions[m]}
                  className={`px-2.5 py-1 rounded-lg text-xs whitespace-nowrap transition-colors ${
                    mode === m
                      ? "bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 font-bold shadow-2xs"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                  }`}
                >
                  {m === "brainstorm" ? "Bàn ý tưởng" : m === "serial" ? "Viết chương" : m === "manga" ? "Manga" : "Phản biện"}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsAttachModalOpen(true)}
                className={`px-2.5 py-1.5 rounded-lg border text-xs flex items-center gap-1.5 ${attachedDocs.length > 0 ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300" : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300"}`}
              >
                <Paperclip className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tư liệu</span> {attachedDocs.length > 0 && `(${attachedDocs.length})`}
              </button>
              <button onClick={() => setShowAdvanced(!showAdvanced)} className="px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 flex items-center gap-1">
                Nâng cao <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
              </button>
            </div>
          </div>

          {showAdvanced && (
            <div className="mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-2 flex-wrap">
              <select value={contextScope} onChange={(e) => setContextScope(e.target.value as any)} className="bg-white dark:bg-[#16161a] border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-1 text-xs">
                <option value="project">Ngữ cảnh: toàn dự án</option>
                <option value="chapter">Ngữ cảnh: chương đang mở</option>
                <option value="selection">Ngữ cảnh: đoạn được chọn</option>
                <option value="library">Ngữ cảnh: tư liệu</option>
              </select>
              <select value={workflowDepth} onChange={(e) => setWorkflowDepth(e.target.value as any)} className="bg-white dark:bg-[#16161a] border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-1 text-xs">
                <option value="quick">Tư duy nhanh</option>
                <option value="deep_5step">Tư duy 5 bước chuyên sâu</option>
              </select>
              <select value={modelChoice} onChange={(e) => setModelChoice(e.target.value)} className="bg-white dark:bg-[#16161a] border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-1 text-xs">
                <option value="gemini-3.8-flash">AI mặc định</option>
                <option value="gemini-3.7-flash">AI dự phòng</option>
                <option value="gemini-3.1-pro-preview">AI chuyên sâu</option>
              </select>
              <button type="button" onClick={toggleSound} className="px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-500 flex items-center gap-1">
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />} {soundEnabled ? "Âm báo bật" : "Âm báo tắt"}
              </button>
            </div>
          )}
        </div>

        {/* Message Thread */}
        <div
          ref={messagesContainerRef}
          onScroll={handleMessagesScroll}
          className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-5"
        >
          {/* Welcome Prompts if empty conversation */}
          {(!activeSession?.messages || activeSession.messages.length <= 1) && (
            <div className="max-w-2xl mx-auto w-full py-6 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-3 shadow-xs">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                Bàn truyện với KAIST như một phòng biên kịch
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md mb-5 leading-relaxed">
                Nói ý tưởng còn thô cũng được. AI sẽ phản biện, phát triển cốt truyện, viết chương dài hoặc chuyển thành storyboard manga.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full text-left">
                {[
                  { title: "Bàn một ý tưởng truyện mới", desc: "AI hỏi ngược, phản biện và tìm hướng có khả năng giữ chân độc giả" },
                  { title: "Viết chương tiếp theo", desc: "Dựa trên Story Bible, timeline và giọng nhân vật đã có" },
                  { title: "Chuyển chương thành manga", desc: "Chia trang, panel, góc máy, thoại và prompt hình ảnh nhất quán" },
                  { title: "Mổ xẻ cốt truyện", desc: "Tìm plot hole, nhịp yếu, twist dễ đoán và đề xuất cách sửa" },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setInputMessage(item.title + ": ");
                    }}
                    className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215] hover:border-indigo-500/50 hover:shadow-xs transition-all text-left cursor-pointer group"
                  >
                    <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {item.title}
                    </div>
                    <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-snug">
                      {item.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeSession?.messages?.map((msg) => {
            const isUser = msg.role === "user";
            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-3xl ${isUser ? "ml-auto flex-row-reverse" : "mr-auto w-full"}`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold shadow-2xs ${
                    isUser
                      ? "bg-indigo-600 text-white"
                      : "bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-indigo-600 dark:text-indigo-400"
                  }`}
                >
                  {isUser ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <AiBrandLogo
                      provider={
                        msg.modelUsed?.toLowerCase().includes("openai") || msg.modelUsed?.toLowerCase().includes("gpt")
                          ? "openai"
                          : "gemini"
                      }
                      size={16}
                    />
                  )}
                </div>

                {/* Bubble */}
                <div
                  className={`rounded-2xl px-4 py-3 text-sm leading-relaxed relative group overflow-hidden ${
                    isUser
                      ? "bg-indigo-600 text-white shadow-xs rounded-tr-xs"
                      : "bg-white dark:bg-[#151518] text-zinc-900 dark:text-zinc-100 border border-zinc-200/80 dark:border-zinc-800/80 shadow-2xs rounded-tl-xs flex-1 max-w-[calc(100%-3rem)]"
                  }`}
                >
                  {/* Attached Documents in user message */}
                  {isUser && msg.sources && msg.sources.length > 0 && (
                    <div className="mb-2 pb-2 border-b border-indigo-400/40 flex flex-wrap items-center gap-1.5 text-[11px] text-indigo-100">
                      <Paperclip className="w-3 h-3 text-indigo-200" />
                      <span className="font-semibold text-white">Đính kèm:</span>
                      {msg.sources.map((src, i) => (
                        <span
                          key={i}
                          className="bg-indigo-700/60 px-1.5 py-0.5 rounded text-white font-medium border border-indigo-400/30 truncate max-w-[200px]"
                        >
                          {src.title}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Message Content: Rich Markdown for Assistant, formatted text for User */}
                  {isUser ? (
                    <div className="whitespace-pre-wrap font-ui text-sm">{msg.content}</div>
                  ) : (
                    <MarkdownRenderer content={msg.content} />
                  )}

                  {/* Trạng thái gửi tin nhắn của Người dùng */}
                  {isUser && msg.status === "sending" && (
                    <div className="mt-2 pt-1.5 border-t border-indigo-400/30 flex items-center gap-1.5 text-[11px] text-indigo-100">
                      <Loader2 className="w-3 h-3 animate-spin text-indigo-200 shrink-0" />
                      <span>Đang gửi đến máy chủ KAIST...</span>
                    </div>
                  )}

                  {/* Trạng thái Gửi thất bại & Khôi phục nội dung */}
                  {isUser && msg.status === "failed" && (
                    <div className="mt-2.5 pt-2 border-t border-red-300/40 flex flex-col gap-1.5 text-xs text-red-50">
                      <div className="flex items-center gap-1.5 font-semibold text-white">
                        <AlertCircle className="w-3.5 h-3.5 text-red-200 shrink-0" />
                        <span>Gửi thất bại</span>
                      </div>
                      {msg.errorMessage && (
                        <div className="text-[11px] text-red-100 leading-tight bg-red-900/40 p-1.5 rounded border border-red-400/30">
                          {msg.errorMessage}
                        </div>
                      )}
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleRetryFailedMessage(msg)}
                          disabled={isLoading}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-zinc-100 text-zinc-900 font-semibold rounded-lg text-xs transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
                          title="Thử gửi lại tin nhắn này"
                        >
                          <RotateCcw className="w-3 h-3 text-indigo-600" />
                          <span>Thử lại</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRestoreDraftToInput(msg)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-700/90 hover:bg-indigo-800 text-white font-medium rounded-lg text-xs transition-all cursor-pointer border border-indigo-400/30 active:scale-95"
                          title="Đưa nội dung này trở lại ô nhập để chỉnh sửa"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Khôi phục vào ô nhập</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Notice & Retry Action in Assistant Message */}
                  {!isUser && msg.isNotice && (
                    <div className="mt-2.5 pt-2 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-700 dark:text-zinc-300">
                      <span className="text-[11px] text-zinc-500">
                        {msg.modelUsed ? `Mô hình: ${msg.modelUsed}` : "Bản nháp & tài liệu được lưu an toàn"}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleSendMessage(lastSentPromptRef.current || "")}
                        disabled={isLoading}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-medium rounded-lg text-xs transition-colors shadow-2xs cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Thử lại</span>
                      </button>
                    </div>
                  )}

                  {/* Interactive Sources citation list in AI message */}
                  {!isUser && msg.sources && msg.sources.length > 0 && (
                    <SourceCitationList
                      sources={msg.sources}
                      onOpenDocument={handleOpenDocument}
                    />
                  )}

                  {/* Action Bar (Copy, Branch) */}
                  <div
                    className={`absolute -bottom-3 ${
                      isUser ? "left-2" : "right-2"
                    } hidden group-hover:flex items-center gap-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-0.5 shadow-md z-10 select-none`}
                  >
                    <button
                      type="button"
                      onClick={() => handleCopyMessage(msg.id, msg.content)}
                      className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded transition-colors select-none"
                      title="Sao chép"
                    >
                      {copiedMsgId === msg.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    {!msg.isNotice &&
                      !msg.isError &&
                      !isErrorMessageContent(msg.content) &&
                      !msg.content.startsWith("[Đã dừng tạo") && (
                        <button
                          type="button"
                          onClick={() => handleBranchMessage(msg)}
                          className="p-1 text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded transition-colors select-none"
                          title="Tạo nhánh ý tưởng từ đây"
                        >
                          <Split className="w-3.5 h-3.5" />
                        </button>
                      )}
                  </div>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-3 max-w-2xl mr-auto">
              <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 animate-spin text-indigo-600" />
              </div>
              <div className="bg-white dark:bg-[#151518] border border-zinc-200/80 dark:border-zinc-800 rounded-2xl rounded-tl-xs px-4 py-3 shadow-2xs flex items-center gap-3 text-zinc-600 dark:text-zinc-300 text-xs">
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping shrink-0" />
                <span className="flex-1">
                  KAIST đang phân tích quy tắc dự án{attachedDocs.length > 0 ? ` & ${attachedDocs.length} tài liệu đính kèm` : ""} và tạo câu trả lời...
                </span>
                <button
                  type="button"
                  onClick={handleStopGenerating}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-300 dark:border-zinc-700 rounded-lg transition-colors cursor-pointer shrink-0"
                  title="Dừng tạo phản hồi"
                >
                  <Square className="w-3 h-3 fill-zinc-700 dark:fill-zinc-300" />
                  <span>Dừng tạo</span>
                </button>
              </div>
            </div>
          )}

          {/* Floating Scroll to Bottom Button */}
          {isScrolledUp && (
            <button
              type="button"
              onClick={() => scrollToBottom(true)}
              className="sticky bottom-4 mx-auto px-3.5 py-1.5 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 rounded-full shadow-lg text-xs font-medium flex items-center gap-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all cursor-pointer z-20 active:scale-95"
            >
              <ChevronDown className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 animate-bounce" />
              <span>Tin nhắn mới nhất</span>
            </button>
          )}

          {errorInfo && (
            <div className={`p-3.5 border rounded-xl text-xs flex items-start justify-between gap-3 max-w-2xl shadow-sm ${
              errorInfo.errorCode === "QUOTA_EXHAUSTED"
                ? "bg-amber-50/95 border-amber-300 text-amber-900"
                : "bg-red-50/95 border-red-200 text-red-800"
            }`}>
              <div className="flex items-start gap-2.5 flex-1">
                <AlertCircle className={`w-4 h-4 shrink-0 mt-0.5 ${
                  errorInfo.errorCode === "QUOTA_EXHAUSTED" ? "text-amber-600" : "text-red-600"
                }`} />
                <div className="space-y-1">
                  <div className="font-semibold text-xs">
                    {errorInfo.errorCode === "QUOTA_EXHAUSTED"
                      ? "Chạm hạn mức API của Google AI Studio (Quota Exceeded)"
                      : errorInfo.errorCode === "RATE_LIMIT_RPM"
                      ? "Giới hạn tần suất yêu cầu (RPM)"
                      : errorInfo.errorCode === "AUTH_ERROR"
                      ? "Lỗi xác thực khóa API"
                      : "Thông báo dịch vụ AI"}
                  </div>
                  <div className="leading-relaxed opacity-95">{errorInfo.message}</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                {errorInfo.canRetry !== false && (
                  <button
                    type="button"
                    onClick={() => handleSendMessage(lastSentPromptRef.current || "")}
                    disabled={isLoading}
                    className="px-2.5 py-1 bg-stone-800 hover:bg-stone-900 active:scale-95 text-white rounded-md font-medium flex items-center gap-1 transition-colors cursor-pointer select-none"
                    title="Thử lại câu hỏi này"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Thử lại</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setErrorInfo(null)}
                  className="p-1 text-stone-500 hover:text-stone-800 hover:bg-stone-200/60 rounded-md transition-colors cursor-pointer select-none"
                  title="Đóng thông báo"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar with Attached Documents & Micro shortcut */}
        <div className="p-3 sm:p-4 bg-white dark:bg-[#121215] border-t border-zinc-200 dark:border-zinc-800">
          <div className="max-w-4xl mx-auto flex flex-col gap-2">
            {/* Active Attached Documents Chips */}
            {attachedDocs.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 p-2 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 rounded-xl">
                <div className="flex items-center gap-1 text-[11px] font-semibold text-indigo-900 dark:text-indigo-300 pr-1">
                  <Paperclip className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Tài liệu tham khảo cho câu hỏi:</span>
                </div>
                {attachedDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center gap-1.5 bg-white border border-indigo-200 text-zinc-800 dark:bg-zinc-900 dark:border-indigo-800/60 dark:text-zinc-200 text-xs px-2 py-1 rounded-lg shadow-2xs"
                  >
                    <FileText className="w-3 h-3 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span className="truncate max-w-[180px] font-medium text-zinc-900 dark:text-zinc-100" title={doc.name}>
                      {doc.name}
                    </span>
                    <button
                      onClick={() => handleRemoveAttached(doc.id)}
                      className="text-zinc-400 hover:text-red-500 p-0.5 rounded transition-colors"
                      title="Gỡ tài liệu này"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => setAttachedDocs([])}
                  className="text-[11px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 ml-auto px-1.5 py-0.5 rounded cursor-pointer"
                >
                  Xóa tất cả
                </button>
              </div>
            )}

            {/* Trạng thái Micro Mức 1 & Phản hồi bằng giọng nói */}
            {isVoiceListening && (
              <div className="flex items-center justify-between px-3.5 py-2 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl text-xs text-red-950 dark:text-red-200 shadow-2xs animate-pulse">
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping shrink-0" />
                  <span className="font-semibold text-red-700 dark:text-red-400 shrink-0">Micro đang nghe:</span>
                  <span className="text-zinc-700 dark:text-zinc-300 italic truncate font-ui">
                    {interimVoiceText ? `"${interimVoiceText}"` : "Hãy nói câu hỏi của bạn (Nói xong có thể sửa chữ rồi bấm Gửi)..."}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => stopInlineVoice(true)}
                  className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer shrink-0 ml-2"
                  title="Dừng ghi âm và chốt chữ vào ô nhập để xem lại"
                >
                  Dừng & Chốt chữ
                </button>
              </div>
            )}

            {voiceToast && !isVoiceListening && (
              <div className="flex items-center justify-between px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 dark:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-200 shadow-2xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{voiceToast}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setVoiceToast(null)}
                  className="text-emerald-700 hover:text-emerald-900 dark:text-emerald-400 dark:hover:text-emerald-200 p-0.5 rounded cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            <div className="relative flex items-center">
              <textarea
                rows={2}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder={
                  isVoiceListening
                    ? "Micro đang lắng nghe... Lời nói sẽ tự động chuyển thành chữ tại đây."
                    : attachedDocs.length > 0
                    ? `Đặt câu hỏi hoặc yêu cầu AI phân tích dựa trên ${attachedDocs.length} tài liệu đã đính kèm...`
                    : "Nhập câu hỏi hoặc yêu cầu sáng tác... (Enter để gửi, Shift+Enter xuống dòng)"
                }
                className={`w-full text-sm p-3 pr-32 bg-zinc-50 dark:bg-[#16161a] border rounded-2xl text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-[#121215] resize-none font-ui transition-all dark:border-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500 ${
                  isVoiceListening ? "border-red-400 ring-1 ring-red-400" : "border-zinc-200 dark:border-zinc-800"
                }`}
              />

              {/* Action Buttons Inside Input */}
              <div className="absolute right-2.5 flex items-center gap-1.5">
                {/* Paperclip Button */}
                <button
                  type="button"
                  onClick={() => setIsAttachModalOpen(true)}
                  title="Thêm tài liệu tham khảo cho AI"
                  className={`p-2 rounded-xl transition-colors cursor-pointer ${
                    attachedDocs.length > 0
                      ? "bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold"
                      : "text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  }`}
                >
                  <Paperclip className="w-4 h-4" />
                </button>

                {/* Voice Button (Micro Mức 1) */}
                <button
                  type="button"
                  onClick={handleToggleVoice}
                  title={
                    isVoiceListening
                      ? "Đang nghe... Bấm để dừng và chốt văn bản để xem lại"
                      : "Nói chuyện bằng Micro (Nói → Chuyển thành chữ → Xem sửa → Bấm Gửi)"
                  }
                  className={`p-2 rounded-xl transition-all cursor-pointer ${
                    isVoiceListening
                      ? "bg-red-500 text-white shadow-xs animate-pulse ring-2 ring-red-300"
                      : "text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  }`}
                >
                  {isVoiceListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                {/* Send / Stop Button */}
                {isLoading ? (
                  <button
                    type="button"
                    onClick={handleStopGenerating}
                    title="Dừng tạo phản hồi từ AI"
                    className="p-2 bg-zinc-800 hover:bg-zinc-900 text-white rounded-xl shadow-xs transition-transform active:scale-95 flex items-center gap-1 text-xs px-2.5 cursor-pointer font-medium"
                  >
                    <Square className="w-3.5 h-3.5 fill-white" />
                    <span className="hidden sm:inline">Dừng</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={(!inputMessage.trim() && !interimVoiceText.trim() && !isVoiceListening) || isLoading}
                    onClick={() => handleSendMessage()}
                    title="Gửi câu hỏi cho AI"
                    className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl disabled:opacity-40 disabled:cursor-not-allowed shadow-xs transition-transform active:scale-95 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-zinc-400 px-1 flex-wrap gap-1">
              <span className="flex items-center gap-1.5">
                <AiBrandLogo provider="gemini" size={13} />
                <span>Đồng hành sáng tác cùng KAIST. Giữ an toàn bản thảo và quy tắc nhân vật.</span>
              </span>
              <span>Enter để gửi, Shift+Enter xuống dòng</span>
            </div>
          </div>
        </div>
      </div>

      {/* DOCUMENT ATTACHMENT MODAL */}
      {isAttachModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#121215] rounded-2xl max-w-xl w-full border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-[#16161a]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center">
                  <Paperclip className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Đính Kèm Tài Liệu Tham Khảo</h3>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    AI sẽ đọc nội dung tài liệu để trả lời chuẩn xác và trích nguồn
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAttachModalOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-zinc-200 dark:border-zinc-800 text-xs px-4 bg-white dark:bg-[#121215] gap-4">
              <button
                onClick={() => setAttachTab("library")}
                className={`py-2.5 font-semibold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
                  attachTab === "library"
                    ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                    : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                }`}
              >
                <FolderArchive className="w-3.5 h-3.5" />
                <span>Kho thư viện ({allDocuments.length})</span>
              </button>
              <button
                onClick={() => setAttachTab("upload")}
                className={`py-2.5 font-semibold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
                  attachTab === "upload"
                    ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                    : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Tải tệp lên</span>
              </button>
              <button
                onClick={() => setAttachTab("snippet")}
                className={`py-2.5 font-semibold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
                  attachTab === "snippet"
                    ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                    : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Dán đoạn trích</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 flex-1 overflow-y-auto">
              {/* Tab 1: Library Selector */}
              {attachTab === "library" && (
                <div className="flex flex-col gap-3">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={searchDocQuery}
                      onChange={(e) => setSearchDocQuery(e.target.value)}
                      placeholder="Tìm kiếm tài liệu theo tên, thẻ..."
                      className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-zinc-900 dark:text-zinc-100"
                    />
                  </div>

                  {filteredLibraryDocs.length === 0 ? (
                    <div className="py-10 text-center text-xs text-zinc-400">
                      Chưa có tài liệu nào trong thư viện phù hợp. Bạn có thể chuyển sang tab &quot;Tải tệp lên&quot; hoặc &quot;Dán đoạn trích&quot;.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
                      {filteredLibraryDocs.map((doc) => {
                        const isAttached = attachedDocs.some((d) => d.id === doc.id);
                        return (
                          <div
                            key={doc.id}
                            onClick={() => handleToggleAttachDoc(doc)}
                            className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-start justify-between gap-2 ${
                              isAttached
                                ? "bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800 shadow-2xs"
                                : "bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                            }`}
                          >
                            <div className="flex items-start gap-2.5">
                              <div
                                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                                  isAttached ? "bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                                }`}
                              >
                                <FileText className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                                  <span>{doc.name}</span>
                                  <span className="text-[10px] text-zinc-400 uppercase font-normal">
                                    {doc.fileType}
                                  </span>
                                </div>
                                <div className="text-zinc-500 dark:text-zinc-400 text-[11px] line-clamp-1 mt-0.5">
                                  {doc.summary || doc.contentSnippet?.slice(0, 100)}
                                </div>
                              </div>
                            </div>
                            <div className="shrink-0 pt-0.5">
                              {isAttached ? (
                                <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                              ) : (
                                <div className="w-4 h-4 rounded-full border border-zinc-300 dark:border-zinc-600" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Upload File */}
              {attachTab === "upload" && (
                <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/40 p-6 text-center">
                  <Upload className="w-8 h-8 text-zinc-400 mb-2" />
                  <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1">Tải tệp tài liệu tham khảo</h4>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-4 max-w-sm">
                    Hỗ trợ các định dạng .txt, .md, .docx, .pdf, .json. Hệ thống sẽ trích xuất văn bản và đính kèm vào phiên hỏi đáp ngay lập tức.
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".txt,.md,.pdf,.docx,.json,.csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    disabled={isUploadingDoc}
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    {isUploadingDoc ? "Đang xử lý tệp..." : "Chọn tệp từ máy tính"}
                  </button>
                </div>
              )}

              {/* Tab 3: Paste Snippet */}
              {attachTab === "snippet" && (
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                      Tên đoạn trích / Ghi chú
                    </label>
                    <input
                      type="text"
                      value={snippetTitle}
                      onChange={(e) => setSnippetTitle(e.target.value)}
                      placeholder="VD: Bối cảnh thành Thăng Long thế kỷ 13, Hồ sơ phản diện..."
                      className="w-full px-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-zinc-900 dark:text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                      Nội dung văn bản / Tài liệu tham khảo
                    </label>
                    <textarea
                      rows={5}
                      value={snippetContent}
                      onChange={(e) => setSnippetContent(e.target.value)}
                      placeholder="Dán nội dung nghiên cứu, trích dẫn sách báo hoặc tài liệu cần AI đọc vào đây..."
                      className="w-full p-2.5 text-xs bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-zinc-900 dark:text-zinc-100"
                    />
                  </div>
                  <button
                    disabled={!snippetTitle.trim() || !snippetContent.trim() || isUploadingDoc}
                    onClick={handleCreateSnippetDoc}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    Lưu & Đính kèm ngay vào hỏi đáp
                  </button>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#16161a] flex items-center justify-between">
              <span className="text-xs text-zinc-600 dark:text-zinc-400">
                Đã chọn: <strong>{attachedDocs.length}</strong> tài liệu
              </span>
              <button
                onClick={() => setIsAttachModalOpen(false)}
                className="px-4 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Reader & Citation Excerpt Modal */}
      <DocumentReaderModal
        isOpen={isDocModalOpen}
        onClose={() => {
          setIsDocModalOpen(false);
          setSelectedDoc(null);
          setSelectedExcerpt(undefined);
          setSelectedSection(undefined);
        }}
        document={selectedDoc}
        highlightExcerpt={selectedExcerpt}
        pageOrSection={selectedSection}
      />
    </div>
  );
};
