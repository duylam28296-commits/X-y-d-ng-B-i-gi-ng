import React, { useState, useEffect } from "react";
import { Section, Card } from "./types";
import { DEFAULT_SECTIONS, DEFAULT_TOPIC } from "./defaultData";
import SectionManager from "./components/SectionManager";
import CardList from "./components/CardList";
import GeminiPanel from "./components/GeminiPanel";
import { 
  Sparkles, Film, Play, BookOpen, Layers, Info, Trash2, 
  RotateCcw, AlertTriangle, ExternalLink, Flame, CheckCircle, Lightbulb, X
} from "lucide-react";

export default function App() {
  const [topic, setTopic] = useState(DEFAULT_TOPIC);
  const [sections, setSections] = useState<Section[]>([]);
  const [activeSectionId, setActiveSectionId] = useState<string>("");
  const [isAILoadingMap, setIsAILoadingMap] = useState<{ [key: string]: boolean }>({});
  
  // App-level notification toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastExplaintation, setToastExplaintation] = useState<string | null>(null);

  // Connection/API Key state
  const [hasApiKey, setHasApiKey] = useState<boolean>(true);

  // 1. Initial State Load
  useEffect(() => {
    const savedTopic = localStorage.getItem("vstory_topic");
    const savedSections = localStorage.getItem("vstory_sections");

    if (savedTopic) setTopic(savedTopic);
    
    if (savedSections) {
      try {
        const parsed = JSON.parse(savedSections);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSections(parsed);
          // Set active section
          const sorted = parsed.sort((a, b) => a.order - b.order);
          setActiveSectionId(sorted[0].id);
        } else {
          loadDefaultSyllabus();
        }
      } catch (e) {
        console.error("Failed to parse sections from local storage:", e);
        loadDefaultSyllabus();
      }
    } else {
      loadDefaultSyllabus();
    }

    // Check backend API key configuration
    fetch("/api/status")
      .then(res => res.json())
      .then(data => {
        if (data && typeof data.hasApiKey === "boolean") {
          setHasApiKey(data.hasApiKey);
        }
      })
      .catch(err => {
        console.warn("Failed to contact backend status API, using fallback mode", err);
      });
  }, []);

  const loadDefaultSyllabus = () => {
    setSections(DEFAULT_SECTIONS);
    setActiveSectionId("sec-1");
    setTopic(DEFAULT_TOPIC);
    saveState(DEFAULT_TOPIC, DEFAULT_SECTIONS);
  };

  const saveState = (newTopic: string, newSections: Section[]) => {
    localStorage.setItem("vstory_topic", newTopic);
    localStorage.setItem("vstory_sections", JSON.stringify(newSections));
  };

  // 2. Section Crud Operations
  const handleAddSection = (title: string, description: string) => {
    const maxOrder = sections.reduce((max, s) => (s.order > max ? s.order : max), 0);
    const newSec: Section = {
      id: `sec-${Date.now()}`,
      title,
      description,
      order: maxOrder + 1,
      cards: []
    };
    const updated = [...sections, newSec];
    setSections(updated);
    setActiveSectionId(newSec.id);
    saveState(topic, updated);
    
    showToast("Đã tạo chương bài giảng mới!", `Chương vừa tạo: "${title}" hiện đang sẵn sàng để soạn bài.`);
  };

  const handleEditSection = (id: string, updates: Partial<Section>) => {
    const updated = sections.map(s => {
      if (s.id === id) {
        return { ...s, ...updates };
      }
      return s;
    });
    setSections(updated);
    saveState(topic, updated);
  };

  const handleDeleteSection = (id: string) => {
    const updated = sections.filter(s => s.id !== id);
    setSections(updated);
    saveState(topic, updated);

    // Re-assign active section if deleted
    if (activeSectionId === id) {
      const remainingSorted = updated.sort((a, b) => a.order - b.order);
      if (remainingSorted.length > 0) {
        setActiveSectionId(remainingSorted[0].id);
      } else {
        setActiveSectionId("");
      }
    }
    showToast("Đã xóa chương bài giảng", "Hệ thống đã dọn dẹp các thư mục liên quan.");
  };

  const handleReorderSections = (id: string, direction: "up" | "down") => {
    const sorted = [...sections].sort((a, b) => a.order - b.order);
    const index = sorted.findIndex(s => s.id === id);
    if (index === -1) return;

    if (direction === "up" && index > 0) {
      // Swap order attributes
      const currentOrder = sorted[index].order;
      sorted[index].order = sorted[index - 1].order;
      sorted[index - 1].order = currentOrder;
    } else if (direction === "down" && index < sorted.length - 1) {
      const currentOrder = sorted[index].order;
      sorted[index].order = sorted[index + 1].order;
      sorted[index + 1].order = currentOrder;
    }

    setSections(sorted);
    saveState(topic, sorted);
  };

  // 3. Card level (Lessons) CRUD inside active Section
  const handleAddCard = (title: string, coreKnowledge: string, videoContent: string) => {
    if (!activeSectionId) {
      alert("Vui lòng chọn hoặc thêm một chương lớn trước!");
      return;
    }

    const updated = sections.map(s => {
      if (s.id === activeSectionId) {
        const maxOrder = s.cards.reduce((max, c) => (c.order > max ? c.order : max), 0);
        const newCard: Card = {
          id: `card-${Date.now()}`,
          title,
          coreKnowledge,
          videoContent,
          order: maxOrder + 1
        };
        return { ...s, cards: [...s.cards, newCard] };
      }
      return s;
    });

    setSections(updated);
    saveState(topic, updated);
    showToast("Đã thêm bài học minh họa!", `Bài học "${title}" với 2 cột cấu trúc lý thuyết & kịch bản đã lưu.`);
  };

  const handleUpdateCard = (cardId: string, updates: Partial<Card>) => {
    const updated = sections.map(s => {
      if (s.id === activeSectionId) {
        const updatedCards = s.cards.map(c => {
          if (c.id === cardId) {
            return { ...c, ...updates };
          }
          return c;
        });
        return { ...s, cards: updatedCards };
      }
      return s;
    });
    setSections(updated);
    saveState(topic, updated);
  };

  const handleDeleteCard = (cardId: string) => {
    const updated = sections.map(s => {
      if (s.id === activeSectionId) {
        const filteredCards = s.cards.filter(c => c.id !== cardId);
        return { ...s, cards: filteredCards };
      }
      return s;
    });

    setSections(updated);
    saveState(topic, updated);
    showToast("Đã xóa bài học thành công", "");
  };

  const handleReorderCards = (cardId: string, direction: "up" | "down") => {
    const updated = sections.map(s => {
      if (s.id === activeSectionId) {
        const sortedCards = [...s.cards].sort((a, b) => a.order - b.order);
        const index = sortedCards.findIndex(c => c.id === cardId);
        if (index === -1) return s;

        if (direction === "up" && index > 0) {
          const currentOrder = sortedCards[index].order;
          sortedCards[index].order = sortedCards[index - 1].order;
          sortedCards[index - 1].order = currentOrder;
        } else if (direction === "down" && index < sortedCards.length - 1) {
          const currentOrder = sortedCards[index].order;
          sortedCards[index].order = sortedCards[index + 1].order;
          sortedCards[index + 1].order = currentOrder;
        }
        return { ...s, cards: sortedCards };
      }
      return s;
    });

    setSections(updated);
    saveState(topic, updated);
  };

  // 4. Gemini Integration actions
  const handleOptimizeCardWithAI = async (cardId: string, goal: string) => {
    // Find card current data
    const activeSec = sections.find(s => s.id === activeSectionId);
    if (!activeSec) return;
    const cardObj = activeSec.cards.find(c => c.id === cardId);
    if (!cardObj) return;

    setIsAILoadingMap(prev => ({ ...prev, [cardId]: true }));

    try {
      const response = await fetch("/api/optimize-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          coreKnowledge: cardObj.coreKnowledge,
          videoContent: cardObj.videoContent,
          goal: goal,
        })
      });

      const data = await response.json();
      if (data.success) {
        handleUpdateCard(cardId, {
          coreKnowledge: data.coreKnowledge,
          videoContent: data.videoContent
        });
        showToast("Gemini Tối ưu hóa thành công!", data.explanation || "Nội dung bài học đã được tái cơ cấu nhịp độ theo phong cách mong muốn.");
      } else {
        alert("Lỗi tối ưu hóa từ AI: " + data.error);
      }
    } catch (e) {
      console.error(e);
      alert("Đường truyền tới server lỗi, kiểm tra kết nối mạng!");
    } finally {
      setIsAILoadingMap(prev => ({ ...prev, [cardId]: false }));
    }
  };

  // Complete course syllabus generation on a prompt
  const handleImportAISections = (newSections: Section[]) => {
    setSections(newSections);
    if (newSections.length > 0) {
      const sorted = newSections.sort((a, b) => a.order - b.order);
      setActiveSectionId(sorted[0].id);
    }
    saveState(topic, newSections);
    showToast(
      "Đã nhập giáo án thiết kế bởi Gemini!",
      "Hệ thống chương giảng lý thuyết & video của bạn đã được thiết lập tự động tối ưu."
    );
  };

  // Helper popup toast trigger
  const showToast = (message: string, explanation: string) => {
    setToastMessage(message);
    setToastExplaintation(explanation);
  };

  const handleResetToPresets = () => {
    if (confirm("Hành động này sẽ khôi phục giáo án về dữ liệu kịch bản chuẩn ban đầu. Bạn có muốn tiếp tục?")) {
      loadDefaultSyllabus();
    }
  };

  const activeSection = sections.find((s) => s.id === activeSectionId);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col antialiased">
      {/* 1. Header Area with Brand Icon details */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-black rounded-xl text-white shadow-md shadow-zinc-800/10">
              <Film size={20} className="stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-xs font-bold md:text-sm text-slate-900 tracking-tight font-display flex items-center gap-2">
                Bộ Xây Dựng Bài Giảng Visual Storytelling & Pacing
              </h1>
              {/* Editable Topic Title Input */}
              <input
                type="text"
                value={topic}
                onChange={(e) => {
                  setTopic(e.target.value);
                  saveState(e.target.value, sections);
                }}
                className="text-[11px] text-zinc-900 font-mono font-medium focus:outline-none bg-slate-50 border border-slate-200 hover:border-black px-2 py-0.5 rounded w-full sm:w-[480px] transition-all mt-0.5"
                title="Sửa chủ đề khóa học lớn"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handleResetToPresets}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors text-[10px] uppercase font-bold flex items-center gap-1 cursor-pointer"
              title="Khôi phục mẫu chuẩn ban đầu"
            >
              <RotateCcw size={11} />
              Reset mẫu kịch bản
            </button>
            <span className="text-[10px] bg-zinc-100 text-zinc-900 border border-zinc-200 font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-zinc-800 rounded-full animate-ping"></span>
              Đã Lưu Local
            </span>
          </div>
        </div>
      </header>

      {/* 2. API Warning Notification Banner */}
      {!hasApiKey && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-center text-xs text-amber-800 flex items-center justify-center gap-2 font-medium">
          <AlertTriangle size={14} className="flex-shrink-0 text-amber-600" />
          <span>
            Hệ thống đang chạy giả định Pacing: <b>GEMINI_API_KEY chưa cấu hình</b> trong Secrets applet. Hãy mở <b>Settings &gt; Secrets</b> để nạp khóa và trải nghiệm AI sinh bài giảng thực tế!
          </span>
        </div>
      )}

      {/* 3. Main Dashboard Workspace Layout */}
      <div className="flex-1 flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-slate-200 h-full">
        
        {/* Left Side: Syllabus workspace */}
        <div className="flex-1 flex flex-col bg-slate-50/30">
          
          {/* Section Manager Tab Menu */}
          <SectionManager
            sections={sections}
            activeSectionId={activeSectionId}
            onSelectSection={setActiveSectionId}
            onAddSection={handleAddSection}
            onEditSection={handleEditSection}
            onDeleteSection={handleDeleteSection}
            onReorderSections={handleReorderSections}
          />

          {/* Card list renderer (active section) */}
          {activeSection ? (
            <CardList
              section={activeSection}
              onAddCard={handleAddCard}
              onUpdateCard={handleUpdateCard}
              onDeleteCard={handleDeleteCard}
              onReorderCards={handleReorderCards}
              onOptimizeCardWithAI={handleOptimizeCardWithAI}
              isAILoading={isAILoadingMap}
            />
          ) : (
            <div className="flex-1 py-16 px-4 flex flex-col items-center justify-center text-center max-w-lg mx-auto">
              <Layers size={40} className="text-slate-400 mb-3" />
              <h2 className="text-base font-bold text-slate-700">Không tìm thấy chương bài giảng nào</h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Vui lòng tạo một chương lớn bằng nút &quot;Thêm Chương Lớn&quot; phía trên hoặc bấm Nhập giáo án mẫu ở bảng điều khiển tay phải để phục hồi danh bạ giáo trình.
              </p>
              <button
                onClick={loadDefaultSyllabus}
                className="mt-4 px-4 py-2 bg-black hover:bg-zinc-800 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer shadow-xs"
              >
                Tải lại Giáo án mẫu mặc định
              </button>
            </div>
          )}
        </div>

        {/* Right Side Column: Gemini integrated AI Workspace */}
        <div className="w-full lg:w-[380px] shrink-0 bg-slate-50">
          <GeminiPanel
            currentSections={sections}
            onImportAISections={handleImportAISections}
          />
        </div>
      </div>

      {/* 4. Custom explanatory dialogue drawer / Toast on successful Gemini output */}
      {toastMessage && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Pop-up header */}
            <div className="bg-black px-5 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-amber-300 animate-pulse" />
                <h3 className="text-xs font-bold font-display uppercase tracking-wider">{toastMessage}</h3>
              </div>
              <button 
                onClick={() => {
                  setToastMessage(null);
                  setToastExplaintation(null);
                }}
                className="p-1 rounded-full bg-white/10 hover:bg-white/20 text-slate-100 hover:text-white transition-colors cursor-pointer"
                title="Đóng cửa sổ"
              >
                <X size={14} />
              </button>
            </div>

            {/* Content info wrapper */}
            <div className="p-5 space-y-4 max-h-[420px] overflow-y-auto bg-white">
              {toastExplaintation ? (
                <div className="space-y-3">
                  <div className="flex items-start gap-2.5">
                    <div className="p-1.5 bg-zinc-100 rounded text-black shrink-0 mt-0.5 animate-pulse">
                      <Lightbulb size={16} />
                    </div>
                    <div>
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Giải thích giải pháp tối ưu từ Gemini:</h4>
                      <p className="text-xs text-slate-600 mt-1.5 leading-relaxed whitespace-pre-line font-sans">
                        {toastExplaintation}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500">Nội dung đã được ghi nhận thành công.</p>
              )}
            </div>

            {/* Footer triggers */}
            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => {
                  setToastMessage(null);
                  setToastExplaintation(null);
                }}
                className="px-4 py-2 bg-black hover:bg-zinc-800 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer shadow-xs"
              >
                Đồng ý & Đóng lại
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Minimal footer */}
      <footer className="bg-white border-t border-slate-200 py-3.5 px-4 text-center">
        <p className="text-[10px] text-slate-400 font-sans">
          Xây dựng cho Đạo diễn, Biên kịch và Nhà làm phim chuyên nghiệp • Bản quyền thuộc hệ thống Visual Storytelling & Pacing Builder 2026.
        </p>
      </footer>
    </div>
  );
}

