import React, { useEffect, useMemo, useState } from "react";
import {
  Bot,
  CalendarClock,
  Play,
  Pause,
  Sparkles,
  Trash2,
  Rocket,
  BookOpen,
  PanelsTopLeft,
  Send,
  CheckCircle2,
  Clock3,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { StoryAutomation, StoryProject, PublicationQueueItem } from "../types";
import { api } from "../services/api";

interface AutopilotViewProps {
  activeProject: StoryProject | null;
  onProjectChanged?: () => Promise<void> | void;
}

const intervalOptions = [
  { value: 24, label: "Mỗi ngày" },
  { value: 48, label: "Mỗi 2 ngày" },
  { value: 72, label: "Mỗi 3 ngày" },
  { value: 168, label: "Mỗi tuần" },
];

const fmtDate = (iso?: string) => {
  if (!iso) return "Chưa lên lịch";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" });
};

export const AutopilotView: React.FC<AutopilotViewProps> = ({ activeProject, onProjectChanged }) => {
  const [automations, setAutomations] = useState<StoryAutomation[]>([]);
  const [queue, setQueue] = useState<PublicationQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [format, setFormat] = useState<"novel" | "manga" | "hybrid">("hybrid");
  const [intervalHours, setIntervalHours] = useState(24);
  const [targetWords, setTargetWords] = useState(2200);
  const [mangaPanels, setMangaPanels] = useState(8);
  const [approvalMode, setApprovalMode] = useState<"review_before_queue" | "auto_queue">("review_before_queue");
  const [autoQueuePublish, setAutoQueuePublish] = useState(true);
  const [autoGenerateImages, setAutoGenerateImages] = useState(false);
  const [firstRunAt, setFirstRunAt] = useState(() => {
    const d = new Date(Date.now() + 60 * 60 * 1000);
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    return local;
  });

  const current = useMemo(
    () => automations.find((a) => a.projectId === activeProject?.id),
    [automations, activeProject?.id]
  );

  const load = async () => {
    setLoading(true);
    try {
      const [a, q] = await Promise.all([api.getStoryAutomations(), api.getPublicationQueue()]);
      setAutomations(a);
      setQueue(q);
      setError(null);
    } catch (e: any) {
      setError(e?.message || "Không thể tải Story Autopilot");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!current) return;
    setFormat(current.format);
    setIntervalHours(current.intervalHours);
    setTargetWords(current.targetWords);
    setMangaPanels(current.mangaPanels);
    setApprovalMode(current.approvalMode);
    setAutoQueuePublish(current.autoQueuePublish);
    setAutoGenerateImages(current.autoGenerateImages);
    const d = new Date(current.nextRunAt);
    if (!Number.isNaN(d.getTime())) {
      setFirstRunAt(new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
    }
  }, [current?.id]);

  const saveAutomation = async () => {
    if (!activeProject) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const payload = {
        projectId: activeProject.id,
        name: `Autopilot · ${activeProject.title}`,
        enabled: current?.enabled ?? false,
        format,
        intervalHours,
        nextRunAt: new Date(firstRunAt).toISOString(),
        targetWords,
        mangaPanels,
        approvalMode,
        autoQueuePublish,
        autoGenerateImages,
      };
      const saved = current
        ? await api.updateStoryAutomation(current.id, payload)
        : await api.createStoryAutomation(payload);
      setAutomations((prev) => [saved, ...prev.filter((a) => a.id !== saved.id)]);
      setMessage("Đã lưu cấu hình Story Autopilot.");
    } catch (e: any) {
      setError(e?.message || "Không thể lưu cấu hình");
    } finally {
      setSaving(false);
    }
  };

  const toggleEnabled = async () => {
    if (!current) {
      await saveAutomation();
      return;
    }
    try {
      const updated = await api.updateStoryAutomation(current.id, { enabled: !current.enabled });
      setAutomations((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    } catch (e: any) {
      setError(e?.message || "Không thể đổi trạng thái Autopilot");
    }
  };

  const runNow = async () => {
    if (!activeProject) return;
    let id = current?.id;
    if (!id) {
      await saveAutomation();
      const refreshed = await api.getStoryAutomations();
      setAutomations(refreshed);
      id = refreshed.find((a) => a.projectId === activeProject.id)?.id;
    }
    if (!id) return;
    setRunningId(id);
    setMessage(null);
    setError(null);
    try {
      const result = await api.runStoryAutomationNow(id);
      setMessage(result.message || "AI đã hoàn tất một vòng tự động.");
      await load();
      await onProjectChanged?.();
    } catch (e: any) {
      setError(e?.message || "Autopilot chạy thất bại");
    } finally {
      setRunningId(null);
    }
  };

  const remove = async () => {
    if (!current) return;
    if (!window.confirm("Xóa lịch Story Autopilot của truyện này?")) return;
    await api.deleteStoryAutomation(current.id);
    setAutomations((prev) => prev.filter((a) => a.id !== current.id));
  };


  const approveQueueItem = async (item: PublicationQueueItem) => {
    try {
      await api.updatePublicationQueueItem(item.id, { status: "queued", scheduledAt: new Date().toISOString() });
      await load();
      setMessage("Đã duyệt chương và đưa vào hàng đợi xuất bản.");
    } catch (e: any) {
      setError(e?.message || "Không thể duyệt chương");
    }
  };

  const projectQueue = queue.filter((q) => q.projectId === activeProject?.id).slice(0, 8);

  return (
    <div className="flex-1 overflow-y-auto bg-zinc-50 dark:bg-[#0d0d10] p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-5">
          <div>
            <div className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-400">KAIST Story Autopilot</div>
            <h1 className="text-2xl font-black mt-1 text-zinc-900 dark:text-white">AI tự viết → dựng manga → xếp lịch → chuẩn bị đăng</h1>
            <p className="text-sm text-zinc-500 mt-1 max-w-3xl">Autopilot tạo chương mới theo Story Bible của dự án, có thể sinh kịch bản panel manga và đưa chương vào hàng đợi xuất bản. Đăng tự động ra nền tảng ngoài chỉ bật khi có connector/API hợp lệ.</p>
          </div>
          <div className={`shrink-0 px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 ${current?.enabled ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900" : "bg-white dark:bg-[#121215] text-zinc-500 border-zinc-200 dark:border-zinc-800"}`}>
            <Bot className="w-4 h-4" />{current?.enabled ? "AUTOPILOT ĐANG BẬT" : "AUTOPILOT ĐANG TẮT"}
          </div>
        </div>

        {!activeProject ? (
          <div className="p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215] text-sm text-zinc-500">Chọn một truyện ở thanh trên cùng trước khi cấu hình Autopilot.</div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_.65fr] gap-5">
              <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215] p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-4"><Rocket className="w-5 h-5 text-indigo-500" /><h2 className="font-extrabold">Cấu hình dây chuyền tự động</h2></div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
                  {[
                    { id: "novel", label: "Truyện chữ", icon: BookOpen },
                    { id: "manga", label: "Manga", icon: PanelsTopLeft },
                    { id: "hybrid", label: "Truyện + Manga", icon: Sparkles },
                  ].map((x) => {
                    const Icon = x.icon;
                    return <button key={x.id} onClick={() => setFormat(x.id as any)} className={`p-3 rounded-xl border text-left ${format === x.id ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30" : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900"}`}><Icon className="w-4 h-4 mb-2 text-indigo-500" /><div className="text-xs font-bold">{x.label}</div></button>;
                  })}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">Chu kỳ
                    <select value={intervalHours} onChange={(e) => setIntervalHours(Number(e.target.value))} className="mt-1.5 w-full p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm">
                      {intervalOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </label>
                  <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">Lần chạy tiếp theo
                    <input type="datetime-local" value={firstRunAt} onChange={(e) => setFirstRunAt(e.target.value)} className="mt-1.5 w-full p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm" />
                  </label>
                  <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">Số chữ/chương
                    <input type="number" min={600} max={8000} step={100} value={targetWords} onChange={(e) => setTargetWords(Number(e.target.value))} className="mt-1.5 w-full p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm" />
                  </label>
                  <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">Panel manga/chương
                    <input type="number" min={4} max={24} value={mangaPanels} onChange={(e) => setMangaPanels(Number(e.target.value))} disabled={format === "novel"} className="mt-1.5 w-full p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm disabled:opacity-40" />
                  </label>
                </div>

                <div className="mt-4 space-y-2">
                  <label className="flex items-center justify-between gap-3 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800"><div><div className="text-xs font-bold">Duyệt trước khi xếp đăng</div><div className="text-[11px] text-zinc-500">An toàn hơn: AI viết xong để bạn kiểm tra rồi mới đưa vào queue.</div></div><input type="checkbox" checked={approvalMode === "review_before_queue"} onChange={(e) => setApprovalMode(e.target.checked ? "review_before_queue" : "auto_queue")} /></label>
                  <label className="flex items-center justify-between gap-3 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800"><div><div className="text-xs font-bold">Tự đưa vào hàng đợi xuất bản</div><div className="text-[11px] text-zinc-500">Không đồng nghĩa với tự đăng ra Wattpad/Webnovel nếu chưa kết nối tài khoản/API.</div></div><input type="checkbox" checked={autoQueuePublish} onChange={(e) => setAutoQueuePublish(e.target.checked)} /></label>
                  <label className="flex items-center justify-between gap-3 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800"><div><div className="text-xs font-bold">Tự chuẩn bị manga</div><div className="text-[11px] text-zinc-500">AI sinh storyboard + prompt panel. Việc render ảnh dùng quota Image AI.</div></div><input type="checkbox" checked={autoGenerateImages} onChange={(e) => setAutoGenerateImages(e.target.checked)} disabled={format === "novel"} /></label>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button onClick={saveAutomation} disabled={saving} className="px-4 py-2 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-bold disabled:opacity-50">{saving ? "Đang lưu..." : "Lưu cấu hình"}</button>
                  <button onClick={toggleEnabled} className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 ${current?.enabled ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300" : "bg-emerald-600 text-white"}`}>{current?.enabled ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}{current?.enabled ? "Tạm dừng" : "Bật Autopilot"}</button>
                  <button onClick={runNow} disabled={Boolean(runningId)} className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-50">{runningId ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}{runningId ? "AI đang viết..." : "Chạy thử ngay"}</button>
                  {current && <button onClick={remove} className="px-3 py-2 rounded-lg border border-red-200 dark:border-red-900 text-red-600 text-xs"><Trash2 className="w-3.5 h-3.5" /></button>}
                </div>
              </section>

              <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215] p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-3"><CalendarClock className="w-4 h-4 text-indigo-500" /><h2 className="font-extrabold text-sm">Trạng thái Agent</h2></div>
                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/70"><div className="text-zinc-500">Truyện</div><div className="font-bold mt-1">{activeProject.title}</div></div>
                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/70"><div className="text-zinc-500">Lần chạy tiếp</div><div className="font-bold mt-1">{fmtDate(current?.nextRunAt || new Date(firstRunAt).toISOString())}</div></div>
                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/70"><div className="text-zinc-500">Lần chạy gần nhất</div><div className="font-bold mt-1">{fmtDate(current?.lastRunAt)}</div>{current?.lastResult && <div className="text-[11px] text-emerald-600 mt-1">{current.lastResult}</div>}</div>
                  {current?.lastError && <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/20 text-red-600"><AlertCircle className="w-4 h-4 mb-1" />{current.lastError}</div>}
                </div>
              </section>
            </div>

            {(message || error) && <div className={`mt-4 p-3 rounded-xl border text-xs ${error ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/20 dark:text-red-300" : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-300"}`}>{error || message}</div>}

            <section className="mt-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215] overflow-hidden">
              <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between"><div><h2 className="font-extrabold text-sm flex items-center gap-2"><Send className="w-4 h-4 text-indigo-500" />Hàng đợi xuất bản</h2><p className="text-[11px] text-zinc-500 mt-0.5">Chương được AI chuẩn bị và chờ duyệt/kết nối nền tảng.</p></div><button onClick={load} className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"><RefreshCw className="w-3.5 h-3.5" /></button></div>
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {loading ? <div className="p-5 text-xs text-zinc-500">Đang tải...</div> : projectQueue.length === 0 ? <div className="p-5 text-xs text-zinc-500">Chưa có chương nào trong hàng đợi. Chạy thử Autopilot để tạo chương đầu tiên.</div> : projectQueue.map((item) => <div key={item.id} className="p-4 flex items-center gap-3"><div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.status === "published" ? "bg-emerald-100 text-emerald-700" : "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600"}`}>{item.status === "published" ? <CheckCircle2 className="w-4 h-4" /> : <Clock3 className="w-4 h-4" />}</div><div className="min-w-0 flex-1"><div className="text-xs font-bold truncate">{item.title}</div><div className="text-[11px] text-zinc-500">{item.status === "waiting_review" ? "Chờ bạn duyệt" : item.status === "queued" ? "Đã xếp lịch" : item.status} · {item.destination === "webhook" ? "Website/CMS" : "Đăng thủ công"} · {fmtDate(item.scheduledAt)}</div></div>{item.status === "waiting_review" && <button onClick={() => approveQueueItem(item)} className="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white text-[11px] font-bold shrink-0">Duyệt & xếp đăng</button>}</div>)}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
};