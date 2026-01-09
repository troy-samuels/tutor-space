"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Filter, X } from "lucide-react";
import { StudentMonthCalendar } from "@/components/student/StudentMonthCalendar";
import { StudentDayView } from "@/components/student/StudentDayView";

type Tutor = {
  id: string;
  name: string;
  avatar: string | null;
};

type StudentScheduleClientProps = {
  tutors: Tutor[];
};

export function StudentScheduleClient({ tutors }: StudentScheduleClientProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [selectedTutorId, setSelectedTutorId] = useState<string | undefined>(undefined);
  const [showMobileDayView, setShowMobileDayView] = useState(false);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    // On mobile, show the day view when a date is selected
    setShowMobileDayView(true);
  };

  const selectedTutor = tutors.find((t) => t.id === selectedTutorId);

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full min-h-0">
      {/* Left Column: Calendar + Filter */}
      <div className="flex-1 flex flex-col gap-4 min-h-0 lg:max-w-md">
        {/* Tutor Filter (only show if multiple tutors) */}
        {tutors.length > 1 && (
          <div className="rounded-2xl border bg-background p-4">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filter by Tutor</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedTutorId(undefined)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                  !selectedTutorId
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                All Tutors
              </button>
              {tutors.map((tutor) => (
                <button
                  key={tutor.id}
                  onClick={() => setSelectedTutorId(tutor.id)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                    selectedTutorId === tutor.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {tutor.name}
                </button>
              ))}
            </div>
            {selectedTutor && (
              <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                <span>Showing lessons with {selectedTutor.name}</span>
                <button
                  onClick={() => setSelectedTutorId(undefined)}
                  className="p-0.5 rounded hover:bg-muted"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Month Calendar */}
        <div className="flex-1 min-h-[400px]">
          <StudentMonthCalendar
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            tutorId={selectedTutorId}
          />
        </div>
      </div>

      {/* Right Column: Day View (Desktop) */}
      <div className="hidden lg:flex lg:flex-1 lg:min-h-0">
        <div className="flex-1 rounded-3xl border bg-background shadow-sm overflow-hidden">
          <StudentDayView
            date={selectedDate}
            tutorId={selectedTutorId}
          />
        </div>
      </div>

      {/* Mobile Day View Overlay */}
      {showMobileDayView && selectedDate && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowMobileDayView(false)}
          />
          {/* Panel */}
          <div className="absolute bottom-0 left-0 right-0 max-h-[80vh] rounded-t-3xl bg-background shadow-2xl overflow-hidden flex flex-col">
            {/* Drag Handle */}
            <div className="flex justify-center py-2">
              <div className="w-12 h-1 rounded-full bg-muted-foreground/30" />
            </div>
            {/* Header */}
            <div className="flex items-center justify-between px-4 pb-2">
              <h3 className="font-semibold">
                {format(selectedDate, "EEEE, MMMM d")}
              </h3>
              <button
                onClick={() => setShowMobileDayView(false)}
                className="p-2 rounded-full hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {/* Day View Content */}
            <div className="flex-1 overflow-hidden">
              <StudentDayView
                date={selectedDate}
                tutorId={selectedTutorId}
                onClose={() => setShowMobileDayView(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
