"use client";

import { useState } from "react";
import { Filter, X } from "lucide-react";
import { StudentMonthCalendar } from "@/components/student/StudentMonthCalendar";
import { StudentDayPanel } from "@/components/student/StudentDayPanel";

type Tutor = {
  id: string;
  name: string;
  avatar: string | null;
};

type StudentScheduleClientProps = {
  tutors: Tutor[];
  studentTimezone?: string;
};

export function StudentScheduleClient({ tutors, studentTimezone }: StudentScheduleClientProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [selectedTutorId, setSelectedTutorId] = useState<string | undefined>(undefined);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const resolvedTimezone =
    studentTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setIsPanelOpen(true);
  };

  const selectedTutor = tutors.find((t) => t.id === selectedTutorId);

  return (
    <div className="flex flex-col gap-6 px-4 sm:px-6 lg:px-8">
      {/* Centered Container */}
      <div className="w-full max-w-2xl mx-auto">
        {/* Tutor Filter (only show if multiple tutors) */}
        {tutors.length > 1 && (
          <div className="rounded-2xl border bg-background p-4 mb-6">
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

        {/* Month Calendar - Centered */}
        <StudentMonthCalendar
          selectedDate={selectedDate}
          onDateSelect={handleDateSelect}
          tutorId={selectedTutorId}
          studentTimezone={resolvedTimezone}
        />
      </div>

      {/* Day Panel - Slides in from right */}
      <StudentDayPanel
        date={selectedDate}
        tutorId={selectedTutorId}
        studentTimezone={resolvedTimezone}
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
      />
    </div>
  );
}
