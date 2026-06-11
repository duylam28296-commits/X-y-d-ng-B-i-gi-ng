import React, { useState } from "react";
import { Card, Section } from "../types";
import { 
  Plus, Edit2, Trash2, ArrowUp, ArrowDown, Sparkles, Check, X, 
  Film, AlertCircle, RefreshCw, MessageSquare, Send, Bot, User, ArrowRight,
  Link, FileText, RotateCcw, Settings
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export const MEDIA_DUYLAM_STANDARD_TEMPLATE = `Chào bạn, tôi là Giám đốc Học thuật của **Media Duy Lâm**. Rất vui được đồng hành cùng bạn trong hành trình nâng cấp tư duy kể chuyện hình ảnh.

Dưới đây là kịch bản chi tiết cho video YouTube thuộc chuỗi **Visual Storytelling Foundation**, tập trung vào việc biến một kỹ thuật cơ bản thành một công cụ kể chuyện đầy ẩn dụ.

---

# KỊCH BẢN VIDEO: [TÊN BÀI HỌC VIẾT IN HOA CHI TIẾT]

**Người trình bày:** Academic Director – Media Duy Lâm
**Thời lượng dự kiến:** 6-8 phút.

---

### PHẦN 1: THE CINEMATIC HOOK (0:00 - 1:15)

**(Visual: [Mô tả chi tiết phân cảnh mở đầu đầy nghệ thuật điện ảnh, sử dụng góc máy trung, cận, hoặc siêu cận, hiệu ứng ánh sáng ghì bóng và nhịp độ dựng kịch tính])**

**Voiceover:** 
Có phải bạn vẫn bận rộn đặt máy quay cho thật tròn vai? Kỹ thuật chỉ là vỏ bọc. Cái cốt lõi là một ẩn dụ hình ảnh đắt giá thức tỉnh suy nghĩ người coi.

---

### PHẦN 2: TỐI GIẢN LÝ THUYẾT (1:15 - 2:45)

**(Visual: [Mô tả đồ họa chuyển động Motion Graphics cô đọng hoặc bối cảnh biểu diễn phim trực quan của Duy Lâm])**

**Director:** 
[Tóm tắt lý thuyết cốt lõi một cách cực kỳ tinh giản, dễ tiếp nhận, tập trung vào phần cảm nhận không gian và nhịp độ]

---

### PHẦN 3: VẬN DỤNG ẨN DỤ HÌNH ẢNH (2:45 - 5:30)

**(Visual: [Mô tả so sánh sự áp dụng ẩn dụ thị giác bằng đồ vật quen thuộc hàng ngày, chuyển động camera chậm 100fps])**

**Director:**
[Giải thích chi tiết 2-3 ví dụ ẩn dụ thị giác cụ thể liên kết chặt chẽ với bài học, chỉ rõ bối cảnh quay, chuyển động camera, cỡ cảnh và âm thanh sfx hỗ trợ]

---

### PHẦN 4: LỒNG GHÉP CTA (5:30 - Kết thúc)

**(Visual: Director xuất hiện trực tiếp trước ống kính, hậu trường là phòng chấm bài thực tế, màn hình hiển thị timeline Premiere/DaVinci)**

**Director:**
[Lời khuyên sâu sắc về cảm quan nghệ thuật thay vì chỉ nắm bắt kỹ thuật thô sơ]

...Hãy tham gia **Gói Subscription Đồng Hành của Duy Lâm**.

Tại đây, không có những bài giảng lý thuyết khô khan lặp lại. Bạn sẽ được:
* Tôi trực tiếp chữa bài 1-1 trên chính sản phẩm của bạn.
* Căn chỉnh từng frame hình, tinh chỉnh Pacing để đạt được sự tinh tế trong ẩn dụ.
* Đào tạo tư duy chiều sâu thay vì chỉ là kỹ thuật bấm máy.

Link đăng ký tôi để ngay dưới phần mô tả. Đừng chỉ học cách nhìn, hãy học cách kể.
Tôi là Giám đốc học thuật tại Media Duy Lâm. Hẹn gặp lại bạn trong những buổi chữa bài chuyên sâu.

**(Visual: Logo Media Duy Lâm hiện lên. Nhạc outro cinematic sang trọng.)**`;

export const renderFormattedContent = (text: string) => {
  if (!text) {
    return (
      <span className="text-zinc-400 italic font-sans text-xs">
        Kịch bản bài học trống trơn. Hãy gắn khung kịch bản mẫu Duy Lâm hoặc sử dụng Gemini biên dịch giúp!
      </span>
    );
  }

  return (
    <div className="space-y-4 font-sans text-xs text-zinc-800 leading-relaxed">
      {text.split("\n").map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-1" />;

        // Headers
        if (trimmed.startsWith("###")) {
          return (
            <h4
              key={idx}
              className="text-xs font-bold text-zinc-950 mt-6 mb-3 uppercase tracking-wider border-l-3 border-black pl-2 py-0.5"
            >
              {trimmed.replace(/^###\s*/, "")}
            </h4>
          );
        }
        if (trimmed.startsWith("##")) {
          return (
            <h3
              key={idx}
              className="text-xs font-extrabold text-zinc-950 mt-7 mb-3.5 uppercase tracking-widest border-l-4 border-black pl-2.5 py-0.5 bg-zinc-100"
            >
              {trimmed.replace(/^##\s*/, "")}
            </h3>
          );
        }
        if (trimmed.startsWith("#")) {
          return (
            <h2
              key={idx}
              className="text-xs font-extrabold text-black mt-8 mb-4 uppercase tracking-widest text-center border-b border-zinc-200 pb-2.5"
            >
              {trimmed.replace(/^#\s*/, "")}
            </h2>
          );
        }

        // Directives (Visual: ...) or similar
        if (
          trimmed.startsWith("(Visual:") ||
          trimmed.startsWith("**(Visual:") ||
          trimmed.startsWith("**Visual:") ||
          trimmed.startsWith("Visual:")
        ) {
          return (
            <div
              key={idx}
              className="bg-zinc-50 border-l-4 border-zinc-900 p-3 my-2.5 rounded-r-lg text-zinc-650 font-medium italic"
            >
              <span className="not-italic font-bold text-[9px] uppercase tracking-wider block text-zinc-500 mb-1 font-mono">
                🎬 CHỈ DẪN KHUNG HÌNH (VISUAL)
              </span>
              {trimmed}
            </div>
          );
        }

        // Host / voices
        const voiceoverMatch = trimmed.match(/^(\*?\*?(?:Voiceover|Director|Academic Director|Presenter)\*?\*?:?)\s*(.*)/i);
        if (voiceoverMatch) {
          const presenter = voiceoverMatch[1];
          const content = voiceoverMatch[2];
          return (
            <div key={idx} className="my-2 pl-0.5">
              <span className="font-bold text-black bg-zinc-100 px-1.5 py-0.5 rounded text-[10px]">
                {presenter.replace(/\*/g, "")}
              </span>
              <p className="mt-1 text-zinc-800 leading-relaxed font-normal">{content}</p>
            </div>
          );
        }

        // Dividers
        if (trimmed === "---") {
          return <hr key={idx} className="my-10 border-zinc-200 border-dashed" />;
        }

        // Bullet point
        if (trimmed.startsWith("*") || trimmed.startsWith("-") || trimmed.startsWith("•")) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-4 py-0.5 text-zinc-700">
              <span className="text-zinc-600 font-bold shrink-0 mt-0.5">•</span>
              <span>{trimmed.replace(/^[\*\-•]\s*/, "")}</span>
            </div>
          );
        }

        return (
          <p key={idx} className="leading-relaxed text-zinc-750 font-sans mb-1.5">
            {trimmed}
          </p>
        );
      })}
    </div>
  );
};

interface CardListProps {
  section: Section;
  onAddCard: (title: string, coreKnowledge: string, videoContent: string) => void;
  onUpdateCard: (cardId: string, updates: Partial<Card>) => void;
  onDeleteCard: (cardId: string) => void;
  onReorderCards: (cardId: string, direction: "up" | "down") => void;
  onOptimizeCardWithAI: (cardId: string, goal: string) => Promise<void>;
  isAILoading: { [key: string]: boolean };
  customTemplate: string;
  customDocLink: string;
  onSaveCustomReference: (template: string, docLink: string) => void;
  customApiKey?: string;
}

export default function CardList({
  section,
  onAddCard,
  onUpdateCard,
  onDeleteCard,
  onReorderCards,
  onOptimizeCardWithAI,
  isAILoading,
  customTemplate,
  customDocLink,
  onSaveCustomReference,
  customApiKey,
}: CardListProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newVideo, setNewVideo] = useState("");
  const [isGeneratingNew, setIsGeneratingNew] = useState(false);

  // Editing state
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editVideo, setEditVideo] = useState("");

  // Custom non-blocking confirmation dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    actionText: string;
    onConfirm: () => void;
  } | null>(null);

  // Presets & customized goals
  const [explainGoalId, setExplainGoalId] = useState<string | null>(null);
  const [customGoal, setCustomGoal] = useState("");

  // Customize reference template manager states
  const [showRefModal, setShowRefModal] = useState(false);
  const [refActiveCardId, setRefActiveCardId] = useState<string | null>(null);
  const [tempTemplate, setTempTemplate] = useState("");
  const [tempDocLink, setTempDocLink] = useState("");
  const [refSavedAlert, setRefSavedAlert] = useState(false);

  const openReferenceModal = (cardId: string | null) => {
    setRefActiveCardId(cardId);
    setTempTemplate(customTemplate || MEDIA_DUYLAM_STANDARD_TEMPLATE);
    setTempDocLink(customDocLink || "");
    setRefSavedAlert(false);
    setShowRefModal(true);
  };

  const handleSaveReferenceConfig = () => {
    onSaveCustomReference(tempTemplate, tempDocLink);
    setRefSavedAlert(true);
    setTimeout(() => {
      setRefSavedAlert(false);
    }, 3000);
  };

  const handleApplyReferenceToCard = () => {
    if (!refActiveCardId) return;
    onUpdateCard(refActiveCardId, { videoContent: tempTemplate });
    if (editingCardId === refActiveCardId) {
      setEditVideo(tempTemplate);
    }
    setShowRefModal(false);
  };

  // Chat interface per card states
  const [activeChatCardId, setActiveChatCardId] = useState<string | null>(null);
  const [cardChats, setCardChats] = useState<{ [cardId: string]: { id: string; role: "user" | "model"; content: string }[] }>({});
  const [cardChatInputs, setCardChatInputs] = useState<{ [cardId: string]: string }>({});
  const [cardChatLoading, setCardChatLoading] = useState<{ [cardId: string]: boolean }>({});

  const OPTIMIZATION_PRESETS = [
    { label: "Nhịp Độ Cực Nhanh (Edgar Wright Stylized Fast-Pacing)", val: "Tối ưu kịch bản nhịp độ cực nhanh kiểu Edgar Wright: các phân cảnh mỗi cú cắt nhỏ hơn 0.5s, zoom cận cảnh cực giật gắt bùng nổ, sử dụng SFX cụ thể phóng đại tiếng động đời thường." },
    { label: "Hồi Hộp Kịch Tính (Alfred Hitchcock Suspense)", val: "Tối ưu kịch tính kiểu Alfred Hitchcock: làm chậm nhịp thở, dùng camera góc POV người xem rình rập, sound design nhạc nền dồn dập tăng áp lực tò mò." },
    { label: "Trầm Tĩnh Chậm Rãi (Denis Villeneuve Slow-Burn)", val: "Tối ưu nhịp độ slow-burn kiểu Denis Villeneuve: khung cảnh bao la cô đơn, chuyển dịch camera Dolly siêu chậm, mảng tối tương phản cao." },
    { label: "Ản Dụ Sinh Động Hơn (Visual Metaphors Booster)", val: "Gia tăng tối đa các hình ảnh ẩn dụ bắt nguồn từ dụng cụ quen thuộc hàng ngày (ly nước chao đảo, que diêm cháy tàn, chiếc kẹp giấy...) làm mỏ neo ghi nhớ kiến thức tốt hơn." }
  ];

  // Triggers when chat tab is expanded
  const toggleChatForCard = (card: Card) => {
    if (activeChatCardId === card.id) {
      setActiveChatCardId(null);
    } else {
      setActiveChatCardId(card.id);
      // Initialize the conversation guidelines if empty
      if (!cardChats[card.id]) {
        setCardChats(prev => ({
          ...prev,
          [card.id]: [
            {
              id: "welcome",
              role: "model",
              content: `Chào thầy/cô! Tôi là trợ lý biên kịch. Hãy nhắn cho tôi bất cứ điều gì bạn muốn tối ưu cho bài học **"${card.title}"** này. 
Ví dụ:
• *'Lồng ghép ẩn dụ hạt mầm nảy mầm để giải thích về sự tích lũy nhận thức.'*
• *'Viết lại lời thoại dí dỏm, ngắn gọn và kịch tính hơn.'*
• *'Thêm các chỉ dẫn đặt góc máy quay 180 độ đối xứng.'*

Sau khi phản hồi, tôi sẽ gửi kèm **Bản thảo gợi ý**. Bạn có thể bấm nút **"Áp dụng"** để cập nhật ngay vào kịch bản!`
            }
          ]
        }));
      }
    }
  };

  const handleSendCardChat = async (cardId: string, cardTitle: string, currentScript: string) => {
    const text = cardChatInputs[cardId] || "";
    if (!text.trim()) return;

    const currentMsgs = cardChats[cardId] || [];
    const userMsg = { id: `user-${Date.now()}`, role: "user" as const, content: text };
    const updatedMsgs = [...currentMsgs, userMsg];

    setCardChats(prev => ({
      ...prev,
      [cardId]: updatedMsgs
    }));
    setCardChatInputs(prev => ({
      ...prev,
      [cardId]: ""
    }));
    setCardChatLoading(prev => ({
      ...prev,
      [cardId]: true
    }));

    try {
      const response = await fetch("/api/chat-card-optimize", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(customApiKey ? { "x-gemini-api-key": customApiKey } : {})
        },
        body: JSON.stringify({
          messages: updatedMsgs.map(m => ({ role: m.role, content: m.content })),
          cardTitle,
          cardScript: currentScript,
          customTemplate,
          customDocLink,
          customApiKey
        })
      });
      const data = await response.json();
      if (data.success) {
        setCardChats(prev => ({
          ...prev,
          [cardId]: [...updatedMsgs, { id: `ai-${Date.now()}`, role: "model" as const, content: data.answer }]
        }));
      } else {
        setCardChats(prev => ({
          ...prev,
          [cardId]: [...updatedMsgs, { id: `ai-${Date.now()}`, role: "model" as const, content: `Lỗi kết nối từ máy chủ AI: ${data.error || "Uknown error"}` }]
        }));
      }
    } catch (err) {
      console.error(err);
      setCardChats(prev => ({
        ...prev,
        [cardId]: [...updatedMsgs, { id: `ai-${Date.now()}`, role: "model" as const, content: "Lỗi đường truyền hoặc máy chủ Gemini tạm bận. Hãy thử lại sau giây lát!" }]
      }));
    } finally {
      setCardChatLoading(prev => ({
        ...prev,
        [cardId]: false
      }));
    }
  };

  // Helper to extract clean draft text
  const parseDraftContent = (text: string) => {
    const startMarker = "===BẢN THẢO GỢI Ý===";
    const endMarker = "===HẾT BẢN THẢO===";
    const startIndex = text.indexOf(startMarker);
    const endIndex = text.indexOf(endMarker);
    if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
      return text.substring(startIndex + startMarker.length, endIndex).trim();
    }
    return null;
  };

  // Helper to clean formatting markers for normal display
  const cleanDisplayContent = (text: string) => {
    return text
      .replace("===BẢN THẢO GỢI Ý===", "**✨ BẢN THẢO GỢI Ý MỚI CỦA GEMINI:**\n```")
      .replace("===HẾT BẢN THẢO===", "```\n*(Bạn có thể nhấn Áp dụng bên dưới để lưu bản thảo này)*");
  };

  const handleApplyDraft = (cardId: string, draftText: string) => {
    // If currently editing this card, apply to edit state as well
    if (editingCardId === cardId) {
      setEditVideo(draftText);
    }
    onUpdateCard(cardId, { videoContent: draftText });
    alert("Đã áp dụng bản thảo gợi ý của Gemini vào Kịch bản bài giảng thành công! Bạn có thể chỉnh sửa thêm hoặc lưu lại.");
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onAddCard(newTitle.trim(), "", newVideo.trim());
    resetAddForm();
  };

  const resetAddForm = () => {
    setNewTitle("");
    setNewVideo("");
    setIsAdding(false);
    setIsGeneratingNew(false);
  };

  const handleAICreateCard = async () => {
    if (!newTitle.trim()) {
      alert("Vui lòng điện tên bài học trước khi bấm Gemini biên kịch hộ.");
      return;
    }
    setIsGeneratingNew(true);
    try {
      const response = await fetch("/api/generate-card", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(customApiKey ? { "x-gemini-api-key": customApiKey } : {})
        },
        body: JSON.stringify({ 
          title: newTitle.trim(), 
          details: "",
          customTemplate,
          customDocLink,
          customApiKey
        }),
      });
      const data = await response.json();
      if (data.success) {
        setNewVideo(data.videoContent);
      } else {
        alert("Lỗi biên kịch từ AI: " + data.error);
      }
    } catch (e) {
      console.error(e);
      alert("Lỗi kết nối máy chủ soạn thảo.");
    } finally {
      setIsGeneratingNew(false);
    }
  };

  const startEdit = (card: Card) => {
    setEditingCardId(card.id);
    setEditTitle(card.title);
    setEditVideo(card.videoContent);
  };

  const handleSaveEdit = (id: string) => {
    if (!editTitle.trim()) return;
    onUpdateCard(id, {
      title: editTitle.trim(),
      coreKnowledge: "",
      videoContent: editVideo.trim()
    });
    setEditingCardId(null);
  };

  const handleOptimizeAction = async (cardId: string, goalText: string) => {
    setExplainGoalId(null);
    await onOptimizeCardWithAI(cardId, goalText);
  };

  const sortedCards = (section.cards || []).sort((a, b) => a.order - b.order);

  return (
    <div className="py-6 px-4 max-w-7xl mx-auto space-y-6">
      {/* Active Section Headline */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-wider block mb-1 font-mono">
            Đang biên soạn chương mục
          </span>
          <h2 className="text-sm font-bold text-slate-900 font-display flex items-center gap-2">
            {section.title}
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
            {section.description || "Chương này chưa có thông tin mô tả."}
          </p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold rounded-lg bg-black hover:bg-zinc-900 text-white shadow-xs transition-all self-stretch md:self-auto justify-center cursor-pointer"
        >
          {isAdding ? <X size={14} /> : <Plus size={14} />}
          {isAdding ? "Hủy soạn bài mới" : "Thêm Bài học"}
        </button>
      </div>

      {/* Add New Card form with Gemini creator integrated */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white p-5 rounded-2xl border border-zinc-300 shadow-lg space-y-4"
          >
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-xs font-bold text-zinc-900 font-display flex items-center gap-2 uppercase tracking-wider">
                <Sparkles size={14} className="text-black animate-pulse" /> Thêm Bài học mới vào hệ thống bài giảng
              </h3>
              <button
                onClick={resetAddForm}
                className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                  Tiêu đề bài học đơn (ví dụ: Kỹ thuật Match Cut đá lạnh tan, Móc câu 3 giây đầu...)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Nhập tiêu đề tại đây..."
                    className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-black"
                  />
                  <button
                    type="button"
                    onClick={handleAICreateCard}
                    disabled={isGeneratingNew || !newTitle.trim()}
                    className="flex items-center gap-1.5 px-3 py-2 bg-black hover:bg-zinc-800 text-white rounded-lg text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                  >
                    {isGeneratingNew ? (
                      <RefreshCw size={14} className="animate-spin" />
                    ) : (
                      <Sparkles size={14} />
                    )}
                    Gemini biên kịch hộ
                  </button>
                </div>
              </div>

              <form onSubmit={handleAddSubmit} className="space-y-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
                      <Film size={12} className="text-black" /> Kịch bản bài giảng (Lồng ghép thoại & ẩn dụ thị giác tinh tế)
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmDialog({
                          title: "Gắn Khung Kịch Bản",
                          message: "Học thuật: Thao tác này sẽ ghi đè và lắp sẵn cấu trúc kịch bản mẫu 4 Phần của Duy Lâm vào bài học mới này. Bạn đồng ý?",
                          actionText: "Xác nhận",
                          onConfirm: () => {
                            setNewVideo(MEDIA_DUYLAM_STANDARD_TEMPLATE);
                            setConfirmDialog(null);
                          }
                        });
                      }}
                      className="text-[9px] text-black hover:bg-black/10 bg-black/5 px-2 py-0.5 rounded inline-flex items-center gap-1 border border-black/20 font-bold uppercase tracking-wider cursor-pointer font-mono shadow-3xs"
                    >
                      <Film size={9} /> Gắn Khung Mẫu
                    </button>
                  </div>
                  <textarea
                    value={newVideo}
                    onChange={(e) => setNewVideo(e.target.value)}
                    placeholder="Nhập toàn bộ cấu kịch bản của giảng viên, chuyển động góc máy quay và âm thanh hiệu ứng tại đây kỹ càng hoặc dùng nút Gắn Khung Mẫu trợ giúp..."
                    rows={8}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-xs text-slate-800 focus:outline-none focus:border-black font-sans"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={resetAddForm}
                    className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                  >
                    Bỏ qua
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs bg-black hover:bg-zinc-800 text-white font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
                  >
                    Lưu bài học
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Single-Column Custom Detailed Cards List */}
      <div className="space-y-5">
        {sortedCards.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200 shadow-sm">
            <AlertCircle size={32} className="text-slate-400 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-600">Mục bài này chưa có nội dung cụ thể</h3>
            <p className="text-xs text-slate-500 mt-1">
              Nhấn nút "Thêm Bài học" ở góc trên hoặc dùng Gemini biên dịch hộ để thiết lập giáo án đầu tiên.
            </p>
          </div>
        ) : (
          sortedCards.map((card, idx) => {
            const isEditing = card.id === editingCardId;
            const isCardLoading = isAILoading[card.id] || false;
            const isChatOpen = activeChatCardId === card.id;

            return (
              <div
                key={card.id}
                id={`card-${card.id}`}
                className="bg-white rounded-2xl border border-slate-200 hover:border-zinc-400 hover:shadow-md overflow-hidden relative transition-all duration-200 shadow-xs"
              >
                {/* Header panel inside the list card */}
                <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full sm:max-w-md bg-white border border-black rounded-lg px-2 py-1 text-xs text-slate-800 font-bold focus:outline-none"
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="bg-zinc-100 text-zinc-900 text-[9px] font-bold px-2 py-0.5 rounded font-mono uppercase tracking-wider border border-zinc-200">
                        BÀI HỌC {section.order}.{idx + 1}
                      </span>
                      <h4 className="text-xs font-bold text-slate-800 font-display">
                        {card.title}
                      </h4>
                    </div>
                  )}

                  {/* Actions for modifying content */}
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {isEditing ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setEditingCardId(null)}
                          className="px-2 py-1 bg-slate-200 text-slate-600 hover:text-slate-800 rounded text-[10px] flex items-center gap-1 cursor-pointer font-medium"
                        >
                          <X size={10} /> Hủy
                        </button>
                        <button
                          onClick={() => handleSaveEdit(card.id)}
                          className="px-2.5 py-1 bg-black hover:bg-zinc-800 text-white rounded text-[10px] font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <Check size={10} /> Lưu
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        {/* Interactive Chat Optimization trigger */}
                        <button
                          onClick={() => toggleChatForCard(card)}
                          className={`p-1 px-2.5 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-2xs border ${
                            isChatOpen 
                              ? "bg-zinc-900 text-white border-zinc-900" 
                              : "bg-zinc-50 hover:bg-zinc-100 text-zinc-900 border-zinc-200"
                          }`}
                        >
                          <MessageSquare size={11} />
                          <span>Chat tinh chỉnh</span>
                        </button>

                        {/* Gắn khung kịch bản mẫu Duy Lâm */}
                        <button
                          onClick={() => openReferenceModal(card.id)}
                          className={`p-1 px-2 border rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-3xs ${
                            customTemplate || customDocLink 
                              ? "bg-emerald-50 text-emerald-900 border-emerald-250 hover:bg-emerald-100" 
                              : "bg-zinc-50 hover:bg-zinc-100 text-zinc-900 border-zinc-200"
                          }`}
                          title={
                            customTemplate || customDocLink 
                              ? "Cấu hình tham chiếu mẫu đang KÍCH HOẠT (Bấm để sửa)" 
                              : "Bấm để thiết lập Khung kịch bản mẫu hoặc làm tham chiếu cho Gemini"
                          }
                        >
                          <Film size={11} className={customTemplate || customDocLink ? "text-emerald-700" : "text-zinc-600"} />
                          <span>Gắn khung mẫu</span>
                          {(customTemplate || customDocLink) && (
                            <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-pulse inline-block" />
                          )}
                        </button>

                        {/* Presets manager */}
                        <button
                          onClick={() => setExplainGoalId(explainGoalId === card.id ? null : card.id)}
                          className="p-1 px-2.5 bg-zinc-100 hover:bg-zinc-200 text-black border border-zinc-300 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                        >
                          <Sparkles size={11} className={isCardLoading ? "animate-spin animate-duration-1000" : "text-black"} />
                          <span>Tối ưu nhanh</span>
                        </button>

                        <button
                          onClick={() => startEdit(card)}
                          className="p-1.5 text-slate-500 hover:text-black rounded hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Sửa nhanh kịch bản"
                        >
                          <Edit2 size={11} />
                        </button>

                        {/* Order manipulation */}
                        {idx > 0 && (
                          <button
                            onClick={() => onReorderCards(card.id, "up")}
                            className="p-1.5 text-slate-500 hover:text-black rounded hover:bg-slate-100 cursor-pointer"
                            title="Di chuyển lên"
                          >
                            <ArrowUp size={11} />
                          </button>
                        )}
                        {idx < sortedCards.length - 1 && (
                          <button
                            onClick={() => onReorderCards(card.id, "down")}
                            className="p-1.5 text-slate-500 hover:text-black rounded hover:bg-slate-100 cursor-pointer"
                            title="Di chuyển xuống"
                          >
                            <ArrowDown size={11} />
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setConfirmDialog({
                              title: "Hủy bài học",
                              message: `Bạn chắc chắn muốn hủy bài học "${card.title}"?`,
                              actionText: "Xác nhận xóa",
                              onConfirm: () => {
                                onDeleteCard(card.id);
                                setConfirmDialog(null);
                              }
                            });
                          }}
                          className="p-1.5 text-rose-500 hover:text-rose-700 rounded hover:bg-rose-50 cursor-pointer"
                          title="Xóa bài học"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <AnimatePresence>
                  {explainGoalId === card.id && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: "auto" }}
                      exit={{ height: 0 }}
                      className="overflow-hidden bg-zinc-50 border-b border-zinc-200 p-4"
                    >
                      <div className="flex items-center gap-1.5 text-zinc-900 font-bold text-[10px] mb-2 uppercase tracking-wide">
                        <Sparkles size={12} className="text-black animate-pulse" />
                        Lựa chọn mục tiêu nâng cấp kịch bản nhanh bằng Gemini:
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mb-3">
                        {OPTIMIZATION_PRESETS.map((p, pIdx) => (
                          <button
                            key={pIdx}
                            onClick={() => handleOptimizeAction(card.id, p.val)}
                            className="text-left p-2.5 rounded-lg bg-white hover:bg-zinc-50 border border-slate-200 hover:border-black text-[10px] text-slate-600 hover:text-black transition-all font-sans block cursor-pointer shadow-3xs"
                          >
                            <div className="font-bold flex items-center gap-1 mb-0.5 text-black uppercase text-[8px] tracking-wider">
                              Lựa chọn {pIdx + 1}
                            </div>
                            {p.label}
                          </button>
                        ))}
                      </div>

                      {/* Custom input prompts */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={customGoal}
                          onChange={(e) => setCustomGoal(e.target.value)}
                          placeholder="Hoặc nhập yêu cầu riêng của bạn, ví dụ: 'Tối ưu lại kịch bản dưới góc độ lấp lánh trà nóng dạt dào'..."
                          className="flex-1 bg-white text-xs text-slate-800 border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-black"
                        />
                        <button
                          onClick={() => {
                            if (!customGoal.trim()) return;
                            handleOptimizeAction(card.id, customGoal);
                            setCustomGoal("");
                          }}
                          className="px-4 py-2 bg-black hover:bg-zinc-800 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs whitespace-nowrap"
                        >
                          Yêu cầu tối ưu
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Unified Lesson Script display (Only one column, wide and gorgeous) */}
                <div className="bg-white">
                  <div className="p-5 space-y-2">
                    <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-1">
                      <Film size={12} className="text-slate-400" /> KỊCH BẢN BÀI GIẢNG (ẨN DỤ THỊ GIÁC & CHỈ DẪN GRAPHIC)
                    </div>

                    {isEditing ? (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center bg-zinc-100 p-2 rounded-t-lg border-x border-t border-slate-300">
                          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Khung soạn thảo kịch bản</span>
                          <button
                            type="button"
                            onClick={() => {
                              setConfirmDialog({
                                title: "Gắn Khung Kịch Bản Mẫu",
                                message: "Học thuật: Hành động này sẽ ghi đè và gắn kịch bản mẫu chuẩn 4 Phần của Duy Lâm vào ô nhập liệu. Bạn có chắc chắn?",
                                actionText: "Gắn khung mẫu",
                                onConfirm: () => {
                                  setEditVideo(MEDIA_DUYLAM_STANDARD_TEMPLATE);
                                  setConfirmDialog(null);
                                }
                              });
                            }}
                            className="text-[9px] text-black hover:bg-black/10 bg-black/5 px-2 py-0.5 rounded inline-flex items-center gap-1 border border-black/20 font-bold uppercase tracking-wider cursor-pointer font-mono"
                          >
                            <Film size={9} /> Gắn Khung Kịch Bản Mẫu
                          </button>
                        </div>
                        <textarea
                          value={editVideo}
                          onChange={(e) => setEditVideo(e.target.value)}
                          rows={12}
                          className="w-full bg-slate-50 border border-slate-300 rounded-b-lg p-3 text-xs text-slate-800 focus:outline-none focus:border-black font-sans leading-relaxed"
                        />
                      </div>
                    ) : (
                      <div className="text-xs text-slate-700 leading-relaxed font-sans bg-zinc-50/20 p-5 overflow-hidden rounded-xl border border-zinc-100">
                        {renderFormattedContent(card.videoContent)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card-specific custom interactive Chat under the kịch bản bài học */}
                <AnimatePresence>
                  {isChatOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t border-slate-200 bg-zinc-50/30"
                    >
                      <div className="p-4 border-b border-slate-100 flex items-center justify-between text-[11px] font-bold text-zinc-800">
                        <div className="flex items-center gap-2">
                          <Bot size={14} className="text-black animate-bounce" />
                          <span>TRÒ CHUYỆN TINH CHỈNH KỊCH BẢN VỚI GEMINI ACADEMIC</span>
                        </div>
                        <span className="text-[9px] text-zinc-500 font-mono">BÀI GIẢNG: {card.title}</span>
                      </div>

                      {/* Chat messages viewport */}
                      <div className="p-4 max-h-[350px] overflow-y-auto space-y-3">
                        {(cardChats[card.id] || []).map((msg) => {
                          const isAI = msg.role === "model";
                          const draftContent = parseDraftContent(msg.content);

                          return (
                            <div key={msg.id} className="space-y-2">
                              <div className={`flex gap-2.5 ${isAI ? "justify-start" : "justify-end"}`}>
                                {/* Icon display */}
                                {isAI && (
                                  <div className="w-6 h-6 rounded-full bg-zinc-100 text-zinc-900 flex items-center justify-center text-[10px] font-bold flex-shrink-0 border border-zinc-200">
                                    AI
                                  </div>
                                )}
                                <div
                                  className={`rounded-2xl px-3.5 py-2.5 text-xs max-w-[85%] whitespace-pre-line leading-relaxed ${
                                    isAI
                                      ? "bg-white text-slate-800 border border-slate-200 shadow-3xs"
                                      : "bg-black text-white shadow-3xs"
                                  }`}
                                >
                                  {isAI ? cleanDisplayContent(msg.content) : msg.content}
                                </div>
                                {!isAI && (
                                  <div className="w-6 h-6 rounded-full bg-zinc-800 text-white flex items-center justify-center text-[9px] font-bold flex-shrink-0">
                                    ME
                                  </div>
                                )}
                              </div>

                              {/* Apply button appears directly below AI suggestion bubbles containing a Draft */}
                              {isAI && draftContent && (
                                <div className="pl-8 flex items-center gap-2">
                                  <button
                                    onClick={() => handleApplyDraft(card.id, draftContent)}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[10px] font-bold transition-all shadow-3xs cursor-pointer"
                                  >
                                    <Check size={11} />
                                    <span>Áp dụng bản thảo này vào kịch bản chính</span>
                                  </button>
                                  <span className="text-[9px] text-slate-400 font-sans italic">
                                    (Ghi đè kịch bản hiện tại của bài học)
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {/* Typing / Loading indicator */}
                        {cardChatLoading[card.id] && (
                          <div className="flex gap-2 items-center text-slate-400 text-xs pl-8">
                            <RefreshCw size={12} className="animate-spin text-black" />
                            <span className="italic">Gemini đang nghiên cứu kịch bản...</span>
                          </div>
                        )}
                      </div>

                      {/* Message Input box */}
                      <div className="p-3 bg-zinc-100 border-t border-slate-200 flex gap-2">
                        <input
                          type="text"
                          value={cardChatInputs[card.id] || ""}
                          onChange={(e) => setCardChatInputs(prev => ({ ...prev, [card.id]: e.target.value }))}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !cardChatLoading[card.id]) {
                              handleSendCardChat(card.id, card.title, card.videoContent);
                            }
                          }}
                          placeholder="Nhập yêu cầu tinh chỉnh của bạn (ví dụ: 'thêm góc quay cận cảnh lúc nước đá tan', 'đổi lời thoại ngắn gọn hơn')..."
                          className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-black"
                        />
                        <button
                          onClick={() => handleSendCardChat(card.id, card.title, card.videoContent)}
                          disabled={cardChatLoading[card.id] || !(cardChatInputs[card.id] || "").trim()}
                          className="p-2.5 bg-black hover:bg-zinc-800 disabled:bg-slate-300 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center"
                        >
                          <Send size={12} />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Full Block Loading overlay */}
                <AnimatePresence>
                  {isCardLoading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.95 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-white/95 flex flex-col items-center justify-center space-y-3 z-10"
                    >
                      <RefreshCw size={24} className="text-black animate-spin" />
                      <div className="text-center">
                        <h4 className="text-xs font-bold text-black font-display">
                          AI đang thiết kế lại kịch bản bài học...
                        </h4>
                        <p className="text-[10px] text-slate-500 mt-1">
                          Gài cắm tư duy chiều sâu & ẩn dụ thị giác tinh tế
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
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
                  <Film size={15} className="text-zinc-200 animate-pulse" />
                  <span className="text-[11px] font-bold uppercase tracking-wider font-mono text-zinc-200">
                    Xác nhận học thuật
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
                    <AlertCircle size={18} />
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

      {/* Custom Reference Template & Doc Link Modal */}
      <AnimatePresence>
        {showRefModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border-2 border-zinc-950 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl"
            >
              {/* Header */}
              <div className="bg-black text-white px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Film size={16} className="text-amber-400" />
                  <span className="text-xs font-bold uppercase tracking-wider font-display">
                    Cấu hình Khung kịch bản mẫu & Tài liệu tham chiếu
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRefModal(false)}
                  className="p-1.5 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4 max-h-[500px] overflow-y-auto bg-slate-50/50">
                <div className="bg-zinc-50 border border-zinc-200 p-3.5 rounded-xl text-xs space-y-1 text-zinc-700">
                  <p className="font-bold text-zinc-900 flex items-center gap-1">
                    <Sparkles size={13} className="text-indigo-600 shrink-0" />
                    Định hình phong cách học thuật thông minh
                  </p>
                  <p className="leading-relaxed">
                    Nội dung và liên kết tài liệu (.doc, .docx, file hướng dẫn) bạn nhập ở đây sẽ là **mỏ neo duy nhất** được nạp trực tiếp vào bộ não của Gemini. Mọi phản hồi, biên kịch kịch bản mới, hay chỉnh sửa nhịp độ (Pacing) sẽ bám chặt theo định dạng này của bạn.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 block">
                    1. Nội dung khung kịch bản mẫu (Template Format)
                  </label>
                  <textarea
                    value={tempTemplate}
                    onChange={(e) => setTempTemplate(e.target.value)}
                    rows={12}
                    className="w-full text-xs font-mono p-3 bg-zinc-950 text-emerald-400 border border-zinc-800 rounded-xl focus:ring-1 focus:ring-emerald-500 focus:outline-none leading-relaxed resize-y shadow-inner"
                    placeholder="Nhập hoặc dán định dạng kịch bản mẫu tại đây..."
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setTempTemplate(MEDIA_DUYLAM_STANDARD_TEMPLATE)}
                      className="px-2.5 py-1 text-[10px] border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-md font-semibold transition-all cursor-pointer"
                    >
                      Dùng mẫu mặc định của Duy Lâm
                    </button>
                    <button
                      type="button"
                      onClick={() => setTempTemplate("")}
                      className="px-2.5 py-1 text-[10px] border border-slate-200 hover:bg-slate-50 text-red-600 rounded-md font-semibold transition-all cursor-pointer"
                    >
                      Xóa trống khung
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 block flex items-center gap-1">
                    2. Đường dẫn liên kết tài liệu (.doc, .docx học hỏi format)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                      <Link size={13} />
                    </div>
                    <input
                      type="text"
                      value={tempDocLink}
                      onChange={(e) => setTempDocLink(e.target.value)}
                      placeholder="Dán link file tài liệu Google Docs, OneDrive, Dropbox..."
                      className="w-full text-xs pl-8.5 pr-3 py-2.5 border border-slate-200 rounded-xl focus:border-black focus:outline-none bg-white placeholder-slate-400 font-mono"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 leading-normal">
                    * Gemini sẽ học quy cách kể chuyện, nhịp điệu pacing, và các thuật ngữ định vị trong tài liệu này để tự động biên kịch.
                  </p>
                </div>

                {refSavedAlert && (
                  <div className="bg-emerald-50 border border-emerald-250 text-emerald-800 p-2.5 rounded-lg text-xs font-medium flex items-center gap-2 animate-pulse mt-1">
                    <Check size={14} className="text-emerald-600" />
                    <span>Đã lưu thành công cấu hình tham chiếu cho Gemini! Đã lưu trữ lưu động.</span>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="bg-slate-50 border-t border-slate-100 px-5 py-4 flex flex-col sm:flex-row gap-3 sm:justify-between items-center">
                {/* Secondary action: Apply to card directly if context was a card */}
                {refActiveCardId ? (
                  <button
                    type="button"
                    onClick={handleApplyReferenceToCard}
                    className="w-full sm:w-auto px-4 py-2.5 border border-slate-200 hover:border-black hover:bg-slate-100 text-slate-700 hover:text-black text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 justify-center cursor-pointer shadow-3xs"
                    title="Ghi đè trực tiếp kịch bản mẫu này dòng vào bài đang xem"
                  >
                    <RefreshCw size={13} />
                    Gắn đè vào bài học này
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => setShowRefModal(false)}
                    className="flex-1 sm:flex-none px-4 py-2.5 border border-slate-200 text-slate-500 hover:text-slate-800 bg-white text-xs font-semibold rounded-lg transition-all cursor-pointer"
                  >
                    Đóng
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveReferenceConfig}
                    className="flex-1 sm:flex-none px-5 py-2.5 bg-black hover:bg-zinc-800 text-white text-xs font-bold rounded-lg transition-all cursor-pointer shadow-md flex items-center gap-1 justify-center"
                  >
                    <Check size={14} />
                    Lưu cấu hình tham chiếu
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
