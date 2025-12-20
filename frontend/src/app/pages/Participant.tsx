import { useState, useEffect } from 'react'; 
import { useSearchParams, useNavigate } from 'react-router-dom'; // useNavigate を追加
import { supabase } from '../lib/supabaseClient'; 
import { CalendarHeader, ViewType } from '../components/CalendarHeader';
import { DayView } from '../components/DayView';
import { WeekView } from '../components/WeekView';
import { MonthView } from '../components/MonthView';
import { YearView } from '../components/YearView';
import { AvailabilitySummary } from '../components/AvailabilitySummary';

export default function Participant() {
  const navigate = useNavigate(); // 初期化
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('eventId');
  
  const [currentView, setCurrentView] = useState<ViewType>('week');
  const [currentDate, setCurrentDate] = useState(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(today.setDate(diff));
  });

  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());
  const [organizerSlots, setOrganizerSlots] = useState<Set<string>>(new Set()); 
  const [eventName, setEventName] = useState('Team Meeting Schedule');

  // 幹事のデータを取得
  useEffect(() => {
    const fetchOrganizerData = async () => {
      if (!eventId) return;
      try {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('event_id', eventId)
          .eq('role', 'organizer')
          .single();

        if (userError || !userData) throw userError;

        const { data: scheduleData, error: schedError } = await supabase
          .from('schedules')
          .select('date')
          .eq('user_id', userData.id);

        if (schedError) throw schedError;

        const slotKeys = scheduleData.map(s => {
          const d = new Date(s.date);
          const dateStr = d.toISOString().split('T')[0];
          const hour = d.getHours();
          return `${dateStr}-${hour}`;
        });
        setOrganizerSlots(new Set(slotKeys));
      } catch (err) {
        console.error('Error fetching organizer schedules:', err);
      }
    };
    fetchOrganizerData();
  }, [eventId]);

  // ★ 追加：参加者の保存処理
  const handleSaveParticipantSchedules = async () => {
    if (selectedSlots.size === 0) {
      alert("日程を1つ以上選択してください");
      return;
    }

    const participantName = prompt("あなたの名前を入力してください") || "参加者";

    try {
      // 1. users テーブルに登録
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert([{
          event_id: eventId,
          name: participantName,
          role: 'participant'
        }])
        .select()
        .single();

      if (userError) throw userError;

      // 2. schedules テーブルに保存
      const schedulesToInsert = Array.from(selectedSlots).map((slotKey) => {
        const parts = slotKey.split("-");
        const hour = Number(parts.pop());
        const dateStr = parts.join("-");
        const date = new Date(`${dateStr}T${String(hour).padStart(2, '0')}:00:00`);

        return {
          user_id: userData.id,
          date: date.toISOString(),
        };
      });

      const { error: schedError } = await supabase
        .from('schedules')
        .insert(schedulesToInsert);

      if (schedError) throw schedError;

      alert("回答を保存しました！集計画面へ移動します。");
      navigate(`/part?eventId=${eventId}`);

    } catch (error: any) {
      console.error("Error saving schedules:", error);
      alert(`保存に失敗しました: ${error.message}`);
    }
  };

  const handleSlotToggle = (slotKey: string) => {
    if (!organizerSlots.has(slotKey)) return;
    setSelectedSlots((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(slotKey)) newSet.delete(slotKey);
      else newSet.add(slotKey);
      return newSet;
    });
  };

  const renderCalendarView = () => {
    const commonProps = {
      selectedSlots,
      onSlotToggle: handleSlotToggle,
      organizerSlots,
    };

    switch (currentView) {
      case 'day': return <DayView currentDate={currentDate} {...commonProps} />;
      case 'week': return <WeekView currentWeek={currentDate} {...commonProps} />;
      case 'month': return <MonthView currentMonth={currentDate} {...commonProps} onDateClick={(d) => { setCurrentDate(d); setCurrentView('day'); }} />;
      case 'year': return <YearView currentYear={currentDate} {...commonProps} onMonthClick={(m) => { const d = new Date(currentDate); d.setMonth(m); setCurrentDate(d); setCurrentView('month'); }} />;
      default: return null;
    }
  };

  return (
    <div className="size-full flex flex-col bg-gray-50 h-screen">
      <CalendarHeader
        currentDate={currentDate}
        onPreviousView={() => { /* 前へ移動ロジック */ }}
        onNextView={() => { /* 次へ移動ロジック */ }}
        eventName={eventName}
        onEventNameChange={setEventName}
        currentView={currentView}
        onViewChange={setCurrentView}
      />
      
      {/* ★ 保存ボタンの設置 */}
      <div className="bg-white border-b px-6 py-3 flex justify-end items-center gap-4">
        <p className="text-sm text-gray-500">幹事の候補日からあなたの都合を選んでください</p>
        <button 
          onClick={handleSaveParticipantSchedules}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium transition-colors shadow-sm"
        >
          回答を保存して次へ
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {renderCalendarView()}
        <AvailabilitySummary selectedSlots={selectedSlots} />
      </div>
    </div>
  );
}