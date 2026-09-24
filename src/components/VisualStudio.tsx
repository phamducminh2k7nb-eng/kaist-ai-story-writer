import React, { useState, useRef } from "react";
import {
  Image as ImageIcon,
  Sparkles,
  Download,
  Maximize2,
  Trash2,
  RefreshCw,
  AlertCircle,
  BookOpen,
  X,
  Search,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  Layers,
  Upload,
  Bookmark,
  CheckCircle2,
  Sliders,
  Filter,
  ThumbsUp,
  ThumbsDown,
  Sun,
  Contrast,
  Zap,
} from "lucide-react";
import { GeneratedImageItem, StoryProject, FoundImageItem } from "../types";
import { api } from "../services/api";

export const STYLE_LABELS: Record<string, { label: string; badge: string; desc: string }> = {
  anime: { label: "Anime / Manga sắc nét", badge: "Anime / Manga", desc: "Nét vẽ cel-shading Nhật Bản, ánh sáng ma mị" },
  cinematic: { label: "Cinematic điện ảnh", badge: "Cinematic 35mm", desc: "Chân thực điện ảnh, ánh sáng chiaroscuro kịch tính" },
  digital_art: { label: "Digital Art kỳ ảo", badge: "Digital Art", desc: "Tranh số ArtStation, chi tiết cao, hào quang rực rỡ" },
  oil_painting: { label: "Sơn dầu cổ điển", badge: "Sơn dầu Canvas", desc: "Nét cọ sơn dầu, cổ điển Rembrandt phục hưng" },
  concept_art: { label: "Concept Art ý niệm", badge: "Concept Art", desc: "Thiết kế mỹ thuật game/phim AAA, matte painting" },
  flat_minimal: { label: "Tối giản (Minimalist)", badge: "Tối giản Vector", desc: "Đồ họa vector phẳng 2D, hiện đại" },
};

export const CATEGORY_LABELS: Record<string, string> = {
  cover: "Bìa sách",
  character: "Nhân vật",
  scene: "Phân cảnh",
  manga: "Trang Manga / Comic",
};

export type StudioTabMode = "ai_create" | "find_existing" | "reference_guided";

interface VisualStudioProps {
  images: GeneratedImageItem[];
  activeProject: StoryProject | null;
  onImagesUpdated: (imgs: GeneratedImageItem[]) => void;
}

export const VisualStudio: React.FC<VisualStudioProps> = ({
  images,
  activeProject,
  onImagesUpdated,
}) => {
  // Main Studio Mode Switch
  const [activeTab, setActiveTab] = useState<StudioTabMode>("ai_create");

  // Mode 1: AI Create State
  const [concept, setConcept] = useState("");
  const [category, setCategory] = useState<"cover" | "character" | "scene" | "manga">("manga");
  const [style, setStyle] = useState<
    "cinematic" | "digital_art" | "anime" | "oil_painting" | "concept_art" | "flat_minimal"
  >("anime");
  const [aspectRatio, setAspectRatio] = useState<"3:4" | "1:1" | "16:9" | "9:16" | "4:3" | "4:5">("4:5");
  
  // Lighting & Contrast Granular Controls (Anti-Dark Image Fix)
  const [lighting, setLighting] = useState<string>("balanced");
  const [lightingType, setLightingType] = useState<string>("three_point");
  const [contrast, setContrast] = useState<string>("balanced");

  // Upscale & Feedback States
  const [upscalingId, setUpscalingId] = useState<string | null>(null);
  const [feedbackSentId, setFeedbackSentId] = useState<string | null>(null);
  const [feedbackRating, setFeedbackRating] = useState<"positive" | "negative" | null>(null);

  // Book Cover Overlay State
  const [customTitle, setCustomTitle] = useState(activeProject?.title || "");
  const [customAuthor, setCustomAuthor] = useState("");
  const [showOverlay, setShowOverlay] = useState(true);

  // Mode 2: Find Existing Images State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFilterType, setSearchFilterType] = useState<"all" | "photo" | "illustration">("all");
  const [searchLicenseGroup, setSearchLicenseGroup] = useState<"commercial" | "all">("all");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<FoundImageItem[]>([]);
  const [searchHasRun, setSearchHasRun] = useState(false);
  const [savingFoundId, setSavingFoundId] = useState<string | null>(null);

  // Mode 3: Reference Guided State
  const [refImageUrl, setRefImageUrl] = useState<string>("");
  const [refPreviewUrl, setRefPreviewUrl] = useState<string>("");
  const [refModifications, setRefModifications] = useState<string>("");
  const [refPreserveElements, setRefPreserveElements] = useState<string[]>([
    "composition",
    "palette",
    "lighting",
  ]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Gallery Filter State
  const [galleryFilter, setGalleryFilter] = useState<"all" | "ai_generated" | "found_existing" | "reference_guided">("all");

  // Generation & Async State
  const [generationStatus, setGenerationStatus] = useState<"idle" | "refining" | "rendering" | "completed" | "failed">("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activePreviewImage, setActivePreviewImage] = useState<GeneratedImageItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Handlers for Mode 1: Generate AI Image
  const handleGenerateAI = async () => {
    if (!concept.trim() || generationStatus === "refining" || generationStatus === "rendering") return;

    setGenerationStatus("refining");
    setStatusMessage("1/2: Gemini AI đang trau chuốt ý niệm và thiết kế prompt thẩm mỹ...");
    setErrorMessage(null);

    try {
      setTimeout(() => {
        setStatusMessage("2/2: Máy chủ AI đang kết xuất hình ảnh độ phân giải cao...");
        setGenerationStatus("rendering");
      }, 900);

      const result = await api.generateImage({
        concept: concept.trim(),
        category,
        style,
        aspectRatio,
        projectId: activeProject?.id,
        customTitle: category === "cover" && showOverlay ? customTitle : undefined,
        customAuthor: category === "cover" && showOverlay ? customAuthor : undefined,
        showOverlay: category === "cover" && showOverlay,
        mode: "ai_generate",
        lighting,
        lightingType,
        contrast,
      });

      onImagesUpdated([result.image, ...images]);
      setGenerationStatus("completed");
      setStatusMessage("Đã tạo ảnh AI thành công!");
      setTimeout(() => setGenerationStatus("idle"), 2500);
    } catch (err: any) {
      console.error("[VisualStudio] Generation error:", err);
      setGenerationStatus("failed");
      setErrorMessage(err?.message || "Không thể khởi tạo hình ảnh. Vui lòng thử lại.");
    }
  };

  // Upscale Image Handler
  const handleUpscale = async (item: GeneratedImageItem, factor: 2 | 4 = 2) => {
    setUpscalingId(item.id);
    try {
      const res = await api.upscaleImage({ imageId: item.id, factor });
      onImagesUpdated(images.map((img) => (img.id === item.id ? res.image : img)));
      if (activePreviewImage?.id === item.id) {
        setActivePreviewImage(res.image);
      }
    } catch (err: any) {
      alert("Lỗi nâng cấp độ phân giải ảnh: " + (err?.message || "Không xác định"));
    } finally {
      setUpscalingId(null);
    }
  };

  // User Feedback Handler
  const handleFeedback = async (
    item: GeneratedImageItem,
    rating: "positive" | "negative",
    reasons: string[] = []
  ) => {
    try {
      await api.submitFeedback({
        targetType: "image",
        targetId: item.id,
        rating: rating === "positive" ? "like" : "dislike",
        reasons,
        userNotes: `Phong cách ${item.style}, môi trường ${item.lighting || "mặc định"}`,
      });
      setFeedbackSentId(item.id);
      setFeedbackRating(rating);
      setTimeout(() => {
        setFeedbackSentId(null);
        setFeedbackRating(null);
      }, 3500);
    } catch (err: any) {
      console.error("Lỗi gửi feedback:", err);
    }
  };

  // Iterative Image Enhancement
  const handleIterateImage = async (
    item: GeneratedImageItem,
    action: "light_up" | "soften_contrast" | "change_mood" | "recompose"
  ) => {
    setGenerationStatus("rendering");
    setStatusMessage(
      action === "light_up"
        ? "Đang tăng sáng và bảo toàn chi tiết cho ảnh..."
        : action === "soften_contrast"
        ? "Đang làm dịu độ tương phản và loại bỏ độ gắt..."
        : "Đang chuyển dịch ánh sáng nghệ thuật..."
    );
    try {
      const result = await api.generateImage({
        concept: item.originalConcept || item.prompt,
        category: item.category,
        style: item.style as any,
        aspectRatio: (item.aspectRatio as any) || "3:4",
        projectId: activeProject?.id,
        lighting: action === "light_up" ? "bright_daylight" : "studio_soft",
        contrast: action === "soften_contrast" ? "gentle" : "balanced",
        parentImageId: item.id,
        editAction: action,
      });
      onImagesUpdated([result.image, ...images]);
      setActivePreviewImage(result.image);
    } catch (err: any) {
      alert("Không thể tinh chỉnh ảnh: " + (err?.message || "Lỗi không xác định"));
    } finally {
      setGenerationStatus("idle");
    }
  };

  // Handlers for Mode 2: Search Existing Images
  const handleSearchImages = async () => {
    if (!searchQuery.trim() || isSearching) return;
    setIsSearching(true);
    setErrorMessage(null);
    try {
      const res = await api.findImages({
        query: searchQuery.trim(),
        filter: {
          type: searchFilterType,
          licenseGroup: searchLicenseGroup,
        },
        projectId: activeProject?.id,
      });
      setSearchResults(res.images || []);
      setSearchHasRun(true);
    } catch (err: any) {
      console.error("[VisualStudio] Search error:", err);
      setErrorMessage(err?.message || "Không thể tìm kiếm hình ảnh. Vui lòng thử lại.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSaveFoundImage = async (item: FoundImageItem) => {
    setSavingFoundId(item.id);
    try {
      const res = await api.saveFoundImage(item, activeProject?.id);
      onImagesUpdated([res.image, ...images]);
    } catch (err: any) {
      alert("Không thể lưu ảnh: " + (err?.message || "Lỗi không xác định"));
    } finally {
      setSavingFoundId(null);
    }
  };

  const handleUseFoundAsReference = (item: FoundImageItem) => {
    setRefImageUrl(item.highResUrl);
    setRefPreviewUrl(item.thumbnailUrl || item.highResUrl);
    setRefModifications(
      `Biến thể dựa trên tác phẩm "${item.title}". Giữ nguyên bố cục và cấu trúc, điều chỉnh chi tiết và ánh sáng nghệ thuật phù hợp bối cảnh.`
    );
    setActiveTab("reference_guided");
  };

  const handleUseFoundAsCover = (item: FoundImageItem) => {
    // Save to studio first if not yet saved
    handleSaveFoundImage(item);
    setCustomTitle(activeProject?.title || item.title);
    setShowOverlay(true);
  };

  // Handlers for Mode 3: Reference Guided Generation
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Vui lòng chọn một tệp hình ảnh hợp lệ (PNG, JPG, WEBP).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      const dataUrl = loadEvt.target?.result as string;
      setRefImageUrl(dataUrl);
      setRefPreviewUrl(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const togglePreserveElement = (elem: string) => {
    setRefPreserveElements((prev) =>
      prev.includes(elem) ? prev.filter((item) => item !== elem) : [...prev, elem]
    );
  };

  const handleGenerateReferenceGuided = async () => {
    if (!refImageUrl) {
      alert("Vui lòng tải lên hoặc chọn một ảnh tham khảo trước khi tạo.");
      return;
    }
    if (generationStatus === "refining" || generationStatus === "rendering") return;

    setGenerationStatus("refining");
    setStatusMessage("1/2: Phân tích đặc trưng ảnh tham khảo & phối hợp cấu trúc hình ảnh...");
    setErrorMessage(null);

    try {
      setTimeout(() => {
        setStatusMessage("2/2: Máy chủ AI đang kết xuất biến thể nghệ thuật từ tham chiếu...");
        setGenerationStatus("rendering");
      }, 1000);

      const finalConcept = refModifications.trim() || concept.trim() || "Biến thể nghệ thuật dựa trên ảnh tham khảo";
      const result = await api.generateImage({
        concept: finalConcept,
        category,
        style,
        aspectRatio,
        projectId: activeProject?.id,
        customTitle: category === "cover" && showOverlay ? customTitle : undefined,
        customAuthor: category === "cover" && showOverlay ? customAuthor : undefined,
        showOverlay: category === "cover" && showOverlay,
        mode: "reference_guide",
        referenceImageUrl: refImageUrl,
        preserveElements: refPreserveElements,
        modifications: refModifications.trim(),
      });

      onImagesUpdated([result.image, ...images]);
      setGenerationStatus("completed");
      setStatusMessage("Đã tạo ảnh từ tham khảo thành công!");
      setTimeout(() => setGenerationStatus("idle"), 2500);
    } catch (err: any) {
      console.error("[VisualStudio] Reference generation error:", err);
      setGenerationStatus("failed");
      setErrorMessage(err?.message || "Không thể tạo ảnh từ tham khảo. Vui lòng thử lại.");
    }
  };

  // Common Action Handlers
  const handleDeleteImage = async (imgId: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa ảnh này khỏi studio?")) return;
    setDeletingId(imgId);
    try {
      await api.deleteImage(imgId);
      onImagesUpdated(images.filter((img) => img.id !== imgId));
      if (activePreviewImage?.id === imgId) setActivePreviewImage(null);
    } catch (err: any) {
      alert("Lỗi khi xóa ảnh: " + (err?.message || "Không xác định"));
    } finally {
      setDeletingId(null);
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDownload = async (img: GeneratedImageItem) => {
    try {
      const a = document.createElement("a");
      a.href = img.imageUrl;
      a.download = `KAIST_${img.style}_${(img.originalConcept || "image").slice(0, 25).replace(/\s+/g, "_")}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      window.open(img.imageUrl, "_blank");
    }
  };

  // Filtered Gallery Items
  const filteredImages = images.filter((img) => {
    if (galleryFilter === "all") return true;
    if (galleryFilter === "ai_generated") return !img.origin || img.origin === "ai_generated";
    if (galleryFilter === "found_existing") return img.origin === "found_existing";
    if (galleryFilter === "reference_guided") return img.origin === "reference_guided";
    return true;
  });

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col bg-stone-50 font-ui overflow-hidden">
      {/* Top Header */}
      <div className="px-6 py-3.5 bg-white border-b border-stone-200 flex flex-wrap items-center justify-between gap-4 shrink-0 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold shadow-2xs">
            <ImageIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-stone-900">Manga Studio · KAIST</h2>
              <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Story Art
              </span>
            </div>
            <p className="text-xs text-stone-500">
              Tạo panel manga, nhân vật, phân cảnh và bìa truyện với continuity nhất quán
            </p>
          </div>
        </div>

        {activeProject && (
          <div className="text-xs px-3 py-1.5 bg-stone-100 border border-stone-200 rounded-xl text-stone-700 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-stone-500" />
            <span>Dự án: <strong>{activeProject.title}</strong></span>
          </div>
        )}
      </div>

      {/* Mode Navigation Bar */}
      <div className="bg-white border-b border-stone-200 px-6 py-2 flex items-center gap-2 shrink-0">
        <span className="text-xs font-semibold text-stone-500 mr-2">Ảnh cho truyện:</span>
        <button
          onClick={() => setActiveTab("ai_create")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === "ai_create"
              ? "bg-amber-500 text-white shadow-2xs"
              : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          1. Vẽ manga / ảnh truyện
        </button>


        <button
          onClick={() => setActiveTab("reference_guided")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === "reference_guided"
              ? "bg-emerald-600 text-white shadow-2xs"
              : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          2. Tạo từ ảnh tham khảo
        </button>
      </div>

      {/* Main Container */}
      <div className="flex-1 overflow-y-auto p-6 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Interactive Control Panel */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          
          {/* TAB 1: TẠO ẢNH AI MỚI */}
          {activeTab === "ai_create" && (
            <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-2xs flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  Manga & Story Image Generator
                </h3>
                <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 font-semibold px-2 py-0.5 rounded-md">
                  Gemini Image + AI Fallback
                </span>
              </div>

              {/* Purpose Selector */}
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1.5">
                  Mục đích sử dụng:
                </label>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  {[
                    { id: "cover", label: "Bìa sách" },
                    { id: "character", label: "Nhân vật" },
                    { id: "scene", label: "Phân cảnh" },
                    { id: "manga", label: "Manga / Comic" },
                  ].map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setCategory(c.id as any)}
                      className={`py-2 px-1 rounded-xl border text-center text-[11px] transition-all ${
                        category === c.id
                          ? "bg-amber-50 border-amber-400 text-amber-950 font-bold shadow-2xs"
                          : "bg-white border-stone-200 text-stone-700 hover:bg-stone-50"
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Concept Prompt Input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-stone-700">
                    Mô tả ý niệm cốt lõi:
                  </label>
                  <span className="text-[10px] text-stone-400">Bám sát chủ thể & màu sắc</span>
                </div>
                <textarea
                  rows={3}
                  value={concept}
                  onChange={(e) => setConcept(e.target.value)}
                  placeholder="Ví dụ: Vị vua bóng tối ngồi trên ngai vàng, uy quyền, ánh sáng tím, phù hợp làm bìa truyện dọc..."
                  className="w-full text-xs p-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white resize-none leading-relaxed transition-all"
                />
                
                {/* Quick Prompt Ideas */}
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {[
                    "Vị vua bóng tối ngồi trên ngai vàng, uy quyền, ánh sáng tím",
                    "Nữ pháp sư điều khiển tinh vân ngân hà",
                    "Kiếm khách áo đen cô độc trên đỉnh núi tuyết",
                    "Thành phố cổ cyberpunk trong mưa rào",
                  ].map((sample, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setConcept(sample)}
                      className="text-[10px] text-stone-500 bg-stone-100 hover:bg-amber-50 hover:text-amber-800 px-2 py-0.5 rounded-md transition-colors"
                    >
                      + {sample}
                    </button>
                  ))}
                </div>
              </div>

              {/* Book Cover Typography Overlay */}
              {category === "cover" && (
                <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/80 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-amber-700" />
                      Chữ hiển thị trên bìa sách:
                    </span>
                    <label className="flex items-center gap-1.5 text-xs text-amber-900 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showOverlay}
                        onChange={(e) => setShowOverlay(e.target.checked)}
                        className="rounded text-amber-600 focus:ring-amber-500"
                      />
                      <span>Bật lớp chữ</span>
                    </label>
                  </div>

                  {showOverlay && (
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="text-[11px] text-stone-600 block mb-1">Tựa đề sách:</label>
                        <input
                          type="text"
                          value={customTitle}
                          onChange={(e) => setCustomTitle(e.target.value)}
                          placeholder="VD: Đế Vương Hắc Ám"
                          className="w-full text-xs p-2 bg-white border border-amber-200 rounded-lg text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-stone-600 block mb-1">Tên tác giả:</label>
                        <input
                          type="text"
                          value={customAuthor}
                          onChange={(e) => setCustomAuthor(e.target.value)}
                          placeholder="VD: Cổ Long / Minh Đức"
                          className="w-full text-xs p-2 bg-white border border-amber-200 rounded-lg text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Style & Ratio */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Phong cách nghệ thuật:
                  </label>
                  <select
                    value={style}
                    onChange={(e) => setStyle(e.target.value as any)}
                    className="w-full text-xs p-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="cinematic">Cinematic điện ảnh (35mm)</option>
                    <option value="digital_art">Digital Art kỳ ảo</option>
                    <option value="anime">Anime / Manga sắc nét</option>
                    <option value="oil_painting">Sơn dầu cổ điển</option>
                    <option value="concept_art">Concept Art ý niệm</option>
                    <option value="flat_minimal">Tối giản (Minimalist)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Tỉ lệ khung hình:
                  </label>
                  <select
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value as any)}
                    className="w-full text-xs p-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="3:4">3:4 (Bìa sách chuẩn)</option>
                    <option value="4:5">4:5 (Mạng xã hội / sản phẩm)</option>
                    <option value="1:1">1:1 (Avatar / Vuông)</option>
                    <option value="16:9">16:9 (Phong cảnh điện ảnh)</option>
                    <option value="9:16">9:16 (Story / Bìa đứng)</option>
                    <option value="4:3">4:3 (Mỹ thuật tiêu chuẩn)</option>
                  </select>
                </div>
              </div>

              {/* Lighting & Contrast Controls - Anti-Dark Fix */}
              <div className="p-3 bg-amber-50/40 rounded-xl border border-amber-200/60 flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-amber-700" />
                    Thiết lập ánh sáng & tương phản
                  </span>
                  <span className="text-[10px] text-amber-800 bg-amber-100/60 font-semibold px-2 py-0.5 rounded-md">
                    Chống tối ảnh
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[11px] text-stone-600 block mb-1">Môi trường ánh sáng:</label>
                    <select
                      value={lighting}
                      onChange={(e) => setLighting(e.target.value)}
                      className="w-full text-xs p-2 bg-white border border-stone-200 rounded-lg text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    >
                      <option value="balanced">Cân bằng tự nhiên (Sáng rõ)</option>
                      <option value="studio_soft">Studio 3 điểm (Mềm mại, không tối)</option>
                      <option value="bright_daylight">Ban ngày trong trẻo (High Key)</option>
                      <option value="warm">Hoàng hôn / Golden Hour (Ấm)</option>
                      <option value="dramatic_rim">Đèn viền Rim Light điện ảnh</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-stone-600 block mb-1">Độ tương phản (Contrast):</label>
                    <select
                      value={contrast}
                      onChange={(e) => setContrast(e.target.value)}
                      className="w-full text-xs p-2 bg-white border border-stone-200 rounded-lg text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    >
                      <option value="balanced">Cân bằng (Bảo tồn chi tiết tối)</option>
                      <option value="gentle">Dịu nhẹ (Soft / Low Contrast)</option>
                      <option value="dynamic">Dải động cao (HDR)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                disabled={!concept.trim() || generationStatus === "refining" || generationStatus === "rendering"}
                onClick={handleGenerateAI}
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                {generationStatus === "refining" || generationStatus === "rendering" ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{statusMessage}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Tạo hình ảnh với AI Diffusion</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* TAB 2: TÌM ẢNH CÓ SẴN (BẢN QUYỀN MỞ) */}
          {activeTab === "find_existing" && (
            <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-2xs flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
                  <Search className="w-4 h-4 text-blue-600" />
                  Chế Độ 2: Tìm Ảnh Có Sẵn
                </h3>
                <span className="text-[10px] bg-blue-50 text-blue-800 border border-blue-200 font-semibold px-2 py-0.5 rounded-md">
                  Openverse & Wikimedia
                </span>
              </div>

              <p className="text-xs text-stone-500 leading-relaxed">
                Tìm kiếm hình ảnh mở đã được xác thực nguồn gốc và điều kiện sử dụng (Creative Commons, Public Domain), an toàn khi làm bìa hoặc quảng cáo.
              </p>

              {/* Search Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-stone-700">Từ khóa tìm kiếm:</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearchImages()}
                    placeholder="VD: vua bóng tối ngai vàng, thành phố cyberpunk..."
                    className="flex-1 text-xs p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                  />
                  <button
                    onClick={handleSearchImages}
                    disabled={!searchQuery.trim() || isSearching}
                    className="px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
                  >
                    {isSearching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    <span>Tìm kiếm</span>
                  </button>
                </div>

                {/* Quick Search Suggestions */}
                <div className="flex flex-wrap gap-1 mt-1">
                  {[
                    "Vua bóng tối ngai vàng uy quyền ánh sáng tím",
                    "Thành phố cổ cyberpunk trong đêm",
                    "Rừng sương mù ma thuật kỳ ảo",
                    "Chân dung kiếm khách áo choàng đen",
                  ].map((kw, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setSearchQuery(kw);
                      }}
                      className="text-[10px] text-stone-500 bg-stone-100 hover:bg-blue-50 hover:text-blue-800 px-2 py-0.5 rounded-md transition-colors"
                    >
                      {kw}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search Filters */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200/80 text-xs">
                <div>
                  <label className="text-[11px] font-semibold text-stone-600 block mb-1">
                    Loại hình ảnh:
                  </label>
                  <select
                    value={searchFilterType}
                    onChange={(e) => setSearchFilterType(e.target.value as any)}
                    className="w-full text-xs p-1.5 bg-white border border-stone-200 rounded-lg text-stone-800"
                  >
                    <option value="all">Tất cả định dạng</option>
                    <option value="photo">Ảnh chụp (Photograph)</option>
                    <option value="illustration">Minh họa / Số hóa</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-stone-600 block mb-1">
                    Điều kiện giấy phép:
                  </label>
                  <select
                    value={searchLicenseGroup}
                    onChange={(e) => setSearchLicenseGroup(e.target.value as any)}
                    className="w-full text-xs p-1.5 bg-white border border-stone-200 rounded-lg text-stone-800"
                  >
                    <option value="all">Mọi giấy phép Creative Commons</option>
                    <option value="commercial">Chỉ giấy phép cho phép thương mại</option>
                  </select>
                </div>
              </div>

              {/* Attribution Policy Notice */}
              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200/70 text-[11px] text-blue-900 leading-relaxed flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold">Chính sách bản quyền minh bạch:</strong> Ảnh tìm thấy luôn hiển thị đầy đủ tên tác giả, liên kết đến trang nguồn và điều kiện cấp phép. Bạn có thể lưu vào Studio KAIST hoặc dùng làm ảnh tham khảo cho AI.
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TẠO TỪ ẢNH THAM KHẢO */}
          {activeTab === "reference_guided" && (
            <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-2xs flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-600" />
                  Chế Độ 3: Tạo Từ Ảnh Tham Khảo
                </h3>
                <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold px-2 py-0.5 rounded-md">
                  Reference Conditioning
                </span>
              </div>

              <p className="text-xs text-stone-500 leading-relaxed">
                Sử dụng ảnh bạn tải lên hoặc chọn từ thư viện làm khuôn mẫu bố cục, bảng màu và ánh sáng để tạo biến thể mới.
              </p>

              {/* Reference Image Picker */}
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1.5">
                  Ảnh tham khảo đầu vào:
                </label>
                
                {refPreviewUrl ? (
                  <div className="relative rounded-xl overflow-hidden border-2 border-emerald-300 bg-stone-900 aspect-16/9 flex items-center justify-center">
                    <img
                      src={refPreviewUrl}
                      alt="Ảnh tham khảo"
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-stone-900/80 p-1 rounded-lg backdrop-blur-xs">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs text-white hover:text-emerald-400 px-2 py-0.5 font-medium"
                      >
                        Đổi ảnh khác
                      </button>
                      <button
                        onClick={() => {
                          setRefImageUrl("");
                          setRefPreviewUrl("");
                        }}
                        className="text-white hover:text-red-400 p-0.5"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-stone-300 hover:border-emerald-500 rounded-2xl p-6 text-center flex flex-col items-center justify-center gap-2 bg-stone-50 hover:bg-emerald-50/30 transition-all cursor-pointer"
                  >
                    <Upload className="w-6 h-6 text-stone-400" />
                    <span className="text-xs font-bold text-stone-700">Tải ảnh tham khảo lên từ máy</span>
                    <span className="text-[10px] text-stone-400">Hỗ trợ JPG, PNG, WEBP (tối đa 25MB)</span>
                  </div>
                )}
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                {/* Or pick from existing gallery */}
                {images.length > 0 && !refPreviewUrl && (
                  <div className="mt-2">
                    <span className="text-[11px] text-stone-500 block mb-1">Hoặc chọn từ tác phẩm trong Studio:</span>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {images.slice(0, 5).map((img) => (
                        <img
                          key={img.id}
                          src={img.imageUrl}
                          alt={img.prompt}
                          onClick={() => {
                            setRefImageUrl(img.imageUrl);
                            setRefPreviewUrl(img.imageUrl);
                          }}
                          className="w-12 h-14 object-cover rounded-lg border border-stone-200 hover:border-emerald-500 cursor-pointer transition-all shrink-0"
                          title={img.originalConcept || img.prompt}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Elements to Preserve Checkboxes */}
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1.5">
                  Đặc trưng muốn giữ lại từ ảnh tham khảo:
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { id: "composition", label: "Bố cục & Góc nhìn" },
                    { id: "palette", label: "Bảng màu & Tông sắc" },
                    { id: "lighting", label: "Hướng sáng & Đổ bóng" },
                    { id: "character", label: "Dáng điệu chủ thể" },
                    { id: "costume", label: "Kiểu dáng trang phục" },
                  ].map((el) => {
                    const isChecked = refPreserveElements.includes(el.id);
                    return (
                      <label
                        key={el.id}
                        className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer transition-all ${
                          isChecked
                            ? "bg-emerald-50 border-emerald-400 text-emerald-950 font-medium"
                            : "bg-white border-stone-200 text-stone-600 hover:bg-stone-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => togglePreserveElement(el.id)}
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="text-[11px]">{el.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Desired Modifications */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-stone-700">
                    Mô tả điều cần thay đổi hoặc thêm mới:
                  </label>
                  <span className="text-[10px] text-stone-400">Yếu tố sáng tạo mới</span>
                </div>
                <textarea
                  rows={2}
                  value={refModifications}
                  onChange={(e) => setRefModifications(e.target.value)}
                  placeholder="Ví dụ: Thay trang phục thành hoàng bào tím thêu rồng, đổi ánh sáng thành tím huyền bí, thêm vương miện gai đen..."
                  className="w-full text-xs p-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white resize-none leading-relaxed transition-all"
                />
              </div>

              {/* Style and Ratio for reference variant */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Phong cách biến thể:
                  </label>
                  <select
                    value={style}
                    onChange={(e) => setStyle(e.target.value as any)}
                    className="w-full text-xs p-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="cinematic">Cinematic điện ảnh</option>
                    <option value="digital_art">Digital Art kỳ ảo</option>
                    <option value="anime">Anime / Manga sắc nét</option>
                    <option value="oil_painting">Sơn dầu cổ điển</option>
                    <option value="concept_art">Concept Art ý niệm</option>
                    <option value="flat_minimal">Tối giản (Minimalist)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Tỉ lệ khung hình:
                  </label>
                  <select
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value as any)}
                    className="w-full text-xs p-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="3:4">3:4 (Bìa sách)</option>
                    <option value="4:5">4:5 (Mạng xã hội / sản phẩm)</option>
                    <option value="1:1">1:1 (Vuông)</option>
                    <option value="16:9">16:9 (Ngang)</option>
                    <option value="9:16">9:16 (Đứng)</option>
                  </select>
                </div>
              </div>

              {/* Honest AI Fidelity Disclaimer */}
              <div className="p-3 bg-stone-100 rounded-xl border border-stone-200 text-[11px] text-stone-700 leading-relaxed">
                <span className="font-semibold text-stone-900">Cam kết trung thực:</span> Mô hình nhận diện ảnh tham khảo qua kênh truyền visual để học hỏi bố cục và ánh sáng. Hệ thống không cam kết giữ nguyên khuôn mặt hoặc chi tiết 1:1, mà tạo ra tác phẩm phái sinh hài hòa.
              </div>

              {/* Action Button */}
              <button
                disabled={!refImageUrl || generationStatus === "refining" || generationStatus === "rendering"}
                onClick={handleGenerateReferenceGuided}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                {generationStatus === "refining" || generationStatus === "rendering" ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{statusMessage}</span>
                  </>
                ) : (
                  <>
                    <Layers className="w-4 h-4" />
                    <span>Tạo biến thể từ ảnh tham khảo</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Error Message Box */}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">{errorMessage}</p>
                <button                  onClick={() => {
                    setErrorMessage(null);
                    if (activeTab === "ai_create") handleGenerateAI();
                    else if (activeTab === "find_existing") handleSearchImages();
                    else handleGenerateReferenceGuided();
                  }}
                  className="mt-1 text-red-700 underline font-medium hover:text-red-900"
                >
                  Thử lại thao tác
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Section: Results or Gallery */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          
          {/* If Mode 2 is active and has search results, show Search Results first */}
          {activeTab === "find_existing" && searchHasRun && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                    Kết quả tìm kiếm ảnh có sẵn ({searchResults.length})
                  </h3>
                  <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
                    Xác thực bản quyền
                  </span>
                </div>
                <span className="text-[11px] text-stone-500">
                  Từ khóa: &ldquo;{searchQuery}&rdquo;
                </span>
              </div>

              {searchResults.length === 0 ? (
                <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center flex flex-col items-center justify-center gap-2">
                  <Search className="w-8 h-8 text-stone-300" />
                  <p className="text-xs font-semibold text-stone-700">Không tìm thấy ảnh phù hợp từ khóa này</p>
                  <p className="text-[11px] text-stone-400">Hãy thử nhập từ khóa khái quát hơn (VD: "king throne", "fantasy castle")</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {searchResults.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-2xs hover:border-blue-300 transition-all flex flex-col justify-between"
                    >
                      <div className="relative aspect-3/4 overflow-hidden bg-stone-900 group">
                        <img
                          src={item.thumbnailUrl}
                          alt={item.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />

                        {/* Badges */}
                        <div className="absolute top-2 left-2 flex flex-col gap-1 pointer-events-none">
                          <span className="bg-blue-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-md shadow-2xs">
                            Ảnh có sẵn
                          </span>
                          <span className="bg-stone-900/80 text-white text-[9px] font-medium px-2 py-0.5 rounded-md backdrop-blur-xs">
                            {item.licenseCode}
                          </span>
                        </div>

                        {/* Commercial permission badge */}
                        <div className="absolute top-2 right-2 pointer-events-none">
                          {item.isCommercialAllowed ? (
                            <span className="bg-emerald-600/90 text-white text-[9px] font-semibold px-2 py-0.5 rounded-md backdrop-blur-xs flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3" />
                              Thương mại OK
                            </span>
                          ) : (
                            <span className="bg-amber-600/90 text-white text-[9px] font-semibold px-2 py-0.5 rounded-md backdrop-blur-xs flex items-center gap-1">
                              <ShieldAlert className="w-3 h-3" />
                              Phi thương mại
                            </span>
                          )}
                        </div>

                        {/* Source Landing Link */}
                        <a
                          href={item.sourceLandingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="absolute bottom-2 left-2 bg-stone-900/80 hover:bg-stone-900 text-white text-[10px] px-2 py-1 rounded-lg backdrop-blur-xs flex items-center gap-1 transition-colors"
                        >
                          <span>Nguồn: {item.provider.split(" ")[0]}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>

                      {/* Content Info */}
                      <div className="p-3 text-xs flex flex-col gap-2">
                        <h4 className="font-semibold text-stone-900 text-xs line-clamp-1">
                          {item.title}
                        </h4>
                        <div className="text-[11px] text-stone-500 flex flex-col gap-0.5">
                          <div>Tác giả: <strong>{item.author}</strong></div>
                          <div>Giấy phép: <span className="font-mono text-[10px]">{item.licenseName}</span></div>
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-1">
                          <button
                            onClick={() => handleSaveFoundImage(item)}
                            disabled={savingFoundId === item.id}
                            className="text-[11px] font-bold text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                          >
                            {savingFoundId === item.id ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              <Bookmark className="w-3 h-3" />
                            )}
                            <span>Lưu vào Studio</span>
                          </button>

                          <button
                            onClick={() => handleUseFoundAsReference(item)}
                            className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                            title="Chuyển sang chế độ tạo từ ảnh tham khảo"
                          >
                            <Layers className="w-3 h-3" />
                            <span>Dùng làm tham khảo</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Project Studio Gallery (Permanent Collections) */}
          <div className="flex flex-col gap-3 mt-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                  Bộ sưu tập trong Studio ({filteredImages.length})
                </h3>
              </div>

              {/* Gallery Filter Chips */}
              <div className="flex items-center gap-1 text-[11px]">
                {[
                  { id: "all", label: "Tất cả" },
                  { id: "ai_generated", label: "AI tạo mới" },
                  { id: "found_existing", label: "Ảnh có sẵn" },
                  { id: "reference_guided", label: "Từ tham khảo" },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setGalleryFilter(f.id as any)}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      galleryFilter === f.id
                        ? "bg-stone-900 text-white font-bold"
                        : "bg-white border border-stone-200 text-stone-600 hover:bg-stone-50"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {filteredImages.length === 0 ? (
              <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-stone-800">Chưa có tác phẩm nào trong mục này</h4>
                <p className="text-xs text-stone-500 max-w-sm leading-relaxed">
                  Sử dụng các chế độ ở bảng điều khiển bên trái để tạo ảnh AI, tìm ảnh có sẵn hoặc dùng ảnh tham khảo.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredImages.map((img) => (
                  <div
                    key={img.id}
                    className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-2xs group flex flex-col justify-between hover:border-amber-300 transition-all"
                  >
                    {/* Image Canvas with optional typography overlay */}
                    <div className="relative aspect-3/4 overflow-hidden bg-stone-900 select-none">
                      <img
                        src={img.imageUrl}
                        alt={img.prompt}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />

                      {/* Book Cover Typography Overlay */}
                      {img.showOverlay && (img.titleOverlay || img.authorOverlay) && (
                        <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none bg-linear-to-b from-stone-950/70 via-transparent to-stone-950/80">
                          {img.titleOverlay && (
                            <div className="pt-2 text-center">
                              <h2 className="font-serif font-extrabold text-white text-base sm:text-lg tracking-wider drop-shadow-md uppercase line-clamp-2">
                                {img.titleOverlay}
                              </h2>
                              <div className="w-8 h-0.5 bg-amber-400 mx-auto mt-1 opacity-80" />
                            </div>
                          )}
                          {img.authorOverlay && (
                            <div className="pb-1 text-center">
                              <span className="text-[10px] text-amber-200 font-serif tracking-widest uppercase drop-shadow-sm">
                                Tác giả: {img.authorOverlay}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Origin Badges */}
                      <div className="absolute top-2 left-2 flex flex-col gap-1 pointer-events-none">
                        {img.origin === "found_existing" ? (
                          <span className="bg-blue-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-md shadow-2xs">
                            Ảnh có sẵn
                          </span>
                        ) : img.origin === "reference_guided" ? (
                          <span className="bg-emerald-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-md shadow-2xs">
                            Biến thể từ tham khảo
                          </span>
                        ) : (
                          <span className="bg-purple-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-md shadow-2xs">
                            AI Diffusion
                          </span>
                        )}

                        <span className="bg-stone-900/80 text-white text-[9px] font-medium px-2 py-0.5 rounded-md backdrop-blur-xs">
                          {STYLE_LABELS[img.style]?.badge || img.style}
                        </span>

                        <span className="bg-stone-900/70 text-amber-300 text-[8px] font-mono px-1.5 py-0.5 rounded-md backdrop-blur-xs">
                          {img.isUpscaled
                            ? `Upscaled ${typeof img.upscaledResolution === 'object' ? `${img.upscaledResolution.width}×${img.upscaledResolution.height}` : (img.upscaledResolution || "2X")}`
                            : (typeof img.nativeResolution === 'object' ? `${img.nativeResolution.width}×${img.nativeResolution.height}` : (img.nativeResolution || (img.aspectRatio === "1:1" ? "1024×1024" : "768×1024")))}
                        </span>
                      </div>

                      {/* Hover Quick Actions */}
                      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-stone-900/70 p-1 rounded-lg backdrop-blur-xs">
                        <button
                          onClick={() => setActivePreviewImage(img)}
                          className="text-white hover:text-amber-400 p-1"
                          title="Xem chi tiết & giấy phép"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDownload(img)}
                          className="text-white hover:text-amber-400 p-1"
                          title="Tải ảnh về máy"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteImage(img.id)}
                          disabled={deletingId === img.id}
                          className="text-white hover:text-red-400 p-1"
                          title="Xóa ảnh"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Metadata & Attribution Details */}
                    <div className="p-3 text-xs flex flex-col gap-2">
                      <div className="font-semibold text-stone-900 text-xs line-clamp-1">
                        {img.originalConcept || img.prompt}
                      </div>
                      
                      <p className="text-stone-500 line-clamp-2 leading-relaxed text-[11px]">
                        {img.description || img.prompt}
                      </p>

                      {/* Attribution Info if found image */}
                      {img.sourceMeta && (
                        <div className="text-[10px] bg-stone-50 p-2 rounded-lg border border-stone-200/60 text-stone-600 flex flex-col gap-0.5">
                          <div>Nguồn: <strong>{img.sourceMeta.sourceType}</strong> | Tác giả: {img.sourceMeta.author || "Không rõ"}</div>
                          <div>Giấy phép: <span className="font-mono text-stone-800">{img.sourceMeta.licenseName || img.sourceMeta.licenseCode}</span></div>
                          {img.sourceMeta.sourceLandingUrl && (
                            <a
                              href={img.sourceMeta.sourceLandingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline flex items-center gap-0.5 mt-0.5"
                            >
                              <span>Xem trang nguồn gốc</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                      )}

                      {/* Reference guide notice if applicable */}
                      {img.referenceGuide && (
                        <div className="text-[10px] bg-emerald-50 p-2 rounded-lg border border-emerald-200/60 text-emerald-900">
                          <strong>Đặc trưng bảo lưu:</strong> {img.referenceGuide.preserveElements.join(", ")}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[10px] text-stone-400 pt-2 border-t border-stone-100">
                        <span>Tỉ lệ: {img.aspectRatio || "3:4"}</span>
                        <div className="flex items-center gap-2">
                          {img.origin !== "found_existing" && !img.isUpscaled && (
                            <button
                              disabled={upscalingId === img.id}
                              onClick={() => handleUpscale(img, 2)}
                              className="text-amber-700 hover:text-amber-800 font-bold flex items-center gap-0.5"
                              title="Nâng độ nét 2X (AI Upscale)"
                            >
                              {upscalingId === img.id ? (
                                <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                              ) : (
                                <Zap className="w-2.5 h-2.5" />
                              )}
                              <span>2X</span>
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setRefImageUrl(img.imageUrl);
                              setRefPreviewUrl(img.imageUrl);
                              setActiveTab("reference_guided");
                            }}
                            className="text-emerald-700 hover:text-emerald-800 font-bold"
                          >
                            Làm tham khảo
                          </button>
                          <button
                            onClick={() => handleDownload(img)}
                            className="text-amber-600 hover:text-amber-700 font-bold flex items-center gap-0.5"
                          >
                            <Download className="w-3 h-3" />
                            Tải về
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fullscreen Preview & Attribution Modal */}
      {activePreviewImage && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col md:flex-row shadow-2xl">
            {/* Left Preview Image */}
            <div className="relative md:w-1/2 bg-stone-900 flex items-center justify-center overflow-hidden min-h-[300px]">
              <img
                src={activePreviewImage.imageUrl}
                alt={activePreviewImage.prompt}
                className="max-h-[85vh] w-full object-contain"
              />
              {activePreviewImage.showOverlay && (activePreviewImage.titleOverlay || activePreviewImage.authorOverlay) && (
                <div className="absolute inset-0 flex flex-col justify-between p-6 pointer-events-none bg-linear-to-b from-stone-950/60 via-transparent to-stone-950/70">
                  {activePreviewImage.titleOverlay && (
                    <div className="pt-4 text-center">
                      <h2 className="font-serif font-black text-white text-xl md:text-2xl tracking-wider drop-shadow-lg uppercase">
                        {activePreviewImage.titleOverlay}
                      </h2>
                    </div>
                  )}
                  {activePreviewImage.authorOverlay && (
                    <div className="pb-2 text-center">
                      <span className="text-xs text-amber-300 font-serif tracking-widest uppercase drop-shadow-md">
                        {activePreviewImage.authorOverlay}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Information */}
            <div className="md:w-1/2 p-6 flex flex-col justify-between overflow-y-auto">
              <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      {activePreviewImage.origin === "found_existing" ? (
                        <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-md">
                          Ảnh có sẵn
                        </span>
                      ) : activePreviewImage.origin === "reference_guided" ? (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md">
                          Biến thể từ tham khảo
                        </span>
                      ) : (
                        <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded-md">
                          AI Diffusion
                        </span>
                      )}
                      <span className="text-[10px] bg-stone-100 text-stone-700 font-bold px-2 py-0.5 rounded-md">
                        {STYLE_LABELS[activePreviewImage.style]?.label || activePreviewImage.style}
                      </span>
                    </div>
                    <h3 className="font-bold text-stone-900 text-base mt-2">
                      {activePreviewImage.originalConcept || "Tác phẩm hình ảnh"}
                    </h3>
                  </div>
                  <button
                    onClick={() => setActivePreviewImage(null)}
                    className="p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Attribution Box for Found Images */}
                {activePreviewImage.sourceMeta && (
                  <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-950 flex flex-col gap-1.5">
                    <div className="font-bold flex items-center gap-1.5 text-blue-900">
                      <ShieldCheck className="w-4 h-4 text-blue-700" />
                      Thông tin bản quyền & nguồn gốc xác thực
                    </div>
                    <div>Tác giả: <strong>{activePreviewImage.sourceMeta.author || "Cộng đồng tác giả"}</strong></div>
                    <div>Giấy phép: <strong>{activePreviewImage.sourceMeta.licenseName || activePreviewImage.sourceMeta.licenseCode}</strong></div>
                    <div>Thương mại: <strong>{activePreviewImage.sourceMeta.isCommercialAllowed ? "Cho phép thương mại (Commercial Allowed)" : "Chỉ phi thương mại"}</strong></div>
                    {activePreviewImage.sourceMeta.sourceLandingUrl && (
                      <a
                        href={activePreviewImage.sourceMeta.sourceLandingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-700 underline font-semibold flex items-center gap-1 mt-1"
                      >
                        <span>Mở liên kết nguồn gốc kiểm chứng</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                )}

                {/* Reference Guide Box */}
                {activePreviewImage.referenceGuide && (
                  <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-950 flex flex-col gap-1">
                    <div className="font-bold text-emerald-900">Chi tiết tạo từ ảnh tham khảo:</div>
                    <div>Đặc trưng bảo lưu: <strong>{activePreviewImage.referenceGuide.preserveElements.join(", ")}</strong></div>
                    <div>Thay đổi yêu cầu: <em>{activePreviewImage.referenceGuide.modificationsDescription}</em></div>
                    <div className="text-[10px] text-emerald-800 mt-1">{activePreviewImage.referenceGuide.fidelityNotice}</div>
                  </div>
                )}

                <div>
                  <label className="text-[11px] font-bold text-stone-500 uppercase">Mô tả tác phẩm</label>
                  <p className="text-xs text-stone-700 mt-1 leading-relaxed">
                    {activePreviewImage.description}
                  </p>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-stone-500 uppercase">Prompt AI đầy đủ</label>
                  <p className="text-xs font-mono bg-stone-50 p-3 rounded-xl border border-stone-200 text-stone-800 mt-1 leading-relaxed">
                    {activePreviewImage.prompt}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs text-stone-600 bg-stone-50 p-3 rounded-xl border border-stone-200">
                  <div>Tỉ lệ: <strong>{activePreviewImage.aspectRatio || "3:4"}</strong></div>
                  <div>
                    Độ phân giải:{" "}
                    <strong className="text-amber-700">
                      {activePreviewImage.isUpscaled
                        ? `${activePreviewImage.upscaledResolution || "1536×2048"} (Đã nâng cấp ${activePreviewImage.upscaleFactor || 2}X)`
                        : `${activePreviewImage.nativeResolution || (activePreviewImage.aspectRatio === "1:1" ? "1024×1024" : "768×1024")} (Gốc)`}
                    </strong>
                  </div>
                  <div>Mô hình: <strong>{activePreviewImage.modelUsed || "Flux-Diffusion-v1"}</strong></div>
                  <div>Ánh sáng: <strong>{activePreviewImage.lighting || "Cân bằng tiêu chuẩn"}</strong></div>
                  <div>Mã tác vụ: <strong className="font-mono text-[10px]">{activePreviewImage.taskId || activePreviewImage.id}</strong></div>
                  <div>Thời gian: <strong>{new Date(activePreviewImage.createdAt).toLocaleDateString("vi-VN")}</strong></div>
                </div>

                {/* AI Polish & Upscaling Toolbar */}
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-600" />
                      Công cụ hậu kỳ & tinh chỉnh ánh sáng
                    </span>
                    {activePreviewImage.isUpscaled && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md">
                        Đã nâng độ phân giải
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {/* Native Upscale 2X Button */}
                    <button
                      disabled={upscalingId === activePreviewImage.id}
                      onClick={() => handleUpscale(activePreviewImage, 2)}
                      className="px-3 py-1.5 bg-white hover:bg-stone-100 border border-stone-300 text-stone-800 font-semibold rounded-lg text-xs flex items-center gap-1.5 shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {upscalingId === activePreviewImage.id ? (
                        <RefreshCw className="w-3 h-3 animate-spin text-amber-600" />
                      ) : (
                        <Sparkles className="w-3 h-3 text-amber-600" />
                      )}
                      <span>{activePreviewImage.isUpscaled ? "Nâng cấp lại 2X" : "Nâng độ nét 2X (AI Upscale)"}</span>
                    </button>

                    {/* Re-light: Brighten up */}
                    <button
                      onClick={() => handleIterateImage(activePreviewImage, "light_up")}
                      className="px-3 py-1.5 bg-white hover:bg-stone-100 border border-stone-300 text-stone-800 font-semibold rounded-lg text-xs flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                      title="Tăng cường ánh sáng và xóa vùng tối quá mức"
                    >
                      <Sun className="w-3 h-3 text-amber-500" />
                      <span>Làm sáng ảnh (Fill Light)</span>
                    </button>

                    {/* Re-light: Soften contrast */}
                    <button
                      onClick={() => handleIterateImage(activePreviewImage, "soften_contrast")}
                      className="px-3 py-1.5 bg-white hover:bg-stone-100 border border-stone-300 text-stone-800 font-semibold rounded-lg text-xs flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                      title="Làm dịu độ tương phản, bảo tồn bóng đổ tự nhiên"
                    >
                      <Contrast className="w-3 h-3 text-stone-600" />
                      <span>Làm dịu tương phản</span>
                    </button>
                  </div>
                </div>

                {/* Feedback & Evaluation (Quality Guardrail) */}
                <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/70 flex items-center justify-between gap-3 text-xs">
                  <div className="flex flex-col">
                    <span className="font-bold text-stone-900 text-xs">Đánh giá chất lượng ảnh</span>
                    <span className="text-[11px] text-stone-500">Giúp hệ thống học gu thẩm mỹ và ánh sáng ưa thích</span>
                  </div>

                  {feedbackSentId === activePreviewImage.id ? (
                    <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Đã ghi nhận phản hồi!
                    </span>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleFeedback(activePreviewImage, "positive", ["Anh_sang_tot", "Dung_concept"])}
                        className="px-2.5 py-1.5 bg-white hover:bg-emerald-50 border border-stone-200 hover:border-emerald-300 text-stone-700 hover:text-emerald-700 rounded-lg font-semibold flex items-center gap-1 shadow-2xs transition-colors"
                        title="Đẹp và đúng ý"
                      >
                        <ThumbsUp className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Hài lòng</span>
                      </button>
                      <button
                        onClick={() => handleFeedback(activePreviewImage, "negative", ["Anh_bi_toi", "Tuong_phan_gat"])}
                        className="px-2.5 py-1.5 bg-white hover:bg-rose-50 border border-stone-200 hover:border-rose-300 text-stone-700 hover:text-rose-700 rounded-lg font-semibold flex items-center gap-1 shadow-2xs transition-colors"
                        title="Ảnh quá tối hoặc chưa ưng ý"
                      >
                        <ThumbsDown className="w-3.5 h-3.5 text-rose-500" />
                        <span>Quá tối / Cần sửa</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-stone-200 flex items-center justify-between gap-3">
                <button
                  onClick={() => handleDeleteImage(activePreviewImage.id)}
                  className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Xóa ảnh
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(activePreviewImage.prompt, "modal_prompt")}
                    className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold transition-colors"
                  >
                    {copiedKey === "modal_prompt" ? "Đã chép" : "Chép Prompt"}
                  </button>
                  <button
                    onClick={() => handleDownload(activePreviewImage)}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Tải về máy
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};