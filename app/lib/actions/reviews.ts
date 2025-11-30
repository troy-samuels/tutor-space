"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type SubmitReviewState = {
  status: "idle" | "success" | "error";
  message?: string;
  review?: { author: string; quote: string; rating?: number | null };
};

const reviewInputSchema = z.object({
  tutorId: z.string().uuid(),
  tutorSiteId: z.string().uuid(),
  tutorUsername: z.string().min(1).max(80),
  rating: z.coerce.number().min(1).max(5),
  title: z.string().trim().max(120).optional(),
  body: z.string().trim().min(20).max(800),
  displayName: z.string().trim().min(2).max(120),
});

/**
 * Allow an authenticated student to leave a review that also surfaces on the tutor's mini-site.
 */
export async function submitTutorSiteReview(
  _prevState: SubmitReviewState,
  formData: FormData
): Promise<SubmitReviewState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: "error", message: "Please sign in to leave a review." };
  }

  const parsed = reviewInputSchema.safeParse({
    tutorId: formData.get("tutorId"),
    tutorSiteId: formData.get("tutorSiteId"),
    tutorUsername: formData.get("tutorUsername"),
    rating: formData.get("rating"),
    title: formData.get("title"),
    body: formData.get("body"),
    displayName: formData.get("displayName"),
  });

  if (!parsed.success) {
    return { status: "error", message: "Please check your answers and try again." };
  }

  const { tutorId, tutorSiteId, tutorUsername, rating, title, body, displayName } = parsed.data;

  // Validate the student belongs to this tutor
  const { data: student, error: studentError } = await supabase
    .from("students")
    .select("id, full_name")
    .eq("user_id", user.id)
    .eq("tutor_id", tutorId)
    .maybeSingle();

  if (studentError || !student) {
    return {
      status: "error",
      message: "You need to be an approved student to leave a review for this tutor.",
    };
  }

  // Verify the student has completed at least one lesson with this tutor
  const { count: completedCount, error: completedError } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("tutor_id", tutorId)
    .eq("student_id", student.id)
    .eq("status", "completed");

  if (completedError) {
    console.error("[submitTutorSiteReview] Failed to verify completed lessons", completedError);
    return { status: "error", message: "Please try again in a moment." };
  }

  if (!completedCount || completedCount < 1) {
    return {
      status: "error",
      message: "Please complete at least one lesson with this tutor before leaving a review.",
    };
  }

  // Prevent duplicate submissions from the same student
  const { data: existingReview } = await supabase
    .from("reviews")
    .select("id")
    .eq("tutor_id", tutorId)
    .eq("student_id", student.id)
    .maybeSingle();

  if (existingReview) {
    return {
      status: "error",
      message: "You already left a review for this tutor. Thanks for sharing your feedback!",
    };
  }

  const now = new Date().toISOString();

  const { data: newReview, error: reviewError } = await supabase
    .from("reviews")
    .insert({
      tutor_id: tutorId,
      student_id: student.id,
      rating,
      title: title || null,
      body,
      is_published: true,
      published_at: now,
    })
    .select("id")
    .single();

  if (reviewError || !newReview) {
    console.error("[submitTutorSiteReview] Failed to insert review", reviewError);
    return {
      status: "error",
      message: "We couldn't save your review. Please try again in a moment.",
    };
  }

  // Keep new testimonials appended to the end of the existing list
  const { count } = await supabase
    .from("tutor_site_reviews")
    .select("id", { count: "exact", head: true })
    .eq("tutor_site_id", tutorSiteId);

  const author = displayName || student.full_name || user.email || "Student";

  const { error: siteReviewError } = await supabase.from("tutor_site_reviews").insert({
    tutor_site_id: tutorSiteId,
    author_name: author,
    quote: body,
    sort_order: count ?? 0,
    student_id: student.id,
    review_id: newReview.id,
    rating,
  });

  if (siteReviewError) {
    console.error("[submitTutorSiteReview] Failed to add to tutor_site_reviews", siteReviewError);
    return {
      status: "error",
      message:
        "Your review was saved privately, but we couldn't publish it. Please refresh and try again.",
    };
  }

  revalidatePath(`/${tutorUsername}`);

  return {
    status: "success",
    message: "Thanks for sharing your feedback!",
    review: { author, quote: body, rating },
  };
}
