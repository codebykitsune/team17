import React, { useState } from 'react';
import { formatDateKey } from '../lib/dateUtils';

interface DayViewProps {
  currentDate: Date;
  selectedSlots: Set<string>;
  onSlotToggle: (slotKey: string) => void;
  organizerSlots?: Set<string>; // すでに任意になっている場合はそのままでOK
}

export function DayView({ currentDate, selectedSlots, onSlotToggle, organizerSlots }: DayViewProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState<'select' | 'deselect'>('select');
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const formatTime = (hour: number) => {
    return `${hour}:00`;
  };

  const getSlotKey = (hour: number) => {
    const dateStr = formatDateKey(currentDate);
    return `${dateStr}-${hour}`;
  };

  const handleMouseDown = (slotKey: string) => {
    if (organizerSlots && !organizerSlots.has(slotKey)) return;
    setIsDragging(true);
    const isCurrentlySelected = selectedSlots.has(slotKey);
    setDragMode(isCurrentlySelected ? 'deselect' : 'select');
    onSlotToggle(slotKey);
  };

  const handleMouseEnter = (slotKey: string) => {
    if (isDragging) {
      if (organizerSlots && !organizerSlots.has(slotKey)) return;
      const isCurrentlySelected = selectedSlots.has(slotKey);
      if (dragMode === 'select' && !isCurrentlySelected) onSlotToggle(slotKey);
      else if (dragMode === 'deselect' && isCurrentlySelected) onSlotToggle(slotKey);
    }
  };

  return (
    <div className="flex-1 overflow-auto bg-white" onMouseUp={() => setIsDragging(false)} onMouseLeave={() => setIsDragging(false)}>
      <div className="max-w-4xl mx-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
          <div className="grid grid-cols-[100px_1fr]">
            <div className="border-r border-gray-200"></div>
            <div className="text-center py-4 border-r border-gray-200">
              <div className="text-gray-500 text-sm mb-1">{currentDate.toLocaleDateString('en-US', { weekday: 'short' })}</div>
              <div className="text-gray-900 text-2xl">{currentDate.getDate()}</div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-[100px_1fr]">
          {hours.map((hour) => {
            const slotKey = getSlotKey(hour);
            const isSelected = selectedSlots.has(slotKey);
            const isOrganizerSelected = organizerSlots ? organizerSlots.has(slotKey) : true;

            return (
              <React.Fragment key={`hour-${hour}`}>
                <div className="border-r border-b border-gray-200 px-4 py-3 text-sm text-gray-500 text-right">{formatTime(hour)}</div>
                <div
                  className={`border-r border-b border-gray-200 h-16 transition-colors select-none ${!isOrganizerSelected
                    ? 'bg-gray-100 cursor-not-allowed'
                    : isSelected ? 'bg-orange-100 hover:bg-orange-200 cursor-pointer' : 'hover:bg-gray-50 cursor-pointer'
                    }`}
                  onMouseDown={() => handleMouseDown(slotKey)}
                  onMouseEnter={() => handleMouseEnter(slotKey)}
                >
                  {isOrganizerSelected && isSelected && <div className="w-full h-full bg-orange-500/20 border-l-4 border-orange-600"></div>}
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
