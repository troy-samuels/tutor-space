"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type SubmitReviewState = {
  status: "idle" | "success" | "error";
  message?: string;
  review?: { author: string; quote: string; rating?: number | null };
};

export type ExistingReview = {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  displayName: string;
  createdAt: string;
  updatedAt: string | null;
};

export type TutorForReview = {
  tutorId: string;
  tutorSiteId: string;
  tutorUsername: string;
  tutorName: string;
  tutorAvatarUrl: string | null;
  completedLessonsCount: number;
  lastCompletedAt: string;
  hasExistingReview: boolean;
  existingReview?: ExistingReview;
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

  // Check for existing review - if found, delegate to update
  const { data: existingReview } = await supabase
    .from("reviews")
    .select("id")
    .eq("tutor_id", tutorId)
    .eq("student_id", student.id)
    .maybeSingle();

  if (existingReview) {
    // Delegate to update function instead of blocking
    return updateTutorSiteReview(_prevState, formData);
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

/**
 * Get all tutors that the current student can review (has completed lessons with).
 * Returns tutor info, lesson count, and existing review if any.
 */
export async function getTutorsAvailableForReview(): Promise<{
  tutors?: TutorForReview[];
  error?: string;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Please sign in to view your tutors." };
  }

  // Get all student records for the current user
  const { data: studentRecords, error: studentError } = await supabase
    .from("students")
    .select("id, tutor_id")
    .eq("user_id", user.id);

  if (studentError || !studentRecords || studentRecords.length === 0) {
    return { tutors: [] };
  }

  const tutors: TutorForReview[] = [];

  for (const student of studentRecords) {
    // Get completed bookings count and last completed date
    const { data: bookings, error: bookingsError } = await supabase
      .from("bookings")
      .select("id, scheduled_at")
      .eq("tutor_id", student.tutor_id)
      .eq("student_id", student.id)
      .eq("status", "completed")
      .order("scheduled_at", { ascending: false });

    if (bookingsError || !bookings || bookings.length === 0) {
      continue; // Skip tutors with no completed lessons
    }

    // Get tutor profile and site info
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, username, avatar_url")
      .eq("id", student.tutor_id)
      .single();

    if (profileError || !profile) {
      continue;
    }

    // Get tutor site ID
    const { data: site, error: siteError } = await supabase
      .from("tutor_sites")
      .select("id")
      .eq("tutor_id", student.tutor_id)
      .single();

    if (siteError || !site) {
      continue;
    }

    // Check for existing review
    const { data: existingReview } = await supabase
      .from("reviews")
      .select("id, rating, title, body, created_at, updated_at")
      .eq("tutor_id", student.tutor_id)
      .eq("student_id", student.id)
      .maybeSingle();

    // Get display name from tutor_site_reviews if review exists
    let displayName: string | null = null;
    if (existingReview) {
      const { data: siteReview } = await supabase
        .from("tutor_site_reviews")
        .select("author_name")
        .eq("review_id", existingReview.id)
        .maybeSingle();
      displayName = siteReview?.author_name ?? null;
    }

    tutors.push({
      tutorId: profile.id,
      tutorSiteId: site.id,
      tutorUsername: profile.username || "",
      tutorName: profile.full_name || "Tutor",
      tutorAvatarUrl: profile.avatar_url,
      completedLessonsCount: bookings.length,
      lastCompletedAt: bookings[0].scheduled_at,
      hasExistingReview: !!existingReview,
      existingReview: existingReview
        ? {
            id: existingReview.id,
            rating: existingReview.rating,
            title: existingReview.title,
            body: existingReview.body,
            displayName: displayName || "",
            createdAt: existingReview.created_at,
            updatedAt: existingReview.updated_at,
          }
        : undefined,
    });
  }

  return { tutors };
}

/**
 * Get an existing review for a specific tutor (for editing).
 */
export async function getExistingReview(tutorId: string): Promise<{
  review?: ExistingReview;
  error?: string;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Please sign in to view your review." };
  }

  // Find student record for this tutor
  const { data: student, error: studentError } = await supabase
    .from("students")
    .select("id")
    .eq("user_id", user.id)
    .eq("tutor_id", tutorId)
    .maybeSingle();

  if (studentError || !student) {
    return { error: "You are not a student of this tutor." };
  }

  // Get existing review
  const { data: review, error: reviewError } = await supabase
    .from("reviews")
    .select("id, rating, title, body, created_at, updated_at")
    .eq("tutor_id", tutorId)
    .eq("student_id", student.id)
    .maybeSingle();

  if (reviewError || !review) {
    return { review: undefined };
  }

  // Get display name from tutor_site_reviews
  const { data: siteReview } = await supabase
    .from("tutor_site_reviews")
    .select("author_name")
    .eq("review_id", review.id)
    .maybeSingle();

  return {
    review: {
      id: review.id,
      rating: review.rating,
      title: review.title,
      body: review.body,
      displayName: siteReview?.author_name || "",
      createdAt: review.created_at,
      updatedAt: review.updated_at,
    },
  };
}

/**
 * Update an existing review.
 */
export async function updateTutorSiteReview(
  _prevState: SubmitReviewState,
  formData: FormData
): Promise<SubmitReviewState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: "error", message: "Please sign in to update your review." };
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

  const { tutorId, tutorUsername, rating, title, body, displayName } = parsed.data;

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
      message: "You need to be an approved student to update your review.",
    };
  }

  // Find existing review
  const { data: existingReview, error: findError } = await supabase
    .from("reviews")
    .select("id")
    .eq("tutor_id", tutorId)
    .eq("student_id", student.id)
    .maybeSingle();

  if (findError || !existingReview) {
    return {
      status: "error",
      message: "No existing review found to update.",
    };
  }

  // Update the review
  const { error: updateError } = await supabase
    .from("reviews")
    .update({
      rating,
      title: title || null,
      body,
    })
    .eq("id", existingReview.id);

  if (updateError) {
    console.error("[updateTutorSiteReview] Failed to update review", updateError);
    return {
      status: "error",
      message: "We couldn't update your review. Please try again.",
    };
  }

  const author = displayName || student.full_name || user.email || "Student";

  // Update the tutor_site_reviews record
  const { error: siteReviewError } = await supabase
    .from("tutor_site_reviews")
    .update({
      author_name: author,
      quote: body,
      rating,
    })
    .eq("review_id", existingReview.id);

  if (siteReviewError) {
    console.error("[updateTutorSiteReview] Failed to update site review", siteReviewError);
    // Non-critical - review was still updated
  }

  revalidatePath(`/${tutorUsername}`);

  return {
    status: "success",
    message: "Your review has been updated!",
    review: { author, quote: body, rating },
  };
}
