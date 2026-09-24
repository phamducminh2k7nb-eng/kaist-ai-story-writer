import React, { useState } from "react";
import {
  Globe,
  Compass,
  Scroll,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  AlertTriangle,
  ChevronRight,
  ShieldAlert,
  Sparkles,
  Search,
} from "lucide-react";
import { WorldRule, OutlineEvent, StoryProject } from "../types";
import { api } from "../services/api";

interface WorldbuildingViewProps {
  project: StoryProject;
  worldRules: WorldRule[];
  outlines: OutlineEvent[];
  onRulesUpdated: (rules: WorldRule[]) => void;
  onOutlinesUpdated: (outlines: OutlineEvent[]) => void;
}

export const WorldbuildingView: React.FC<WorldbuildingViewProps> = ({
  project,
  worldRules,
  outlines,
  onRulesUpdated,
  onOutlinesUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<"rules" | "timeline">("rules");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Create rule modal
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [newRule, setNewRule] = useState<Partial<WorldRule>>({
    name: "",
    category: "power_system",
    description: "",
    costOrLimit: "",
    status: "finalized",
    exceptions: "",
  });

  const handleCreateRule = async () => {
    if (!newRule.name?.trim()) return;
    try {
      const created = await api.createWorldRule(project.id, {
        ...newRule,
        category: newRule.category || "power_system",
        status: "finalized",
      });
      onRulesUpdated([...worldRules, created]);
      setShowRuleModal(false);
      setNewRule({
        name: "",
        category: "power_system",
        description: "",
        costOrLimit: "",
        status: "finalized",
        exceptions: "",
      });
    } catch (err: any) {
      alert(err.message || "Lỗi tạo quy tắc thế giới");
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa quy luật thế giới này?")) return;
    await api.deleteWorldRule(project.id, id);
    onRulesUpdated(worldRules.filter((r) => r.id !== id));
  };

  const filteredRules = worldRules.filter((r) => {
    const matchSearch =
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = selectedCategory === "all" || r.category === selectedCategory;
    return matchSearch && matchCat;
  });

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col bg-stone-50/50 font-ui overflow-hidden">
      {/* Top Bar */}
      <div className="px-6 py-4 bg-white border-b border-stone-200 flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-stone-900">Thiết Lập Thế Giới & Dòng Thời Gian</h2>
            <p className="text-xs text-stone-500">
              Khai mở hệ thống phép thuật, địa lý, phe phái và kiểm soát tính nhất quán của cốt truyện
            </p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center bg-stone-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("rules")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "rules"
                ? "bg-white text-stone-900 shadow-2xs"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            Quy luật & Hệ thống ({worldRules.length})
          </button>
          <button
            onClick={() => setActiveTab("timeline")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "timeline"
                ? "bg-white text-stone-900 shadow-2xs"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            Dòng thời gian & Manh mối ({outlines.length})
          </button>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 overflow-y-auto p-6 max-w-6xl mx-auto w-full">
        {activeTab === "rules" ? (
          <div className="flex flex-col gap-5">
            {/* Filter & Add Rule */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-stone-200 shadow-2xs">
              <div className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-stone-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm quy luật thế giới..."
                  className="text-xs text-stone-800 bg-transparent focus:outline-none w-48 sm:w-64"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="text-xs bg-stone-50 border border-stone-200 rounded-lg p-1.5 text-stone-700"
                >
                  <option value="all">Tất cả danh mục</option>
                  <option value="power_system">Hệ thống năng lượng / Phép thuật</option>
                  <option value="geography">Địa lý & Vùng đất</option>
                  <option value="factions">Phe phái & Bang hội</option>
                  <option value="history">Lịch sử & Niên đại</option>
                  <option value="glossary">Thuật ngữ riêng</option>
                </select>

                <button
                  onClick={() => setShowRuleModal(true)}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Thêm thiết lập
                </button>
              </div>
            </div>

            {/* Rules Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredRules.map((rule) => (
                <div
                  key={rule.id}
                  className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        {rule.category}
                      </span>
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 font-semibold">
                        {rule.status === "finalized" ? "Bất biến" : "Đề xuất"}
                      </span>
                    </div>

                    <h4 className="font-bold text-stone-900 text-sm mt-2">{rule.name}</h4>
                    <p className="text-xs text-stone-600 mt-2 leading-relaxed bg-stone-50 p-3 rounded-xl border border-stone-150">
                      {rule.description}
                    </p>

                    {rule.costOrLimit && (
                      <div className="mt-3 p-2.5 rounded-lg bg-red-50/60 border border-red-200 text-xs">
                        <div className="font-bold text-red-900 flex items-center gap-1 mb-1">
                          <ShieldAlert className="w-3 h-3 text-red-600" />
                          Giới hạn & Cái giá phải trả:
                        </div>
                        <div className="text-stone-700">{rule.costOrLimit}</div>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-end">
                    <button
                      onClick={() => handleDeleteRule(rule.id)}
                      className="text-stone-300 hover:text-red-600 p-1"
                      title="Xóa thiết lập"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Timeline Tab */
          <div className="flex flex-col gap-4">
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
              <h3 className="text-sm font-bold text-stone-900 mb-1">
                Dòng Thời Gian Biên Niên Sử & Hồi Cốt Truyện
              </h3>
              <p className="text-xs text-stone-500 mb-4">
                Theo dõi các sự kiện cốt lõi, manh mối gieo rắc và lời hứa với độc giả
              </p>

              <div className="relative pl-6 border-l-2 border-amber-300 space-y-6">
                {outlines.map((item, idx) => (
                  <div key={item.id} className="relative group">
                    <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-amber-500 border-4 border-white shadow-xs" />
                    <div className="bg-stone-50 hover:bg-stone-100/80 p-4 rounded-xl border border-stone-200 transition-colors">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-amber-700 uppercase">
                          {item.act || "Hồi I"}
                        </span>
                        <span className="text-[10px] text-stone-400">Thứ tự: {item.storyOrder}</span>
                      </div>
                      <h4 className="font-bold text-stone-900 text-xs mt-1">{item.title}</h4>
                      <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                        {item.description}
                      </p>

                      {item.cluesTracked && item.cluesTracked.length > 0 && (
                        <div className="mt-2 text-[11px] text-amber-800 bg-amber-50/70 p-2 rounded-lg border border-amber-200">
                          <strong>Manh mối gieo rắc:</strong> {item.cluesTracked.join("; ")}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal Add Rule */}
      {showRuleModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-stone-200 flex flex-col gap-4 text-xs font-ui">
            <h3 className="font-bold text-stone-900 text-sm">Thêm Quy Tắc Thế Giới Mới</h3>

            <div>
              <label className="font-semibold text-stone-700 block mb-1">Tên quy tắc / Khái niệm:</label>
              <input
                type="text"
                value={newRule.name}
                onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                placeholder="Ví dụ: Định luật bảo toàn linh khí..."
                className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-900"
              />
            </div>

            <div>
              <label className="font-semibold text-stone-700 block mb-1">Danh mục:</label>
              <select
                value={newRule.category}
                onChange={(e) => setNewRule({ ...newRule, category: e.target.value as any })}
                className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-900"
              >
                <option value="power_system">Hệ thống năng lượng / Phép thuật</option>
                <option value="geography">Địa lý & Vùng đất</option>
                <option value="factions">Phe phái & Bang hội</option>
                <option value="history">Lịch sử & Niên đại</option>
                <option value="glossary">Thuật ngữ riêng</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-stone-700 block mb-1">Mô tả chi tiết nguyên lý:</label>
              <textarea
                rows={3}
                value={newRule.description}
                onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                placeholder="Nguyên lý hoạt động, cách nhân vật kích hoạt, phạm vi ảnh hưởng..."
                className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-900 resize-none"
              />
            </div>

            <div>
              <label className="font-semibold text-stone-700 block mb-1">
                Giới hạn & Cái giá phải trả (Rất quan trọng):
              </label>
              <input
                type="text"
                value={newRule.costOrLimit}
                onChange={(e) => setNewRule({ ...newRule, costOrLimit: e.target.value })}
                placeholder="Cạn kiệt tuổi thọ, tổn thương linh hồn..."
                className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-900"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                onClick={() => setShowRuleModal(false)}
                className="px-4 py-2 text-stone-600 hover:text-stone-900"
              >
                Hủy
              </button>
              <button
                onClick={handleCreateRule}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg shadow-xs"
              >
                Lưu quy tắc
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};