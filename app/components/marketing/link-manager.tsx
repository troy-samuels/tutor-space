"use client";

import { useMemo, useState, useTransition } from "react";
import type { DragEndEvent } from "@dnd-kit/core";
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { createLink, updateLink, deleteLink, updateLinksOrder, type LinkRecord } from "@/lib/actions/links";
import type { LinkFormValues } from "@/lib/validators/link";
import { LinkAnalytics } from "@/components/marketing/link-analytics";
import { LinkEditor } from "@/components/marketing/link-editor";
import { SortableLinkItem } from "@/components/marketing/sortable-link-item";
import { LinkPreview } from "@/components/marketing/link-preview";

type StatusMessage = { type: "success" | "error"; message: string } | null;

type ProfileContext = {
  full_name: string;
  username: string;
  avatar_url: string | null;
  socials: {
    instagram: string | null;
    tiktok: string | null;
    facebook: string | null;
    x: string | null;
  };
};

export function LinkManager({
  initialLinks,
  profile,
  analytics,
}: {
  initialLinks: LinkRecord[];
  profile: ProfileContext;
  analytics?: Array<{ date: string; count: number }>;
}) {
  const [links, setLinks] = useState(initialLinks);
  const [status, setStatus] = useState<StatusMessage>(null);
  const [isPending, startTransition] = useTransition();

  const appOrigin =
    typeof window !== "undefined" && window.location.origin
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL ?? "https://tutorlingua.co";

  const sortedLinks = useMemo(
    () => [...links].sort((a, b) => a.sort_order - b.sort_order),
    [links]
  );

  const totalClicks = useMemo(
    () => sortedLinks.reduce((total, link) => total + (link.click_count ?? 0), 0),
    [sortedLinks]
  );

  function handleStatus(next: StatusMessage) {
    setStatus(next);
    if (next) {
      setTimeout(() => setStatus(null), 4000);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const currentIndex = sortedLinks.findIndex((link) => link.id === active.id);
    const newIndex = sortedLinks.findIndex((link) => link.id === over.id);

    const reordered = arrayMove(sortedLinks, currentIndex, newIndex).map((link, index) => ({
      ...link,
      sort_order: index,
    }));

    setLinks(reordered);

    startTransition(() => {
      (async () => {
        const response = await updateLinksOrder(
          reordered.map((link) => ({
            id: link.id,
            sort_order: link.sort_order,
          }))
        );

        if (response.error) {
          handleStatus({ type: "error", message: response.error });
          setLinks(sortedLinks); // revert on failure
        } else {
          handleStatus({ type: "success", message: "Link order saved." });
        }
      })();
    });
  }

  function handleCreate(values: LinkFormValues, successMessage: string, reset?: () => void) {
    setStatus(null);
    startTransition(() => {
      (async () => {
        const response = await createLink(values);
        if (response.error || !response.data) {
          handleStatus({
            type: "error",
            message: response.error ?? "We couldn't add that link. Please try again.",
          });
          return;
        }
        setLinks((prev) => [...prev, response.data]);
        handleStatus({ type: "success", message: successMessage });
        reset?.();
      })();
    });
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Link in bio</h1>
            <p className="text-sm text-muted-foreground">
              Curate your offers, testimonials, and lead magnets so social traffic converts into booked lessons.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
            <span>Total clicks</span>
            <span className="text-base text-foreground">{totalClicks}</span>
          </div>
        </div>
        {status ? (
          <p
            className={`inline-flex w-full items-center justify-between rounded-2xl px-4 py-3 text-xs font-medium ${
              status.type === "success"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-destructive/10 text-destructive"
            }`}
          >
            {status.message}
          </p>
        ) : null}
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-6">
          <div className="rounded-3xl border border-border bg-white/90 p-6 shadow-sm backdrop-blur">
            <h2 className="text-base font-semibold text-foreground">Add a new spotlight</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Link to booking funnels, lead magnets, testimonials, or external content that reinforces your credibility.
            </p>
            <div className="mt-4">
              <LinkEditor
                variant="create"
                disabled={isPending}
                onSubmit={(values, reset) => handleCreate(values, "Link added to your bio.", reset)}
              />

              {profile.username ? (
                <div className="mt-5 rounded-2xl border border-border bg-primary/5 px-4 py-4">
                  <p className="text-xs font-semibold text-primary">Quick actions</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Drop in high-converting CTAs without typing everything from scratch.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() =>
                        handleCreate(
                          {
                            title: "Book a lesson",
                            url: `${appOrigin}/book/${profile.username}`,
                            description: "Choose a package, pay upfront, and reserve a spot instantly.",
                            icon_url: "",
                            button_style: "primary",
                            is_visible: true,
                          },
                          "Added 'Book a lesson' CTA to your bio."
                        )
                      }
                      className="inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      + Add “Book a lesson”
                    </button>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() =>
                        handleCreate(
                          {
                            title: "Parent credibility page",
                            url: `${appOrigin}/@${profile.username}`,
                            description: "Send parents to your testimonials, progress stats, and safety assurances.",
                            icon_url: "",
                            button_style: "outline",
                            is_visible: true,
                          },
                          "Added parent credibility link to your bio."
                        )
                      }
                      className="inline-flex items-center justify-center rounded-full border border-border bg-white px-4 py-2 text-xs font-semibold text-foreground transition hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      + Add "Credibility page"
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-white/90 p-6 shadow-sm backdrop-blur">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">Live links</h2>
              <span className="text-xs text-muted-foreground">{sortedLinks.length} items</span>
            </div>

            <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={sortedLinks.map((link) => link.id)} strategy={verticalListSortingStrategy}>
                <ul className="mt-4 space-y-3">
                  {sortedLinks.map((link) => (
                    <SortableLinkItem
                      key={link.id}
                      link={link}
                      onChange={async (values) => {
                        setStatus(null);
                        return await new Promise<boolean>((resolve) => {
                          startTransition(() => {
                            (async () => {
                              const response = await updateLink(link.id, values);
                              if (response.error || !response.data) {
                                handleStatus({
                                  type: "error",
                                  message: response.error ?? "We couldn't update that link. Please try again.",
                                });
                                resolve(false);
                                return;
                              }
                              setLinks((prev) =>
                                prev.map((item) => (item.id === link.id ? response.data! : item))
                              );
                              handleStatus({ type: "success", message: "Link updated." });
                              resolve(true);
                            })();
                          });
                        });
                      }}
                      onToggleVisibility={() => {
                        setStatus(null);
                        startTransition(() => {
                          (async () => {
                            const buttonStyle =
                              (link.button_style as LinkFormValues["button_style"] | null) ?? "default";
                            const response = await updateLink(link.id, {
                              title: link.title,
                              url: link.url,
                              description: link.description ?? "",
                              icon_url: link.icon_url ?? "",
                              button_style: buttonStyle,
                              is_visible: !link.is_visible,
                            });

                            if (response.error || !response.data) {
                              handleStatus({
                                type: "error",
                                message: response.error ?? "We couldn't toggle that link.",
                              });
                              return;
                            }

                            setLinks((prev) =>
                              prev.map((item) =>
                                item.id === link.id ? { ...item, is_visible: response.data!.is_visible } : item
                              )
                            );
                            handleStatus({
                              type: "success",
                              message: response.data.is_visible
                                ? "Link shown on your public page."
                                : "Link hidden from your public page.",
                            });
                          })();
                        });
                      }}
                      onDelete={() => {
                        setStatus(null);
                        startTransition(() => {
                          (async () => {
                            const response = await deleteLink(link.id);
                            if (response.error) {
                              handleStatus({ type: "error", message: response.error });
                              return;
                            }
                            setLinks((prev) => prev.filter((item) => item.id !== link.id));
                            handleStatus({ type: "success", message: "Link removed." });
                          })();
                        });
                      }}
                    />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>

            {sortedLinks.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-border bg-primary/5 px-4 py-6 text-center text-sm text-foreground">
                Add your first link above to start sharing your TutorLingua bio.
              </div>
            ) : null}
          </div>
        </section>

        <aside className="space-y-4">
          <LinkAnalytics series={analytics} />
          <LinkPreview profile={profile} links={sortedLinks} />
          <div className="rounded-3xl border border-border bg-primary/5 px-5 py-4 text-xs text-foreground">
            <p className="font-semibold text-primary">Growth Plan tip</p>
            <p className="mt-1">
              Embed your lead magnet PDF here and capture emails automatically. Upgrade to unlock the Lead Hub and
              bring DMs + form submissions into one inbox.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
