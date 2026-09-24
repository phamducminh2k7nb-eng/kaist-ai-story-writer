import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  ShieldCheck,
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ExternalLink,
  KeyRound,
  RotateCcw,
  Sparkles,
  Info,
  Copy,
  Check,
  X,
  ArrowRight,
  Shield,
  Sun,
  Moon,
  Monitor,
  BookOpen,
  PenTool,
  Compass,
} from "lucide-react";
import { api } from "../services/api";
import { UserProfile, ThemePreference } from "../types";
import {
  ensureGoogleIdentityInitialized,
  renderGoogleSignInButton,
  setGoogleCredentialCallback,
  requestGoogleAccessToken,
} from "../services/googleAuth";

declare global {
  interface Window {
    google?: any;
  }
}

type AuthMode = "login" | "register" | "forgot_password" | "reset_password" | "verify_email";

interface LoginViewProps {
  onLoginSuccess: (user: UserProfile) => void;
  themeMode?: ThemePreference;
  onToggleTheme?: (newTheme: ThemePreference) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onLoginSuccess,
  themeMode = "system",
  onToggleTheme,
}) => {
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form Fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Google OAuth states
  const [clientId, setClientId] = useState<string>("");
  const [hasServerClientId, setHasServerClientId] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const googleBtnContainerRef = useRef<HTMLDivElement>(null);

  // Admin / Technical modal for OAuth configuration
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [customClientIdInput, setCustomClientIdInput] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const currentOrigin = typeof window !== "undefined" ? window.location.origin : "";
  const isInIframe = typeof window !== "undefined" && window.self !== window.top;

  const devOrigin = "https://ais-dev-sotflw25wuc2bnyuq6wqxs-739196383914.asia-east1.run.app";
  const previewOrigin = "https://ais-pre-sotflw25wuc2bnyuq6wqxs-739196383914.asia-east1.run.app";
  const localOrigin = "http://localhost:3000";

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Load OAuth config from server on mount
  useEffect(() => {
    let isMounted = true;
    async function loadConfig() {
      try {
        const config = await api.getAuthConfig();
        if (!isMounted) return;
        const customSaved = localStorage.getItem("kaist_custom_google_client_id") || "";
        const effectiveClientId = config.googleClientId || customSaved;
        setClientId(effectiveClientId);
        setCustomClientIdInput(effectiveClientId);
        setHasServerClientId(Boolean(config.googleClientId));
      } catch (err) {
        console.warn("Failed to load auth config:", err);
      }
    }
    loadConfig();
    return () => {
      isMounted = false;
    };
  }, []);

  // Handle Google ID token response
  const handleGoogleCredentialResponse = useCallback(
    async (response: any) => {
      if (!response?.credential) {
        setGoogleError("Không nhận được token xác thực từ Google. Vui lòng thử lại.");
        return;
      }

      setIsLoading(true);
      setErrorMsg(null);
      setGoogleError(null);
      try {
        const res = await api.loginWithGoogle({ credential: response.credential });
        setSuccessMsg(`Chào mừng ${res.user.name}! Đang mở không gian làm việc...`);
        setTimeout(() => {
          onLoginSuccess(res.user);
        }, 400);
      } catch (err: any) {
        setGoogleError(err?.message || "Xác minh tài khoản Google thất bại.");
        setIsLoading(false);
      }
    },
    [onLoginSuccess]
  );

  // Sync active callback reference to singleton so re-renders/remounts route to the latest handler
  useEffect(() => {
    setGoogleCredentialCallback(handleGoogleCredentialResponse);
    return () => {
      setGoogleCredentialCallback(null);
    };
  }, [handleGoogleCredentialResponse]);

  // Initialize Google Identity Services ONCE per page session (strict mode & remount safe)
  useEffect(() => {
    if (!clientId) return;
    ensureGoogleIdentityInitialized(clientId, handleGoogleCredentialResponse);
  }, [clientId, handleGoogleCredentialResponse]);

  // Render or re-render the button into the container when container mounts or authMode changes
  useEffect(() => {
    if (!clientId || !googleBtnContainerRef.current) return;
    const isDark = document.documentElement.classList.contains("dark");
    renderGoogleSignInButton(googleBtnContainerRef.current, {
      theme: isDark ? "filled_black" : "outline",
      size: "large",
      type: "standard",
      shape: "pill",
      text: "continue_with",
      logo_alignment: "left",
      width: 320,
    });
  }, [clientId, authMode, themeMode]);

  // Google OAuth2 Popup alternative flow
  const handleGooglePopup = () => {
    if (!clientId) {
      setGoogleError("Đăng nhập Google tạm thời chưa được kết nối Client ID. Vui lòng sử dụng Email và Mật khẩu.");
      return;
    }

    setIsLoading(true);
    setGoogleError(null);
    setErrorMsg(null);

    requestGoogleAccessToken(
      clientId,
      async (accessToken) => {
        try {
          const res = await api.loginWithGoogle({ accessToken });
          setSuccessMsg(`Chào mừng ${res.user.name}! Đang mở không gian làm việc...`);
          setTimeout(() => {
            onLoginSuccess(res.user);
          }, 400);
        } catch (err: any) {
          setIsLoading(false);
          setGoogleError(err?.message || "Xác thực phiên với máy chủ không thành công.");
        }
      },
      (errorDetail) => {
        setIsLoading(false);
        if (errorDetail.includes("origin_mismatch")) {
          setGoogleError(
            "Đăng nhập Google chưa hoàn tất đồng bộ địa chỉ web (origin). Bạn có thể đăng nhập hoặc tạo tài khoản bằng Email bên dưới để vào làm việc ngay."
          );
        } else {
          setGoogleError("Lỗi kết nối Google: " + errorDetail);
        }
      }
    );
  };

  // 1. Submit Email Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email || !password) {
      setErrorMsg("Vui lòng nhập đầy đủ Email và Mật khẩu.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.loginWithEmail({ email, password });
      setSuccessMsg("Đăng nhập thành công! Đang chuyển hướng...");
      setTimeout(() => {
        onLoginSuccess(res.user);
      }, 400);
    } catch (err: any) {
      setErrorMsg(err?.message || "Email hoặc mật khẩu không chính xác.");
      setIsLoading(false);
    }
  };

  // 2. Submit Email Registration
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email || !password) {
      setErrorMsg("Vui lòng điền đầy đủ Email và Mật khẩu.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Mật khẩu phải có độ dài tối thiểu từ 6 ký tự.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Mật khẩu xác nhận không khớp.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.registerWithEmail({
        email,
        password,
        name: fullName.trim() || undefined,
      });

      setSuccessMsg("Tạo tài khoản thành công! Bạn có thể bắt đầu sáng tác ngay.");
      setTimeout(() => {
        onLoginSuccess(res.user);
      }, 500);
    } catch (err: any) {
      setErrorMsg(err?.message || "Không thể đăng ký tài khoản. Vui lòng thử lại.");
      setIsLoading(false);
    }
  };

  // 3. Submit Forgot Password Request
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email) {
      setErrorMsg("Vui lòng nhập địa chỉ email đã đăng ký.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.forgotPassword({ email });
      setSuccessMsg(res.message);
      if (res.resetCode) {
        setResetCode(res.resetCode);
      }
      setAuthMode("reset_password");
    } catch (err: any) {
      setErrorMsg(err?.message || "Không thể gửi yêu cầu quên mật khẩu.");
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Submit Reset Password
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email || !resetCode || !password) {
      setErrorMsg("Vui lòng điền đầy đủ Email, Mã khôi phục và Mật khẩu mới.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Mật khẩu mới phải có tối thiểu 6 ký tự.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.resetPassword({
        email,
        resetCode: resetCode.trim(),
        newPassword: password,
      });
      setSuccessMsg(res.message);
      setTimeout(() => {
        onLoginSuccess(res.user);
      }, 500);
    } catch (err: any) {
      setErrorMsg(err?.message || "Không thể đặt lại mật khẩu.");
      setIsLoading(false);
    }
  };

  // 5. Submit Email Verification
  const handleVerifyEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email || !verificationCode) {
      setErrorMsg("Vui lòng nhập email và mã xác minh 6 số.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.verifyEmail({ email, code: verificationCode.trim() });
      setSuccessMsg(res.message);
      setTimeout(() => {
        onLoginSuccess(res.user);
      }, 500);
    } catch (err: any) {
      setErrorMsg(err?.message || "Xác minh email không thành công.");
      setIsLoading(false);
    }
  };

  const handleSaveAdminClientId = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customClientIdInput.trim();
    if (!trimmed) {
      return;
    }
    localStorage.setItem("kaist_custom_google_client_id", trimmed);
    setClientId(trimmed);
    setSuccessMsg("Đã cập nhật Client ID. Nút đăng nhập Google đang được khởi tạo lại.");
    setIsAdminModalOpen(false);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 flex flex-col justify-between selection:bg-indigo-600 selection:text-white transition-colors duration-200">
      {/* Top Bar */}
      <header className="border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-[#0c0c0e]/80 backdrop-blur-md px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center font-serif text-white font-bold text-base shadow-xs shadow-indigo-500/20 shrink-0">
            K
          </div>
          <div>
            <h1 className="font-semibold text-sm sm:text-base text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              KAIST AI Studio
              <span className="text-[10px] uppercase tracking-wider bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 font-sans font-medium px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-500/20">
                Xác thực
              </span>
            </h1>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 hidden sm:block">
              Không gian AI chuyên sâu cho người viết truyện dài và xuất bản
            </p>
          </div>
        </div>

        {/* Right side controls: Security badge + Theme Switcher */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/60 px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700/60">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-[11px] font-medium">Dữ liệu riêng biệt</span>
          </div>

          {/* 3-Option Theme Switcher */}
          {onToggleTheme && (
            <div
              className="flex items-center bg-zinc-100 dark:bg-zinc-800/80 p-0.5 rounded-xl border border-zinc-200/90 dark:border-zinc-700/80 text-zinc-500 dark:text-zinc-400"
              role="group"
              aria-label="Tùy chọn giao diện: Sáng, Tối, Theo hệ thống"
            >
              <button
                type="button"
                onClick={() => onToggleTheme("light")}
                title="Giao diện Sáng"
                aria-pressed={themeMode === "light"}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  themeMode === "light"
                    ? "bg-white text-indigo-600 shadow-xs font-semibold"
                    : "hover:text-zinc-900 dark:hover:text-zinc-200"
                }`}
              >
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden sm:inline text-[11px]">Sáng</span>
              </button>
              <button
                type="button"
                onClick={() => onToggleTheme("dark")}
                title="Giao diện Tối"
                aria-pressed={themeMode === "dark"}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  themeMode === "dark"
                    ? "bg-zinc-900 text-indigo-300 dark:bg-zinc-700 dark:text-white shadow-xs font-semibold"
                    : "hover:text-zinc-900 dark:hover:text-zinc-200"
                }`}
              >
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline text-[11px]">Tối</span>
              </button>
              <button
                type="button"
                onClick={() => onToggleTheme("system")}
                title="Tự động theo giao diện hệ thống"
                aria-pressed={themeMode === "system"}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  themeMode === "system"
                    ? "bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-300 shadow-xs font-semibold"
                    : "hover:text-zinc-900 dark:hover:text-zinc-200"
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px]">Hệ thống</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Authentication & Presentation Content */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-10 my-auto">
        <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Presentation / Feature Hero */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/60 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>NỀN TẢNG KAIST AI STUDIO 2.0</span>
            </div>

            <div className="space-y-3">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 leading-[1.2]">
                Không Gian AI Viết Truyện & Xuất Bản Thông Minh
              </h2>
              <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-2xl font-normal">
                Đồng hành cùng tác giả từ ý tưởng, nhân vật, thế giới, dàn ý và từng chương truyện đến bìa minh họa và gói xuất bản.
              </p>
            </div>

            {/* 3 Core Value Pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
              <div className="p-3.5 rounded-xl bg-white/70 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 space-y-1.5 shadow-2xs">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-zinc-900 dark:text-zinc-200">
                  Viết Truyện & Kịch Bản
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-normal">
                  Kiểm soát logic thế giới, dòng thời gian và tâm lý nhân vật xuyên suốt.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-white/70 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 space-y-1.5 shadow-2xs">
                <div className="w-7 h-7 rounded-lg bg-violet-50 dark:bg-violet-950/60 flex items-center justify-center text-violet-600 dark:text-violet-400">
                  <PenTool className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-zinc-900 dark:text-zinc-200">
                  Chiến Lược Content
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-normal">
                  Đồng bộ giọng văn thương hiệu, lập dàn bài và lịch đăng tải đa kênh.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-white/70 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 space-y-1.5 shadow-2xs">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-zinc-900 dark:text-zinc-200">
                  20 Tiêu Chí KAIST
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-normal">
                  Không gian lưu trữ và lịch sử chat bảo mật độc lập cho từng tài khoản.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Authentication Card */}
          <div className="lg:col-span-5 w-full">
            <div className="w-full bg-white dark:bg-[#121215] border border-zinc-200/90 dark:border-zinc-800/90 rounded-2xl p-6 sm:p-7 shadow-xl shadow-zinc-900/5 dark:shadow-2xl backdrop-blur-md">
              {/* Iframe Notice */}
              {isInIframe && (
                <div className="mb-4 p-2.5 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/40 rounded-xl text-xs text-indigo-800 dark:text-indigo-300 flex items-center justify-between gap-2">
                  <span className="truncate">Đang chạy trong khung xem trước.</span>
                  <a
                    href={window.location.href}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-[11px] shrink-0 flex items-center gap-1 transition-colors"
                  >
                    <span>Mở tab mới</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {/* Mode Switcher Tabs (Đăng nhập / Đăng ký) */}
              {(authMode === "login" || authMode === "register") && (
                <div className="flex bg-zinc-100 dark:bg-zinc-900/90 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800/80 mb-5">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("login");
                      setErrorMsg(null);
                      setGoogleError(null);
                    }}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      authMode === "login"
                        ? "bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-xs"
                        : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                    }`}
                  >
                    Đăng nhập
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("register");
                      setErrorMsg(null);
                      setGoogleError(null);
                    }}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      authMode === "register"
                        ? "bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-xs"
                        : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                    }`}
                  >
                    Đăng ký tài khoản
                  </button>
                </div>
              )}

              {/* Back button for secondary modes */}
              {(authMode === "forgot_password" ||
                authMode === "reset_password" ||
                authMode === "verify_email") && (
                <div className="mb-4">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("login");
                      setErrorMsg(null);
                      setGoogleError(null);
                    }}
                    className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>&larr; Quay lại Đăng nhập</span>
                  </button>
                </div>
              )}

              {/* Card Title & Description */}
              <div className="text-left mb-5">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                  {authMode === "login" && "Chào mừng bạn trở lại"}
                  {authMode === "register" && "Tạo tài khoản tác giả mới"}
                  {authMode === "forgot_password" && "Khôi phục mật khẩu"}
                  {authMode === "reset_password" && "Đặt lại mật khẩu mới"}
                  {authMode === "verify_email" && "Xác minh địa chỉ Email"}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  {authMode === "login" && "Tiếp tục các dự án sáng tác, kịch bản và kho ý tưởng của bạn."}
                  {authMode === "register" && "Mỗi tác giả sở hữu không gian lưu trữ và trợ lý AI độc lập."}
                  {authMode === "forgot_password" && "Nhập email của bạn để nhận mã xác thực khôi phục mật khẩu."}
                  {authMode === "reset_password" && "Nhập mã 6 chữ số và thiết lập mật khẩu đăng nhập mới."}
                  {authMode === "verify_email" && "Nhập mã xác minh 6 chữ số đã được gửi tới email của bạn."}
                </p>
              </div>

              {/* Feedback messages */}
              {errorMsg && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800/70 rounded-xl text-xs text-red-800 dark:text-red-200 flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <div className="leading-snug">{errorMsg}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setErrorMsg(null)}
                    className="text-red-500 hover:text-red-700 dark:hover:text-white p-0.5 rounded cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {successMsg && (
                <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/70 rounded-xl text-xs text-emerald-800 dark:text-emerald-200 flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <div className="leading-snug">{successMsg}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSuccessMsg(null)}
                    className="text-emerald-500 hover:text-emerald-700 dark:hover:text-white p-0.5 rounded cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Google Error Notification */}
              {googleError && (
                <div className="mb-4 p-3.5 bg-amber-50 dark:bg-zinc-900/90 border border-amber-300 dark:border-amber-500/40 rounded-xl text-xs text-zinc-800 dark:text-zinc-300 space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div className="leading-relaxed text-amber-800 dark:text-amber-200">{googleError}</div>
                  </div>
                  <div className="flex items-center gap-2 pt-1 border-t border-amber-200 dark:border-zinc-800 text-[11px]">
                    <button
                      type="button"
                      onClick={() => {
                        setGoogleError(null);
                        setAuthMode("login");
                      }}
                      className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold cursor-pointer"
                    >
                      &rarr; Đăng nhập bằng Email & Mật khẩu
                    </button>
                    <span className="text-zinc-400">&bull;</span>
                    <button
                      type="button"
                      onClick={handleGooglePopup}
                      className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 cursor-pointer"
                    >
                      Thử lại Google
                    </button>
                  </div>
                </div>
              )}

              {/* 1. LOGIN FORM */}
              {authMode === "login" && (
                <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      Địa chỉ Email
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute left-3 top-3" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="tacgia@gmail.com"
                        className="w-full bg-white dark:bg-zinc-950/80 border border-zinc-300 dark:border-zinc-700/80 rounded-xl pl-9 pr-3 py-2.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                        Mật khẩu
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode("forgot_password");
                          setErrorMsg(null);
                        }}
                        className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline transition-colors cursor-pointer"
                      >
                        Quên mật khẩu?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute left-3 top-3" />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-white dark:bg-zinc-950/80 border border-zinc-300 dark:border-zinc-700/80 rounded-xl pl-9 pr-9 py-2.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:scale-98 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50 mt-2 cursor-pointer"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Đang xác thực...</span>
                      </>
                    ) : (
                      <>
                        <span>Đăng nhập</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* 2. REGISTER FORM */}
              {authMode === "register" && (
                <form onSubmit={handleRegisterSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Họ tên hoặc Bút danh
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute left-3 top-3" />
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Bút danh sáng tác"
                        className="w-full bg-white dark:bg-zinc-950/80 border border-zinc-300 dark:border-zinc-700/80 rounded-xl pl-9 pr-3 py-2.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Địa chỉ Email
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute left-3 top-3" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="tacgia@gmail.com"
                        className="w-full bg-white dark:bg-zinc-950/80 border border-zinc-300 dark:border-zinc-700/80 rounded-xl pl-9 pr-3 py-2.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Mật khẩu (Tối thiểu 6 ký tự)
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute left-3 top-3" />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-white dark:bg-zinc-950/80 border border-zinc-300 dark:border-zinc-700/80 rounded-xl pl-9 pr-9 py-2.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Xác nhận lại mật khẩu
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute left-3 top-3" />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-white dark:bg-zinc-950/80 border border-zinc-300 dark:border-zinc-700/80 rounded-xl pl-9 pr-3 py-2.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:scale-98 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50 mt-2 cursor-pointer"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Đang khởi tạo tài khoản...</span>
                      </>
                    ) : (
                      <>
                        <span>Đăng ký ngay</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* 3. FORGOT PASSWORD FORM */}
              {authMode === "forgot_password" && (
                <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      Email tài khoản
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute left-3 top-3" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="tacgia@gmail.com"
                        className="w-full bg-white dark:bg-zinc-950/80 border border-zinc-300 dark:border-zinc-700/80 rounded-xl pl-9 pr-3 py-2.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:scale-98 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50 cursor-pointer"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <span>Gửi mã khôi phục 6 số</span>
                    )}
                  </button>
                </form>
              )}

              {/* 4. RESET PASSWORD FORM */}
              {authMode === "reset_password" && (
                <form onSubmit={handleResetPasswordSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Email tài khoản
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-white dark:bg-zinc-950/80 border border-zinc-300 dark:border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Mã khôi phục 6 chữ số
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value)}
                      placeholder="123456"
                      className="w-full bg-white dark:bg-zinc-950/80 border border-indigo-500/60 rounded-xl px-3 py-2 text-center text-sm font-mono tracking-widest text-indigo-600 dark:text-indigo-300 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Mật khẩu mới (Tối thiểu 6 ký tự)
                    </label>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-white dark:bg-zinc-950/80 border border-zinc-300 dark:border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:scale-98 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50 mt-2 cursor-pointer"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <span>Xác nhận & Đăng nhập</span>
                    )}
                  </button>
                </form>
              )}

              {/* 5. VERIFY EMAIL FORM */}
              {authMode === "verify_email" && (
                <form onSubmit={handleVerifyEmailSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      Mã xác minh 6 số
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      placeholder="123456"
                      className="w-full bg-white dark:bg-zinc-950/80 border border-indigo-500/60 rounded-xl px-3 py-2 text-center text-sm font-mono tracking-widest text-indigo-600 dark:text-indigo-300 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:scale-98 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50 cursor-pointer"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <span>Kích hoạt tài khoản</span>
                    )}
                  </button>
                </form>
              )}

              {/* Social Divider (only for login and register) */}
              {(authMode === "login" || authMode === "register") && (
                <>
                  <div className="relative my-5 text-center">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-zinc-200 dark:border-zinc-800" />
                    </div>
                    <span className="relative bg-white dark:bg-[#121215] px-3 text-[11px] text-zinc-400 uppercase tracking-wider font-medium">
                      Hoặc
                    </span>
                  </div>

                  {/* Google Button */}
                  <div className="space-y-2.5">
                    <div className="flex flex-col items-center justify-center">
                      <div ref={googleBtnContainerRef} className="min-h-[44px] flex items-center justify-center" />
                    </div>

                    <button
                      type="button"
                      onClick={handleGooglePopup}
                      disabled={isLoading}
                      className="w-full py-2.5 px-4 rounded-xl bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-800 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold flex items-center justify-center gap-2.5 transition-all shadow-2xs active:scale-98 disabled:opacity-50 cursor-pointer"
                    >
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                      <span>Tiếp tục với Google (Cửa sổ Popup)</span>
                    </button>
                  </div>
                </>
              )}

              {/* Privacy badge */}
              <div className="mt-5 pt-3.5 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-center gap-2 text-[11px] text-zinc-500">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span>Không gian sáng tác bảo mật độc lập theo tiêu chuẩn KAIST</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer with subtle Admin / Developer config modal link */}
      <footer className="border-t border-zinc-200/80 dark:border-zinc-800/80 bg-white/60 dark:bg-[#0c0c0e]/60 px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-zinc-500">
        <div>KAIST AI Studio &bull; Nền tảng sáng tạo nội dung văn học & kịch bản an toàn</div>
        <button
          type="button"
          onClick={() => setIsAdminModalOpen(true)}
          className="text-[11px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors flex items-center gap-1 cursor-pointer"
        >
          <Info className="w-3 h-3" />
          <span>Cấu hình Google OAuth (Kỹ thuật)</span>
        </button>
      </footer>

      {/* ADMIN / TECHNICAL OAUTH DIALOG */}
      {isAdminModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-zinc-900 dark:text-zinc-100">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">
                  Cấu hình Google OAuth & Xử lý origin_mismatch
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAdminModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-zinc-300">
              <p className="text-zinc-400 leading-relaxed text-[11px]">
                Nếu gặp lỗi <strong>400: origin_mismatch</strong> từ Google, hãy mở{" "}
                <a
                  href="https://console.cloud.google.com/apis/credentials"
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-400 underline inline-flex items-center gap-0.5"
                >
                  Google Cloud Console <ExternalLink className="w-3 h-3" />
                </a>
                , chọn Client ID loại <strong>Web application</strong> và dán các Origin sau vào{" "}
                <strong>Authorized JavaScript origins</strong>:
              </p>

              {/* Copyable Origins */}
              <div className="space-y-2">
                <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800 flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] text-indigo-400 font-semibold uppercase">
                      Origin trang hiện tại (Current Origin)
                    </div>
                    <div className="font-mono text-xs text-zinc-200 truncate">
                      {currentOrigin || devOrigin}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(currentOrigin || devOrigin, "current")}
                    className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-xs flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                  >
                    {copiedKey === "current" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === "current" ? "Đã chép" : "Sao chép"}</span>
                  </button>
                </div>

                <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800 flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] text-zinc-400 font-semibold uppercase">
                      Origin bản xem trước / xuất bản (Preview)
                    </div>
                    <div className="font-mono text-xs text-zinc-200 truncate">
                      {previewOrigin}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(previewOrigin, "preview")}
                    className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-xs flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                  >
                    {copiedKey === "preview" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === "preview" ? "Đã chép" : "Sao chép"}</span>
                  </button>
                </div>

                <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800 flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] text-zinc-400 font-semibold uppercase">
                      Origin máy cá nhân (Localhost)
                    </div>
                    <div className="font-mono text-xs text-zinc-200 truncate">
                      {localOrigin}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(localOrigin, "local")}
                    className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-xs flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                  >
                    {copiedKey === "local" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === "local" ? "Đã chép" : "Sao chép"}</span>
                  </button>
                </div>
              </div>

              {/* Client ID Custom update */}
              <form onSubmit={handleSaveAdminClientId} className="pt-3 border-t border-zinc-800 space-y-2">
                <label className="block text-xs font-semibold text-zinc-300">
                  Google Client ID tùy chỉnh:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customClientIdInput}
                    onChange={(e) => setCustomClientIdInput(e.target.value)}
                    placeholder="vd: 701735649238-xxx.apps.googleusercontent.com"
                    className="flex-1 bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs font-mono text-zinc-100 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shrink-0 cursor-pointer"
                  >
                    Lưu
                  </button>
                </div>
              </form>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setIsAdminModalOpen(false)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
