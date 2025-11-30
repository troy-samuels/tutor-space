import { redirect } from "next/navigation";

// Redirect to main students page which now has inline add functionality
export default function ImportStudentsPage() {
  redirect("/students");
}
