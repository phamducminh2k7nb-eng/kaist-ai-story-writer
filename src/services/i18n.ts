// KAIST Multi-language Localization and Language Processing Service

export type SupportedLanguage = "vi" | "en" | "ja" | "ko" | "zh" | "fr";

export interface LanguageSetting {
  uiLanguage: SupportedLanguage;
  inputLanguageMode: "auto" | SupportedLanguage;
  outputLanguageMode: "match_input" | SupportedLanguage;
}

export const LANGUAGE_LABELS: Record<SupportedLanguage, { label: string; native: string }> = {
  vi: { label: "Tiếng Việt", native: "Tiếng Việt" },
  en: { label: "Tiếng Anh", native: "English" },
  ja: { label: "Tiếng Nhật", native: "日本語" },
  ko: { label: "Tiếng Hàn", native: "한국어" },
  zh: { label: "Tiếng Trung", native: "中文" },
  fr: { label: "Tiếng Pháp", native: "Français" },
};

export const UI_TRANSLATIONS: Record<SupportedLanguage, Record<string, string>> = {
  vi: {
    "app.name": "KAIST AI Studio",
    "nav.editor": "Bản thảo & Chương",
    "nav.projects": "Dự án truyện",
    "nav.characters": "Hồ sơ nhân vật",
    "nav.world": "Thế giới & Quy tắc",
    "nav.chat": "Hỏi đáp & Phản biện AI",
    "nav.visual": "Studio Bìa & Ảnh AI",
    "nav.library": "Thư viện tài liệu",
    "nav.memory": "Trí nhớ dự án",
    "nav.calendar": "Lịch xuất bản",
    "nav.governance": "Bộ tiêu chí KAIST",
    "nav.settings": "Cài đặt hệ thống",
    "btn.save": "Lưu thay đổi",
    "btn.cancel": "Hủy",
    "btn.close": "Đóng",
    "btn.send": "Gửi yêu cầu",
    "btn.open_source": "Mở nguồn",
    "btn.copy_link": "Sao chép liên kết",
    "btn.copied": "Đã sao chép",
    "btn.download": "Tải về máy",
    "status.verified": "Đã kiểm chứng",
    "status.local_doc": "Tài liệu nội bộ",
    "status.snippet_only": "Trích đoạn",
    "status.unreachable": "Không thể truy cập",
    "sources.header": "Căn cứ & Nguồn tham khảo",
    "sources.no_link": "Chưa có liên kết ngoài",
    "ai.model_info": "Mô hình: Gemini 3.8 Flash | Bảo mật máy chủ KAIST",
  },
  en: {
    "app.name": "KAIST AI Studio",
    "nav.editor": "Manuscript & Chapters",
    "nav.projects": "Story Projects",
    "nav.characters": "Character Codex",
    "nav.world": "Worldbuilding & Rules",
    "nav.chat": "AI Chat & Critique",
    "nav.visual": "Cover & Art Studio",
    "nav.library": "Document Library",
    "nav.memory": "Project Memory",
    "nav.calendar": "Publishing Calendar",
    "nav.governance": "KAIST Governance",
    "nav.settings": "System Settings",
    "btn.save": "Save Changes",
    "btn.cancel": "Cancel",
    "btn.close": "Close",
    "btn.send": "Send Prompt",
    "btn.open_source": "Open Source",
    "btn.copy_link": "Copy Link",
    "btn.copied": "Copied",
    "btn.download": "Download File",
    "status.verified": "Verified Source",
    "status.local_doc": "Internal Document",
    "status.snippet_only": "Excerpt Only",
    "status.unreachable": "Unavailable",
    "sources.header": "Evidence & Citations",
    "sources.no_link": "No external link available",
    "ai.model_info": "Model: Gemini 3.8 Flash | Server-side Protected",
  },
  ja: {
    "app.name": "KAIST AIスタジオ",
    "nav.editor": "原稿・章",
    "nav.projects": "作品プロジェクト",
    "nav.characters": "キャラクター台帳",
    "nav.world": "世界観とルール",
    "nav.chat": "AI相談・批評",
    "nav.visual": "表紙・画像スタジオ",
    "nav.library": "資料ライブラリ",
    "nav.memory": "プロジェクト記憶",
    "nav.calendar": "執筆カレンダー",
    "nav.governance": "KAIST規範基準",
    "nav.settings": "環境設定",
    "btn.save": "保存",
    "btn.cancel": "キャンセル",
    "btn.close": "閉じる",
    "btn.send": "送信",
    "btn.open_source": "情報源を開く",
    "btn.copy_link": "リンクをコピー",
    "btn.copied": "コピー完了",
    "btn.download": "ダウンロード",
    "status.verified": "検証済み",
    "status.local_doc": "内部文書",
    "status.snippet_only": "抜粋のみ",
    "status.unreachable": "アクセス不可",
    "sources.header": "根拠・参照文献",
    "sources.no_link": "外部リンクなし",
    "ai.model_info": "モデル: Gemini 3.8 Flash | サーバー側暗号化保護",
  },
  ko: {
    "app.name": "KAIST AI 스튜디오",
    "nav.editor": "원고 및 챕터",
    "nav.projects": "스토리 프로젝트",
    "nav.characters": "캐릭터 도감",
    "nav.world": "세계관 및 규칙",
    "nav.chat": "AI 대화 및 비평",
    "nav.visual": "표지 및 아트 스튜디오",
    "nav.library": "자료 라이브러리",
    "nav.memory": "프로젝트 메모리",
    "nav.calendar": "출판 캘린더",
    "nav.governance": "KAIST 규범 기준",
    "nav.settings": "환경 설정",
    "btn.save": "변경 사항 저장",
    "btn.cancel": "취소",
    "btn.close": "닫기",
    "btn.send": "보내기",
    "btn.open_source": "출처 열기",
    "btn.copy_link": "링크 복사",
    "btn.copied": "복사됨",
    "btn.download": "다운로드",
    "status.verified": "검증된 출처",
    "status.local_doc": "내부 문서",
    "status.snippet_only": "발췌문만 있음",
    "status.unreachable": "접근 불가",
    "sources.header": "근거 및 참고 출처",
    "sources.no_link": "외부 링크 없음",
    "ai.model_info": "모델: Gemini 3.8 Flash | 서버 보안 보호",
  },
  zh: {
    "app.name": "KAIST AI 工作室",
    "nav.editor": "手稿与章节",
    "nav.projects": "故事项目",
    "nav.characters": "角色图鉴",
    "nav.world": "世界观与法则",
    "nav.chat": "AI 研讨与审校",
    "nav.visual": "封面与视觉生成",
    "nav.library": "参考资料库",
    "nav.memory": "项目记忆库",
    "nav.calendar": "发布日历",
    "nav.governance": "KAIST 治理标准",
    "nav.settings": "系统设置",
    "btn.save": "保存更改",
    "btn.cancel": "取消",
    "btn.close": "关闭",
    "btn.send": "发送",
    "btn.open_source": "打开来源",
    "btn.copy_link": "复制链接",
    "btn.copied": "已复制",
    "btn.download": "下载文件",
    "status.verified": "已验证来源",
    "status.local_doc": "内部文档",
    "status.snippet_only": "仅有摘录",
    "status.unreachable": "无法访问",
    "sources.header": "事实依据与参考来源",
    "sources.no_link": "暂无外部链接",
    "ai.model_info": "模型: Gemini 3.8 Flash | 服务端安全保护",
  },
  fr: {
    "app.name": "Studio KAIST AI",
    "nav.editor": "Manuscrit & Chapitres",
    "nav.projects": "Projets littéraires",
    "nav.characters": "Codex des personnages",
    "nav.world": "Univers & Règles",
    "nav.chat": "Dialogue & Critique IA",
    "nav.visual": "Studio Couverture & Art",
    "nav.library": "Bibliothèque de documents",
    "nav.memory": "Mémoire de projet",
    "nav.calendar": "Calendrier éditorial",
    "nav.governance": "Gouvernance KAIST",
    "nav.settings": "Paramètres du système",
    "btn.save": "Enregistrer",
    "btn.cancel": "Annuler",
    "btn.close": "Fermer",
    "btn.send": "Envoyer",
    "btn.open_source": "Ouvrir la source",
    "btn.copy_link": "Copier le lien",
    "btn.copied": "Copié",
    "btn.download": "Télécharger",
    "status.verified": "Source vérifiée",
    "status.local_doc": "Document interne",
    "status.snippet_only": "Extrait seul",
    "status.unreachable": "Inaccessible",
    "sources.header": "Preuves & Sources de référence",
    "sources.no_link": "Aucun lien externe",
    "ai.model_info": "Modèle: Gemini 3.8 Flash | Sécurisé côté serveur",
  },
};

const DEFAULT_SETTINGS: LanguageSetting = {
  uiLanguage: "vi",
  inputLanguageMode: "auto",
  outputLanguageMode: "match_input",
};

export function getStoredLanguageSettings(): LanguageSetting {
  try {
    const raw = localStorage.getItem("kaist_language_settings");
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (e) {
    // fallback
  }
  return DEFAULT_SETTINGS;
}

export function saveStoredLanguageSettings(settings: LanguageSetting) {
  try {
    localStorage.setItem("kaist_language_settings", JSON.stringify(settings));
  } catch (e) {
    // fallback
  }
}

export function translate(key: string, lang: SupportedLanguage = "vi"): string {
  const dict = UI_TRANSLATIONS[lang] || UI_TRANSLATIONS["vi"];
  return dict[key] || UI_TRANSLATIONS["vi"][key] || key;
}