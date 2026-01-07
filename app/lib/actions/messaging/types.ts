export type ConversationThread = {
  id: string;
  student_id: string;
  tutor_id: string;
  last_message_preview: string | null;
  last_message_at: string | null;
  tutor_unread: boolean;
  student_unread: boolean;
  students: {
    full_name: string | null;
    email: string | null;
    status: string | null;
  } | null;
  profiles: {
    full_name: string | null;
  } | null;
};

export type MessageAttachment = {
  type: "audio";
  url: string;
  duration_seconds: number;
  mime_type: string;
};

export type ConversationMessage = {
  id: string;
  thread_id: string;
  sender_role: "tutor" | "student" | "system";
  body: string;
  attachments?: MessageAttachment[];
  created_at: string;
};

export type MessagingActionState = {
  error?: string;
  success?: string;
};
