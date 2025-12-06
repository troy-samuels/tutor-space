import { Instagram, Youtube, Mail } from "lucide-react";
import type { SophieMockData } from "../sophie-data";

type MockupFooterProps = {
  social: SophieMockData["social"];
  theme: SophieMockData["theme"];
};

const iconMap: Record<string, typeof Instagram> = {
  Instagram,
  Youtube,
  Mail,
};

export function MockupFooter({ social, theme }: MockupFooterProps) {
  return (
    <footer className="px-4 py-6 text-center" style={{ backgroundColor: theme.background }}>
      <p
        className="text-xs font-medium"
        style={{ color: `${theme.text}99` }}
      >
        Connect with me
      </p>

      {/* Social icons */}
      <div className="mt-3 flex justify-center gap-3">
        {social.map((item) => {
          const Icon = iconMap[item.icon] || Mail;
          return (
            <span
              key={item.platform}
              className="flex h-9 w-9 items-center justify-center rounded-full transition-colors"
              style={{
                backgroundColor: `${theme.primary}10`,
                color: theme.primary,
              }}
            >
              <Icon className="h-4 w-4" />
            </span>
          );
        })}
      </div>

      {/* Powered by TutorLingua */}
      <p
        className="mt-6 text-[10px]"
        style={{ color: `${theme.text}40` }}
      >
        Powered by TutorLingua
      </p>
    </footer>
  );
}
