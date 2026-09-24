import React, { useState } from "react";
import {
  Megaphone,
  Sparkles,
  Copy,
  Check,
  Share2,
  Video,
  FileText,
  Mail,
  Send,
  Plus,
  Layers,
  ChevronRight,
  TrendingUp,
  Bookmark,
  Calendar,
} from "lucide-react";
import { BrandProfile, MarketingContentItem, StoryProject } from "../types";
import { api } from "../services/api";

interface ContentStudioViewProps {
  brands: BrandProfile[];
  contentList: MarketingContentItem[];
  activeProject: StoryProject | null;
  onContentUpdated: (items: MarketingContentItem[]) => void;
  onNavigateToCalendar: () => void;
}

export const ContentStudioView: React.FC<ContentStudioViewProps> = ({
  brands,
  contentList,
  activeProject,
  onContentUpdated,
  onNavigateToCalendar,
}) => {
  const [format, setFormat] = useState<"social_post" | "video_script" | "seo_blog" | "email">("social_post");
  const [goal, setGoal] = useState<string>("Tăng tương tác độc giả");
  const [targetAudience, setTargetAudience] = useState<string>("Độc giả yêu thích truyện tiên hiệp, kỳ ảo, 18-35 tuổi");
  const [productInfo, setProductInfo] = useState<string>(
    activeProject
      ? `Tác phẩm: ${activeProject.title} — ${activeProject.description}`
      : "Cuốn sách mới ra mắt, tình tiết lôi cuốn, mở đầu với biến cố bí ẩn."
  );
  const [extraPrompt, setExtraPrompt] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedOutput, setGeneratedOutput] = useState<any | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    try {
      const result = await api.generateMarketing({
        brandId: brands[0]?.id,
        productInfo,
        format,
        platform: format === "video_script" ? "tiktok" : format === "social_post" ? "facebook" : "web",
        goal,
        targetAudience,
        extraPrompt,
      });
      setGeneratedOutput(result);

      // Save to list
      const savedItem = await api.createMarketingContent({
        brandId: brands[0]?.id,
        format,
        platform: format === "video_script" ? "tiktok" : "facebook",
        title: result.title || "Bài viết Marketing mới",
        body: result.bodyText || "",
        hook: result.hookVariations?.[0] || "",
        callToAction: result.callToAction || "",
        variations: (result.hookVariations || []).map((h: string) => ({
          angle: "A/B Hook",
          hook: h,
          body: result.bodyText || "",
        })),
        hashtags: result.hashtags || [],
        status: "drafting",
        targetAudience,
        goal,
      });
      onContentUpdated([savedItem, ...contentList]);
    } catch (err: any) {
      alert(err.message || "Lỗi tạo nội dung marketing");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col bg-stone-50/50 font-ui overflow-hidden">
      {/* Top Bar */}
      <div className="px-6 py-4 bg-white border-b border-stone-200 flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
            <Megaphone className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-stone-900">Content Studio & Marketing</h2>
            <p className="text-xs text-stone-500">
              Biến tác phẩm và câu chuyện thương hiệu thành bài viết Facebook, kịch bản video ngắn và bài SEO
            </p>
          </div>
        </div>

        <button
          onClick={onNavigateToCalendar}
          className="px-3.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold flex items-center gap-1.5"
        >
          <Calendar className="w-3.5 h-3.5" />
          Lên lịch đăng bài
        </button>
      </div>

      {/* Main Container */}
      <div className="flex-1 overflow-y-auto p-6 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Parameters */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-2xs flex flex-col gap-4">
            <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-rose-600" />
              Tùy Chọn Tạo Nội Dung
            </h3>

            {/* Format choice */}
            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1.5">
                Định dạng & Nền tảng:
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { id: "social_post", label: "Bài đăng Facebook", icon: Share2 },
                  { id: "video_script", label: "Kịch bản TikTok / Reels", icon: Video },
                  { id: "seo_blog", label: "Bài viết SEO Blog", icon: FileText },
                  { id: "email", label: "Email gửi độc giả", icon: Mail },
                ].map((f) => {
                  const Icon = f.icon;
                  return (
                    <button
                      key={f.id}
                      onClick={() => setFormat(f.id as any)}
                      className={`p-2.5 rounded-xl border flex items-center gap-2 text-left transition-all ${
                        format === f.id
                          ? "bg-rose-50 border-rose-300 text-rose-900 font-bold shadow-2xs"
                          : "bg-white border-stone-200 text-stone-700 hover:bg-stone-50"
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0 text-rose-600" />
                      <span>{f.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Target Audience */}
            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1">
                Chân dung độc giả / Khách hàng:
              </label>
              <input
                type="text"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                placeholder="Ví dụ: Độc giả trẻ yêu truyện bí ẩn..."
                className="w-full text-xs p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>

            {/* Goal */}
            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1">
                Mục tiêu chiến dịch:
              </label>
              <input
                type="text"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="Ví dụ: Kích thích sự tò mò đọc chương mới, bán sách giấy..."
                className="w-full text-xs p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>

            {/* Product / Novel Info */}
            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1">
                Thông tin tác phẩm / Sản phẩm cốt lõi:
              </label>
              <textarea
                rows={3}
                value={productInfo}
                onChange={(e) => setProductInfo(e.target.value)}
                placeholder="Nhập trích đoạn truyện, điểm nhấn kịch tính, hoặc thông điệp cốt lõi..."
                className="w-full text-xs p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 focus:outline-none focus:ring-1 focus:ring-rose-500 resize-none"
              />
            </div>

            {/* Extra prompt */}
            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1">
                Yêu cầu bổ sung:
              </label>
              <textarea
                rows={2}
                value={extraPrompt}
                onChange={(e) => setExtraPrompt(e.target.value)}
                placeholder="Ví dụ: Giọng văn dí dỏm, nhấn mạnh vào twist cuối chương, gắn CTA rõ ràng..."
                className="w-full text-xs p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 focus:outline-none focus:ring-1 focus:ring-rose-500 resize-none"
              />
            </div>

            {/* Generate Button */}
            <button
              disabled={isGenerating}
              onClick={handleGenerate}
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors"
            >
              {isGenerating ? (
                <>
                  <span className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>KAIST đang sáng tạo nội dung...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Tạo bài viết & Hook A/B ngay</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Output Area */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {generatedOutput ? (
            <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-md flex flex-col gap-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div>
                  <span className="text-[10px] font-bold text-rose-700 uppercase bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                    Nội dung hoàn chỉnh
                  </span>
                  <h3 className="font-extrabold text-stone-900 text-base mt-1">
                    {generatedOutput.title || "Bản nháp Marketing"}
                  </h3>
                </div>
                <button
                  onClick={() => handleCopy(generatedOutput.bodyText, "body")}
                  className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  {copiedKey === "body" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === "body" ? "Đã chép" : "Sao chép"}</span>
                </button>
              </div>

              {/* A/B Hooks */}
              {generatedOutput.hookVariations && generatedOutput.hookVariations.length > 0 && (
                <div className="p-4 bg-rose-50/50 rounded-xl border border-rose-200 flex flex-col gap-2">
                  <div className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-rose-600" />
                    3 Câu Hook thử nghiệm A/B:
                  </div>
                  <div className="space-y-2">
                    {generatedOutput.hookVariations.map((h: string, idx: number) => (
                      <div
                        key={idx}
                        className="p-2.5 bg-white rounded-lg border border-stone-200 text-xs text-stone-800 flex items-center justify-between gap-2"
                      >
                        <span>
                          <strong>Hook {idx + 1}:</strong> {h}
                        </span>
                        <button
                          onClick={() => handleCopy(h, `hook_${idx}`)}
                          className="p-1 text-stone-400 hover:text-stone-700"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Body Text */}
              <div className="text-xs text-stone-800 whitespace-pre-wrap leading-relaxed bg-stone-50 p-4 rounded-xl border border-stone-200">
                {generatedOutput.bodyText}
              </div>

              {/* Call to Action & Hashtags */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-100 text-xs">
                {generatedOutput.callToAction && (
                  <div className="text-rose-700 font-semibold">
                    CTA: {generatedOutput.callToAction}
                  </div>
                )}
                {generatedOutput.hashtags && (
                  <div className="flex flex-wrap gap-1">
                    {generatedOutput.hashtags.map((tag: string, i: number) => (
                      <span key={i} className="text-[11px] text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 border border-stone-200 text-center flex flex-col items-center justify-center text-stone-400 min-h-[400px]">
              <Megaphone className="w-12 h-12 text-stone-300 mb-3" />
              <h4 className="text-sm font-bold text-stone-700">Chưa tạo nội dung nào</h4>
              <p className="text-xs max-w-sm mt-1">
                Điền mục tiêu và bấm "Tạo bài viết & Hook A/B ngay" để KAIST sáng tác nội dung marketing chuẩn phong cách.
              </p>
            </div>
          )}

          {/* Recent Content Library */}
          <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-2xs">
            <h4 className="font-bold text-stone-900 text-xs uppercase tracking-wider mb-3">
              Bài viết gần đây ({contentList.length})
            </h4>
            <div className="divide-y divide-stone-100 max-h-48 overflow-y-auto">
              {contentList.map((item) => (
                <div key={item.id} className="py-2 flex items-center justify-between text-xs">
                  <div className="truncate pr-2">
                    <span className="font-semibold text-stone-800">{item.title}</span>
                    <span className="text-[10px] text-stone-400 ml-2">({item.platform})</span>
                  </div>
                  <span className="text-[10px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full capitalize">
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};