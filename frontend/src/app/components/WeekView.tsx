import { useState } from 'react';

interface WeekViewProps {
  currentWeek: Date;
  selectedSlots: Set<string>;
  onSlotToggle: (slotKey: string) => void;
}

export function WeekView({ currentWeek, selectedSlots, onSlotToggle }: WeekViewProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState<'select' | 'deselect'>('select');

  // Generate hours from 0 (12 AM) to 23 (11 PM) - 24 hours
  const hours = Array.from({ length: 24 }, (_, i) => i);
  
  // Generate days of the week
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

  const getDayName = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  const getDayDate = (date: Date) => {
    return date.getDate();
  };

  const getSlotKey = (date: Date, hour: number) => {
    const dateStr = date.toISOString().split('T')[0];
    return `${dateStr}-${hour}`;
  };

  const handleMouseDown = (slotKey: string) => {
    setIsDragging(true);
    const isCurrentlySelected = selectedSlots.has(slotKey);
    setDragMode(isCurrentlySelected ? 'deselect' : 'select');
    onSlotToggle(slotKey);
  };

  const handleMouseEnter = (slotKey: string) => {
    if (isDragging) {
      const isCurrentlySelected = selectedSlots.has(slotKey);
      if (dragMode === 'select' && !isCurrentlySelected) {
        onSlotToggle(slotKey);
      } else if (dragMode === 'deselect' && isCurrentlySelected) {
        onSlotToggle(slotKey);
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div 
      className="flex-1 overflow-auto bg-white"
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="min-w-[800px]">
        {/* Header with days */}
        <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
          <div className="grid grid-cols-[80px_repeat(7,1fr)]">
            <div className="border-r border-gray-200"></div>
            {days.map((day, index) => {
              const isToday = day.toDateString() === new Date().toDateString();
              return (
                <div
                  key={index}
                  className="text-center py-3 border-r border-gray-200 last:border-r-0"
                >
                  <div className="text-gray-500 text-sm mb-1">{getDayName(day)}</div>
                  <div
                    className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${
                      isToday ? 'bg-blue-600 text-white' : 'text-gray-900'
                    }`}
                  >
                    {getDayDate(day)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Time slots grid */}
        <div className="grid grid-cols-[80px_repeat(7,1fr)]">
          {hours.map((hour) => (
            <>
              {/* Time label */}
              <div
                key={`time-${hour}`}
                className="border-r border-b border-gray-200 px-3 py-2 text-sm text-gray-500 text-right"
              >
                {formatTime(hour)}
              </div>
              
              {/* Day slots */}
              {days.map((day, dayIndex) => {
                const slotKey = getSlotKey(day, hour);
                const isSelected = selectedSlots.has(slotKey);
                
                return (
                  <div
                    key={slotKey}
                    className={`border-r border-b border-gray-200 last:border-r-0 h-12 cursor-pointer transition-colors select-none ${
                      isSelected
                        ? 'bg-blue-100 hover:bg-blue-200'
                        : 'hover:bg-gray-50'
                    }`}
                    onMouseDown={() => handleMouseDown(slotKey)}
                    onMouseEnter={() => handleMouseEnter(slotKey)}
                  >
                    {isSelected && (
                      <div className="w-full h-full bg-blue-500/20 border-l-4 border-blue-600"></div>
                    )}
                  </div>
                );
              })}
            </>
          ))}
        </div>
      </div>
    </div>
  );
}
