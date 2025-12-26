import { formatDateKey } from '../lib/dateUtils';

interface YearViewProps {
  currentYear: Date;
  selectedSlots: Set<string>;
  onMonthClick: (month: number) => void;
}

export function YearView({ currentYear, selectedSlots, onMonthClick }: YearViewProps) {
  const year = currentYear.getFullYear();
  const months = Array.from({ length: 12 }, (_, i) => i);

  const getMonthName = (monthIndex: number) => {
    return new Date(year, monthIndex, 1).toLocaleDateString('en-US', { month: 'long' });
  };

  const getDaysInMonth = (monthIndex: number) => {
    const firstDay = new Date(year, monthIndex, 1);
    const lastDay = new Date(year, monthIndex + 1, 0);

    const days: (Date | null)[] = [];

    // Add empty cells for days before the first day of the month
    const firstDayOfWeek = firstDay.getDay();
    const startOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    for (let i = 0; i < startOffset; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, monthIndex, i));
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

  const getMonthAvailabilityCount = (monthIndex: number) => {
    const days = getDaysInMonth(monthIndex);
    let count = 0;
    days.forEach((day) => {
      if (day && hasAvailability(day)) {
        count++;
      }
    });
    return count;
  };

  const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const today = new Date();

  return (
    <div className="flex-1 overflow-auto bg-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {months.map((monthIndex) => {
            const days = getDaysInMonth(monthIndex);
            const availabilityCount = getMonthAvailabilityCount(monthIndex);

            return (
              <div
                key={monthIndex}
                onClick={() => onMonthClick(monthIndex)}
                className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-orange-300 hover:shadow-md transition-all"
              >
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-gray-900">{getMonthName(monthIndex)}</h3>
                  {availabilityCount > 0 && (
                    <span className="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded-full">
                      {availabilityCount} day{availabilityCount !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                {/* Mini calendar */}
                <div className="grid grid-cols-7 gap-1">
                  {/* Week day headers */}
                  {weekDays.map((day, idx) => (
                    <div key={idx} className="text-center text-xs text-gray-400">
                      {day}
                    </div>
                  ))}

                  {/* Days */}
                  {days.map((day, idx) => {
                    if (!day) {
                      return <div key={`empty-${idx}`} className="aspect-square"></div>;
                    }

                    const isToday = day.toDateString() === today.toDateString();
                    const hasSlots = hasAvailability(day);

                    return (
                      <div
                        key={idx}
                        className={`aspect-square flex items-center justify-center text-xs rounded ${isToday
                          ? 'bg-orange-600 text-white'
                          : hasSlots
                            ? 'bg-orange-100 text-orange-900'
                            : 'text-gray-700 hover:bg-gray-50'
                          }`}
                      >
                        {day.getDate()}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
