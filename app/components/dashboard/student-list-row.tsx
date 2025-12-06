"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Calendar,
  MessageSquare,
  Wallet,
  FileText,
  AlertCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export type StudentListRowData = {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  proficiencyLevel?: string;
  nextLesson?: {
    date: string;
    time: string;
    serviceName: string;
  };
  remainingLessonsCount: number; // From package purchases
  unreadMessagesCount: number;
  outstandingBalance: {
    amount: number;
    currency: string;
  };
  lastNoteDate?: string;
};


export function StudentListRow({ student }: { student: StudentListRowData }) {
  const initials = student.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const hasOutstandingBalance = student.outstandingBalance.amount > 0;
  const isNotesStale = student.lastNoteDate 
    ? new Date(student.lastNoteDate) < new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) // 14 days
    : true;

  return (
    <div className="group flex items-center gap-3 rounded-xl border border-border bg-white/90 px-4 py-2.5 shadow-sm transition-all hover:shadow-md hover:border-primary/30">
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        {student.avatarUrl ? (
          <Image
            src={student.avatarUrl}
            alt={student.fullName}
            width={32}
            height={32}
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-[10px] font-medium text-gray-600">
            {initials}
          </div>
        )}
      </div>

      {/* Student Info - Single line */}
      <div className="min-w-0 flex-1">
        <Link
          href={`/students/${student.id}`}
          className="flex items-center gap-2 text-xs hover:text-foreground"
        >
          <span className="font-medium text-foreground truncate hover:underline">
            {student.fullName}
          </span>
          <span className="text-muted-foreground truncate hidden sm:inline">
            {student.email}
          </span>
        </Link>
      </div>

      {/* Next Lesson Status - Single line */}
      <div className="text-right flex-shrink-0">
        {student.nextLesson ? (
          <p className="text-xs text-foreground">
            <span className="font-medium">{student.nextLesson.date}</span>
            <span className="text-muted-foreground"> · {student.nextLesson.time}</span>
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">No lesson</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5">
        {/* Remaining Lessons */}
        <div className="relative group/icon">
          <Link
            href={`/students/${student.id}`}
            className="relative flex h-7 w-7 items-center justify-center rounded-md bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <Calendar className="h-4 w-4 text-gray-600" />
            {student.remainingLessonsCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-red text-[10px] font-bold text-white">
                {student.remainingLessonsCount}
              </span>
            )}
          </Link>
          {/* Tooltip */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/icon:block z-10">
            <div className="rounded-lg bg-gray-900 px-2.5 py-1.5 text-[11px] text-white shadow-lg whitespace-nowrap">
              <p>Remaining lessons: {student.remainingLessonsCount}</p>
              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 h-0 w-0 border-4 border-transparent border-t-gray-900" />
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="relative group/icon">
          <Link
            href="/messages"
            className="relative flex h-7 w-7 items-center justify-center rounded-md bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <MessageSquare className="h-4 w-4 text-gray-600" />
            {student.unreadMessagesCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-red text-[10px] font-bold text-white">
                {student.unreadMessagesCount}
              </span>
            )}
          </Link>
          {/* Tooltip */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/icon:block z-10">
            <div className="rounded-lg bg-gray-900 px-2.5 py-1.5 text-[11px] text-white shadow-lg">
              {student.unreadMessagesCount > 0
                ? `${student.unreadMessagesCount} unread`
                : "No new messages"}
              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 h-0 w-0 border-4 border-transparent border-t-gray-900" />
            </div>
          </div>
        </div>

        {/* Payment Status */}
        <div className="relative group/icon">
          <div className="relative flex h-7 w-7 items-center justify-center rounded-md bg-gray-50 hover:bg-gray-100 transition-colors">
            <Wallet className="h-4 w-4 text-gray-600" />
            {hasOutstandingBalance && (
              <AlertCircle className="absolute -top-1 -right-1 h-3 w-3 text-brand-red" />
            )}
          </div>
          {/* Tooltip */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/icon:block z-10">
            <div className="rounded-lg bg-gray-900 px-2.5 py-1.5 text-[11px] text-white shadow-lg">
              {hasOutstandingBalance
                ? `${student.outstandingBalance.currency} ${(student.outstandingBalance.amount / 100).toFixed(2)} owed`
                : "Paid"}
              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 h-0 w-0 border-4 border-transparent border-t-gray-900" />
            </div>
          </div>
        </div>

        {/* Lesson Notes */}
        <div className="relative group/icon">
          <Link
            href={`/students/${student.id}#notes`}
            className="relative flex h-7 w-7 items-center justify-center rounded-md bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <FileText className="h-4 w-4 text-gray-600" />
            {isNotesStale && (
              <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-brand-red" />
            )}
          </Link>
          {/* Tooltip */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/icon:block z-10">
            <div className="rounded-lg bg-gray-900 px-2.5 py-1.5 text-[11px] text-white shadow-lg whitespace-nowrap">
              {student.lastNoteDate ? (
                <>
                  <p>Last note: {formatDistanceToNow(new Date(student.lastNoteDate), { addSuffix: true })}</p>
                  {isNotesStale && <p className="text-orange-300 text-[10px]">Add recent notes</p>}
                </>
              ) : (
                <p>No notes yet</p>
              )}
              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 h-0 w-0 border-4 border-transparent border-t-gray-900" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
