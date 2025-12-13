"use client";

import Link from "next/link";
import { Mail, Phone, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

type StudentProfileCardProps = {
  student: {
    id: string;
    full_name: string | null;
    email: string;
    phone: string | null;
    proficiency_level: string | null;
    status: string | null;
  };
};

// Helper to capitalize and format level/status text
function formatLabel(text: string | null): string {
  if (!text) return "";
  return text
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export function StudentProfileCard({ student }: StudentProfileCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-xl font-semibold text-primary">
          {student.full_name?.charAt(0)?.toUpperCase() || "S"}
        </div>

        {/* Name and badges */}
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-foreground">
            {student.full_name || "Unnamed Student"}
          </h2>
          <div className="flex items-center gap-2 mt-1.5">
            {student.proficiency_level && (
              <span className="text-xs text-muted-foreground">
                {formatLabel(student.proficiency_level)}
              </span>
            )}
            {student.proficiency_level && student.status && (
              <span className="text-muted-foreground/40">·</span>
            )}
            <span className="text-xs text-muted-foreground">
              {formatLabel(student.status) || "Active"}
            </span>
          </div>
        </div>
      </div>

      {/* Contact action icons */}
      <div className="flex items-center gap-2 mt-6 pt-4 border-t border-border/60">
        <Button variant="outline" size="icon" className="h-10 w-10 rounded-full" asChild title={`Email ${student.email}`}>
          <a href={`mailto:${student.email}`} aria-label={`Email ${student.email}`}>
            <Mail className="h-4 w-4" />
          </a>
        </Button>

        {student.phone && (
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-full"
            asChild
            title={`Call ${student.phone}`}
          >
            <a href={`tel:${student.phone}`} aria-label={`Call ${student.phone}`}>
              <Phone className="h-4 w-4" />
            </a>
          </Button>
        )}

        <Button variant="outline" size="icon" className="h-10 w-10 rounded-full" asChild title="Send message">
          <Link href={`/messages?student=${student.id}`} aria-label="Send message">
            <MessageSquare className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
