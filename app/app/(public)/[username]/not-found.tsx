import Link from "next/link";
import { Search } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import enMessages from "@/messages/en.json";

export default function NotFound() {
  const t = (key: keyof typeof enMessages.publicProfileNotFound) =>
    enMessages.publicProfileNotFound[key];

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background via-muted/40 to-white px-6 py-16">
      <div className="w-full max-w-3xl rounded-3xl border border-border/70 bg-white/90 p-10 text-center shadow-xl backdrop-blur">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Search className="h-5 w-5" />
        </div>
        <h1 className="mt-6 text-2xl font-semibold text-foreground">{t("title")}</h1>
        <p className="mt-3 text-sm text-muted-foreground">{t("description")}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/marketplace" className={buttonVariants({ size: "sm" })}>
            {t("ctaExplore")}
          </Link>
          <Link href="/" className={buttonVariants({ variant: "secondary", size: "sm" })}>
            {t("ctaHome")}
          </Link>
          <Link href="/signup" className={buttonVariants({ variant: "outline", size: "sm" })}>
            {t("ctaPublish")}
          </Link>
        </div>
        <p className="mt-6 text-xs text-muted-foreground">{t("hint")}</p>
      </div>
    </div>
  );
}
