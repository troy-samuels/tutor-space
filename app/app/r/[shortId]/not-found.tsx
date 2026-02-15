import Link from "next/link";

export default function RecapNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="mb-4 text-5xl">🔍</div>
      <h1 className="mb-2 font-heading text-2xl text-foreground">
        Recap not found
      </h1>
      <p className="text-center text-sm text-muted-foreground">
        This recap link may have expired or doesn&apos;t exist.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-xl bg-primary px-6 py-3 font-semibold text-white transition-all hover:brightness-110"
      >
        Go to TutorLingua
      </Link>
    </div>
  );
}
