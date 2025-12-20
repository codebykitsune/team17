import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom"; // useLocation を追加
import { AvailabilitySummary } from "../components/AvailabilitySummary";
import { CalendarHeader, ViewType } from "../components/CalendarHeader";
import { DayView } from "../components/DayView";
import { MonthView } from "../components/MonthView";
import { WeekView } from "../components/WeekView";
import { YearView } from "../components/YearView";
import { supabase } from "../lib/supabaseClient"; 
import { Button } from "../components/ui/button"; 

export default function App() {
  const navigate = useNavigate();
  const location = useLocation(); // state を受け取るために必要

  // 前のページから送られてきた情報を取得
  const eventId = location.state?.eventId;
  const userId = location.state?.userId;

  const [currentView, setCurrentView] = useState<ViewType>("week");
  const [currentDate, setCurrentDate] = useState(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); 
    return new Date(today.setDate(diff));
  });

  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());
  const [eventName, setEventName] = useState("Team Meeting Schedule");

  const handleSaveSchedules = async () => {
    if (selectedSlots.size === 0) {
      alert("日程を選択してください");
      return;
    }

    // ここで userId の存在を確認
    if (!userId) {
      alert("ユーザーIDが見つかりません。イベント作成からやり直してください。");
      return;
    }

    try {
      const schedulesToInsert = Array.from(selectedSlots).map((slotKey) => {
        const parts = slotKey.split("-");
        const hour = Number(parts.pop());
        const dateStr = parts.join("-");
        const date = new Date(`${dateStr}T${String(hour).padStart(2, '0')}:00:00`);

        return {
          user_id: userId,
          date: date.toISOString(),
        };
      });

      const { error } = await supabase
        .from("schedules")
        .insert(schedulesToInsert);

      if (error) throw error;

      alert("日程を保存しました！");
      navigate(`/part?eventId=${eventId}`); 

    } catch (error: any) {
      console.error("Error saving schedules:", error);
      alert(`保存に失敗しました: ${error.message}`);
    }
  };

  // ... (handlePreviousView, handleNextView などの他の関数は変更なし) ...
  const handlePreviousView = () => {
    const newDate = new Date(currentDate);
    switch (currentView) {
      case "day": newDate.setDate(newDate.getDate() - 1); break;
      case "week": newDate.setDate(newDate.getDate() - 7); break;
      case "month": newDate.setMonth(newDate.getMonth() - 1); break;
      case "year": newDate.setFullYear(newDate.getFullYear() - 1); break;
    }
    setCurrentDate(newDate);
  };

  const handleNextView = () => {
    const newDate = new Date(currentDate);
    switch (currentView) {
      case "day": newDate.setDate(newDate.getDate() + 1); break;
      case "week": newDate.setDate(newDate.getDate() + 7); break;
      case "month": newDate.setMonth(newDate.getMonth() + 1); break;
      case "year": newDate.setFullYear(newDate.getFullYear() + 1); break;
    }
    setCurrentDate(newDate);
  };

  const handleViewChange = (view: ViewType) => setCurrentView(view);

  const handleSlotToggle = (slotKey: string) => {
    setSelectedSlots((prev) => {
      const next = new Set(prev);
      if (next.has(slotKey)) next.delete(slotKey);
      else next.add(slotKey);
      return next;
    });
  };

  const handleDateClick = (date: Date) => {
    setCurrentDate(date);
    setCurrentView("day");
  };

  const handleMonthClick = (monthIndex: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(monthIndex);
    newDate.setDate(1);
    setCurrentDate(newDate);
    setCurrentView("month");
  };

  const renderCalendarView = () => {
    switch (currentView) {
      case "day":
        return <DayView currentDate={currentDate} selectedSlots={selectedSlots} onSlotToggle={handleSlotToggle} />;
      case "week":
        return <WeekView currentWeek={currentDate} selectedSlots={selectedSlots} onSlotToggle={handleSlotToggle} />;
      case "month":
        return (
          <MonthView
            currentMonth={currentDate}
            selectedSlots={selectedSlots}
            onSlotToggle={handleSlotToggle}
            onDateClick={handleDateClick}
          />
        );
      case "year":
        return <YearView currentYear={currentDate} selectedSlots={selectedSlots} onMonthClick={handleMonthClick} />;
    }
  };

  return (
    <div className="size-full flex flex-col bg-gray-50 h-screen">
      <CalendarHeader
        currentDate={currentDate}
        onPreviousView={handlePreviousView}
        onNextView={handleNextView}
        eventName={eventName}
        onEventNameChange={setEventName}
        currentView={currentView}
        onViewChange={handleViewChange}
      />

      <div className="bg-white border-b px-6 py-3 flex justify-end items-center gap-4">
        <p className="text-sm text-gray-500">候補日を選択して保存してください</p>
        <Button 
          onClick={handleSaveSchedules}
          className="bg-orange-600 hover:bg-orange-700 text-white"
        >
          日程を確定して保存
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {renderCalendarView()}
        <AvailabilitySummary selectedSlots={selectedSlots} />
      </div>
    </div>
  );
}