import React, { useState, useEffect } from "react";
import { Section, Card } from "./types";
import { DEFAULT_SECTIONS, DEFAULT_TOPIC } from "./defaultData";
import SectionManager from "./components/SectionManager";
import CardList from "./components/CardList";
import ProductionCalendar from "./components/ProductionCalendar";
import { 
  Sparkles, Film, Play, BookOpen, Layers, Info, Trash2, 
  RotateCcw, AlertTriangle, ExternalLink, Flame, CheckCircle, Lightbulb, X,
  Download, Upload
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [topic, setTopic] = useState(DEFAULT_TOPIC);
  const [sections, setSections] = useState<Section[]>([]);
  const [activeSectionId, setActiveSectionId] = useState<string>("");
  const [isAILoadingMap, setIsAILoadingMap] = useState<{ [key: string]: boolean }>({});
  
  // Production calendar scheduling state (Date YYYY-MM-DD -> Card ID)
  const [calendarPlan, setCalendarPlan] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem("vstory_calendar_plan");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  
  // App-level notification toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastExplaintation, setToastExplaintation] = useState<string | null>(null);

  // Connection/API Key state
  const [customApiKey, setCustomApiKey] = useState<string>(() => {
    return localStorage.getItem("vstory_gemini_api_key") || "";
  });
  const [showApiKeyInput, setShowApiKeyInput] = useState<boolean>(false);
  const [hasApiKey, setHasApiKey] = useState<boolean>(true);

  // Custom template & document format references for Gemini
  const [customTemplate, setCustomTemplate] = useState<string>("");
  const [customDocLink, setCustomDocLink] = useState<string>("");

  const saveCustomReference = (template: string, docLink: string) => {
    setCustomTemplate(template);
    setCustomDocLink(docLink);
    saveState(topic, sections, template, docLink, calendarPlan);
  };

  // Custom non-blocking confirmation dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    actionText: string;
    onConfirm: () => void;
  } | null>(null);

  // Fallback state loader for when database is newly empty or offline
  const loadFromLocalStorage = () => {
    const savedTopic = localStorage.getItem("vstory_topic");
    const savedSections = localStorage.getItem("vstory_sections");
    const savedTemplate = localStorage.getItem("vstory_custom_template");
    const savedDocLink = localStorage.getItem("vstory_custom_doc_link");
    const savedPlan = localStorage.getItem("vstory_calendar_plan");

    if (savedTopic) setTopic(savedTopic);
    if (savedTemplate) setCustomTemplate(savedTemplate);
    if (savedDocLink) setCustomDocLink(savedDocLink);
    if (savedPlan) {
      try {
        setCalendarPlan(JSON.parse(savedPlan));
      } catch {}
    }
    
    if (savedSections) {
      try {
        const parsed = JSON.parse(savedSections);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSections(parsed);
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
  };

  // 1. Initial State Load (Server-Side Database Sync with LocalStorage Fallback)
  useEffect(() => {
    fetch("/api/load-syllabus")
      .then(res => res.json())
      .then(data => {
        if (data && data.success) {
          if (data.topic) setTopic(data.topic);
          if (data.customTemplate) setCustomTemplate(data.customTemplate);
          if (data.customDocLink) setCustomDocLink(data.customDocLink);
          if (data.calendarPlan) setCalendarPlan(data.calendarPlan);
          if (Array.isArray(data.sections) && data.sections.length > 0) {
            setSections(data.sections);
            const sorted = [...data.sections].sort((a, b) => a.order - b.order);
            setActiveSectionId(sorted[0].id);
          } else {
            loadDefaultSyllabus();
          }
          
          // Seed local state to avoid disparity
          localStorage.setItem("vstory_topic", data.topic || DEFAULT_TOPIC);
          if (data.sections) localStorage.setItem("vstory_sections", JSON.stringify(data.sections));
          if (data.customTemplate) localStorage.setItem("vstory_custom_template", data.customTemplate);
          if (data.customDocLink) localStorage.setItem("vstory_custom_doc_link", data.customDocLink);
          if (data.calendarPlan) localStorage.setItem("vstory_calendar_plan", JSON.stringify(data.calendarPlan));
          
          showToast(
            "Đã đồng bộ trực tuyến!",
            "Toàn bộ khối lượng giáo án soạn thảo và lịch phát sóng kịch bản đã được tải từ móng cơ sở dữ liệu gốc thành công."
          );
        } else {
          loadFromLocalStorage();
        }
      })
      .catch(err => {
        console.warn("Failed to reach server database, using device fallback key.", err);
        loadFromLocalStorage();
      });
  }, []);

  // Check backend API key configuration dynamically when key changes
  useEffect(() => {
    const savedApiKey = localStorage.getItem("vstory_gemini_api_key") || "";
    fetch(`/api/status?customApiKey=${encodeURIComponent(savedApiKey)}`, {
      headers: savedApiKey ? { "x-gemini-api-key": savedApiKey } : {}
    })
      .then(res => res.json())
      .then(data => {
        if (data && typeof data.hasApiKey === "boolean") {
          setHasApiKey(data.hasApiKey);
        }
      })
      .catch(err => {
        console.warn("Failed to contact backend status API, using fallback mode", err);
      });
  }, [customApiKey]);

  const loadDefaultSyllabus = () => {
    setSections(DEFAULT_SECTIONS);
    setActiveSectionId("sec-1");
    setTopic(DEFAULT_TOPIC);
    saveState(DEFAULT_TOPIC, DEFAULT_SECTIONS);
  };

  const saveState = (
    newTopic: string, 
    newSections: Section[], 
    newTemplate?: string, 
    newDocLink?: string, 
    newPlan?: Record<string, string>
  ) => {
    const resolvedTemplate = newTemplate !== undefined ? newTemplate : customTemplate;
    const resolvedDocLink = newDocLink !== undefined ? newDocLink : customDocLink;
    const resolvedPlan = newPlan !== undefined ? newPlan : calendarPlan;

    localStorage.setItem("vstory_topic", newTopic);
    localStorage.setItem("vstory_sections", JSON.stringify(newSections));
    localStorage.setItem("vstory_custom_template", resolvedTemplate);
    localStorage.setItem("vstory_custom_doc_link", resolvedDocLink);
    localStorage.setItem("vstory_calendar_plan", JSON.stringify(resolvedPlan));

    // Async REST-sync write to server workspace
    fetch("/api/save-syllabus", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic: newTopic,
        sections: newSections,
        customTemplate: resolvedTemplate,
        customDocLink: resolvedDocLink,
        calendarPlan: resolvedPlan,
      })
    })
    .catch(err => {
      console.warn("Could not save to remote database. Cached under device browser instance.", err);
    });
  };

  const handleUpdatePlan = (dateStr: string, cardId: string) => {
    const updatedPlan = { ...calendarPlan };
    if (cardId === "") {
      delete updatedPlan[dateStr];
    } else {
      updatedPlan[dateStr] = cardId;
    }
    setCalendarPlan(updatedPlan);
    saveState(topic, sections, customTemplate, customDocLink, updatedPlan);
    showToast(
      "Lập lịch sản xuất bài học thành công!",
      `Mã số bài học định dạng số đã được định vị vào lịch chạy dự án.`
    );
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
        headers: { 
          "Content-Type": "application/json",
          ...(customApiKey ? { "x-gemini-api-key": customApiKey } : {})
        },
        body: JSON.stringify({
          coreKnowledge: cardObj.coreKnowledge,
          videoContent: cardObj.videoContent,
          goal: goal,
          customTemplate,
          customDocLink,
          customApiKey
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
    setConfirmDialog({
      title: "Khôi phục mẫu chuẩn",
      message: "Hành động này sẽ khôi phục giáo án về dữ liệu kịch bản chuẩn ban đầu của Media Duy Lâm. Bạn có muốn tiếp tục?",
      actionText: "Khôi phục",
      onConfirm: () => {
        loadDefaultSyllabus();
        setConfirmDialog(null);
      }
    });
  };

  const handleSaveApiKey = (key: string) => {
    const trimmed = key.trim();
    setCustomApiKey(trimmed);
    localStorage.setItem("vstory_gemini_api_key", trimmed);
    setShowApiKeyInput(false);
    showToast("Đã lưu khóa API Gemini cá nhân!", "Hệ thống sẽ ưu tiên sử dụng khóa cá nhân này cho tất cả các yêu cầu xử lý AI.");
  };

  const handleClearApiKey = () => {
    setCustomApiKey("");
    localStorage.removeItem("vstory_gemini_api_key");
    setShowApiKeyInput(false);
    showToast("Đã xóa khóa API Gemini cá nhân", "Hệ thống sẽ quay về sử dụng khóa API mặc định trên máy chủ.");
  };

  // Export entire syllabus as standard JSON backup
  const handleExportBackup = () => {
    try {
      const backupData = {
        version: "2.0",
        topic,
        customTemplate,
        customDocLink,
        sections,
        exportedAt: new Date().toISOString()
      };
      const jsonString = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      
      const cleanTopic = topic.trim().replace(/[^a-zA-Z0-9_đĐâÂăĂêÊôÔơƠưƯááààảảããạạííììỉỉĩĩịịúúùùủủũũụụýýỳỳỷỷỹỹỵỵ/]/g, "_");
      link.download = `MediaDuyLam_KichBan_${cleanTopic || "LessonPlan"}_Backup.json`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      showToast(
        "Xuất file sao lưu thành công!", 
        "Tệp .json chứa toàn bộ kịch bản và cấu trúc chương mục đã được tải xuống máy tính của bạn."
      );
    } catch (err: any) {
      console.error(err);
      showToast("Lỗi xuất file!", "Vui lòng kiểm tra lại cấu trúc dữ liệu kịch bản của bạn.");
    }
  };

  // Import entire syllabus from backup JSON
  const handleImportBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        
        if (data && Array.isArray(data.sections)) {
          setTopic(data.topic || DEFAULT_TOPIC);
          setSections(data.sections);
          if (data.customTemplate) setCustomTemplate(data.customTemplate);
          if (data.customDocLink) setCustomDocLink(data.customDocLink);
          
          if (data.sections.length > 0) {
            const sorted = [...data.sections].sort((a, b) => a.order - b.order);
            setActiveSectionId(sorted[0].id);
          }
          
          saveState(data.topic || DEFAULT_TOPIC, data.sections);
          if (data.customTemplate) localStorage.setItem("vstory_custom_template", data.customTemplate);
          if (data.customDocLink) localStorage.setItem("vstory_custom_doc_link", data.customDocLink);
          
          showToast(
            "Khôi phục bài giảng nguyên vẹn bản quyền!", 
            "Chào bạn học viên, toàn bộ cấu trúc bài giảng cũ đã được đồng bộ chuẩn hóa thành công."
          );
        } else {
          showToast("Mã khóa lỗi kịch bản!", "Hãy chắc chắn rằng đây là file sao lưu .json chuẩn của Media Duy Lâm.");
        }
      } catch (err) {
        console.error(err);
        showToast("Lỗi giải mã file!", "Cấu trúc dữ liệu có thể đã bị sửa đổi bất thường hoặc sai định dạng.");
      }
    };
    reader.readAsText(file);
    event.target.value = ""; // clear input
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

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
            <button
              onClick={() => setShowApiKeyInput(!showApiKeyInput)}
              className={`px-2.5 py-1.5 rounded-lg border text-[10px] uppercase font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                customApiKey 
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100" 
                  : "border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100"
              }`}
              title="Cấu hình Khóa API Gemini cá nhân của bạn"
            >
              <Sparkles size={11} className={customApiKey ? "text-emerald-600 animate-pulse" : ""} />
              {customApiKey ? "🔑 Đã Nạp API Key" : "⚡ Nạp API key"}
            </button>

            {/* Export Backup Button */}
            <button
              onClick={handleExportBackup}
              className="px-2.5 py-1.5 rounded-lg border border-zinc-200 text-zinc-700 hover:text-zinc-900 hover:bg-slate-50 hover:border-zinc-400 transition-colors text-[10px] uppercase font-bold flex items-center gap-1 cursor-pointer"
              title="Tải tệp sao lưu bài giảng về máy tính (.json)"
            >
              <Download size={11} />
              Xuất kịch bản (.json)
            </button>

            {/* Import Backup Button */}
            <label
              className="px-2.5 py-1.5 rounded-lg border border-zinc-200 text-zinc-700 hover:text-zinc-900 hover:bg-slate-50 hover:border-zinc-400 transition-colors text-[10px] uppercase font-bold flex items-center gap-1 cursor-pointer"
              title="Chọn tệp kịch bản (.json) từ máy tính để khôi phục bài giảng"
            >
              <Upload size={11} />
              Nhập kịch bản
              <input
                type="file"
                accept=".json"
                onChange={handleImportBackup}
                className="hidden"
              />
            </label>

            <button
              onClick={handleResetToPresets}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors text-[10px] uppercase font-bold flex items-center gap-1 cursor-pointer"
              title="Khôi phục mẫu chuẩn ban đầu"
            >
              <RotateCcw size={11} />
              Reset mẫu kịch bản
            </button>
            <span className="text-[10px] bg-zinc-150 text-zinc-800 border border-zinc-200 font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-zinc-800 rounded-full animate-ping"></span>
              Đã Lưu Local
            </span>
          </div>
        </div>
      </header>

      {/* Expandable personal API Key setup bar */}
      <AnimatePresence>
        {showApiKeyInput && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="bg-zinc-900 border-b border-zinc-800 text-white overflow-hidden"
          >
            <div className="max-w-7xl mx-auto px-4 py-3.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="p-1 bg-zinc-800 rounded text-amber-400 font-bold font-mono text-[9px] uppercase tracking-wider">
                    Gemini Setup
                  </span>
                  <h4 className="font-bold text-zinc-100">Cấu hình API Key Gemini Cá Nhân</h4>
                </div>
                <p className="text-[10px] text-zinc-400 leading-normal">
                  Mã API của bạn được lưu an toàn dưới LocalStorage trình duyệt và gửi trực tiếp tới máy chủ proxy để phục vụ tác vụ AI.
                </p>
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto">
                <input
                  type="password"
                  placeholder="Dán mã API Key của bạn tại đây (AIzaSy...)"
                  defaultValue={customApiKey}
                  id="custom-key-input-field"
                  className="bg-zinc-950 border border-zinc-700 focus:border-zinc-500 text-zinc-100 rounded-lg px-2.5 py-1.5 w-full md:w-[280px] text-xs focus:outline-none font-mono"
                />
                <button
                  type="button"
                  onClick={() => {
                    const inputEl = document.getElementById("custom-key-input-field") as HTMLInputElement;
                    if (inputEl) {
                      handleSaveApiKey(inputEl.value);
                    }
                  }}
                  className="px-4 py-1.5 bg-white text-black font-bold rounded-lg cursor-pointer hover:bg-zinc-200 transition-colors shrink-0 text-[11px]"
                >
                  Lưu Lại
                </button>
                {customApiKey && (
                  <button
                    type="button"
                    onClick={handleClearApiKey}
                    className="px-3 py-1.5 border border-zinc-705 text-zinc-400 hover:text-white hover:border-zinc-500 rounded-lg cursor-pointer transition-colors shrink-0 text-[11px]"
                  >
                    Xóa Khóa
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. API Warning Notification Banner */}
      {!hasApiKey && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-center text-xs text-amber-800 flex items-center justify-center gap-2 font-medium">
          <AlertTriangle size={14} className="flex-shrink-0 text-amber-600" />
          <span>
            Hệ thống đang chạy giả định: <b>GEMINI_API_KEY chưa cấu hình</b> trong Secrets applet. Hãy mở <b>Settings &gt; Secrets</b> hoặc bấm <b>⚡ Nạp API key</b> phía trên để bổ sung!
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
              customTemplate={customTemplate}
              customDocLink={customDocLink}
              onSaveCustomReference={saveCustomReference}
              customApiKey={customApiKey}
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

        {/* Right Side Column: Cinematic Production Content Calendar */}
        <div className="w-full lg:w-[380px] shrink-0 bg-zinc-900 border-l border-zinc-850">
          <ProductionCalendar
            sections={sections}
            calendarPlan={calendarPlan}
            onUpdatePlan={handleUpdatePlan}
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
                  <RotateCcw size={15} className="text-zinc-200 animate-pulse" />
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
                    <RotateCcw size={18} />
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

      {/* 5. Minimal footer */}
      <footer className="bg-white border-t border-slate-200 py-3.5 px-4 text-center">
        <p className="text-[10px] text-slate-400 font-sans">
          Xây dựng cho Đạo diễn, Biên kịch và Nhà làm phim chuyên nghiệp • Bản quyền thuộc hệ thống Visual Storytelling & Pacing Builder 2026.
        </p>
      </footer>
    </div>
  );
}

