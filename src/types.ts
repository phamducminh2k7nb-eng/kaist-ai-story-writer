export type UserRole = 'author' | 'marketer' | 'admin' | 'editor';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar: string;
  role: UserRole;
  language: string;
  timezone: string;
  dailyGoalWords: number;
  currentStreak: number;
  totalWordsWritten: number;
  createdAt: string;
  emailVerified?: boolean;
}

export interface ProjectRule {
  id: string;
  rule: string;
  type: 'must_have' | 'forbidden' | 'style';
  status: 'active' | 'draft';
}

export interface CharacterStatusInChapter {
  chapterId: string;
  location: string;
  physicalCondition: string;
  holdingItem?: string;
  emotionalState?: string;
}

export interface CharacterKnowledge {
  knows: string[];
  unawareOf: string[];
  misinterprets: string[];
  hides: string[];
}

export interface Character {
  id: string;
  name: string;
  nickname?: string;
  role: 'protagonist' | 'antagonist' | 'supporting' | 'mentor' | 'minor';
  age?: number | string;
  pronounAndTitle?: string;
  appearance?: string;
  occupation?: string;
  origin?: string;
  personality: string;
  internalConflict?: string;
  externalGoal?: string;
  innerNeed?: string;
  fears?: string;
  secrets?: string;
  powersAndLimits?: string;
  habitsAndVoice?: string;
  relationships?: { targetCharacterId: string; targetName: string; relationType: string; dynamic: string }[];
  knowledge: CharacterKnowledge;
  chapterStatuses: CharacterStatusInChapter[];
  avatarUrl?: string;
}

export interface WorldRule {
  id: string;
  category: 'geography' | 'history' | 'culture' | 'power_system' | 'society' | 'economy' | 'factions' | 'glossary';
  name: string;
  description: string;
  status: 'proposed' | 'finalized' | 'deprecated';
  exceptions?: string;
  costOrLimit?: string;
}

export interface ChapterVersion {
  id: string;
  timestamp: string;
  content: string;
  wordCount: number;
  label?: string;
}

export interface ChapterComment {
  id: string;
  author: string;
  timestamp: string;
  highlightedText: string;
  comment: string;
  resolved: boolean;
}

export interface Chapter {
  id: string;
  projectId: string;
  order: number;
  title: string;
  act?: string; // e.g. "Hồi I: Khởi nguyên"
  summary: string;
  targetWordCount: number;
  actualWordCount: number;
  status: 'idea' | 'drafting' | 'review' | 'completed' | 'locked';
  content: string;
  authorNotes?: string;
  comments: ChapterComment[];
  versions: ChapterVersion[];
  lastSavedAt: string;
}

export interface OutlineEvent {
  id: string;
  projectId: string;
  act: string;
  chapterId?: string;
  storyOrder: number;
  chronologicalOrder: number;
  title: string;
  description: string;
  location?: string;
  charactersInvolved: string[];
  cluesTracked?: string[];
  readerPromises?: string[];
  impactedChapters?: string[];
}

export interface LiteraryIssue {
  id: string;
  chapterId: string;
  type: 'grammar_spelling' | 'repetition' | 'voice_consistency' | 'pov_shift' | 'pacing' | 'clue_gap' | 'fact_contradiction';
  severity: 'low' | 'medium' | 'high';
  excerpt: string;
  reason: string;
  suggestedFix: string;
  status: 'pending' | 'accepted' | 'rejected';
}

export type MemoryCategory = 'personal' | 'project' | 'chapter' | 'session' | 'reference';

export interface ProjectMemoryItem {
  id: string;
  projectId?: string;
  type: MemoryCategory;
  topic: string;
  content: string;
  source: string;
  confidence: number;
  status: 'proposed' | 'verified' | 'locked';
  createdDate: string;
  lastUpdated: string;
}

export interface ControlledKnowledgeResearch {
  id: string;
  query: string;
  sourceUrl?: string;
  sourceTitle?: string;
  extractedFacts: string[];
  verifications: { fact: string; isVerified: boolean; note: string }[];
  targetProjectId?: string;
  savedToMemory: boolean;
  timestamp: string;
}

export interface StoryProject {
  id: string;
  userId: string;
  title: string;
  tagline?: string;
  description: string;
  primaryGenre: string;
  secondaryGenre?: string;
  targetAudience: string;
  contentRating: 'all' | 'pg13' | '16+' | '18+';
  language: string;
  pointOfView: 'first' | 'third_limited' | 'third_omniscient' | 'second';
  tense: 'past' | 'present';
  tone: string;
  coreTheme: string;
  settingTime: string;
  settingPlace: string;
  targetWordCount: number;
  totalWordCount: number;
  rules: ProjectRule[];
  coverImage?: string;
  createdAt: string;
  updatedAt: string;
}


export type StoryAutomationFormat = 'novel' | 'manga' | 'hybrid';
export type StoryAutomationApprovalMode = 'review_before_queue' | 'auto_queue';

export interface StoryAutomation {
  id: string;
  userId: string;
  projectId: string;
  name: string;
  enabled: boolean;
  format: StoryAutomationFormat;
  intervalHours: number;
  nextRunAt: string;
  targetWords: number;
  mangaPanels: number;
  approvalMode: StoryAutomationApprovalMode;
  autoGenerateImages: boolean;
  autoQueuePublish: boolean;
  lastRunAt?: string;
  lastResult?: string;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PublicationQueueItem {
  id: string;
  userId: string;
  projectId: string;
  chapterId: string;
  title: string;
  scheduledAt: string;
  status: 'waiting_review' | 'queued' | 'published' | 'failed';
  destination: 'manual' | 'webhook';
  publishedUrl?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AutomationRunResult {
  success: boolean;
  chapter?: Chapter;
  mangaScript?: DocumentItem;
  mangaImages?: GeneratedImageItem[];
  queueItem?: PublicationQueueItem;
  message: string;
}

export interface BrandProfile {
  id: string;
  userId: string;
  brandName: string;
  industry: string;
  brandPromise: string;
  targetAudience: string;
  toneOfVoice: string;
  preferredKeywords: string[];
  forbiddenWords: string[];
  approvedSamples: string[];
  products: {
    id: string;
    name: string;
    description: string;
    benefits: string[];
    price?: string;
    proofPoints?: string;
  }[];
}

export interface MarketingContentItem {
  id: string;
  userId: string;
  brandId?: string;
  title: string;
  format: 'social_post' | 'video_script' | 'seo_blog' | 'landing_page' | 'email' | 'livestream';
  platform: 'facebook' | 'tiktok' | 'youtube' | 'linkedin' | 'instagram' | 'email' | 'web';
  targetAudience: string;
  goal: string;
  hook: string;
  body: string;
  callToAction: string;
  variations: { angle: string; hook: string; body: string }[];
  hashtags?: string[];
  status: 'idea' | 'drafting' | 'review' | 'ready' | 'published';
  scheduledDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentItem {
  id: string;
  userId: string;
  projectId?: string;
  name: string;
  fileType: 'pdf' | 'docx' | 'txt' | 'md' | 'image' | 'csv' | 'json';
  sizeBytes: number;
  wordCount?: number;
  pageCount?: number;
  tags: string[];
  summary: string;
  contentSnippet: string;
  fullContent?: string;
  isScanned?: boolean;
  status?: 'uploading' | 'processing' | 'ready' | 'scanned_or_empty' | 'error';
  statusMessage?: string;
  uploadedAt: string;
}

export type ImageOrigin = 'ai_generated' | 'found_existing' | 'reference_guided';

export interface ImageSourceMeta {
  sourceType: 'openverse' | 'wikimedia' | 'unsplash' | 'user_library' | 'web';
  author?: string;
  creatorUrl?: string;
  sourceLandingUrl?: string;
  licenseCode?: string;
  licenseName?: string;
  licenseUrl?: string;
  isCommercialAllowed?: boolean;
  isVerifiedLicense?: boolean;
  attributionHtml?: string;
  originalDimensions?: { width: number; height: number };
  fileSizeBytes?: number;
}

export interface ReferenceGuideMeta {
  referenceImageUrl: string;
  preserveElements: ('composition' | 'palette' | 'lighting' | 'character' | 'costume')[];
  modificationsDescription: string;
  actualModelDispatched: boolean;
  fidelityNotice: string;
}

export interface FoundImageItem {
  id: string;
  title: string;
  thumbnailUrl: string;
  highResUrl: string;
  sourceLandingUrl: string;
  author: string;
  provider: string;
  licenseCode: string;
  licenseName: string;
  licenseUrl?: string;
  isCommercialAllowed: boolean;
  isVerifiedLicense: boolean;
  dimensions?: { width: number; height: number };
  tags?: string[];
  origin: 'found_existing';
}

export interface GeneratedImageItem {
  id: string;
  userId: string;
  projectId?: string;
  characterId?: string;
  taskId?: string;
  originalConcept?: string;
  prompt: string;
  refinedPrompt?: string;
  modelUsed?: string;
  providerUsed?: 'gemini' | 'pollinations';
  imageMimeType?: string;
  style: 'anime' | 'cinematic' | 'digital_art' | 'oil_painting' | 'concept_art' | 'flat_minimal';
  aspectRatio: '1:1' | '16:9' | '9:16' | '3:4' | '4:3' | '4:5';
  category?: 'cover' | 'character' | 'scene' | 'manga';
  imageUrl: string;
  description: string;
  suggestedColors?: string[];
  titleOverlay?: string;
  authorOverlay?: string;
  showOverlay?: boolean;
  status?: 'generating' | 'completed' | 'failed';
  origin?: ImageOrigin;
  sourceMeta?: ImageSourceMeta;
  referenceGuide?: ReferenceGuideMeta;
  // Resolution & Upscaling Metadata
  nativeResolution?: { width: number; height: number };
  isUpscaled?: boolean;
  upscaledFrom?: { width: number; height: number };
  upscaledResolution?: { width: number; height: number };
  upscaleFactor?: number;
  upscaleMethod?: string;
  // Aesthetic, Lighting & Contrast
  lighting?: 'balanced' | 'bright' | 'low_key_clear';
  lightingType?: 'studio_portrait' | 'natural_soft' | 'golden_hour' | 'rim_lighting' | 'ambient_mystic';
  contrast?: 'balanced' | 'soft' | 'dramatic';
  subjectClarity?: boolean;
  // Feedback & Guided Edits
  userRating?: 'like' | 'dislike' | null;
  ratingReason?: string;
  ratingNotes?: string;
  parentImageId?: string;
  editAction?: string;
  createdAt: string;
}

export interface UserPreference {
  id: string;
  userId: string;
  projectId?: string;
  category: 'visual_lighting' | 'visual_subject' | 'visual_style' | 'writing_tone' | 'character_fidelity' | 'general';
  title: string;
  description: string;
  enabled: boolean;
  isProjectSpecific?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface UserFeedback {
  id: string;
  userId: string;
  targetType: 'image' | 'chat_message' | 'chapter_generation';
  targetId: string;
  rating: 'like' | 'dislike';
  reasons: string[];
  userNotes?: string;
  appliedPrompt?: string;
  createdAt: string;
}

export interface AIProviderModel {
  id: string;
  name: string;
  description: string;
  bestFor: string;
  contextWindow: string;
  status: 'active' | 'configured' | 'unconfigured';
}

export interface AIProviderConfig {
  id: 'gemini' | 'openai' | 'anthropic';
  name: string;
  displayName: string;
  status: 'connected' | 'not_configured' | 'rate_limited';
  hasKey: boolean;
  requiresKey: string;
  currentModel: string;
  availableModels: AIProviderModel[];
}

export interface CritiqueRefineResult {
  originalText: string;
  critique: {
    pacingScore: number;
    voiceConsistency: string;
    strengths: string[];
    weaknesses: string[];
    ruleViolations: string[];
  };
  refinedDraft: string;
  diffHighlights: { type: 'added' | 'removed' | 'kept'; text: string }[];
}

export interface SystemReleaseInfo {
  version: string;
  buildDate: string;
  environment: 'development' | 'production';
  previewUrl: string;
  productionUrl: string;
  status: 'healthy' | 'degraded' | 'warning';
  subsystems: {
    id: string;
    name: string;
    status: 'ok' | 'warning' | 'error';
    details: string;
  }[];
}

export interface CalendarEvent {
  id: string;
  userId: string;
  projectId?: string;
  chapterId?: string;
  contentId?: string;
  title: string;
  date: string;
  type: 'chapter_deadline' | 'content_publish' | 'writing_sprint' | 'milestone';
  status: 'idea' | 'in_progress' | 'waiting_review' | 'completed' | 'published';
  targetWords?: number;
  reminder: boolean;
}

export interface SourceCitation {
  title: string;
  url?: string;
  author?: string;
  domain?: string;
  date?: string;
  summary?: string;
  supportPoint?: string;
  status?: 'verified' | 'snippet_only' | 'unreachable' | 'local_document';
  sourceType?: 'document' | 'web' | 'memory';
  docId?: string;
  pageOrSection?: string;
  excerpt?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  contextScope?: 'selection' | 'chapter' | 'project' | 'library';
  sources?: SourceCitation[];
  isStreaming?: boolean;
  isError?: boolean;
  isNotice?: boolean;
  modelUsed?: string;
  diagnostic?: any;
  status?: 'sending' | 'sent' | 'failed';
  errorMessage?: string;
  attachedDocsSnapshot?: any[];
}

export interface ChatSession {
  id: string;
  userId: string;
  projectId?: string;
  title: string;
  mode: 'brainstorm' | 'write' | 'edit' | 'critique' | 'research';
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export type ThemePreference = "light" | "dark" | "system";