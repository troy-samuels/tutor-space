import { redirect } from "next/navigation";

export const metadata = {
  title: "Practice | TutorLingua",
  description: "Launch the TutorLingua practice experience.",
};

export default function PracticeEntryPage() {
  redirect("/student/practice");
}
