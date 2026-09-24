import React, { useState } from "react";
import {
  FileText,
  Globe,
  ExternalLink,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Info,
} from "lucide-react";
import { SourceCitation } from "../types";

interface SourceCitationListProps {
  sources: SourceCitation[];
  onOpenDocument?: (docId?: string, title?: string, excerpt?: string, pageOrSection?: string) => void;
}

export const SourceCitationList: React.FC<SourceCitationListProps> = ({ sources, onOpenDocument }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  if (!sources || sources.length === 0) return null;

  const handleCopyLink = (url: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const documentSources = sources.filter(
    (s) => s.sourceType === "document" || Boolean(s.docId) || (s.url && s.url.startsWith("/api/documents"))
  );
  const webSources = sources.filter(
    (s) => s.sourceType === "web" || (s.url && s.url.startsWith("http")) || (!s.docId && !s.url?.startsWith("/api/documents"))
  );

  return (
    <div className="mt-3 pt-2.5 border-t border-stone-100 font-sans">
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 text-xs text-stone-600 font-semibold">
          <BookOpen className="w-3.5 h-3.5 text-amber-700" />
          <span>Căn cứ & Nguồn tham khảo ({sources.length})</span>
        </div>
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="inline-flex items-center gap-1 text-[11px] font-medium text-stone-500 hover:text-stone-800 transition-colors cursor-pointer py-0.5 px-1.5 rounded hover:bg-stone-100"
        >
          <span>{isExpanded ? "Thu gọn" : "Xem chi tiết"}</span>
          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* Compact view (badges) */}
      {!isExpanded && (
        <div className="flex flex-wrap gap-1.5">
          {sources.map((src, idx) => {
            const isDoc =
              src.sourceType === "document" ||
              Boolean(src.docId) ||
              (src.url && src.url.startsWith("/api/documents"));
            const hasLink = Boolean(src.url && src.url.startsWith("http"));

            return (
              <div
                key={idx}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all bg-stone-100/90 text-stone-700 hover:bg-stone-200/80 border border-stone-200/60"
              >
                {isDoc ? (
                  <FileText className="w-3 h-3 text-blue-600 shrink-0" />
                ) : (
                  <Globe className="w-3 h-3 text-emerald-600 shrink-0" />
                )}

                <span className="truncate max-w-[180px]" title={src.title}>
                  {src.title}
                </span>

                {src.pageOrSection && (
                  <span className="text-[10px] text-stone-500 bg-white/80 px-1 py-0.2 rounded border border-stone-200/50">
                    {src.pageOrSection}
                  </span>
                )}

                {isDoc && onOpenDocument && (
                  <button
                    type="button"
                    onClick={() => onOpenDocument(src.docId, src.title, src.excerpt, src.pageOrSection)}
                    className="ml-0.5 text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                    title="Mở nội dung tài liệu này"
                  >
                    Xem
                  </button>
                )}

                {hasLink && (
                  <a
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-0.5 text-stone-500 hover:text-stone-900"
                    title={`Mở liên kết: ${src.url}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Expanded detailed cards */}
      {isExpanded && (
        <div className="space-y-2.5 pt-1 animate-fade-in">
          {/* Document Sources Section */}
          {documentSources.length > 0 && (
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-blue-800/80 mb-1.5 flex items-center gap-1">
                <FileText className="w-3 h-3 text-blue-600" />
                <span>Tài liệu nội bộ đã đính kèm ({documentSources.length})</span>
              </div>
              <div className="space-y-1.5">
                {documentSources.map((src, idx) => (
                  <div
                    key={`doc_${idx}`}
                    className="bg-blue-50/50 border border-blue-100 rounded-xl p-2.5 text-xs text-stone-700"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-semibold text-stone-900 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span className="truncate">{src.title}</span>
                        {src.pageOrSection && (
                          <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-normal">
                            {src.pageOrSection}
                          </span>
                        )}
                      </div>
                      {onOpenDocument && (
                        <button
                          type="button"
                          onClick={() => onOpenDocument(src.docId, src.title, src.excerpt, src.pageOrSection)}
                          className="px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-[11px] font-medium transition-colors shrink-0 cursor-pointer flex items-center gap-1"
                        >
                          <span>Mở tài liệu</span>
                        </button>
                      )}
                    </div>

                    {src.excerpt && (
                      <div className="mt-1.5 p-2 bg-white rounded-lg border border-blue-100 text-[11px] text-stone-800 font-serif italic">
                        "{src.excerpt}"
                      </div>
                    )}

                    {src.supportPoint && (
                      <p className="mt-1 text-[11px] text-stone-600">
                        <strong className="text-stone-700">Luận điểm hỗ trợ:</strong> {src.supportPoint}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Web Sources Section */}
          {webSources.length > 0 && (
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-800/80 mb-1.5 flex items-center gap-1">
                <Globe className="w-3 h-3 text-emerald-600" />
                <span>Nguồn tham khảo bên ngoài ({webSources.length})</span>
              </div>
              <div className="space-y-1.5">
                {webSources.map((src, idx) => {
                  const hasLink = Boolean(src.url && src.url.startsWith("http"));
                  const isCopied = copiedUrl === src.url;

                  return (
                    <div
                      key={`web_${idx}`}
                      className="bg-emerald-50/40 border border-emerald-100 rounded-xl p-2.5 text-xs text-stone-700"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h5 className="font-semibold text-stone-900 flex items-center gap-1.5 truncate">
                            <Globe className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="truncate">{src.title}</span>
                          </h5>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-stone-500">
                            {src.domain && (
                              <span className="font-mono bg-white px-1.5 py-0.2 rounded border border-emerald-200/60 text-emerald-800 font-medium">
                                {src.domain}
                              </span>
                            )}
                            {src.author && <span>Tác giả: {src.author}</span>}
                            {src.date && <span>({src.date})</span>}
                          </div>
                        </div>

                        {hasLink ? (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[10px] font-medium border border-emerald-200/60">
                              <Check className="w-2.5 h-2.5" />
                              <span>URL an toàn</span>
                            </span>
                            <button
                              type="button"
                              onClick={(e) => handleCopyLink(src.url!, e)}
                              className="p-1.5 text-stone-500 hover:text-stone-800 hover:bg-white rounded-md transition-colors"
                              title="Sao chép liên kết"
                            >
                              {isCopied ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                            <a
                              href={src.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[11px] font-medium transition-colors"
                            >
                              <span>Mở nguồn</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 shrink-0">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-stone-100 text-stone-600 rounded-md text-[10px] font-medium border border-stone-200">
                              <span>Trích dẫn thư mục</span>
                            </span>
                          </div>
                        )}
                      </div>

                      {src.summary && (
                        <p className="mt-1.5 text-[11px] text-stone-600 leading-relaxed">
                          <strong className="text-stone-700">Tóm tắt:</strong> {src.summary}
                        </p>
                      )}

                      {src.supportPoint && (
                        <p className="mt-1 text-[11px] text-stone-600 leading-relaxed">
                          <strong className="text-stone-700">Giá trị dẫn chứng:</strong> {src.supportPoint}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};