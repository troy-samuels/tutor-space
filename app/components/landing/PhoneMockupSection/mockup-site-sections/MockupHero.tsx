import Image from "next/image";
import { Instagram, Youtube, Mail } from "lucide-react";
import type { SophieMockData } from "../sophie-data";

type MockupHeroProps = {
  profile: SophieMockData["profile"];
  social: SophieMockData["social"];
  theme: SophieMockData["theme"];
};

const iconMap: Record<string, typeof Instagram> = {
  Instagram,
  Youtube,
  Mail,
};

export function MockupHero({ profile, social, theme }: MockupHeroProps) {
  return (
    <section
      className="px-4 py-8 text-center"
      style={{ backgroundColor: theme.background }}
    >
      {/* Avatar with accent ring */}
      <div className="flex justify-center">
        <div
          className="rounded-full p-1"
          style={{ backgroundColor: theme.secondary }}
        >
          <div className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-white">
            <Image
              src={profile.avatarUrl}
              alt={profile.name}
              fill
              className="object-cover object-center"
              sizes="80px"
              loading="lazy"
              fetchPriority="low"
            />
          </div>
        </div>
      </div>

      {/* Name and tagline */}
      <h1
        className="mt-4 text-xl font-bold"
        style={{
          color: theme.text,
          fontFamily: '"Merriweather", Georgia, serif',
        }}
      >
        {profile.name}
      </h1>
      <p className="mt-1 text-sm" style={{ color: `${theme.text}99` }}>
        {profile.tagline}
      </p>
      <p className="mt-0.5 text-xs" style={{ color: `${theme.text}66` }}>
        {profile.location}
      </p>

      {/* Social icons */}
      <div className="mt-4 flex justify-center gap-2">
        {social.map((item) => {
          const Icon = iconMap[item.icon] || Mail;
          return (
            <span
              key={item.platform}
              className="flex h-8 w-8 items-center justify-center rounded-full transition-colors"
              style={{
                backgroundColor: `${theme.primary}15`,
                color: theme.primary,
              }}
            >
              <Icon className="h-4 w-4" />
            </span>
          );
        })}
      </div>
    </section>
  );
}
