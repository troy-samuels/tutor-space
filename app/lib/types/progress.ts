// Progress types and constants - separated from server actions for Next.js compatibility
// "use server" files can only export async functions, so constants must live here

export type HomeworkStatus = "draft" | "assigned" | "in_progress" | "submitted" | "completed" | "cancelled";

export const HOMEWORK_STATUSES: HomeworkStatus[] = [
  "draft",
  "assigned",
  "in_progress",
  "submitted",
  "completed",
  "cancelled",
];
