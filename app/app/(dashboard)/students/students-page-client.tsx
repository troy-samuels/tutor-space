"use client";

import { useRouter } from "next/navigation";
import { AddStudentsPanel } from "@/components/students/add-students-panel";

type Student = {
  id: string;
  fullName: string;
  email: string;
  status?: string;
};

type Props = {
  initialStudents: Student[];
};

export function StudentsPageClient({ initialStudents }: Props) {
  const router = useRouter();

  const handleStudentAdded = () => {
    // Refresh the page to get updated student list
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-foreground">Students</h1>
        <p className="text-sm text-muted-foreground">
          Add and manage your student roster.
        </p>
      </header>

      <AddStudentsPanel students={initialStudents} onStudentAdded={handleStudentAdded} />
    </div>
  );
}
