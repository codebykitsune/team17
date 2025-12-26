import { formatDateKey } from '../lib/dateUtils';

interface MonthViewProps {
  currentMonth: Date;
  selectedSlots: Set<string>;
  onSlotToggle: (slotKey: string) => void;
  onDateClick: (date: Date) => void;
}

export function MonthView({ currentMonth, selectedSlots, onDateClick }: MonthViewProps) {
  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const days: (Date | null)[] = [];

    // Add empty cells for days before the first day of the month
    const firstDayOfWeek = firstDay.getDay();
    const startOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // Monday as first day
    for (let i = 0; i < startOffset; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const hasAvailability = (date: Date) => {
    const dateStr = formatDateKey(date);
    for (let hour = 0; hour < 24; hour++) {
      if (selectedSlots.has(`${dateStr}-${hour}`)) {
        return true;
      }
    }
    return false;
  };

  const getAvailabilityCount = (date: Date) => {
    const dateStr = formatDateKey(date);
    let count = 0;
    for (let hour = 0; hour < 24; hour++) {
      if (selectedSlots.has(`${dateStr}-${hour}`)) {
        count++;
      }
    }
    return count;
  };

  const days = getDaysInMonth();
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const today = new Date();

  return (
    <div className="flex-1 overflow-auto bg-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Week day headers */}
        <div className="grid grid-cols-7 gap-px mb-px bg-gray-200">
          {weekDays.map((day) => (
            <div
              key={day}
              className="bg-white text-center py-3 text-sm text-gray-600"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-px bg-gray-200">
          {days.map((day, index) => {
            if (!day) {
              return <div key={`empty-${index}`} className="bg-gray-50 h-32"></div>;
            }

            const isToday = day.toDateString() === today.toDateString();
            const hasSlots = hasAvailability(day);
            const slotCount = getAvailabilityCount(day);

            return (
              <div
                key={index}
                onClick={() => onDateClick(day)}
                className="bg-white h-32 p-2 cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <div className="flex flex-col h-full">
                  <div
                    className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm mb-2 ${isToday
                      ? 'bg-orange-600 text-white'
                      : 'text-gray-900'
                      }`}
                  >
                    {day.getDate()}
                  </div>

                  {hasSlots && (
                    <div className="flex-1 flex flex-col gap-1">
                      <div className="bg-orange-100 border-l-4 border-orange-600 px-2 py-1 text-xs text-orange-900 rounded-sm">
                        {slotCount} slot{slotCount !== 1 ? 's' : ''}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
