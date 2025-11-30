"use client";

import { useState, useEffect } from "react";
import { StudentListRow, type StudentListRowData } from "./student-list-row";
import { Users, Plus, Search } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// Fake student data for testing
const FAKE_STUDENTS: StudentListRowData[] = [
  {
    id: "1",
    fullName: "Emma Thompson",
    email: "emma.thompson@example.com",
    proficiencyLevel: "B2",
    nextLesson: {
      date: "Today",
      time: "2:00 PM",
      serviceName: "Conversational Spanish"
    },
    remainingLessonsCount: 3,
    unreadMessagesCount: 2,
    outstandingBalance: {
      amount: 0,
      currency: "USD"
    },
    lastNoteDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
  },
  {
    id: "2",
    fullName: "Michael Chen",
    email: "m.chen@example.com",
    proficiencyLevel: "A2",
    nextLesson: {
      date: "Tomorrow",
      time: "10:00 AM",
      serviceName: "Business English"
    },
    remainingLessonsCount: 8,
    unreadMessagesCount: 0,
    outstandingBalance: {
      amount: 12000, // $120.00
      currency: "USD"
    },
    lastNoteDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
  },
  {
    id: "3",
    fullName: "Sarah Martinez",
    email: "sarah.m@example.com",
    proficiencyLevel: "C1",
    nextLesson: undefined,
    remainingLessonsCount: 0,
    unreadMessagesCount: 5,
    outstandingBalance: {
      amount: 24000, // $240.00
      currency: "USD"
    },
    lastNoteDate: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(), // 21 days ago (stale)
  },
  {
    id: "4",
    fullName: "James Wilson",
    email: "jwilson@example.com",
    proficiencyLevel: "B1",
    nextLesson: undefined,
    remainingLessonsCount: 0,
    unreadMessagesCount: 1,
    outstandingBalance: {
      amount: 0,
      currency: "USD"
    },
    lastNoteDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
  },
  {
    id: "5",
    fullName: "Priya Patel",
    email: "priya.patel@example.com",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Priya",
    proficiencyLevel: "B2",
    nextLesson: {
      date: "Friday",
      time: "4:00 PM",
      serviceName: "IELTS Preparation"
    },
    remainingLessonsCount: 15,
    unreadMessagesCount: 0,
    outstandingBalance: {
      amount: 0,
      currency: "USD"
    },
    lastNoteDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // Yesterday
  },
  {
    id: "6",
    fullName: "Robert Johnson",
    email: "r.johnson@example.com",
    proficiencyLevel: "C2",
    nextLesson: undefined,
    remainingLessonsCount: 0,
    unreadMessagesCount: 0,
    outstandingBalance: {
      amount: 0,
      currency: "USD"
    },
    lastNoteDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days ago
  }
];

export function StudentList() {
  const [students, setStudents] = useState<StudentListRowData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Simulate data fetching
  useEffect(() => {
    const timer = setTimeout(() => {
      setStudents(FAKE_STUDENTS);
      setLoading(false);
    }, 500); // Simulate network delay

    return () => clearTimeout(timer);
  }, []);

  const filteredStudents = students.filter(student => 
    student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Students</h2>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-muted/50" />
          ))}
        </div>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Students</h2>
        </div>
        <div className="rounded-2xl border border-dashed border-muted-foreground/30 bg-muted/20 p-8">
          <div className="flex flex-col items-center text-center space-y-4">
            <Users className="h-12 w-12 text-muted-foreground/50" />
            <div>
              <h3 className="font-semibold text-foreground">No students yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Import your roster or invite a learner from your booking link
              </p>
            </div>
            <div className="flex gap-3">
              <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Link href="/students/import">
                  <Plus className="mr-2 h-4 w-4" />
                  Add students
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/bookings/new">Invite a learner</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Students</h2>
          <p className="text-sm text-muted-foreground">
            Quick overview of all your students
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 w-full sm:w-64 rounded-lg border border-input bg-background text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <Button asChild size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Link href="/students">
              View all
            </Link>
          </Button>
        </div>
      </div>

      <div className="space-y-1.5">
        {/* Header Row */}
        <div className="flex items-center gap-3 px-4 py-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
          <div className="w-8"></div>
          <div className="flex-1">Student</div>
          <div className="text-right">Next Lesson</div>
          <div className="w-[120px] text-right">Actions</div>
        </div>
        
        {/* Student Rows */}
        <div className="space-y-2">
          {filteredStudents.map((student) => (
            <StudentListRow key={student.id} student={student} />
          ))}
        </div>
      </div>

      {filteredStudents.length === 0 && searchTerm && (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">
            No students found matching "{searchTerm}"
          </p>
        </div>
      )}
    </div>
  );
}
