"use client";

import { useMemo, useState } from "react";
import { Play, X, ExternalLink, ArrowLeft, Download } from "lucide-react";

export type LibraryItem = {
  id: string;
  title: string;
  description?: string | null;
  category?: string | null;
  fulfillment: "file" | "link" | string;
  externalUrl?: string | null;
  downloadUrl?: string | null;
  coverUrl?: string | null;
  progress?: number | null;
};

function getCoverStyle(item: LibraryItem) {
  if (item.coverUrl) {
    return {
      backgroundImage: `url(${item.coverUrl})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    };
  }
  return {
    backgroundImage: "linear-gradient(135deg, #f6f7fb 0%, #e7e7ec 50%, #dfe3e8 100%)",
  };
}

function consumptionLink(item: LibraryItem) {
  if (item.fulfillment === "file" && item.downloadUrl) return item.downloadUrl;
  if (item.externalUrl) return item.externalUrl;
  return null;
}

export function StudentLibraryGrid({ items }: { items: LibraryItem[] }) {
  const [active, setActive] = useState<LibraryItem | null>(null);
  const [completed, setCompleted] = useState(false);
  const totalItems = items.length;

  const gridItems = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        progress: item.category === "course" ? item.progress ?? 0 : null,
      })),
    [items]
  );

  return (
    <>
      {totalItems === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-white/90 p-8 text-center">
          <p className="text-lg font-semibold text-foreground">No purchases yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Bought lessons and products will appear here.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {gridItems.map((item) => {
            const isVideo = item.category === "video" || item.fulfillment === "link";
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActive(item)}
                className="group relative block overflow-hidden rounded-2xl border border-border/70 bg-stone-100 shadow-sm transition hover:-translate-y-1 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <div
                  className="relative aspect-[3/4] w-full"
                  style={getCoverStyle(item)}
                >
                  {isVideo ? (
                    <div className="absolute inset-0 flex items-center justify-center text-white/80">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/60 backdrop-blur">
                        <Play className="h-5 w-5" />
                      </div>
                    </div>
                  ) : null}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-3">
                    <p className="line-clamp-2 font-semibold text-white">{item.title}</p>
                  </div>
                  {item.progress !== null && item.progress !== undefined ? (
                    <div className="absolute inset-x-0 bottom-0 h-1.5">
                      <div className="h-full w-full overflow-hidden rounded-full bg-white/30">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${Math.min(Math.max(item.progress, 0), 100)}%` }}
                        />
                      </div>
                    </div>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {active ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-8">
          <div className="relative w-full max-w-4xl rounded-3xl bg-white p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => {
                setActive(null);
                setCompleted(false);
              }}
              className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground transition hover:bg-muted"
              aria-label="Close viewer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-4 flex flex-col items-center gap-3 border-b border-border/50 pb-4 text-center">
              <div className="flex w-full items-center justify-between text-sm text-muted-foreground">
                <button
                  type="button"
                  onClick={() => {
                    setActive(null);
                    setCompleted(false);
                  }}
                  className="inline-flex items-center gap-1 rounded-full px-3 py-1 transition hover:bg-muted"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Library
                </button>
                <span className="flex-1 text-center font-serif text-lg text-foreground">{active.title}</span>
                <span className="w-28" aria-hidden />
              </div>
            </div>

            {(() => {
              const link = consumptionLink(active);
              const isPdf = active.fulfillment === "file" && (active.downloadUrl?.toLowerCase().includes(".pdf") ?? false);
              const isVideo = active.category === "video" || (active.externalUrl && /(youtube|vimeo|loom|\.mp4|\.mov|\.mkv|\.avi)/i.test(active.externalUrl));

              if (isPdf) {
                return (
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      {link ? (
                        <a
                          href={link}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90"
                        >
                          <Download className="h-4 w-4" />
                          Download PDF
                        </a>
                      ) : null}
                    </div>
                    <div className="relative h-[70vh] overflow-hidden rounded-2xl border border-border bg-stone-50">
                      {link ? (
                        <iframe
                          src={`${link}#view=FitH`}
                          className="h-full w-full"
                          title={active.title}
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                          Preview unavailable.
                        </div>
                      )}
                    </div>
                  </div>
                );
              }

              if (active.fulfillment === "link" && !isVideo) {
                return (
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-border bg-stone-50 p-6 shadow-inner">
                      <p className="text-sm font-semibold text-foreground">External Resource</p>
                      <p className="text-xs text-muted-foreground">Notion Template</p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Duplicate this to your workspace and start using it right away.
                      </p>
                      {link ? (
                        <a
                          href={link}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90"
                        >
                          Open in Notion ↗
                        </a>
                      ) : (
                        <p className="mt-4 text-xs text-destructive">No link available.</p>
                      )}
                    </div>
                  </div>
                );
              }

              if (isVideo) {
                return (
                  <div className="space-y-4">
                    <div className="relative w-full overflow-hidden rounded-2xl border border-border bg-black">
                      {link ? (
                        link.match(/youtube|vimeo|loom/i) ? (
                          <iframe
                            src={link}
                            title={active.title}
                            className="aspect-video w-full"
                            allow="accelerometer; autoplay; encrypted-media; picture-in-picture"
                            allowFullScreen
                          />
                        ) : (
                          <video
                            controls
                            className="w-full"
                            src={link}
                          />
                        )
                      ) : (
                        <div className="flex aspect-video items-center justify-center text-sm text-muted-foreground">
                          No video available.
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setCompleted(true)}
                      className={`inline-flex w-full items-center justify-center rounded-full px-4 py-3 text-sm font-semibold shadow ${completed ? "bg-emerald-600 text-white" : "bg-primary text-primary-foreground hover:bg-primary/90"}`}
                    >
                      {completed ? "Marked as Complete" : "Mark as Complete"}
                    </button>
                  </div>
                );
              }

              return (
                <div className="space-y-3">
                  <div
                    className="relative aspect-[3/4] overflow-hidden rounded-2xl border border-border/60"
                    style={getCoverStyle(active)}
                  />
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {active.description || "Open to view your resource."}
                  </p>
                  {link ? (
                    <a
                      href={link}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Open resource
                    </a>
                  ) : (
                    <p className="text-xs text-destructive">No access link available.</p>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      ) : null}
    </>
  );
}
