import { redirect } from "next/navigation";

export const metadata = {
  title: "Practice | Student Portal",
  description: "Access conversation practice assignments",
};

export default function PracticePage() {
  redirect("/student/progress");
}
