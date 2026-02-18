import type { Metadata } from "next";
import PhrasalVerbChallenge from "@/components/english/phrasal-verbs/PhrasalVerbChallenge";

export const metadata: Metadata = {
  title: "Phrasal Verb Challenge — Daily Quiz",
  description:
    "Master English phrasal verbs with our daily 5-question challenge. New phrasal verbs every day — shareable results like Wordle.",
  openGraph: {
    title: "Daily Phrasal Verb Challenge — Can you get 5/5?",
    description:
      "The #1 challenge for English learners. 5 new phrasal verbs every day. Free, instant, shareable.",
  },
};

export default function PhrasalVerbsPage() {
  return <PhrasalVerbChallenge />;
}
