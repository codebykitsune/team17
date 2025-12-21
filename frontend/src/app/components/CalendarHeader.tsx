import type { ReactNode } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Button } from './ui/button';

export type ViewType = 'day' | 'week' | 'month' | 'year';

interface CalendarHeaderProps {
  currentDate: Date;
  onPreviousView: () => void;
  onNextView: () => void;
  eventName: string;
  onEventNameChange: (name: string) => void;
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  headerAction?: ReactNode;
}

export function CalendarHeader({
  currentDate,
  onPreviousView,
  onNextView,
  eventName,
  onEventNameChange,
  currentView,
  onViewChange,
  headerAction,
}: CalendarHeaderProps) {
  const formatDateRange = (date: Date, view: ViewType) => {
    if (view === 'day') {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      });
    } else if (view === 'week') {
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 6);
      
      const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
      const start = date.toLocaleDateString('en-US', options);
      const end = endDate.toLocaleDateString('en-US', options);
      const year = date.getFullYear();
      
      return `${start} - ${end}, ${year}`;
    } else if (view === 'month') {
      return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } else {
      return date.getFullYear().toString();
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <Calendar className="w-6 h-6 text-orange-600" />
          <input
            type="text"
            value={eventName}
            onChange={(e) => onEventNameChange(e.target.value)}
            className="border-none outline-none bg-transparent"
            placeholder="Event name"
          />
        </div>
        {headerAction}
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={onPreviousView}
              className="h-8 w-8"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={onNextView}
              className="h-8 w-8"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <span className="text-gray-700 min-w-[280px]">{formatDateRange(currentDate, currentView)}</span>
        </div>

        <div className="flex items-center gap-1 bg-gray-100 rounded-md p-1">
          {(['day', 'week', 'month', 'year'] as ViewType[]).map((view) => (
            <button
              key={view}
              onClick={() => onViewChange(view)}
              className={`px-4 py-1.5 rounded text-sm capitalize transition-colors ${
                currentView === view
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {view}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
