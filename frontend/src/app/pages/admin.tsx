import { useState } from "react";
import { AvailabilitySummary } from "../components/AvailabilitySummary";
import { CalendarHeader, ViewType } from "../components/CalendarHeader";
import { DayView } from "../components/DayView";
import { MonthView } from "../components/MonthView";
import { WeekView } from "../components/WeekView";
import { YearView } from "../components/YearView";

export default function App() {
  const [currentView, setCurrentView] = useState<ViewType>("week");
  const [currentDate, setCurrentDate] = useState(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
    return new Date(today.setDate(diff));
  });

  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());
  const [eventName, setEventName] = useState("Team Meeting Schedule");

  const handlePreviousView = () => {
    const newDate = new Date(currentDate);

    switch (currentView) {
      case "day":
        newDate.setDate(newDate.getDate() - 1);
        break;
      case "week":
        newDate.setDate(newDate.getDate() - 7);
        break;
      case "month":
        newDate.setMonth(newDate.getMonth() - 1);
        break;
      case "year":
        newDate.setFullYear(newDate.getFullYear() - 1);
        break;
    }

    setCurrentDate(newDate);
  };

  const handleNextView = () => {
    const newDate = new Date(currentDate);

    switch (currentView) {
      case "day":
        newDate.setDate(newDate.getDate() + 1);
        break;
      case "week":
        newDate.setDate(newDate.getDate() + 7);
        break;
      case "month":
        newDate.setMonth(newDate.getMonth() + 1);
        break;
      case "year":
        newDate.setFullYear(newDate.getFullYear() + 1);
        break;
    }

    setCurrentDate(newDate);
  };

  const handleSlotToggle = (slotKey: string) => {
    setSelectedSlots((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(slotKey)) {
        newSet.delete(slotKey);
      } else {
        newSet.add(slotKey);
      }
      return newSet;
    });
  };

  const handleViewChange = (view: ViewType) => {
    setCurrentView(view);
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
    <div className="size-full flex flex-col bg-gray-50">
      <CalendarHeader
        currentDate={currentDate}
        onPreviousView={handlePreviousView}
        onNextView={handleNextView}
        eventName={eventName}
        onEventNameChange={setEventName}
        currentView={currentView}
        onViewChange={handleViewChange}
      />

      <div className="flex flex-1 overflow-hidden">
        {renderCalendarView()}

        <AvailabilitySummary selectedSlots={selectedSlots} />
      </div>
    </div>
  );
}
