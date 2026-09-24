import React, { useState } from "react";
import {
  FolderArchive,
  Upload,
  FileText,
  Trash2,
  ExternalLink,
  Tag,
  Search,
  CheckCircle,
  Sparkles,
} from "lucide-react";
import { DocumentItem } from "../types";
import { api } from "../services/api";

interface LibraryViewProps {
  documents: DocumentItem[];
  onDocumentsUpdated: (docs: DocumentItem[]) => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  documents,
  onDocumentsUpdated,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsProcessing(true);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        let fileType: "pdf" | "docx" | "txt" | "md" | "image" = "txt";
        if (file.name.endsWith(".pdf")) fileType = "pdf";
        else if (file.name.endsWith(".docx")) fileType = "docx";
        else if (file.name.endsWith(".md")) fileType = "md";
        else if (file.type.includes("image")) fileType = "image";

        let textContent = `Tài liệu tải lên: ${file.name} (Kích thước: ${(file.size / 1024).toFixed(1)} KB)`;
        if (file.type.includes("text") || file.name.endsWith(".txt") || file.name.endsWith(".md")) {
          textContent = await file.text();
        }

        const newDoc = await api.createDocument({
          name: file.name,
          fileType,
          sizeBytes: file.size,
          summary: `Tài liệu tham khảo bối cảnh và nghiên cứu: ${file.name}`,
          contentSnippet: textContent.slice(0, 5000),
          tags: ["Tài liệu mới", "Nghiên cứu"],
        });
        onDocumentsUpdated([newDoc, ...documents]);
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Lỗi khi tải tài liệu");
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredDocs = documents.filter((d) =>
    (d.name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col bg-stone-50/50 font-ui overflow-hidden">
      {/* Top Bar */}
      <div className="px-6 py-4 bg-white border-b border-stone-200 flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
            <FolderArchive className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-stone-900">Thư Viện Tài Liệu & Tri Thức</h2>
            <p className="text-xs text-stone-500">
              Kho tài liệu tham khảo bối cảnh, lịch sử và tư liệu sáng tác cho AI
            </p>
          </div>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm tài liệu..."
            className="pl-9 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 overflow-y-auto p-6 max-w-6xl mx-auto w-full flex flex-col gap-6">
        {/* Upload Dropzone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            handleFileUpload(e.dataTransfer.files);
          }}
          className={`border-2 border-dashed rounded-2xl p-8 text-center flex flex-col items-center justify-center transition-all ${
            isDragging
              ? "border-blue-500 bg-blue-50/60"
              : "border-stone-300 bg-white hover:border-stone-400"
          }`}
        >
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
            <Upload className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-stone-800">
            Kéo thả tệp tài liệu vào đây hoặc nhấp để tải lên
          </h3>
          <p className="text-xs text-stone-400 mt-1">
            Hỗ trợ văn bản PDF, DOCX, TXT, Markdown (Tối đa 25MB)
          </p>

          <label className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer transition-colors">
            Chọn tệp từ máy
            <input
              type="file"
              multiple
              className="hidden"
              onChange={(e) => handleFileUpload(e.target.files)}
            />
          </label>

          {isProcessing && (
            <div className="mt-3 text-xs text-blue-600 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
              Đang phân tích và trích xuất nội dung...
            </div>
          )}
        </div>

        {/* Documents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocs.map((doc) => (
            <div
              key={doc.id}
              className="bg-white rounded-2xl p-5 border border-stone-200 shadow-2xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="w-8 h-8 rounded-xl bg-stone-100 text-stone-700 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] text-stone-400 font-mono">
                    {((doc.sizeBytes || 1024) / 1024).toFixed(0)} KB
                  </span>
                </div>

                <h4 className="font-bold text-stone-900 text-sm mt-3 line-clamp-1">{doc.name}</h4>
                <p className="text-xs text-stone-500 mt-1.5 line-clamp-3 leading-relaxed">
                  {doc.summary || doc.contentSnippet}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
                <div className="flex flex-wrap gap-1">
                  {doc.tags?.slice(0, 2).map((t, i) => (
                    <span key={i} className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-medium">
                      {t}
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => {
                    const filtered = documents.filter((d) => d.id !== doc.id);
                    onDocumentsUpdated(filtered);
                  }}
                  className="text-stone-300 hover:text-red-600 p-1"
                  title="Xóa tài liệu"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};