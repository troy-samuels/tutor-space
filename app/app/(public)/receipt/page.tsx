import type { Metadata } from "next";
import { ReceiptGenerator } from "./ReceiptGenerator";

export const metadata: Metadata = {
  title: "Your Platform Receipt — How Much Have You Paid? | TutorLingua",
  description:
    "Calculate exactly how much commission you've paid to Preply, iTalki, or Cambly. Generate a shareable receipt showing your true cost of teaching on a platform.",
  keywords: [
    "Preply commission calculator",
    "iTalki fees total",
    "Cambly earnings calculator",
    "tutor platform fees",
    "online tutoring commission receipt",
    "how much does Preply take",
  ],
  openGraph: {
    type: "website",
    url: "/receipt",
    title: "Your Platform Receipt — See What You've Really Paid",
    description:
      "Generate a receipt showing exactly how much commission you've paid to your tutoring platform. Share it. Start a conversation.",
  },
  alternates: {
    canonical: "/receipt",
  },
};

export default function ReceiptPage() {
  return <ReceiptGenerator />;
}
