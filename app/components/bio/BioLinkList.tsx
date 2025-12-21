"use client";

type BioLink = {
  id: string;
  url: string;
  title: string;
  button_style?: string | null;
};

type BioLinkListProps = {
  links: BioLink[];
};

export function BioLinkList({ links }: BioLinkListProps) {
  if (links.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-border bg-muted/50 px-5 py-6 text-center text-sm text-foreground">
        This tutor is still adding resources. Check back soon, or tap book a lesson to connect directly.
      </div>
    );
  }

  return (
    <>
      {links.map((link) => (
        <a
          key={link.id}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackClick(link.id)}
          className={buttonClass(link.button_style ?? "default")}
        >
          {link.title}
        </a>
      ))}
    </>
  );
}

function trackClick(linkId: string) {
  if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
    navigator.sendBeacon(`/api/links/${linkId}/click`);
    return;
  }

  void fetch(`/api/links/${linkId}/click`, {
    method: "POST",
    keepalive: true,
  });
}

function buttonClass(style: string) {
  switch (style) {
    case "primary":
      return "block rounded-full bg-primary px-5 py-3 text-center text-sm font-semibold text-primary-foreground shadow-md transition hover:bg-primary/90";
    case "secondary":
      return "block rounded-full bg-primary/10 px-5 py-3 text-center text-sm font-semibold text-primary transition hover:bg-primary/20";
    case "outline":
      return "block rounded-full border shadow-sm px-5 py-3 text-center text-sm font-semibold text-primary transition hover:bg-primary/10";
    default:
      return "block rounded-full bg-white px-5 py-3 text-center text-sm font-semibold text-primary shadow-md transition hover:bg-primary/10";
  }
}
