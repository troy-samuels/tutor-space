import Script from "next/script";
import type { Metadata } from "next";
import { TelegramProvider } from "./TelegramProvider";

export const metadata: Metadata = {
  title: "Language Games | TutorLingua",
  description:
    "Daily word games to sharpen your language skills. Play Lingua Connections, Word Ladder, and more.",
};

export default function GamesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Script
        src="https://telegram.org/js/telegram-web-app.js"
        strategy="beforeInteractive"
      />
      <TelegramProvider>{children}</TelegramProvider>
    </>
  );
}
