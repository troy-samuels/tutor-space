import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getStudentDetailData } from "@/lib/data/student-detail";
import { StudentDetailView } from "@/components/students/StudentDetailView";

type StudentDetailPageProps = {
  params: Promise<{
    studentId: string;
  }>;
};

export default async function StudentDetailPage({ params }: StudentDetailPageProps) {
  const { studentId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const detail = await getStudentDetailData(studentId);
  if (!detail) {
    notFound();
  }

  return (
    <StudentDetailView studentId={studentId} initialData={detail} />
  );
}
