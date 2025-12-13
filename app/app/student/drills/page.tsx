import { redirect } from "next/navigation";

export const metadata = {
  title: "Homework | Student Portal",
  description: "View your homework and linked practice.",
};

export default function DrillsRedirectPage() {
  redirect("/student/homework");
}
