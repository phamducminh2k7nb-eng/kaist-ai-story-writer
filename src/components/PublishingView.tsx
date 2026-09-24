import React, { useMemo, useState } from "react";
import { Copy, Download, ExternalLink, Send, Sparkles, CheckCircle2, Link2, AlertCircle } from "lucide-react";
import { Chapter, StoryProject } from "../types";
import { api } from "../services/api";

interface PublishingViewProps {
  activeProject: StoryProject | null;
  chapters: Chapter[];
}

const PLATFORMS = [
  { name: "Wattpad", url: "https://www.wattpad.com/" },
  { name: "Inkitt", url: "https://www.inkitt.com/" },
  { name: "Royal Road", url: "https://www.royalroad.com/" },
  { name: "Webnovel", url: "https://www.webnovel.com/" },
  { name: "Amazon KDP", url: "https://kdp.amazon.com/" },
];

export const PublishingView: React.FC<PublishingViewProps> = ({ activeProject, chapters }) => {
  const [copied, setCopied] = useState(false);
  const [aiPackage, setAiPackage] = useState("");
  const [isPreparing, setIsPreparing] = useState(false);
  const completed = chapters.filter((c) => c.status === "completed" || (c.content || "").trim().length > 300);

  const fullText = useMemo(() => {
    if (!activeProject) return "";
    const ordered = [...chapters].sort((a, b) => (a.order || 0) - (b.order || 0));
    return [
      activeProject.title,
      activeProject.description || "",
      ...ordered.map((c) => `\n\n# ${c.title}\n\n${c.content || ""}`),
    ].join("\n");
  }, [activeProject, chapters]);

  const copyPackage = async () => {
    await navigator.clipboard.writeText(fullText);
    setCopied(true); setTimeout(() => setCopied(false), 1800);
  };

  const downloadTxt = () => {
    const blob = new Blob([fullText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `${activeProject?.title || "KAIST-truyen"}.txt`; a.click(); URL.revokeObjectURL(url);
  };

  const prepareWithAI = async () => {
    if (!activeProject) return;
    setIsPreparing(true);
    try {
      const result = await api.sendChatMessage({
        message: `Hãy chuẩn bị gói xuất bản cho truyện "${activeProject.title}". Viết: mô tả bán hàng ngắn, giới thiệu truyện, 8-12 từ khóa, cảnh báo nội dung nếu cần, lịch đăng 4 tuần và checklist trước khi xuất bản. Không bịa điều khoản hay mức tiền của bất kỳ nền tảng nào.`,
        projectId: activeProject.id,
        mode: "serial",
        workflowDepth: "quick",
      });
      setAiPackage(result.text || "");
    } catch (e:any) {
      setAiPackage(e?.message || "Không thể chuẩn bị gói xuất bản lúc này.");
    } finally { setIsPreparing(false); }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-6xl mx-auto w-full">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div><div className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Publishing Agent</div><h1 className="text-xl font-extrabold text-zinc-900 dark:text-white mt-1">Tự đăng & hỗ trợ kiếm tiền từ truyện</h1><p className="text-sm text-zinc-500 mt-1">KAIST tự chuẩn bị bản thảo, metadata, lịch đăng và hàng đợi xuất bản. Khi có connector/API hợp lệ, Autopilot có thể tự gửi chương sang nền tảng đích; doanh thu vẫn phụ thuộc nền tảng, nội dung và người đọc.</p></div>
        <Send className="w-6 h-6 text-indigo-500 shrink-0" />
      </div>

      {!activeProject ? <div className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215] text-sm text-zinc-500">Chọn một dự án truyện trước.</div> : <>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215]"><div className="text-[11px] text-zinc-500">Truyện</div><div className="font-bold text-sm mt-1 truncate">{activeProject.title}</div></div>
          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215]"><div className="text-[11px] text-zinc-500">Chương có nội dung</div><div className="font-bold text-sm mt-1">{completed.length} / {chapters.length}</div></div>
          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215]"><div className="text-[11px] text-zinc-500">Trạng thái Agent</div><div className="font-bold text-sm mt-1 text-amber-600">Chờ kết nối nền tảng</div></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <section className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215]">
            <h2 className="font-bold text-sm flex items-center gap-2"><Sparkles className="w-4 h-4 text-indigo-500" />Gói xuất bản AI</h2>
            <p className="text-xs text-zinc-500 mt-1 mb-3">Tạo mô tả, từ khóa, lịch đăng và checklist riêng cho truyện.</p>
            <button onClick={prepareWithAI} disabled={isPreparing} className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold disabled:opacity-50">{isPreparing ? "AI đang chuẩn bị..." : "AI chuẩn bị gói xuất bản"}</button>
            {aiPackage && <div className="mt-3 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 text-xs whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto">{aiPackage}</div>}
            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={copyPackage} className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs flex items-center gap-1.5"><Copy className="w-3.5 h-3.5" />{copied ? "Đã chép toàn bộ truyện" : "Chép toàn bộ truyện"}</button>
              <button onClick={downloadTxt} className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs flex items-center gap-1.5"><Download className="w-3.5 h-3.5" />Xuất TXT</button>
            </div>
          </section>

          <section className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215]">
            <h2 className="font-bold text-sm flex items-center gap-2"><Link2 className="w-4 h-4 text-indigo-500" />Nơi đăng truyện</h2>
            <p className="text-xs text-zinc-500 mt-1 mb-3">Mở trang chính thức để kết nối/đăng. Chính sách kiếm tiền có thể thay đổi theo từng nền tảng.</p>
            <div className="space-y-2">
              {PLATFORMS.map((p) => <a key={p.name} href={p.url} target="_blank" rel="noreferrer" className="flex items-center justify-between p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-indigo-400 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 text-xs"><span className="font-semibold">{p.name}</span><ExternalLink className="w-3.5 h-3.5 text-zinc-400" /></a>)}
            </div>
            <div className="mt-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 text-[11px] text-amber-800 dark:text-amber-300 flex gap-2"><AlertCircle className="w-4 h-4 shrink-0" /><span>KAIST không giả vờ tự đăng nhập thay bạn. Với website/CMS riêng, cấu hình PUBLISH_WEBHOOK_URL để Agent tự POST chương đã duyệt. Wattpad/Webnovel/Inkitt chỉ tự đăng khi có connector/API được nền tảng cho phép.</span></div>
          </section>
        </div>

        <div className="mt-5 p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/60 dark:bg-emerald-950/20 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2"><CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" /><span>Luồng mới: AI bàn ý tưởng → tự viết chương → tạo storyboard/panel manga → xếp lịch → bạn duyệt hoặc Autopilot queue → Publisher Agent đăng khi connector hợp lệ.</span></div>
      </>}
    </div>
  );
};