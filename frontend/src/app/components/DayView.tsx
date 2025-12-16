import { useState } from 'react';

interface DayViewProps {
  currentDate: Date;
  selectedSlots: Set<string>;
  onSlotToggle: (slotKey: string) => void;
}

export function DayView({ currentDate, selectedSlots, onSlotToggle }: DayViewProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState<'select' | 'deselect'>('select');

  // Generate hours from 0 to 23 (24 hours)
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const formatTime = (hour: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour} ${period}`;
  };

  const getSlotKey = (hour: number) => {
    const dateStr = currentDate.toISOString().split('T')[0];
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
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
          <div className="grid grid-cols-[100px_1fr]">
            <div className="border-r border-gray-200"></div>
            <div className="text-center py-4 border-r border-gray-200">
              <div className="text-gray-500 text-sm mb-1">
                {currentDate.toLocaleDateString('en-US', { weekday: 'short' })}
              </div>
              <div className="text-gray-900 text-2xl">
                {currentDate.getDate()}
              </div>
            </div>
          </div>
        </div>

        {/* Time slots */}
        <div className="grid grid-cols-[100px_1fr]">
          {hours.map((hour) => {
            const slotKey = getSlotKey(hour);
            const isSelected = selectedSlots.has(slotKey);

            return (
              <>
                {/* Time label */}
                <div
                  key={`time-${hour}`}
                  className="border-r border-b border-gray-200 px-4 py-3 text-sm text-gray-500 text-right"
                >
                  {formatTime(hour)}
                </div>

                {/* Time slot */}
                <div
                  key={slotKey}
                  className={`border-r border-b border-gray-200 h-16 cursor-pointer transition-colors select-none ${
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
              </>
            );
          })}
        </div>
      </div>
    </div>
  );
}
