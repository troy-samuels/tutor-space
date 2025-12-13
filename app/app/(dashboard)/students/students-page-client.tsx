"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AddStudentsPanel } from "@/components/students/add-students-panel";
import { InviteLinkManager } from "@/components/students/InviteLinkManager";
import { Users, Link as LinkIcon } from "lucide-react";

type Student = {
  id: string;
  fullName: string;
  email: string;
  status?: string;
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

export function StudentsPageClient({
  initialStudents,
  initialInviteLinks = [],
  services = [],
}: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"students" | "invites">("students");

  const handleStudentAdded = () => {
    router.refresh();
  };

  const handleInviteLinkChange = () => {
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-foreground">Students</h1>
        <p className="text-sm text-muted-foreground">
          Manage your students and create invite links.
        </p>
      </header>

      {/* Tabs */}
      <div className="border-b border-border">
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
              {initialStudents.length}
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
      </div>

      {/* Tab Content */}
      {activeTab === "students" && (
        <AddStudentsPanel students={initialStudents} onStudentAdded={handleStudentAdded} />
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
