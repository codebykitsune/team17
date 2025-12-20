import React, { useState } from 'react';

interface WeekViewProps {
  currentWeek: Date;
  selectedSlots: Set<string>;
  onSlotToggle: (slotKey: string) => void;
  organizerSlots?: Set<string>; // 「?」を追加して任意にする
}

export function WeekView({ currentWeek, selectedSlots, onSlotToggle, organizerSlots }: WeekViewProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState<'select' | 'deselect'>('select');

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(currentWeek);
    date.setDate(date.getDate() + i);
    return date;
  });

  const formatTime = (hour: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour} ${period}`;
  };

  const getDayName = (date: Date) => date.toLocaleDateString('en-US', { weekday: 'short' });
  const getDayDate = (date: Date) => date.getDate();
  const getSlotKey = (date: Date, hour: number) => {
    const dateStr = date.toISOString().split('T')[0];
    return `${dateStr}-${hour}`;
  };

  const handleMouseDown = (slotKey: string) => {
    // 幹事設定データが存在し、かつその中にスロットがない場合のみガードする
    if (organizerSlots && !organizerSlots.has(slotKey)) return; 
    
    setIsDragging(true);
    const isCurrentlySelected = selectedSlots.has(slotKey);
    setDragMode(isCurrentlySelected ? 'deselect' : 'select');
    onSlotToggle(slotKey);
  };

  const handleMouseEnter = (slotKey: string) => {
    if (isDragging) {
      // 幹事設定データが存在し、かつその中にスロットがない場合のみガードする
      if (organizerSlots && !organizerSlots.has(slotKey)) return;
      
      const isCurrentlySelected = selectedSlots.has(slotKey);
      if (dragMode === 'select' && !isCurrentlySelected) onSlotToggle(slotKey);
      else if (dragMode === 'deselect' && isCurrentlySelected) onSlotToggle(slotKey);
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  return (
    <div className="flex-1 overflow-auto bg-white" onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
      <div className="min-w-[800px]">
        <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
          <div className="grid grid-cols-[80px_repeat(7,1fr)]">
            <div className="border-r border-gray-200"></div>
            {days.map((day, index) => {
              const isToday = day.toDateString() === new Date().toDateString();
              return (
                <div key={index} className="text-center py-3 border-r border-gray-200 last:border-r-0">
                  <div className="text-gray-500 text-sm mb-1">{getDayName(day)}</div>
                  <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${isToday ? 'bg-blue-600 text-white' : 'text-gray-900'}`}>
                    {getDayDate(day)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-[80px_repeat(7,1fr)]">
          {hours.map((hour) => (
            <React.Fragment key={`hour-row-${hour}`}>
              <div className="border-r border-b border-gray-200 px-3 py-2 text-sm text-gray-500 text-right">
                {formatTime(hour)}
              </div>
              {days.map((day) => {
                const slotKey = getSlotKey(day, hour);
                const isSelected = selectedSlots.has(slotKey);
                // 幹事設定データがない場合は常に true (選択可能) とみなす
                const isOrganizerSelected = organizerSlots ? organizerSlots.has(slotKey) : true;
                
                return (
                  <div
                    key={slotKey}
                    className={`border-r border-b border-gray-200 last:border-r-0 h-12 transition-colors select-none ${
                      !isOrganizerSelected 
                        ? 'bg-gray-100 cursor-not-allowed' // 参加者画面用のグレーアウト
                        : isSelected
                          ? 'bg-blue-100 hover:bg-blue-200 cursor-pointer' 
                          : 'hover:bg-gray-50 cursor-pointer'
                    }`}
                    onMouseDown={() => handleMouseDown(slotKey)}
                    onMouseEnter={() => handleMouseEnter(slotKey)}
                  >
                    {isOrganizerSelected && isSelected && (
                      <div className="w-full h-full bg-blue-500/20 border-l-4 border-blue-600"></div>
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}