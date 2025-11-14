import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AddStudentsPanel } from "@/components/students/add-students-panel";
import { Button } from "@/components/ui/button";

export default async function ImportStudentsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/students/import");
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-primary/70">Students</p>
          <h1 className="text-3xl font-semibold text-foreground">Add students</h1>
          <p className="text-sm text-muted-foreground">
            Import a CSV for fast migrations or add individuals manually. We’ll safely merge any
            duplicates based on email.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/students">Back to students</Link>
        </Button>
      </header>

      <AddStudentsPanel />
    </div>
  );
}
