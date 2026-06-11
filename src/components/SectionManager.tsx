import React, { useState } from "react";
import { Section } from "../types";
import { Plus, ArrowUp, ArrowDown, Edit2, Trash2, Check, X, FolderKanban } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface SectionManagerProps {
  sections: Section[];
  activeSectionId: string;
  onSelectSection: (id: string) => void;
  onAddSection: (title: string, description: string) => void;
  onEditSection: (id: string, updates: Partial<Section>) => void;
  onDeleteSection: (id: string) => void;
  onReorderSections: (id: string, direction: "up" | "down") => void;
}

export default function SectionManager({
  sections,
  activeSectionId,
  onSelectSection,
  onAddSection,
  onEditSection,
  onDeleteSection,
  onReorderSections,
}: SectionManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");

  // Custom non-blocking confirmation dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    actionText: string;
    onConfirm: () => void;
  } | null>(null);

  // Handle Add section trigger
  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onAddSection(newTitle.trim(), newDesc.trim());
    setNewTitle("");
    setNewDesc("");
    setIsAdding(false);
  };

  // Start edit mode
  const startEdit = (sec: Section, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(sec.id);
    setEditTitle(sec.title);
    setEditDesc(sec.description);
  };

  // Save edit
  const handleSaveEdit = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!editTitle.trim()) return;
    onEditSection(id, { title: editTitle.trim(), description: editDesc.trim() });
    setEditingId(null);
  };

  return (
    <div className="bg-white border-b border-slate-200 p-5 shadow-xs">
      <div className="max-w-7xl mx-auto">
        {/* Header section with title and Add quick button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-zinc-100 border border-zinc-200 rounded-lg text-black shadow-xs">
              <FolderKanban size={18} />
            </div>
            <div>
              <h2 className="text-xs font-bold tracking-wider uppercase text-zinc-900 font-display">
                Các Module Bài Giảng (Modules)
              </h2>
              <p className="text-xs text-slate-500">
                Lộ trình học tập chuyên sâu, sắp xếp bố cục và nhịp độ Visual Storytelling
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-black hover:bg-zinc-800 text-white shadow-xs transition-colors cursor-pointer"
          >
            {isAdding ? <X size={14} /> : <Plus size={14} />}
            {isAdding ? "Hủy" : "Thêm Chương Mới"}
          </button>
        </div>

        {/* Add Form Accordion */}
        <AnimatePresence>
          {isAdding && (
            <motion.form
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              onSubmit={handleAdd}
              className="overflow-hidden bg-slate-50 rounded-xl p-4 border border-slate-200 mb-4"
            >
              <h3 className="text-xs font-bold text-slate-800 uppercase mb-3">Tạo Chương Lớn Mới</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                    Tiêu Đề Chương
                  </label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="ví dụ: Chương 4: Kể chuyện bằng Thiết kế màu sắc (Color Pacing)..."
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-black"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                    Mô Tả Tóm Tắt chương
                  </label>
                  <input
                    type="text"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Sử dụng ánh sáng và sắc diện màu sắc để dẫn dắt hành trình cảm xúc..."
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-black"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs bg-black hover:bg-zinc-800 text-white font-semibold rounded-lg"
                >
                  Xác nhận thêm
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Horizontal Navigation List of Tabs */}
        <div className="flex flex-wrap gap-2 overflow-x-auto pb-2 border-b border-slate-200">
          {sections
            .sort((a, b) => a.order - b.order)
            .map((sec, idx) => {
              const isActive = sec.id === activeSectionId;
              const isEditing = sec.id === editingId;

              return (
                <div
                  key={sec.id}
                  onClick={() => !isEditing && onSelectSection(sec.id)}
                  className={`group relative flex flex-col min-w-[200px] max-w-[280px] flex-1 rounded-xl p-3 border cursor-pointer transition-all ${
                    isActive
                      ? "bg-zinc-200/90 border-zinc-900 text-zinc-950 font-bold border-b-3 shadow-2xs"
                      : "bg-zinc-100/60 border-zinc-200 hover:bg-zinc-200/50 text-zinc-650"
                  }`}
                >
                  {/* Inline Edit form / Section details view */}
                  {isEditing ? (
                    <div onClick={(e) => e.stopPropagation()} className="space-y-2">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-800 focus:outline-none focus:border-black"
                      />
                      <textarea
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        rows={2}
                        className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-[10px] text-slate-800 focus:outline-none focus:border-black"
                      />
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-1 text-slate-500 hover:text-slate-800"
                          title="Hủy"
                        >
                          <X size={12} />
                        </button>
                        <button
                          onClick={(e) => handleSaveEdit(sec.id, e)}
                          className="p-1 text-emerald-600 hover:text-emerald-800"
                          title="Lưu"
                        >
                          <Check size={12} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {/* Section Index Marker */}
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                        Chương {idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
                      </span>
                      {/* Title */}
                      <h3 className="text-xs font-bold leading-tight font-display break-words line-clamp-2 text-slate-900 group-hover:text-black transition-colors">
                        {sec.title}
                      </h3>
                      {/* Description */}
                      <p className="text-[10px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {sec.description || "Chưa có mô tả."}
                      </p>
                      
                      {/* Total cards badge */}
                      <div className="flex items-center gap-1.5 mt-2">
                        <span className="text-[9px] bg-slate-100 py-0.5 px-2 rounded-full font-mono text-slate-600 border border-slate-200">
                          {sec.cards.length} bài học
                        </span>
                      </div>

                      {/* Control buttons overlaying on hover */}
                      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 flex items-center gap-1 bg-white/95 rounded-md p-1 border border-slate-200 shadow-md transition-opacity">
                        <button
                          onClick={(e) => startEdit(sec, e)}
                          className="p-1 text-slate-500 hover:text-black transition-colors"
                          title="Chỉnh sửa chương"
                        >
                          <Edit2 size={10} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDialog({
                              title: "Xóa chương lớn",
                              message: `Bạn chắc chắn muốn xóa chương "${sec.title}" cùng toàn bộ bài học bên trong? Thao tác này không thể khôi phục.`,
                              actionText: "Xác nhận xóa",
                              onConfirm: () => {
                                onDeleteSection(sec.id);
                                setConfirmDialog(null);
                              }
                            });
                          }}
                          className="p-1 text-rose-500 hover:text-rose-700 transition-colors"
                          title="Xóa chương"
                        >
                          <Trash2 size={10} />
                        </button>
                        {idx > 0 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onReorderSections(sec.id, "up");
                            }}
                            className="p-1 text-slate-500 hover:text-black transition-colors"
                            title="Di chuyển lên"
                          >
                            <ArrowUp size={10} />
                          </button>
                        )}
                        {idx < sections.length - 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onReorderSections(sec.id, "down");
                            }}
                            className="p-1 text-slate-500 hover:text-black transition-colors"
                            title="Di chuyển xuống"
                          >
                            <ArrowDown size={10} />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </div>

      {/* Custom Modal Confirmation Portal */}
      <AnimatePresence>
        {confirmDialog && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-100">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border-2 border-slate-900 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              {/* Header */}
              <div className="bg-black text-white px-5 py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FolderKanban size={15} className="text-zinc-200 animate-pulse" />
                  <span className="text-[11px] font-bold uppercase tracking-wider font-mono text-zinc-200">
                    Xác nhận tác vụ
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setConfirmDialog(null)}
                  className="p-1 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-3.5">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-zinc-50 text-black rounded-xl border border-zinc-200 shrink-0 mt-0.5">
                    <Trash2 size={18} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 font-display">
                      {confirmDialog.title}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed mt-1 font-sans">
                      {confirmDialog.message}
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="bg-slate-50 border-t border-slate-100 px-5 py-3.5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmDialog(null)}
                  className="px-4 py-2 border border-slate-200 hover:border-slate-300 text-slate-500 hover:text-slate-800 bg-white text-xs font-semibold rounded-lg transition-all cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={confirmDialog.onConfirm}
                  className="px-4.5 py-2 bg-black hover:bg-zinc-800 text-white text-xs font-bold rounded-lg transition-all cursor-pointer shadow-xs"
                >
                  {confirmDialog.actionText}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
