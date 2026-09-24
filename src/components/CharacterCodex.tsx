import React, { useState } from "react";
import {
  Users,
  Plus,
  Shield,
  EyeOff,
  Eye,
  Lock,
  Heart,
  HelpCircle,
  AlertOctagon,
  Sparkles,
  Edit2,
  Trash2,
  Save,
  ChevronRight,
  Search,
} from "lucide-react";
import { Character, StoryProject } from "../types";
import { api } from "../services/api";

interface CharacterCodexProps {
  project: StoryProject;
  characters: Character[];
  onCharactersUpdated: (chars: Character[]) => void;
}

export const CharacterCodex: React.FC<CharacterCodexProps> = ({
  project,
  characters,
  onCharactersUpdated,
}) => {
  const [selectedCharId, setSelectedCharId] = useState<string>(characters[0]?.id || "");
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Character>>({});

  const activeChar = characters.find((c) => c.id === selectedCharId) || characters[0];

  const handleSelect = (char: Character) => {
    setSelectedCharId(char.id);
    setIsEditing(false);
  };

  const handleStartEdit = (char: Character) => {
    setEditForm({ ...char });
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!editForm.id) return;
    try {
      const updated = await api.updateCharacter(project.id, editForm.id, editForm);
      const newChars = characters.map((c) => (c.id === updated.id ? updated : c));
      onCharactersUpdated(newChars);
      setIsEditing(false);
    } catch (err: any) {
      alert(err.message || "Lỗi lưu nhân vật");
    }
  };

  const handleCreateNew = async () => {
    try {
      const newChar = await api.createCharacter(project.id, {
        name: "Nhân vật mới",
        role: "supporting",
        age: 20,
        appearance: "Mô tả ngoại hình đặc trưng...",
        personality: "Đặc điểm tính cách...",
        externalGoal: "Mục tiêu bên ngoài...",
        internalConflict: "Xung đột nội tâm...",
        fears: "Nỗi sợ lớn nhất...",
        secrets: "Bí mật giấu kín...",
        powersAndLimits: "Giới hạn năng lực / Điểm yếu...",
        habitsAndVoice: "Điềm đạm, kiệm lời",
        knowledge: {
          knows: ["Dữ kiện đã biết"],
          unawareOf: ["Điều chưa biết (Cấm để nhân vật này biết trước)"],
          misinterprets: [],
          hides: [],
        },
        chapterStatuses: [],
      });
      onCharactersUpdated([...characters, newChar]);
      setSelectedCharId(newChar.id);
      handleStartEdit(newChar);
    } catch (err: any) {
      alert(err.message || "Lỗi tạo nhân vật");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa hồ sơ nhân vật này?")) return;
    await api.deleteCharacter(project.id, id);
    const filtered = characters.filter((c) => c.id !== id);
    onCharactersUpdated(filtered);
    if (filtered.length > 0) setSelectedCharId(filtered[0].id);
  };

  const filteredCharacters = characters.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-3.5rem)] flex bg-white font-ui overflow-hidden">
      {/* Left List */}
      <div className="w-72 border-r border-stone-200 bg-stone-50/50 flex flex-col shrink-0">
        <div className="p-3 border-b border-stone-200 flex items-center justify-between">
          <span className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-amber-600" />
            Nhân vật ({characters.length})
          </span>
          <button
            onClick={handleCreateNew}
            className="p-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Thêm
          </button>
        </div>

        <div className="p-2 border-b border-stone-200/60">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm nhân vật..."
              className="w-full pl-8 pr-2.5 py-1.5 bg-white border border-stone-200 rounded-lg text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
          {filteredCharacters.map((c) => {
            const isSelected = c.id === selectedCharId;
            return (
              <button
                key={c.id}
                onClick={() => handleSelect(c)}
                className={`w-full text-left p-2.5 rounded-xl text-xs transition-all flex items-start justify-between ${
                  isSelected
                    ? "bg-amber-500 text-white font-semibold shadow-xs"
                    : "text-stone-700 hover:bg-stone-200/50"
                }`}
              >
                <div>
                  <div className="font-bold">{c.name}</div>
                  <div className={`text-[10px] capitalize ${isSelected ? "text-amber-100" : "text-stone-400"}`}>
                    {c.role === "protagonist"
                      ? "Nhân vật chính"
                      : c.role === "antagonist"
                      ? "Phản diện"
                      : c.role === "mentor"
                      ? "Người thầy"
                      : "Nhân vật phụ"}
                  </div>
                </div>
                {c.knowledge?.unawareOf && c.knowledge.unawareOf.length > 0 && (
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                      isSelected ? "bg-amber-700/60 text-white" : "bg-red-50 text-red-700 border border-red-200"
                    }`}
                    title="Có kiến thức cấm để lộ"
                  >
                    Bảo mật
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Detail Pane */}
      {activeChar ? (
        <div className="flex-1 overflow-y-auto p-6 bg-stone-50/40">
          <div className="max-w-4xl mx-auto flex flex-col gap-6">
            {/* Header / Actions */}
            <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-400 text-white flex items-center justify-center font-bold text-xl shadow-md">
                  {activeChar.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-extrabold text-stone-900">{activeChar.name}</h2>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase bg-amber-100 text-amber-800">
                      {activeChar.role}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 mt-1">
                    Tuổi: {activeChar.age || "Chưa rõ"} • Biệt danh: {activeChar.nickname || "Không"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleSaveEdit}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs"
                    >
                      <Save className="w-3.5 h-3.5" />
                      Lưu thay đổi
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-medium"
                    >
                      Hủy
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleStartEdit(activeChar)}
                      className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Chỉnh sửa
                    </button>
                    <button
                      onClick={() => handleDelete(activeChar.id)}
                      className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                      title="Xóa nhân vật"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Knowledge Tracker Card (The Core Constraint) */}
            <div className="bg-white p-5 rounded-2xl border-2 border-red-200/80 shadow-xs flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-red-100 text-red-700 flex items-center justify-center">
                    <AlertOctagon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-stone-900">
                      Bảng Giới Hạn Kiến Thức (Knowledge & Blindspot Tracker)
                    </h3>
                    <p className="text-[11px] text-stone-500">
                      KAIST cam kết tuyệt đối: Nhân vật chỉ hành động dựa trên những gì họ biết.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* What Knows */}
                <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200">
                  <div className="font-bold text-emerald-900 flex items-center gap-1.5 mb-2">
                    <Eye className="w-3.5 h-3.5 text-emerald-600" />
                    Điều ĐÃ BIẾT (Knows):
                  </div>
                  <ul className="list-disc list-inside text-stone-700 space-y-1">
                    {activeChar.knowledge?.knows?.map((k, i) => (
                      <li key={i}>{k}</li>
                    )) || <li>Chưa nhập dữ liệu</li>}
                  </ul>
                </div>

                {/* What Unaware Of - STRICT FORBIDDEN */}
                <div className="p-3.5 bg-red-50/70 rounded-xl border border-red-300">
                  <div className="font-bold text-red-900 flex items-center gap-1.5 mb-2">
                    <EyeOff className="w-3.5 h-3.5 text-red-600" />
                    Điều CHƯA BIẾT (CẤM ĐỂ LỘ):
                  </div>
                  <ul className="list-disc list-inside text-stone-800 space-y-1 font-medium">
                    {activeChar.knowledge?.unawareOf?.map((u, i) => (
                      <li key={i}>{u}</li>
                    )) || <li>Không có giới hạn bảo mật</li>}
                  </ul>
                </div>

                {/* What Misinterprets */}
                <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200">
                  <div className="font-bold text-amber-900 flex items-center gap-1.5 mb-2">
                    <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                    Điều ĐANG HIỂU SAI (Misinterprets):
                  </div>
                  <ul className="list-disc list-inside text-stone-700 space-y-1">
                    {activeChar.knowledge?.misinterprets?.map((m, i) => (
                      <li key={i}>{m}</li>
                    )) || <li>Chưa ghi nhận</li>}
                  </ul>
                </div>

                {/* What Hides */}
                <div className="p-3.5 bg-purple-50/60 rounded-xl border border-purple-200">
                  <div className="font-bold text-purple-900 flex items-center gap-1.5 mb-2">
                    <Lock className="w-3.5 h-3.5 text-purple-600" />
                    Điều ĐANG CHE GIẤU (Hides):
                  </div>
                  <ul className="list-disc list-inside text-stone-700 space-y-1">
                    {activeChar.knowledge?.hides?.map((h, i) => (
                      <li key={i}>{h}</li>
                    )) || <li>Không có bí mật giấu kín</li>}
                  </ul>
                </div>
              </div>
            </div>

            {/* Psychological Dossier & Goals */}
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
              <div>
                <h4 className="font-bold text-stone-900 mb-2">Đặc điểm ngoại hình & Dấu vết</h4>
                <p className="text-stone-600 leading-relaxed bg-stone-50 p-3 rounded-xl border border-stone-150">
                  {activeChar.appearance || "Chưa có mô tả"}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-stone-900 mb-2">Tính cách & Tâm lý cốt lõi</h4>
                <p className="text-stone-600 leading-relaxed bg-stone-50 p-3 rounded-xl border border-stone-150">
                  {activeChar.personality || "Chưa có mô tả"}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-stone-900 mb-2">Mục tiêu bên ngoài (External Goal)</h4>
                <p className="text-stone-600 leading-relaxed bg-stone-50 p-3 rounded-xl border border-stone-150">
                  {activeChar.externalGoal || "Chưa có mục tiêu"}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-stone-900 mb-2">Xung đột nội tâm (Internal Conflict)</h4>
                <p className="text-stone-600 leading-relaxed bg-stone-50 p-3 rounded-xl border border-stone-150">
                  {activeChar.internalConflict || "Chưa xác định"}
                </p>
              </div>

              <div className="md:col-span-2">
                <h4 className="font-bold text-stone-900 mb-2">Giọng điệu & Thói quen giao tiếp</h4>
                <div className="flex items-center gap-3 bg-stone-50 p-3 rounded-xl border border-stone-150">
                  <span className="font-semibold text-stone-700">Phong thái:</span>
                  <span className="bg-white px-2 py-1 rounded border border-stone-200">
                    {activeChar.habitsAndVoice || "Bình thường"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-stone-400 text-xs">
          Chọn một nhân vật để xem chi tiết
        </div>
      )}
    </div>
  );
};