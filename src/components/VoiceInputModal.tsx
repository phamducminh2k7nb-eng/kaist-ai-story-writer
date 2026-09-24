import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Square, Send, X, AlertCircle, RefreshCw, Volume2, Globe } from "lucide-react";

interface VoiceInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (transcribedText: string) => void;
  targetLabel?: string;
}

export const VoiceInputModal: React.FC<VoiceInputModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  targetLabel = "Soạn thảo nội dung hoặc gửi tin nhắn",
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimText, setInterimText] = useState("");
  const [language, setLanguage] = useState("vi-VN");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [volumeLevel, setVolumeLevel] = useState(0);

  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!isOpen) {
      stopListening();
      setTranscript("");
      setInterimText("");
      setErrorMsg(null);
    }
  }, [isOpen]);

  const startListening = async () => {
    setErrorMsg(null);
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setErrorMsg("Trình duyệt của bạn hiện chưa hỗ trợ Web Speech API. Bạn có thể sử dụng Google Chrome hoặc Edge để dùng tính năng Micro.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // Audio visualizer
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioCtx;
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        analyserRef.current = analyser;
        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);

        const updateVolume = () => {
          if (!analyserRef.current) return;
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          setVolumeLevel(Math.min(100, Math.round((avg / 128) * 100)));
          animFrameRef.current = requestAnimationFrame(updateVolume);
        };
        updateVolume();
      } catch (err) {
        console.warn("Audio meter init failed:", err);
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let finalChunk = "";
        let interimChunk = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalChunk += event.results[i][0].transcript + " ";
          } else {
            interimChunk += event.results[i][0].transcript;
          }
        }
        if (finalChunk) {
          setTranscript((prev) => (prev ? prev + " " + finalChunk : finalChunk).trim());
        }
        setInterimText(interimChunk);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech Recognition Error:", event.error);
        if (event.error === "not-allowed") {
          setErrorMsg("Bạn đã từ chối quyền truy cập micro. Vui lòng cho phép quyền trong cài đặt trình duyệt.");
        } else if (event.error === "no-speech") {
          // Keep listening or quiet
        } else {
          setErrorMsg(`Lỗi nhận diện âm thanh: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error("Mic access error:", err);
      setErrorMsg("Không thể truy cập micro. Vui lòng kiểm tra quyền thiết bị.");
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setIsListening(false);
    setVolumeLevel(0);
  };

  const handleConfirmSend = () => {
    stopListening();
    const fullText = (transcript + (interimText ? " " + interimText : "")).trim();
    if (!fullText) return;
    onConfirm(fullText);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <Mic className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-stone-900 text-sm">Micro Mức 1 — Nói chuyển thành chữ</h3>
              <p className="text-xs text-stone-500">{targetLabel}</p>
            </div>
          </div>
          <button
            onClick={() => {
              stopListening();
              onClose();
            }}
            className="text-stone-400 hover:text-stone-700 p-1 rounded-lg hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col gap-4">
          {/* Language selector & Instruction */}
          <div className="flex items-center justify-between text-xs text-stone-600 bg-stone-50 p-2.5 rounded-lg border border-stone-150">
            <div className="flex items-center gap-1.5 font-medium">
              <Globe className="w-3.5 h-3.5 text-stone-500" />
              <span>Ngôn ngữ nhận diện:</span>
            </div>
            <select
              value={language}
              onChange={(e) => {
                const newLang = e.target.value;
                setLanguage(newLang);
                if (isListening) {
                  stopListening();
                }
              }}
              disabled={isListening}
              className="bg-white border border-stone-200 rounded-md px-2 py-1 text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="vi-VN">Tiếng Việt (Tự nhiên)</option>
              <option value="en-US">English (US)</option>
              <option value="fr-FR">Français</option>
              <option value="ja-JP">日本語 (Japanese)</option>
              <option value="ko-KR">한국어 (Korean)</option>
              <option value="zh-CN">中文 (Mandarin)</option>
            </select>
          </div>

          {/* Mic Visualizer and Controls */}
          <div className="flex flex-col items-center justify-center py-5 px-4 bg-stone-50/50 rounded-xl border border-stone-150 relative">
            {isListening ? (
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  <span
                    className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-30"
                    style={{ transform: `scale(${1 + volumeLevel / 100})` }}
                  />
                  <button
                    onClick={stopListening}
                    className="relative w-16 h-16 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:bg-red-600 transition-all cursor-pointer"
                  >
                    <Square className="w-6 h-6 fill-white" />
                  </button>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-red-600 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  Đang ghi nhận giọng nói (Mức âm: {volumeLevel}%)...
                </div>
                <p className="text-xs text-stone-500 text-center max-w-xs">
                  Nói rõ ràng tự nhiên. Bấm nút đỏ vuông khi bạn nói xong.
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <button
                  onClick={startListening}
                  className="w-16 h-16 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-lg hover:bg-amber-600 transition-all hover:scale-105 cursor-pointer"
                >
                  <Mic className="w-7 h-7" />
                </button>
                <div className="text-xs font-medium text-stone-700">
                  Bấm để bắt đầu thu âm
                </div>
                <p className="text-xs text-stone-500 text-center">
                  Quy trình KAIST: <strong>Nói → Chuyển thành chữ → Xem & sửa → Bạn chủ động bấm gửi</strong>
                </p>
              </div>
            )}
          </div>

          {/* Error notice if any */}
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Transcript Review & Edit Area (User has full control) */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs font-medium text-stone-700">
              <span>Xem lại và chỉnh sửa văn bản trước khi áp dụng:</span>
              {transcript && (
                <button
                  onClick={() => {
                    setTranscript("");
                    setInterimText("");
                  }}
                  className="text-stone-400 hover:text-red-500 text-xs flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  Xóa trắng
                </button>
              )}
            </div>
            <textarea
              rows={4}
              value={transcript + (interimText ? " " + interimText : "")}
              onChange={(e) => {
                setTranscript(e.target.value);
                setInterimText("");
              }}
              placeholder="Văn bản bạn vừa nói sẽ hiển thị tại đây để bạn xem lại và sửa chữa..."
              className="w-full text-sm p-3 bg-white border border-stone-200 rounded-xl text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none font-ui"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-stone-50 border-t border-stone-200 flex items-center justify-between">
          <button
            onClick={() => {
              stopListening();
              onClose();
            }}
            className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 rounded-lg hover:bg-stone-200/50 transition-colors"
          >
            Hủy bỏ
          </button>
          <button
            disabled={!(transcript || interimText).trim()}
            onClick={handleConfirmSend}
            className="px-5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg shadow-xs flex items-center gap-1.5 transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Xác nhận & Sử dụng nội dung</span>
          </button>
        </div>
      </div>
    </div>
  );
};