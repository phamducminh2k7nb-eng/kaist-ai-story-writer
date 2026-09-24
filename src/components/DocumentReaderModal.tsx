import React, { useState } from "react";
import { X, FileText, Download, Copy, Check, Search, BookOpen, ExternalLink, ShieldCheck } from "lucide-react";
import { DocumentItem } from "../types";

interface DocumentReaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentItem | null;
  highlightExcerpt?: string;
  pageOrSection?: string;
}

export const DocumentReaderModal: React.FC<DocumentReaderModalProps> = ({
  isOpen,
  onClose,
  document: doc,
  highlightExcerpt,
  pageOrSection,
}) => {
  const [copied, setCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  if (!isOpen || !doc) return null;

  const content = doc.fullContent || doc.contentSnippet || "";

  const handleCopyContent = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const rawUrl = `/api/documents/raw/${doc.id}`;
    const a = document.createElement("a");
    a.href = rawUrl;
    a.download = doc.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-fade-in">
      <div
        className="bg-white border border-stone-200 rounded-2xl w-full max-w-3xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50/80">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-stone-900 text-base truncate max-w-md" title={doc.name}>
                  {doc.name}
                </h3>
                <span className="text-[11px] px-2 py-0.5 rounded-md font-mono font-medium uppercase bg-stone-200 text-stone-700">
                  {doc.fileType || "doc"}
                </span>
                {doc.status === "scanned_or_empty" && (
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-medium">
                    Bản scan/ảnh chụp
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-500 mt-0.5 flex items-center gap-2">
                <span>{((doc.sizeBytes || 0) / 1024).toFixed(1)} KB</span>
                <span>•</span>
                <span>{doc.wordCount ? `${doc.wordCount.toLocaleString()} từ` : "Đã số hóa"}</span>
                {pageOrSection && (
                  <>
                    <span>•</span>
                    <span className="text-blue-700 font-medium bg-blue-50 px-1.5 py-0.5 rounded">
                      Vị trí: {pageOrSection}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0 ml-2">
            <button
              type="button"
              onClick={handleDownload}
              className="p-2 text-stone-500 hover:text-stone-800 hover:bg-stone-200/60 rounded-xl transition-colors"
              title="Tải tệp về máy"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleCopyContent}
              className="p-2 text-stone-500 hover:text-stone-800 hover:bg-stone-200/60 rounded-xl transition-colors"
              title="Sao chép nội dung"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 rounded-xl transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Highlighted Excerpt Banner if opened from a specific citation */}
        {highlightExcerpt && (
          <div className="bg-amber-50/90 border-b border-amber-200/80 px-5 py-3">
            <div className="flex items-start gap-2">
              <BookOpen className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
                  Đoạn trích dẫn đối chiếu được AI viện dẫn:
                </span>
                <p className="text-xs font-serif italic text-amber-950 mt-1 leading-relaxed bg-white/70 p-2.5 rounded-lg border border-amber-200">
                  "{highlightExcerpt}"
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Summary banner */}
        {doc.summary && !highlightExcerpt && (
          <div className="bg-blue-50/70 border-b border-blue-100 px-5 py-2.5 text-xs text-blue-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="truncate">
              <strong className="font-semibold">Tóm tắt tài liệu:</strong> {doc.summary}
            </span>
          </div>
        )}

        {/* Search inside doc bar */}
        <div className="px-5 py-2 border-b border-stone-100 flex items-center gap-2 bg-white">
          <Search className="w-3.5 h-3.5 text-stone-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm từ khóa trong tài liệu này..."
            className="w-full text-xs text-stone-800 placeholder-stone-400 outline-hidden bg-transparent"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="text-stone-400 hover:text-stone-600 text-xs px-1"
            >
              Xóa
            </button>
          )}
        </div>

        {/* Document Content View */}
        <div className="p-5 overflow-y-auto flex-1 font-serif text-sm leading-relaxed text-stone-800 whitespace-pre-wrap selection:bg-amber-100 selection:text-amber-900 bg-stone-50/30">
          {content ? (
            searchTerm ? (
              // Simple highlight for search term
              content.split(new RegExp(`(${searchTerm.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")})`, "gi")).map(
                (part, i) =>
                  part.toLowerCase() === searchTerm.toLowerCase() ? (
                    <mark key={i} className="bg-yellow-200 text-stone-900 rounded px-0.5">
                      {part}
                    </mark>
                  ) : (
                    part
                  )
              )
            ) : highlightExcerpt && content.includes(highlightExcerpt) ? (
              // Highlight citation excerpt
              (() => {
                const parts = content.split(highlightExcerpt);
                return (
                  <>
                    {parts[0]}
                    <mark className="bg-amber-200 text-stone-900 rounded px-1 py-0.5 font-medium border border-amber-300">
                      {highlightExcerpt}
                    </mark>
                    {parts.slice(1).join(highlightExcerpt)}
                  </>
                );
              })()
            ) : (
              content
            )
          ) : (
            <div className="py-12 text-center text-stone-400 font-sans text-xs">
              <FileText className="w-8 h-8 mx-auto mb-2 text-stone-300" />
              Tài liệu này chưa có nội dung văn bản trích xuất (có thể là tệp ảnh hoặc PDF chưa quét OCR).
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-stone-200 bg-stone-50 flex items-center justify-between text-xs text-stone-500 font-sans">
          <span>Quyền riêng tư: Chỉ người dùng đã đăng nhập mới có thể xem tài liệu này</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-800 hover:bg-stone-900 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};