"use client";

import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AddStudentsPanel } from "@/components/students/add-students-panel";
import { InviteLinkManager } from "@/components/students/InviteLinkManager";
import { Users, Link as LinkIcon, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Student = {
  id: string;
  fullName: string;
  email: string;
  status?: string;
  onboardingStatus?: string;
  engagementScore?: number;
};

type InviteLink = {
  id: string;
  token: string;
  name: string;
  expiresAt: string;
  isActive: boolean;
  serviceIds: string[];
  usageCount: number;
  createdAt: string;
  services: Array<{ id: string; name: string }>;
};

type Service = {
  id: string;
  name: string;
};

type Props = {
  initialStudents: Student[];
  initialInviteLinks?: InviteLink[];
  services?: Service[];
};

const ONBOARDING_OPTIONS = [
  { value: "not_started", label: "Not Started" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
];

export function StudentsPageClient({
  initialStudents,
  initialInviteLinks = [],
  services = [],
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<"students" | "invites">("students");

  // Initialize filters from URL params
  const initialOnboardingFilter = searchParams.get("onboarding")?.split(",").filter(Boolean) ?? [];

  const [onboardingFilters, setOnboardingFilters] = useState<string[]>(initialOnboardingFilter);

  const handleStudentAdded = () => {
    router.refresh();
  };

  const handleInviteLinkChange = () => {
    router.refresh();
  };

  const toggleOnboardingFilter = (value: string) => {
    setOnboardingFilters((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const clearFilters = () => {
    setOnboardingFilters([]);
  };

  // Filter students based on selected filters
  const filteredStudents = useMemo(() => {
    return initialStudents.filter((student) => {
      const onboardingMatch =
        onboardingFilters.length === 0 ||
        onboardingFilters.includes(student.onboardingStatus ?? "not_started");
      return onboardingMatch;
    });
  }, [initialStudents, onboardingFilters]);

  const hasActiveFilters = onboardingFilters.length > 0;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Students</h1>
          <p className="text-sm text-muted-foreground">
            Manage your students and create invite links.
          </p>
        </div>
      </header>

      {/* Tabs and Filters */}
      <div className="border-b border-border">
        <div className="flex items-center justify-between gap-4">
          <nav className="-mb-px flex gap-6">
            <button
              onClick={() => setActiveTab("students")}
              className={`flex items-center gap-2 py-3 px-1 border-b-2 text-sm font-medium transition-colors ${
                activeTab === "students"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              }`}
            >
              <Users className="h-4 w-4" />
              Students
              <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-muted">
                {hasActiveFilters ? `${filteredStudents.length}/${initialStudents.length}` : initialStudents.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("invites")}
              className={`flex items-center gap-2 py-3 px-1 border-b-2 text-sm font-medium transition-colors ${
                activeTab === "invites"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              }`}
            >
              <LinkIcon className="h-4 w-4" />
              Invite Links
              <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-muted">
                {initialInviteLinks.length}
              </span>
            </button>
          </nav>

          {activeTab === "students" && (
            <div className="flex items-center gap-2 pb-3">
              {/* Onboarding Status Filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={onboardingFilters.length > 0 ? "border-primary text-primary" : ""}
                  >
                    <Filter className="h-3.5 w-3.5 mr-1.5" />
                    Onboarding
                    {onboardingFilters.length > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-primary text-primary-foreground">
                        {onboardingFilters.length}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuLabel>Onboarding Status</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {ONBOARDING_OPTIONS.map((option) => (
                    <DropdownMenuCheckboxItem
                      key={option.value}
                      checked={onboardingFilters.includes(option.value)}
                      onCheckedChange={() => toggleOnboardingFilter(option.value)}
                    >
                      {option.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-3.5 w-3.5 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "students" && (
        <AddStudentsPanel students={filteredStudents} onStudentAdded={handleStudentAdded} />
      )}

      {activeTab === "invites" && (
        <InviteLinkManager
          inviteLinks={initialInviteLinks}
          services={services}
          onLinkChange={handleInviteLinkChange}
        />
      )}
    </div>
  );
}
