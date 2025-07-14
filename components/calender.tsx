"use client";

import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CalendarIcon,
  Bell,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface CalendarEvent {
  id: string;
  date: string; // YYYY-MM-DD format
  title: string;
  description?: string;
  type: "event" | "notification";
  time?: string;
}

interface CalendarProps {
  events?: CalendarEvent[];
  onDateClick?: (date: string) => void;
  onEventClick?: (event: CalendarEvent) => void;
}

export default function Calendar({
  events = [],
  onDateClick,
  onEventClick,
}: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const today = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Get first day of month and number of days
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
  const firstDayWeekday = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  // Generate calendar days
  const calendarDays = [];

  // Add empty cells for days before month starts
  for (let i = 0; i < firstDayWeekday; i++) {
    calendarDays.push(null);
  }

  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const formatDate = (day: number) => {
    return `${currentYear}-${String(currentMonth + 1).padStart(
      2,
      "0"
    )}-${String(day).padStart(2, "0")}`;
  };

  const getEventsForDate = (day: number) => {
    const dateStr = formatDate(day);
    return events.filter(event => event.date === dateStr);
  };

  const isToday = (day: number) => {
    return (
      today.getDate() === day &&
      today.getMonth() === currentMonth &&
      today.getFullYear() === currentYear
    );
  };

  const isPastDate = (day: number) => {
    const date = new Date(currentYear, currentMonth, day);
    return date < today;
  };

  const handleDateClick = (day: number) => {
    const dateStr = formatDate(day);
    setSelectedDate(dateStr);
    onDateClick?.(dateStr);
  };

  const selectedDateEvents = selectedDate
    ? events.filter(event => event.date === selectedDate)
    : [];

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4 px-2 sm:px-4">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="text-base sm:text-xl">
              {monthNames[currentMonth]} {currentYear}
            </span>
          </CardTitle>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth("prev")}
              className="h-8 w-8 sm:h-9 sm:w-auto sm:px-3"
            >
              <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline ml-1">Prev</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth("next")}
              className="h-8 w-8 sm:h-9 sm:w-auto sm:px-3"
            >
              <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline ml-1">Next</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Week days header */}
          <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-2">
            {weekDays.map(day => (
              <div
                key={day}
                className="p-1 sm:p-2 text-center text-xs sm:text-sm font-medium text-muted-foreground"
              >
                <span className="hidden sm:inline">{day}</span>
                <span className="sm:hidden">{day.slice(0, 1)}</span>
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
            {calendarDays.map((day, index) => {
              if (day === null) {
                return <div key={index} className="p-1 sm:p-2 h-12 sm:h-16" />;
              }

              const dayEvents = getEventsForDate(day);
              const hasEvents = dayEvents.length > 0;
              const hasNotifications = dayEvents.some(
                event => event.type === "notification"
              );
              const hasPastEvents = dayEvents.some(
                event => event.type === "event"
              );

              return (
                <div
                  key={day}
                  className={`
          p-0.5 sm:p-1 h-12 sm:h-16 border rounded-md sm:rounded-lg cursor-pointer transition-colors relative
          ${
            isToday(day)
              ? "bg-primary text-primary-foreground"
              : "hover:bg-muted"
          }
          ${
            selectedDate === formatDate(day)
              ? "ring-1 sm:ring-2 ring-primary"
              : ""
          }
          ${isPastDate(day) ? "text-muted-foreground" : ""}
        `}
                  onClick={() => handleDateClick(day)}
                >
                  <div className="text-xs sm:text-sm font-medium">{day}</div>

                  {/* Event indicators */}
                  <div className="flex flex-wrap gap-0.5 sm:gap-1 mt-0.5 sm:mt-1">
                    {hasNotifications && (
                      <div
                        className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full"
                        title="Notification"
                      />
                    )}
                    {hasPastEvents && (
                      <div
                        className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full"
                        title="Event"
                      />
                    )}
                  </div>

                  {/* Event count */}
                  {hasEvents && (
                    <div className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1">
                      <Badge
                        variant="secondary"
                        className="text-xs px-1 py-0 h-3 sm:h-4 min-w-[12px] sm:min-w-[16px] text-center"
                      >
                        {dayEvents.length}
                      </Badge>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Selected date events */}
      {selectedDate && selectedDateEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-sm sm:text-base">
                Events for{" "}
                <span className="block sm:inline">
                  {new Date(selectedDate).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Past Events */}
              {selectedDateEvents.filter(event => event.type === "event")
                .length > 0 && (
                <div>
                  <h4 className="font-semibold text-green-700 mb-3 flex items-center gap-2 text-sm sm:text-base">
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                    Past Events
                  </h4>
                  <ul className="space-y-2 ml-4 sm:ml-6">
                    {selectedDateEvents
                      .filter(event => event.type === "event")
                      .map(event => (
                        <li
                          key={event.id}
                          className="flex items-start gap-2 sm:gap-3"
                        >
                          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full mt-1.5 sm:mt-2 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start sm:items-center gap-2 flex-col sm:flex-row">
                              <span className="font-medium text-sm sm:text-base break-words">
                                {event.title}
                              </span>
                              {event.time && (
                                <Badge
                                  variant="outline"
                                  className="text-xs self-start"
                                >
                                  {event.time}
                                </Badge>
                              )}
                            </div>
                            {event.description && (
                              <p className="text-xs sm:text-sm text-muted-foreground mt-1 break-words">
                                {event.description}
                              </p>
                            )}
                          </div>
                        </li>
                      ))}
                  </ul>
                </div>
              )}

              {/* Future Notifications */}
              {selectedDateEvents.filter(event => event.type === "notification")
                .length > 0 && (
                <div>
                  <h4 className="font-semibold text-blue-700 mb-3 flex items-center gap-2 text-sm sm:text-base">
                    <Bell className="h-3 w-3 sm:h-4 sm:w-4" />
                    Upcoming Notifications
                  </h4>
                  <ul className="space-y-2 ml-4 sm:ml-6">
                    {selectedDateEvents
                      .filter(event => event.type === "notification")
                      .map(event => (
                        <li
                          key={event.id}
                          className="flex items-start gap-2 sm:gap-3"
                        >
                          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full mt-1.5 sm:mt-2 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start sm:items-center gap-2 flex-col sm:flex-row">
                              <span className="font-medium text-sm sm:text-base break-words">
                                {event.title}
                              </span>
                              {event.time && (
                                <Badge
                                  variant="outline"
                                  className="text-xs self-start"
                                >
                                  {event.time}
                                </Badge>
                              )}
                            </div>
                            {event.description && (
                              <p className="text-xs sm:text-sm text-muted-foreground mt-1 break-words">
                                {event.description}
                              </p>
                            )}
                          </div>
                        </li>
                      ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state for selected date with no events */}
      {selectedDate && selectedDateEvents.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-sm sm:text-base">
                <span className="block sm:inline">
                  {new Date(selectedDate).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6 sm:py-8 text-muted-foreground">
              <CalendarIcon className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-50" />
              <p className="text-sm sm:text-base">
                No events or notifications for this date
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      <Card>
        <CardContent className="pt-4 sm:pt-6">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 rounded-full" />
              <span>Past Events</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-blue-500 rounded-full" />
              <span>Future Notifications</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-primary rounded-full" />
              <span>Today</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
