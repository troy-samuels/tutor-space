"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AlertTriangle, MessageSquare, Calendar, ChevronRight } from "lucide-react";
import { RiskStatusBadge } from "../engagement/RiskStatusBadge";
import type { AtRiskStudent, RiskStatus } from "@/lib/actions/student-engagement";

type AtRiskStudentsWidgetProps = {
  students: AtRiskStudent[];
  className?: string;
};

export function AtRiskStudentsWidget({
  students,
  className,
}: AtRiskStudentsWidgetProps) {
  if (students.length === 0) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base font-medium">At-Risk Students</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="rounded-full bg-green-100 p-3 mb-3">
              <AlertTriangle className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-sm font-medium">All students are healthy!</p>
            <p className="text-xs text-muted-foreground mt-1">
              No students need immediate attention
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getActivityText = (student: AtRiskStudent) => {
    if (student.days_since_last_lesson !== null) {
      if (student.days_since_last_lesson === 0) {
        return "Had lesson today";
      }
      return `Last lesson ${student.days_since_last_lesson} days ago`;
    }
    if (student.last_activity_at) {
      return `Active ${formatDistanceToNow(new Date(student.last_activity_at), { addSuffix: true })}`;
    }
    return "No recent activity";
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            <CardTitle className="text-base font-medium">At-Risk Students</CardTitle>
          </div>
          <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
            {students.length}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {students.slice(0, 5).map((student) => (
          <div
            key={student.id}
            className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
          >
            <Avatar className="h-9 w-9">
              <AvatarFallback className="text-xs">
                {getInitials(student.full_name || student.email)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium truncate">
                  {student.full_name || student.email}
                </p>
                <RiskStatusBadge
                  status={student.risk_status as RiskStatus}
                  showLabel={false}
                  size="sm"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {getActivityText(student)}
              </p>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                asChild
              >
                <Link href={`/students/${student.id}?tab=messages`}>
                  <MessageSquare className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                asChild
              >
                <Link href={`/bookings/new?student=${student.id}`}>
                  <Calendar className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        ))}

        {students.length > 5 && (
          <Button variant="ghost" size="sm" className="w-full" asChild>
            <Link href="/students?risk=at_risk,critical">
              View all {students.length} at-risk students
              <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        )}

        {students.length <= 5 && students.length > 0 && (
          <Button variant="outline" size="sm" className="w-full" asChild>
            <Link href="/students?risk=at_risk,critical">
              View all students
              <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
