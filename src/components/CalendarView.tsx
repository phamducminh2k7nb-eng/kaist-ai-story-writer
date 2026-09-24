import React, { useState } from "react";
import {
  Calendar as CalendarIcon,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Filter,
  Flame,
} from "lucide-react";
import { CalendarEvent } from "../types";
import { api } from "../services/api";

interface CalendarViewProps {
  events: CalendarEvent[];
  onEventsUpdated: (events: CalendarEvent[]) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  events,
  onEventsUpdated,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEvent, setNewEvent] = useState<Partial<CalendarEvent>>({
    title: "",
    date: new Date().toISOString().split("T")[0],
    type: "chapter_deadline",
    targetWords: 3000,
    status: "in_progress",
  });

  const handleCreateEvent = async () => {
    if (!newEvent.title?.trim()) return;
    try {
      const created = await api.createCalendarEvent(newEvent);
      onEventsUpdated([...events, created]);
      setShowAddModal(false);
      setNewEvent({
        title: "",
        date: new Date().toISOString().split("T")[0],
        type: "chapter_deadline",
        targetWords: 3000,
        status: "in_progress",
      });
    } catch (err) {
      console.error(err);
      alert("Lỗi thêm sự kiện");
    }
  };

  const handleToggleStatus = async (ev: CalendarEvent) => {
    const nextStatus = ev.status === "completed" ? "in_progress" : "completed";
    try {
      const updated = await api.updateCalendarEvent(ev.id, { status: nextStatus });
      onEventsUpdated(events.map((e) => (e.id === updated.id ? updated : e)));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col bg-stone-50/50 font-ui overflow-hidden">
      {/* Top Bar */}
      <div className="px-6 py-4 bg-white border-b border-stone-200 flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-800 flex items-center justify-center font-bold">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-stone-900">Lịch Viết & Kế Hoạch Đăng Bài</h2>
            <p className="text-xs text-stone-500">
              Quản lý thời hạn hoàn thành chương truyện, sprint viết và lịch xuất bản đa kênh
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Thêm mục tiêu / Hạn chót
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 max-w-5xl mx-auto w-full flex flex-col gap-6">
        {/* Milestone Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-stone-500">Chuỗi ngày viết</div>
              <div className="text-lg font-extrabold text-stone-900">7 ngày liên tiếp</div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-stone-500">Mục tiêu đã đạt</div>
              <div className="text-lg font-extrabold text-stone-900">
                {events.filter((e) => e.status === "completed").length} sự kiện
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-stone-500">Đang tiến hành</div>
              <div className="text-lg font-extrabold text-stone-900">
                {events.filter((e) => e.status === "in_progress").length} nhiệm vụ
              </div>
            </div>
          </div>
        </div>

        {/* Events List */}
        <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-2xs flex flex-col gap-4">
          <h3 className="font-bold text-stone-900 text-sm">Danh Sách Lịch Trình Chi Tiết</h3>

          <div className="divide-y divide-stone-100">
            {events.map((ev) => (
              <div
                key={ev.id}
                className="py-3.5 flex items-center justify-between hover:bg-stone-50 px-3 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleToggleStatus(ev)}
                    className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${
                      ev.status === "completed"
                        ? "bg-emerald-500 border-emerald-500 text-white"
                        : "border-stone-300 hover:border-amber-500 text-transparent"
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                  <div>
                    <div
                      className={`text-xs font-bold ${
                        ev.status === "completed" ? "line-through text-stone-400" : "text-stone-900"
                      }`}
                    >
                      {ev.title}
                    </div>
                    <div className="text-[11px] text-stone-400 mt-0.5">
                      Ngày: <strong>{ev.date}</strong> • Loại:{" "}
                      {ev.type === "chapter_deadline" ? "Hạn chót chương" : "Đăng bài Marketing"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {ev.targetWords && (
                    <span className="text-xs font-mono text-stone-500 font-medium">
                      {ev.targetWords.toLocaleString()} từ
                    </span>
                  )}
                  <span
                    className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${
                      ev.status === "completed"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {ev.status === "completed" ? "Đã xong" : "Đang thực hiện"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal Add Event */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-stone-200 flex flex-col gap-4 text-xs font-ui">
            <h3 className="font-bold text-stone-900 text-sm">Thêm Kế Hoạch Mới</h3>

            <div>
              <label className="font-semibold text-stone-700 block mb-1">Nhiệm vụ / Mục tiêu:</label>
              <input
                type="text"
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                placeholder="Ví dụ: Hoàn thiện Chương 12: Quyết chiến đỉnh Ma Thiên..."
                className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-stone-700 block mb-1">Ngày hoàn thành:</label>
                <input
                  type="date"
                  value={newEvent.date}
                  onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-900"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Mục tiêu số từ:</label>
                <input
                  type="number"
                  value={newEvent.targetWords}
                  onChange={(e) => setNewEvent({ ...newEvent, targetWords: Number(e.target.value) })}
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-900"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-stone-600 hover:text-stone-900"
              >
                Hủy
              </button>
              <button
                onClick={handleCreateEvent}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg shadow-xs"
              >
                Lưu kế hoạch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};