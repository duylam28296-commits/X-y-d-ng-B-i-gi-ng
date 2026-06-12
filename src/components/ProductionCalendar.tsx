import React, { useState } from "react";
import { Section, Card } from "../types";
import { Calendar, ChevronLeft, ChevronRight, PlayCircle, Clock, Film, ListOrdered, CalendarDays, Video } from "lucide-react";

interface ProductionCalendarProps {
  sections: Section[];
  calendarPlan: Record<string, string>; // YYYY-MM-DD -> Card ID
  onUpdatePlan: (dateStr: string, cardId: string) => void;
}

export default function ProductionCalendar({
  sections,
  calendarPlan,
  onUpdatePlan,
}: ProductionCalendarProps) {
  // Use current date as reference
  const [currentDate, setCurrentDate] = useState(() => new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
    "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
  ];

  // Helper: Get list of all cards sorted by section and order
  const getFlattenedCards = (): { card: Card; label: string; id: string }[] => {
    const list: { card: Card; label: string; id: string }[] = [];
    // Sort sections by order
    const sortedSections = [...sections].sort((a, b) => a.order - b.order);
    sortedSections.forEach((sec, sIdx) => {
      const sortedCards = [...sec.cards].sort((a, b) => a.order - b.order);
      sortedCards.forEach((card, cIdx) => {
        list.push({
          card,
          label: `${sIdx + 1}.${cIdx + 1}`,
          id: card.id,
        });
      });
    });
    return list;
  };

  const allCards = getFlattenedCards();

  // Helper to find short label (e.g. "1.1") of a card by ID
  const getCardInfo = (cardId: string) => {
    const found = allCards.find((c) => c.id === cardId);
    if (!found) return null;
    return found;
  };

  // Calendar setup calculations
  // Get first day of the month (0 = Sun, 1 = Mon ... 6 = Sat)
  const firstDayIndex = new Date(year, month, 1).getDay();
  // Adjust to make Monday the first column (0 = Mon, 6 = Sun)
  const adjustedFirstDayIndex = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

  // Get total days in current month
  const totalDays = new Date(year, month + 1, 0).getDate();

  // Generate date array
  const dayCells: (number | null)[] = [];
  for (let i = 0; i < adjustedFirstDayIndex; i++) {
    dayCells.push(null);
  }
  for (let d = 1; d <= totalDays; d++) {
    dayCells.push(d);
  }

  // Group into weeks of 7
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < dayCells.length; i += 7) {
    weeks.push(dayCells.slice(i, i + 7));
  }

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <div className="bg-zinc-900 text-zinc-100 flex flex-col h-full rounded-2xl border border-zinc-800 shadow-xl overflow-hidden font-sans">
      {/* Calendar Header Banner */}
      <div className="bg-zinc-950 p-4 border-b border-zinc-850">
        <div className="flex items-center gap-2 mb-1">
          <CalendarDays size={16} className="text-amber-400 stroke-[2.2]" />
          <h2 className="text-xs uppercase tracking-widest font-bold text-zinc-100">
            Lịch sản xuất Bài Giảng
          </h2>
        </div>
        <p className="text-[10px] text-zinc-400 font-medium">
          Lập kế hoạch bấm máy, tiền kỳ, hậu kỳ cho từng kịch bản bài giảng
        </p>
      </div>

      {/* Month Navigator Controls */}
      <div className="flex items-center justify-between px-4 py-3 bg-zinc-900 border-b border-zinc-850">
        <div className="text-xs font-bold font-mono tracking-tight text-white flex items-center gap-1.5">
          <span>{monthNames[month]}</span>
          <span className="text-zinc-500 font-normal">/</span>
          <span className="text-zinc-400">{year}</span>
        </div>
        
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleToday}
            className="px-2 py-1 text-[9px] font-bold uppercase tracking-wider bg-zinc-800 border border-zinc-700 hover:border-zinc-500 rounded text-zinc-300 hover:text-white transition-colors cursor-pointer"
          >
            Hôm nay
          </button>
          <button
            onClick={handlePrevMonth}
            className="p-1 rounded bg-zinc-800 hover:bg-zinc-750 text-zinc-400 hover:text-white transition-colors cursor-pointer border border-zinc-700"
            title="Tháng trước"
          >
            <ChevronLeft size={13} />
          </button>
          <button
            onClick={handleNextMonth}
            className="p-1 rounded bg-zinc-800 hover:bg-zinc-750 text-zinc-400 hover:text-white transition-colors cursor-pointer border border-zinc-700"
            title="Tháng sau"
          >
            <ChevronRight size={13} />
          </button>
        </div>
      </div>

      {/* Calendar Grid Container */}
      <div className="p-3 flex-1 overflow-y-auto space-y-4">
        {/* Days of week header labels */}
        <div className="grid grid-cols-7 text-center text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
          <div>T2</div>
          <div>T3</div>
          <div>T4</div>
          <div>T5</div>
          <div>T6</div>
          <div>T7</div>
          <div className="text-amber-500">CN</div>
        </div>

        {/* Date cells grid */}
        <div className="space-y-1">
          {weeks.map((week, wIdx) => (
            <div key={wIdx} className="grid grid-cols-7 gap-1">
              {week.map((day, dIdx) => {
                if (day === null) {
                  return <div key={`empty-${dIdx}`} className="aspect-square bg-transparent rounded-lg" />;
                }

                // Format string key YYYY-MM-DD
                const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const scheduledCardId = calendarPlan[dateKey] || "";
                const cardInfo = getCardInfo(scheduledCardId);

                // Highlight today
                const isToday =
                  new Date().getDate() === day &&
                  new Date().getMonth() === month &&
                  new Date().getFullYear() === year;

                return (
                  <div
                    key={`day-${day}`}
                    className={`aspect-square relative p-1 rounded-lg border flex flex-col justify-between transition-all group ${
                      isToday
                        ? "border-amber-500 bg-amber-500/5 shadow-xs shadow-amber-500/5 text-amber-300"
                        : scheduledCardId
                        ? "border-zinc-700 bg-zinc-800"
                        : "border-zinc-850 hover:border-zinc-700 bg-zinc-900/50"
                    }`}
                  >
                    {/* Day number header */}
                    <div className="flex justify-between items-center">
                      <span className={`text-[10px] font-bold font-mono ${isToday ? "text-amber-400" : "text-zinc-400"}`}>
                        {day}
                      </span>
                      {cardInfo && (
                        <span className="text-[8px] px-1 bg-amber-500 text-zinc-950 font-bold rounded-sm scale-90 origin-top-right">
                          {cardInfo.label}
                        </span>
                      )}
                    </div>

                    {/* Compact schedule dropdown inside each day cell */}
                    <div className="mt-auto">
                      <select
                        value={scheduledCardId}
                        onChange={(e) => onUpdatePlan(dateKey, e.target.value)}
                        className={`w-full text-[8px] bg-transparent focus:bg-zinc-800 focus:text-white border-0 focus:outline-none focus:ring-0 select-none text-center font-bold tracking-tight py-0.5 cursor-pointer rounded-sm ${
                          scheduledCardId 
                            ? "text-amber-400 bg-amber-500/10 hover:bg-amber-500/20" 
                            : "text-zinc-600 hover:text-zinc-400"
                        }`}
                        style={{ WebkitAppearance: "none", MozAppearance: "none" }}
                        title={cardInfo ? `${cardInfo.label}: ${cardInfo.card.title}` : "Lên kế hoạch bài"}
                      >
                        <option value="" className="bg-zinc-900 text-zinc-500 text-[10px]">
                          -
                        </option>
                        {allCards.map((c) => (
                          <option key={c.id} value={c.id} className="bg-zinc-900 text-zinc-300 text-[10px]">
                            {c.label} - {c.card.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Dynamic Summary Cards inside Sidebar */}
        <div className="pt-2 border-t border-zinc-850 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-zinc-400 bg-zinc-950/40 p-2.5 rounded-lg border border-zinc-850">
            <span className="flex items-center gap-1">
              <Film size={11} className="text-zinc-500" />
              Tổng kịch bản sản xuất:
            </span>
            <span className="font-mono font-bold text-white">
              {Object.values(calendarPlan).filter(id => id !== "").length} bài
            </span>
          </div>

          {/* Quick Schedule Reference Board */}
          <div className="bg-zinc-950/20 rounded-xl p-3 border border-zinc-850 space-y-2">
            <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
              <Clock size={11} className="text-amber-400" />
              Lịch trình rải bài chi tiết
            </h4>
            
            {Object.entries(calendarPlan)
              .filter(([_, cardId]) => cardId && getCardInfo(cardId))
              .sort((a, b) => a[0].localeCompare(b[0]))
              .map(([dateStr, cardId]) => {
                const info = getCardInfo(cardId);
                if (!info) return null;
                
                // Format elegant dates dd/mm
                const parts = dateStr.split("-");
                const formattedDate = `${parts[2]}/${parts[1]}`;

                return (
                  <div key={dateStr} className="flex items-center justify-between gap-2 text-[10px] bg-zinc-900/60 p-2 rounded-lg border border-zinc-850/60 hover:border-zinc-700 transition-colors">
                    <span className="font-mono font-bold text-amber-400 shrink-0 bg-amber-500/5 px-1.5 py-0.5 rounded border border-amber-500/20">
                      {formattedDate}
                    </span>
                    <span className="truncate text-zinc-300 font-medium flex-1 pl-1">
                      {info.card.title}
                    </span>
                    <span className="font-mono text-zinc-500 text-[10px] font-bold shrink-0">
                      bài {info.label}
                    </span>
                  </div>
                );
              })}

            {Object.values(calendarPlan).filter(id => id !== "").length === 0 && (
              <p className="text-[10px] text-zinc-600 text-center italic py-2">
                Chưa gán kịch bản nào vào ngày sản xuất của lịch trình.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
