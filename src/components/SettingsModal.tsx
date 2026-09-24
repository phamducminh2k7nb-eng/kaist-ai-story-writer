import React, { useState } from "react";
import {
  X,
  User,
  ShieldCheck,
  Download,
  Flame,
  Globe,
  Sliders,
  Sparkles,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { UserProfile } from "../types";
import { api } from "../services/api";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  onUserUpdated: (user: UserProfile) => void;
  onOpenGovernance?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  user,
  onUserUpdated,
  onOpenGovernance,
}) => {
  const [name, setName] = useState(user?.name || "");
  const [dailyGoal, setDailyGoal] = useState(user?.dailyGoalWords || 1500);
  const [timezone, setTimezone] = useState(user?.timezone || "Asia/Ho_Chi_Minh");
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updated = await api.updateProfile({
        name,
        dailyGoalWords: Number(dailyGoal),
        timezone,
      });
      onUserUpdated(updated);
      onClose();
    } catch (err: any) {
      alert(err.message || "Lỗi lưu cài đặt");
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const data = await api.exportAllData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `KAIST_Data_Backup_${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert("Lỗi xuất dữ liệu");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150 font-ui">
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-sm">Cài Đặt Tài Khoản & Cấu Hình AI</h3>
              <p className="text-[11px] text-stone-500">Quản lý hồ sơ tác giả và quyền riêng tư</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 p-1 rounded-lg hover:bg-stone-200/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col gap-5 text-xs max-h-[75vh] overflow-y-auto">
          {/* Google Authentication Status */}
          <div className="p-4 bg-emerald-50/70 rounded-xl border border-emerald-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"}
                alt="Avatar"
                className="w-10 h-10 rounded-full object-cover border border-emerald-300"
              />
              <div>
                <div className="font-bold text-emerald-950 text-sm">{user?.name}</div>
                <div className="text-emerald-700 text-[11px]">{user?.email}</div>
              </div>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-white px-2.5 py-1 rounded-md border border-emerald-300 shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Đã xác thực Google
            </div>
          </div>

          {/* Form Fields */}
          <div className="flex flex-col gap-4">
            <div>
              <label className="font-semibold text-stone-700 block mb-1">Tên tác giả / Bút danh:</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-stone-700 block mb-1">
                  Mục tiêu viết mỗi ngày (Từ):
                </label>
                <input
                  type="number"
                  value={dailyGoal}
                  onChange={(e) => setDailyGoal(Number(e.target.value))}
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Múi giờ làm việc:</label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="Asia/Ho_Chi_Minh">Việt Nam (GMT+7)</option>
                  <option value="Asia/Tokyo">Nhật Bản (GMT+9)</option>
                  <option value="America/New_York">New York (EST)</option>
                  <option value="Europe/Paris">Paris (CET)</option>
                </select>
              </div>
            </div>

            {/* Language Configuration Section */}
            <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 flex flex-col gap-3">
              <div className="font-bold text-stone-800 flex items-center gap-2">
                <Globe className="w-4 h-4 text-amber-600" />
                Cấu hình Đa ngôn ngữ (Tiếng Việt, English, 日本語, 한국어, 中文, Français)
              </div>
              <p className="text-[11px] text-stone-500">
                Tách riêng ngôn ngữ hiển thị, ngôn ngữ nhận diện đầu vào và quy tắc phản hồi của AI.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="text-[11px] font-semibold text-stone-700 block mb-1">
                    Ngôn ngữ giao diện:
                  </label>
                  <select
                    defaultValue="vi"
                    onChange={(e) => {
                      try {
                        const raw = localStorage.getItem("kaist_language_settings");
                        const current = raw ? JSON.parse(raw) : {};
                        current.uiLanguage = e.target.value;
                        localStorage.setItem("kaist_language_settings", JSON.stringify(current));
                      } catch (err) {}
                    }}
                    className="w-full p-2 bg-white border border-stone-200 rounded-lg text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="vi">Tiếng Việt</option>
                    <option value="en">English</option>
                    <option value="ja">日本語</option>
                    <option value="ko">한국어</option>
                    <option value="zh">中文</option>
                    <option value="fr">Français</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-stone-700 block mb-1">
                    Nhận diện đầu vào:
                  </label>
                  <select
                    defaultValue="auto"
                    className="w-full p-2 bg-white border border-stone-200 rounded-lg text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="auto">Tự động nhận diện</option>
                    <option value="vi">Ưu tiên Tiếng Việt</option>
                    <option value="en">Ưu tiên English</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-stone-700 block mb-1">
                    Ngôn ngữ trả lời AI:
                  </label>
                  <select
                    defaultValue="match_input"
                    className="w-full p-2 bg-white border border-stone-200 rounded-lg text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="match_input">Khớp theo ngôn ngữ hỏi</option>
                    <option value="vi">Luôn đáp Tiếng Việt</option>
                    <option value="en">Always English</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* AI Engine Status */}
          <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 flex flex-col gap-2">
            <div className="font-bold text-stone-800 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Mô hình AI: Gemini 3.8 Flash
              </span>
              <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full font-semibold">
                Hoạt động bình thường
              </span>
            </div>
            <p className="text-[11px] text-stone-500 leading-relaxed">
              Mọi tương tác được mã hóa và truyền tải bảo mật thông qua máy chủ phụ trợ (server-side proxy) của KAIST. Không bao giờ lộ API key ra trình duyệt.
            </p>
          </div>

          {/* KAIST AI Governance Criteria */}
          <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200 flex items-center justify-between">
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-stone-900 text-xs">
                  Bộ tiêu chí KAIST: AI bảo trì, cập nhật & phát triển có kiểm soát
                </div>
                <div className="text-[11px] text-stone-600 mt-0.5">
                  20 tiêu chuẩn: phân cấp quyền, tự chẩn đoán, xuất bản an toàn, chống mã độc & kiểm soát bí mật.
                </div>
              </div>
            </div>
            {onOpenGovernance && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenGovernance();
                }}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shrink-0 ml-3 shadow-2xs transition-colors"
              >
                Xem chi tiết
              </button>
            )}
          </div>

          {/* Data Export & Backup */}
          <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between">
            <div>
              <div className="font-bold text-stone-800">Xuất toàn bộ dữ liệu (JSON Backup)</div>
              <div className="text-[11px] text-stone-500">
                Tải về toàn bộ truyện, chương, hồ sơ nhân vật, trí nhớ và bài marketing.
              </div>
            </div>
            <button
              disabled={isExporting}
              onClick={handleExportData}
              className="px-3.5 py-1.5 bg-stone-800 hover:bg-stone-900 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              {isExporting ? "Đang xuất..." : "Tải bản sao"}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-stone-50 border-t border-stone-200 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-stone-600 hover:text-stone-900 font-medium"
          >
            Đóng
          </button>
          <button
            disabled={isSaving}
            onClick={handleSave}
            className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-xs transition-colors"
          >
            {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </div>
    </div>
  );
};