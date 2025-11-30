import { redirect } from "next/navigation";

/**
 * Legacy route: /page/[username]
 *
 * This route exists for backward compatibility with old external links and bookmarks.
 * It redirects to the canonical tutor site URL: /{username}
 *
 * ROUTE STRUCTURE:
 * - /{username} - Full custom tutor website (site builder) - CANONICAL
 * - /profile/{username} - Simple profile page with bio and stats
 * - /bio/{username} - Link-in-bio page (Linktree-style)
 * - /page/{username} - Legacy redirect (THIS FILE)
 *
 * DO NOT remove this redirect without checking for external link impacts.
 */

type PageParams = {
  username: string;
};

export default async function OldPageRoute({ params }: { params: Promise<PageParams> }) {
  const resolvedParams = await params;
  // Redirect to the canonical root-level tutor site
  redirect(`/${resolvedParams.username}`);
}
