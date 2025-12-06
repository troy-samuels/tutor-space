import { addDays, format } from "date-fns";

export type DemoStudent = {
  id: string;
  name: string;
  initials: string;
  // Enhanced fields for student detail overlay
  unreadMessages: number;
  lastMessagePreview?: string;
  lessonsCompleted: number;
  memberSince: string;
  status: "active" | "trial";
  language: string;
};

export type DemoBooking = {
  id: string;
  date: string; // "2025-11-27"
  time: string; // "9:00 AM"
  duration: number; // minutes
  student: DemoStudent;
  service: string;
  status: "confirmed" | "pending" | "completed";
  paymentStatus: "paid" | "unpaid";
};

// Demo students with enhanced profile data
export const DEMO_STUDENTS: DemoStudent[] = [
  {
    id: "1",
    name: "Maria Garcia",
    initials: "MG",
    unreadMessages: 2,
    lastMessagePreview: "Thanks for the homework tips!",
    lessonsCompleted: 12,
    memberSince: "October 2024",
    status: "active",
    language: "Spanish",
  },
  {
    id: "2",
    name: "Thomas Klein",
    initials: "TK",
    unreadMessages: 0,
    lessonsCompleted: 8,
    memberSince: "November 2024",
    status: "active",
    language: "German",
  },
  {
    id: "3",
    name: "Sophie Laurent",
    initials: "SL",
    unreadMessages: 1,
    lastMessagePreview: "Can we move Friday's lesson?",
    lessonsCompleted: 5,
    memberSince: "November 2024",
    status: "trial",
    language: "French",
  },
  {
    id: "4",
    name: "James Wilson",
    initials: "JW",
    unreadMessages: 0,
    lessonsCompleted: 15,
    memberSince: "September 2024",
    status: "active",
    language: "English",
  },
  {
    id: "5",
    name: "Yuki Tanaka",
    initials: "YT",
    unreadMessages: 3,
    lastMessagePreview: "Looking forward to tomorrow!",
    lessonsCompleted: 6,
    memberSince: "October 2024",
    status: "active",
    language: "Japanese",
  },
];

// Helper to create date strings relative to today
function getDateString(daysFromToday: number): string {
  return format(addDays(new Date(), daysFromToday), "yyyy-MM-dd");
}

// Generate bookings spread across the current period
export function generateDemoBookings(): DemoBooking[] {
  const bookings: DemoBooking[] = [];

  // Today - 3 bookings
  bookings.push(
    {
      id: "1",
      date: getDateString(0),
      time: "9:00 AM",
      duration: 60,
      student: DEMO_STUDENTS[0],
      service: "Spanish Conversation",
      status: "confirmed",
      paymentStatus: "paid",
    },
    {
      id: "2",
      date: getDateString(0),
      time: "11:30 AM",
      duration: 45,
      student: DEMO_STUDENTS[1],
      service: "German Grammar",
      status: "confirmed",
      paymentStatus: "paid",
    },
    {
      id: "3",
      date: getDateString(0),
      time: "3:00 PM",
      duration: 60,
      student: DEMO_STUDENTS[2],
      service: "French Pronunciation",
      status: "pending",
      paymentStatus: "unpaid",
    }
  );

  // Tomorrow - 2 bookings
  bookings.push(
    {
      id: "4",
      date: getDateString(1),
      time: "10:00 AM",
      duration: 60,
      student: DEMO_STUDENTS[3],
      service: "English Business",
      status: "confirmed",
      paymentStatus: "paid",
    },
    {
      id: "5",
      date: getDateString(1),
      time: "2:00 PM",
      duration: 45,
      student: DEMO_STUDENTS[4],
      service: "Japanese Basics",
      status: "confirmed",
      paymentStatus: "paid",
    }
  );

  // Day after tomorrow - 1 booking
  bookings.push({
    id: "6",
    date: getDateString(2),
    time: "4:00 PM",
    duration: 60,
    student: DEMO_STUDENTS[0],
    service: "Spanish Conversation",
    status: "pending",
    paymentStatus: "unpaid",
  });

  // +4 days - 4 bookings (busy day showcase)
  bookings.push(
    {
      id: "7",
      date: getDateString(4),
      time: "9:00 AM",
      duration: 60,
      student: DEMO_STUDENTS[1],
      service: "German Conversation",
      status: "confirmed",
      paymentStatus: "paid",
    },
    {
      id: "8",
      date: getDateString(4),
      time: "10:30 AM",
      duration: 45,
      student: DEMO_STUDENTS[2],
      service: "French Grammar",
      status: "confirmed",
      paymentStatus: "paid",
    },
    {
      id: "9",
      date: getDateString(4),
      time: "2:00 PM",
      duration: 60,
      student: DEMO_STUDENTS[3],
      service: "English Conversation",
      status: "confirmed",
      paymentStatus: "paid",
    },
    {
      id: "10",
      date: getDateString(4),
      time: "5:00 PM",
      duration: 45,
      student: DEMO_STUDENTS[4],
      service: "Japanese Intermediate",
      status: "pending",
      paymentStatus: "unpaid",
    }
  );

  // +6 days - 2 bookings
  bookings.push(
    {
      id: "11",
      date: getDateString(6),
      time: "11:00 AM",
      duration: 60,
      student: DEMO_STUDENTS[0],
      service: "Spanish Grammar",
      status: "confirmed",
      paymentStatus: "paid",
    },
    {
      id: "12",
      date: getDateString(6),
      time: "3:30 PM",
      duration: 45,
      student: DEMO_STUDENTS[1],
      service: "German Conversation",
      status: "confirmed",
      paymentStatus: "paid",
    }
  );

  // +8 days - 3 bookings
  bookings.push(
    {
      id: "13",
      date: getDateString(8),
      time: "9:30 AM",
      duration: 60,
      student: DEMO_STUDENTS[2],
      service: "French Conversation",
      status: "confirmed",
      paymentStatus: "paid",
    },
    {
      id: "14",
      date: getDateString(8),
      time: "1:00 PM",
      duration: 45,
      student: DEMO_STUDENTS[3],
      service: "English Grammar",
      status: "pending",
      paymentStatus: "unpaid",
    },
    {
      id: "15",
      date: getDateString(8),
      time: "4:30 PM",
      duration: 60,
      student: DEMO_STUDENTS[4],
      service: "Japanese Advanced",
      status: "confirmed",
      paymentStatus: "paid",
    }
  );

  return bookings;
}

// Get bookings for a specific date
export function getBookingsForDate(
  date: Date,
  bookings: DemoBooking[]
): DemoBooking[] {
  const dateString = format(date, "yyyy-MM-dd");
  return bookings
    .filter((b) => b.date === dateString)
    .sort((a, b) => {
      // Sort by time
      const timeA = parseTimeToMinutes(a.time);
      const timeB = parseTimeToMinutes(b.time);
      return timeA - timeB;
    });
}

// Get booking count for a specific date
export function getBookingCountForDate(
  date: Date,
  bookings: DemoBooking[]
): number {
  const dateString = format(date, "yyyy-MM-dd");
  return bookings.filter((b) => b.date === dateString).length;
}

// Helper to parse time string to minutes for sorting
function parseTimeToMinutes(time: string): number {
  const match = time.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return 0;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3].toUpperCase();
  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;
  return hours * 60 + minutes;
}
