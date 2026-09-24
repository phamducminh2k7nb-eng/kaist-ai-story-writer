import React from "react";
import { LogOut, Loader2, AlertCircle, X, ShieldCheck } from "lucide-react";

interface LogoutModalProps {
  isOpen: boolean;
  isLoggingOut: boolean;
  error: string | null;
  userName?: string;
  userEmail?: string;
  onConfirm: () => void;
  onCancel: () => void;
  onRetry: () => void;
}

export const LogoutModal: React.FC<LogoutModalProps> = ({
  isOpen,
  isLoggingOut,
  error,
  userName,
  userEmail,
  onConfirm,
  onCancel,
  onRetry,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="logout-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity duration-200"
      onClick={() => {
        if (!isLoggingOut) onCancel();
      }}
    >
      <div
        id="logout-modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="logout-title"
        className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden transition-all duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 dark:bg-red-500/15 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
              <LogOut className="w-5 h-5" />
            </div>
            <div>
              <h3
                id="logout-title"
                className="text-base font-semibold text-zinc-900 dark:text-zinc-100"
              >
                {isLoggingOut ? "Đang đăng xuất..." : "Xác nhận đăng xuất"}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                KAIST AI Studio Session Management
              </p>
            </div>
          </div>
          {!isLoggingOut && (
            <button
              id="btn-close-logout-modal"
              onClick={onCancel}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              aria-label="Đóng"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="px-6 py-4 space-y-4">
          {/* User Account Info Chip */}
          {(userName || userEmail) && (
            <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/60 rounded-xl flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-semibold flex items-center justify-center text-sm shrink-0">
                {(userName || userEmail || "U")[0].toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                {userName && (
                  <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                    {userName}
                  </p>
                )}
                {userEmail && (
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                    {userEmail}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Status / Loading State */}
          {isLoggingOut ? (
            <div className="py-6 flex flex-col items-center justify-center text-center space-y-3">
              <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
              <div>
                <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                  Đang đăng xuất…
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  Đang thu hồi phiên bảo mật và giải phóng bộ nhớ giao diện…
                </p>
              </div>
            </div>
          ) : error ? (
            /* Error State with Retry option */
            <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl space-y-2">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                <div className="text-xs text-red-700 dark:text-red-300 leading-relaxed">
                  <p className="font-semibold">Đăng xuất không thành công</p>
                  <p className="mt-0.5">{error}</p>
                </div>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 pl-6.5">
                Dữ liệu tài khoản của bạn vẫn được giữ nguyên. Vui lòng bấm &ldquo;Thử lại&rdquo; để kết thúc phiên an toàn.
              </p>
            </div>
          ) : (
            /* Normal Confirmation Prompt */
            <div className="space-y-3">
              <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                Bạn có chắc chắn muốn kết thúc phiên làm việc này? Sau khi đăng xuất, bạn sẽ được chuyển về màn hình đăng nhập.
              </p>
              <div className="flex items-start gap-2 p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-800 dark:text-emerald-300 text-[11px] leading-relaxed">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Dữ liệu an toàn:</strong> Toàn bộ tiểu thuyết, nhân vật, tài liệu và lịch sử chat đã lưu vẫn được bảo vệ nguyên vẹn trên tài khoản của bạn.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-800/40 border-t border-zinc-200/80 dark:border-zinc-800 flex items-center justify-end gap-2.5">
          {isLoggingOut ? (
            <div className="text-xs text-zinc-400 dark:text-zinc-500 flex items-center gap-2">
              <span>Vui lòng không đóng cửa sổ</span>
            </div>
          ) : error ? (
            <>
              <button
                id="btn-cancel-logout-error"
                type="button"
                onClick={onCancel}
                className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200/70 dark:hover:bg-zinc-700 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                id="btn-retry-logout"
                type="button"
                onClick={onRetry}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 shadow-xs transition-colors flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Thử lại</span>
              </button>
            </>
          ) : (
            <>
              <button
                id="btn-cancel-logout"
                type="button"
                onClick={onCancel}
                className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200/70 dark:hover:bg-zinc-700 transition-colors"
              >
                Ở lại
              </button>
              <button
                id="btn-confirm-logout"
                type="button"
                onClick={onConfirm}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 shadow-xs transition-colors flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Đăng xuất</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};