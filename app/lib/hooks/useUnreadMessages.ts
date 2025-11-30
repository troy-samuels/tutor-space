"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Mode = "tutor" | "student";

type Options = {
  pollIntervalMs?: number;
};

export function useUnreadMessages(mode: Mode, options?: Options) {
  const [count, setCount] = useState(0);
  const pollIntervalMs = options?.pollIntervalMs ?? 20000;

  useEffect(() => {
    let isActive = true;
    const supabase = createClient();

    async function loadUnreadCount() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          if (isActive) setCount(0);
          return;
        }

        if (mode === "tutor") {
          const { count } = await supabase
            .from("conversation_threads")
            .select("id", { count: "exact", head: true })
            .eq("tutor_id", user.id)
            .eq("unread_for_tutor", true);

          if (isActive) setCount(count ?? 0);
          return;
        }

        const { data: studentRows, error: studentError } = await supabase
          .from("students")
          .select("id")
          .eq("user_id", user.id);

        if (studentError) {
          throw studentError;
        }

        const studentIds = (studentRows ?? []).map((row) => row.id).filter(Boolean);

        if (studentIds.length === 0) {
          if (isActive) setCount(0);
          return;
        }

        const { count } = await supabase
          .from("conversation_threads")
          .select("id", { count: "exact", head: true })
          .in("student_id", studentIds)
          .eq("unread_for_student", true);

        if (isActive) setCount(count ?? 0);
      } catch (error) {
        console.error("[useUnreadMessages] Failed to fetch unread count", error);
        if (isActive) setCount(0);
      }
    }

    loadUnreadCount();

    const intervalId = pollIntervalMs ? setInterval(loadUnreadCount, pollIntervalMs) : null;

    return () => {
      isActive = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [mode, pollIntervalMs]);

  return count;
}
