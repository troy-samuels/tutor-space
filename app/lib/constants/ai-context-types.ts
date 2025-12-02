// Context types with descriptions for AI assistant UI
export const CONTEXT_TYPES = [
  { value: "general", label: "General", description: "General questions and assistance" },
  { value: "lesson_prep", label: "Lesson Prep", description: "Help preparing lesson plans and materials" },
  { value: "student_feedback", label: "Student Feedback", description: "Help writing student feedback and progress reports" },
  { value: "content_creation", label: "Content Creation", description: "Create exercises, quizzes, and learning materials" },
  { value: "scheduling", label: "Scheduling", description: "Help with scheduling and availability" },
] as const;

export type ContextType = typeof CONTEXT_TYPES[number]["value"];
