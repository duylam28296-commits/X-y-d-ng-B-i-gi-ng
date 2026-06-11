import React, { useState, useRef, useEffect } from "react";
import { ChatMessage, Section } from "../types";
import { Sparkles, Send, RefreshCw, Film, HelpCircle, AlertCircle, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface GeminiPanelProps {
  currentSections: Section[];
  onImportAISections: (sections: Section[]) => void;
  customTemplate: string;
  customDocLink: string;
}

export default function GeminiPanel({ 
  currentSections, 
  onImportAISections,
  customTemplate,
  customDocLink
}: GeminiPanelProps) {
  const [topicInput, setTopicInput] = useState("");
  const [isGeneratingStructure, setIsGeneratingStructure] = useState(false);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg-welcome",
      role: "assistant",
      content: "Xin chào! Tôi là Trợ lý Dựng Phim & Pacing AI. Tôi hiểu rõ cách sắp đặt máy quay, cắt cảnh và cách thức điều tiết nhịp chảy của bộ phim. Tôi sẵn sàng phân tích cấu trúc bài giảng của bạn và gợi ý tối ưu hóa kịch bản cưới, video tiktok hay phim ngắn. Bạn cần tôi trợ giúp điều gì?",
      timestamp: new Date()
    }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isChatLoading]);

  // Topic suggestion presets
  const TOPIC_PRESETS = [
    "Kịch tính cuộc rượt đuổi trong ngõ hẻm nghẹt thở",
    "Biến video review công nghệ thường nhật thành kiệt tác",
    "Sử dụng nhịp độ chậm rải (slow burn) trong phim kinh dị"
  ];

  // AI Chat submission
  const handleSendChat = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: chatInput.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    const currentQuery = chatInput;
    setChatInput("");
    setIsChatLoading(true);

    try {
      const response = await fetch("/api/chat-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          topic: topicInput,
          currentSyllabus: currentSections.map(s => ({
            title: s.title,
            description: s.description,
            lessons: s.cards.map(c => ({
              title: c.title,
              coreKnowledge: c.coreKnowledge,
              videoContent: c.videoContent
            }))
          })),
          customTemplate,
          customDocLink
        })
      });

      const data = await response.json();
      if (data.success) {
        setMessages(prev => [...prev, {
          id: `msg-${Date.now()}-ai`,
          role: "assistant",
          content: data.answer,
          timestamp: new Date()
        }]);
      } else {
        setMessages(prev => [...prev, {
          id: `msg-${Date.now()}-err`,
          role: "assistant",
          content: "Rất tiếc, tôi đang gặp khó khăn khi kết nối dịch vụ. " + (data.error || ""),
          timestamp: new Date()
        }]);
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, {
        id: `msg-${Date.now()}-err`,
        role: "assistant",
        content: "Lỗi đường truyền kỹ thuật, vui lòng thử lại sau.",
        timestamp: new Date()
      }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Generate whole structure via Gemini API
  const handleGenerateStructure = async (overrideTopic?: string) => {
    const activeTopic = overrideTopic || topicInput;
    if (!activeTopic.trim()) {
      alert("Vui lòng nhập chủ đề chính muốn thiết kế hệ thống bài cương!");
      return;
    }

    setIsGeneratingStructure(true);
    if (!overrideTopic) {
      setTopicInput(activeTopic);
    }

    try {
      const response = await fetch("/api/suggest-structure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          topic: activeTopic,
          customTemplate,
          customDocLink
        }),
      });
      const data = await response.json();
      if (data.success && data.sections) {
        // Convert plain JSON to full typed Section database structure
        const formattedSections: Section[] = data.sections.map((sec: any, sIdx: number) => ({
          id: `ai-sec-${Date.now()}-${sIdx}`,
          title: sec.title,
          description: `Khóa học thiết kế bởi AI nhằm cung cấp lý thuyết và ví dụ trực quan về "${activeTopic}"`,
          order: sIdx + 1,
          cards: [
            {
              id: `ai-card-${Date.now()}-${sIdx}-1`,
              title: `Bài tập 1: ${sec.title}`,
              coreKnowledge: sec.coreKnowledge,
              videoContent: sec.videoContent,
              order: 1
            }
          ]
        }));
        onImportAISections(formattedSections);
      } else {
        alert("Lỗi tạo khung bài giảng: " + (data.error || "Không có kết quả"));
      }
    } catch (err) {
      console.error(err);
      alert("Có lỗi xảy ra khi gọi API gợi ý cấu trúc!");
    } finally {
      setIsGeneratingStructure(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 border-l border-slate-200 font-sans text-slate-800 divide-y divide-slate-200 shadow-xs">
      {/* SECTION 1: AI Topic Course Designer */}
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-1 bg-zinc-100 rounded text-black">
            <Sparkles size={15} />
          </div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-display">
            Sinh Lộ trình Giáo án (Bằng AI)
          </h3>
        </div>

        <div className="space-y-2">
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Nhập đề tài video bất kỳ (TikTok, Phim ngắn, Vlog). AI sẽ sinh ngay 3-5 Chương lớn đầy đủ Kiến thức & Kịch bản minh họa:
          </p>
          <div className="flex flex-col gap-1.5 pt-1">
            <input
              type="text"
              value={topicInput}
              onChange={(e) => setTopicInput(e.target.value)}
              placeholder="ví dụ: Kịch tính đẩy cao trong phim ẩm thực..."
              className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-black w-full"
            />
            
            <button
              onClick={() => handleGenerateStructure()}
              disabled={isGeneratingStructure || !topicInput.trim()}
              className="flex items-center justify-center gap-1.5 w-full py-2.5 bg-black hover:bg-zinc-800 text-white font-bold rounded-lg text-xs transition-all disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer shadow-xs"
            >
              {isGeneratingStructure ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <Sparkles size={14} />
              )}
              Thiết kế Giáo án ngay!
            </button>
          </div>
        </div>

        {/* Suggestion tags */}
        <div className="space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">Đề xuất chủ đề gợi ý:</span>
          <div className="flex flex-col gap-1">
            {TOPIC_PRESETS.map((p, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setTopicInput(p);
                  handleGenerateStructure(p);
                }}
                disabled={isGeneratingStructure}
                className="text-left text-[10px] text-slate-600 bg-white hover:bg-zinc-100 hover:text-black px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-black transition-all font-sans block cursor-pointer shadow-2xs"
              >
                ✦ {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 2: Conversational Expert Assistant Chat */}
      <div className="flex-1 flex flex-col min-h-[300px]">
        {/* Chat info tab header */}
        <div className="px-4 py-3 bg-slate-100/50 border-b border-slate-200 flex justify-between items-center">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <MessageCircle size={14} className="text-black" />
            <span>Trợ lý Đạo diễn & Pacing Coaching</span>
          </div>
          <span className="text-[9px] text-zinc-850 bg-zinc-200 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-widest">
            LIVE AI
          </span>
        </div>

        {/* Messaging Logs container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[460px] bg-white">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed font-sans ${
                  msg.role === "user"
                    ? "bg-zinc-900 text-white rounded-br-none shadow-xs"
                    : "bg-slate-50 text-slate-700 rounded-bl-none border border-slate-200 shadow-2xs"
                }`}
              >
                <div className="whitespace-pre-line">{msg.content}</div>
                <div className={`text-[9px] mt-1 flex justify-end font-mono ${msg.role === "user" ? "text-zinc-400" : "text-slate-400"}`}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}

          {isChatLoading && (
            <div className="flex justify-start">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl rounded-bl-none px-3.5 py-2.5 text-xs text-black font-sans flex items-center gap-2">
                <RefreshCw size={12} className="animate-spin" />
                <span>Gemini đang nghiên cứu nhịp độ kịch bản...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Prompt presets for fast questioning */}
        <div className="px-3 py-2 bg-slate-50 border-t border-slate-250 overflow-x-auto whitespace-nowrap flex gap-1.5">
          <button
            onClick={() => {
              setChatInput("Làm sao để dựng nhịp gắt gắp như Edgar Wright?");
              setTimeout(() => handleSendChat(), 50);
            }}
            className="text-[10px] bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-black px-3 py-1.5 rounded-full transition-colors cursor-pointer shadow-2xs"
          >
            Nhịp Edgar Wright?
          </button>
          <button
            onClick={() => {
              setChatInput("Hãy bình luận cấu trúc giáo án hiện tại xem có chuẩn Pacing không?");
              setTimeout(() => handleSendChat(), 50);
            }}
            className="text-[10px] bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-black px-3 py-1.5 rounded-full transition-colors cursor-pointer shadow-2xs"
          >
            Góp ý giáo án?
          </button>
          <button
            onClick={() => {
              setChatInput("Giải thích quy tắc dựng phim 180 độ trong cảnh đối thoại gắt.");
              setTimeout(() => handleSendChat(), 50);
            }}
            className="text-[10px] bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-black px-3 py-1.5 rounded-full transition-colors cursor-pointer shadow-2xs"
          >
            Định luật 180 độ?
          </button>
        </div>

        {/* Chat input box */}
        <form onSubmit={handleSendChat} className="p-3 bg-slate-50 border-t border-slate-200 flex gap-2">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            disabled={isChatLoading}
            placeholder="Hỏi ý kiến kịch bản, lý thuyết pacing..."
            className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-black"
          />
          <button
            type="submit"
            disabled={!chatInput.trim() || isChatLoading}
            className="p-2.5 bg-black hover:bg-zinc-800 disabled:bg-slate-200 disabled:opacity-50 text-white rounded-lg flex items-center justify-center transition-colors cursor-pointer shadow-xs"
          >
            <Send size={14} />
          </button>
        </form>
      </div>
    </div>
  );
}
