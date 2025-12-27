"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Facebook, Globe, Instagram, Music4, Twitter } from "lucide-react";
import { useRouter } from "next/navigation";
import { ThemeShell } from "@/components/site/ThemeShell";
import { ProductPurchaseForm } from "@/components/digital-products/purchase-form";
import type { FAQItem, SiteTheme } from "@/lib/types/site";
import { cn, formatCurrency } from "@/lib/utils";

type TabId = "services" | "products" | "reviews" | "faq";

type ServiceData = {
  id: string;
  name: string;
  description?: string | null;
  duration_minutes?: number | null;
  price?: number | null;
  currency?: string | null;
};

type ProductData = {
  id: string;
  title: string;
  description?: string | null;
  price_cents?: number | null;
  currency?: string | null;
};

type ReviewData = {
  author: string;
  quote: string;
  rating?: number | null;
};

type ProfileData = {
  full_name: string;
  tagline: string;
  bio: string;
  avatar_url?: string | null;
  languages_taught: string[];
  instagram_handle?: string | null;
  tiktok_handle?: string | null;
  facebook_handle?: string | null;
  x_handle?: string | null;
  website_url?: string | null;
};

interface PublicProfileClientProps {
  username: string;
  profile: ProfileData;
  coverImage: string | null;
  themeId: SiteTheme;
  accentColor: string;
  bgColor: string;
  services: ServiceData[];
  products: ProductData[];
  reviews: ReviewData[];
  nextSlot?: string | null;
  visibility: {
    about: boolean;
    services: boolean;
    products: boolean;
    reviews: boolean;
    faq: boolean;
  };
  faqs: FAQItem[];
}

export default function PublicProfileClient({
  username,
  profile,
  coverImage,
  themeId,
  accentColor,
  bgColor,
  services,
  products,
  reviews,
  nextSlot,
  visibility,
  faqs,
}: PublicProfileClientProps) {
  const router = useRouter();

  // Compute enabled tabs based on available content
  const enabledTabs = useMemo(() => {
    const tabs: { id: TabId; label: string }[] = [];
    if (visibility.services && services.length > 0) tabs.push({ id: "services", label: "Services" });
    if (visibility.products && products.length > 0) tabs.push({ id: "products", label: "Products" });
    if (visibility.reviews && reviews.length > 0) tabs.push({ id: "reviews", label: "Reviews" });
    if (visibility.faq && faqs.length > 0) tabs.push({ id: "faq", label: "FAQ" });
    return tabs;
  }, [
    faqs.length,
    products.length,
    reviews.length,
    services.length,
    visibility.faq,
    visibility.products,
    visibility.reviews,
    visibility.services,
  ]);

  const [activeTab, setActiveTab] = useState<TabId>(enabledTabs[0]?.id || "services");

  // Service selection state
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(
    services[0]?.id ?? null
  );
  const selectedService = services.find((s) => s.id === selectedServiceId) ?? null;
  const handleBook = () => {
    if (!selectedServiceId) return;
    const query = new URLSearchParams({ service: selectedServiceId });
    router.push(`/book/${username}?${query.toString()}`);
  };

  const formatPriceLabel = (amount?: number | null, currency?: string | null) => {
    if (amount == null || amount <= 0) return "Free";
    return formatCurrency(amount, currency?.toUpperCase() || "USD");
  };

  const socialLinks = [
    profile.instagram_handle
      ? {
          label: "Instagram",
          url: `https://instagram.com/${profile.instagram_handle.replace(/^@/, "")}`,
          icon: <Instagram className="h-4 w-4" />,
        }
      : null,
    profile.tiktok_handle
      ? {
          label: "TikTok",
          url: `https://tiktok.com/@${profile.tiktok_handle.replace(/^@/, "")}`,
          icon: <Music4 className="h-4 w-4" />,
        }
      : null,
    profile.facebook_handle
      ? {
          label: "Facebook",
          url: `https://facebook.com/${profile.facebook_handle.replace(/^@/, "")}`,
          icon: <Facebook className="h-4 w-4" />,
        }
      : null,
    profile.x_handle
      ? {
          label: "X",
          url: `https://x.com/${profile.x_handle.replace(/^@/, "")}`,
          icon: <Twitter className="h-4 w-4" />,
        }
      : null,
    profile.website_url
      ? {
          label: "Website",
          url: profile.website_url,
          icon: <Globe className="h-4 w-4" />,
        }
      : null,
  ].filter(Boolean) as Array<{ label: string; url: string; icon: React.ReactNode }>;

  return (
    <ThemeShell themeId={themeId}>
      <div className="min-h-screen bg-[var(--bg-page)]">
        {/* Creator Profile Header */}
        <CreatorProfileHeader
          name={profile.full_name}
          tagline={profile.tagline}
          bio={profile.bio}
          languages={profile.languages_taught}
          photoUrl={profile.avatar_url}
          coverImage={coverImage}
          accentColor={accentColor}
          bgColor={bgColor}
          hasAvailability={!!nextSlot}
          showAbout={visibility.about}
          socialLinks={socialLinks}
        />

        {/* iOS Segmented Control Tabs */}
        {enabledTabs.length > 0 && (
          <div className="sticky top-4 z-40 bg-[var(--bg-page)]">
            <div className="mx-auto mb-6 mt-2 w-full max-w-3xl px-4 sm:px-6">
              <div className="relative flex rounded-full bg-stone-100/80 p-1 backdrop-blur-md">
                {/* Sliding background pill */}
                <motion.div
                  className="absolute inset-y-1 rounded-full bg-white shadow-sm"
                  style={{
                    width: `${100 / enabledTabs.length}%`,
                    left: `${(enabledTabs.findIndex((t) => t.id === activeTab) * 100) / enabledTabs.length}%`,
                  }}
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />

                {/* Tab buttons */}
                {enabledTabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "relative z-10 flex-1 rounded-full py-2 text-center text-sm font-medium transition-colors",
                      activeTab === tab.id
                        ? "text-stone-900"
                        : "text-stone-500 hover:text-stone-700"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <main className="mx-auto w-full max-w-3xl px-4 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:px-6">
          {activeTab === "services" && visibility.services && services.length > 0 && (
            <ServicesList
              services={services}
              accentColor={accentColor}
              formatPriceLabel={formatPriceLabel}
              selectedId={selectedServiceId}
              onSelect={setSelectedServiceId}
            />
          )}
          {activeTab === "products" && visibility.products && products.length > 0 && (
            <ProductsList products={products} formatPriceLabel={formatPriceLabel} />
          )}
          {activeTab === "reviews" && visibility.reviews && reviews.length > 0 && (
            <ReviewsList reviews={reviews} />
          )}
          {activeTab === "faq" && visibility.faq && faqs.length > 0 && (
            <FaqList items={faqs} />
          )}
        </main>

        {/* Desktop CTA */}
        <DesktopCTA
          nextSlot={nextSlot}
          accentColor={accentColor}
          selectedService={selectedService}
          onBook={handleBook}
          formatPriceLabel={formatPriceLabel}
        />

        {/* Sticky CTA (Mobile) */}
        <MobileCTA
          nextSlot={nextSlot}
          accentColor={accentColor}
          selectedService={selectedService}
          onBook={handleBook}
          formatPriceLabel={formatPriceLabel}
        />
      </div>
    </ThemeShell>
  );
}

// ============================================================
// Creator Profile Header
// ============================================================

function CreatorProfileHeader({
  name,
  tagline,
  bio,
  languages,
  photoUrl,
  coverImage,
  accentColor,
  bgColor,
  hasAvailability,
  showAbout,
  socialLinks,
}: {
  name: string;
  tagline: string;
  bio: string;
  languages: string[];
  photoUrl?: string | null;
  coverImage: string | null;
  accentColor: string;
  bgColor: string;
  hasAvailability: boolean;
  showAbout: boolean;
  socialLinks: Array<{ label: string; url: string; icon: React.ReactNode }>;
}) {
  return (
    <div className="relative">
      {/* 1. Banner - h-40, full width with fade */}
      <div className="relative h-44 w-full overflow-hidden md:h-56">
        {coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverImage}
            alt="Cover"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full" style={{ backgroundColor: accentColor }} />
        )}
        {/* Banner Fade Overlay - seamless transition to page background */}
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[var(--bg-page)]"
        />
      </div>

      {/* 2. Avatar - Centered, overlapping (-mt-14) */}
      <div className="relative flex justify-center">
        <div className="relative -mt-14 md:-mt-16">
          {/* Avatar circle */}
          <div
            className="h-28 w-28 overflow-hidden rounded-full border-[4px] md:h-32 md:w-32"
            style={{ borderColor: bgColor }}
          >
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photoUrl}
                alt={name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-stone-200 text-2xl font-semibold text-stone-400">
                {name.charAt(0)}
              </div>
            )}
          </div>
          {/* Live Status Indicator */}
          {hasAvailability && <LiveStatusIndicator />}
        </div>
      </div>

      {/* 3. Identity Block - Generous spacing */}
      <div className="mt-6 space-y-3 text-center">
        <h1
          className="text-3xl font-semibold text-stone-900 break-words md:text-4xl"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {name}
        </h1>
        {tagline && (
          <p className="text-sm text-stone-500 break-words">{tagline}</p>
        )}
      </div>

      {/* 4. Social Icons */}
      {socialLinks.length > 0 && (
        <div className="mt-4 flex justify-center">
          <div className="flex items-center gap-3">
            {socialLinks.map((link) => (
              <a
                key={link.label}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-stone-200 text-stone-600 transition hover:border-stone-300 hover:text-stone-900"
                title={link.label}
                aria-label={link.label}
              >
                {link.icon}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* 5. Info Chip Row (Metadata Scroll) */}
      {languages.length > 0 && (
        <div className="mt-4 flex justify-center overflow-x-auto px-4 py-2 no-scrollbar">
          <div className="flex gap-3">
            {languages.map((lang) => (
              <InfoChip key={lang} icon="flag">{lang}</InfoChip>
            ))}
          </div>
        </div>
      )}

      {/* 6. About Block - max-w-xs mx-auto */}
      {showAbout && bio && (
        <div className="mx-auto mt-4 w-full max-w-3xl px-4 text-center sm:px-6">
          <p className="text-sm leading-relaxed text-stone-600 break-words md:text-base">{bio}</p>
        </div>
      )}

      {/* 7. Signature - Sign-off for bio */}
      {showAbout ? <SignatureBlock firstName={name.split(" ")[0]} /> : null}
    </div>
  );
}

// ============================================================
// Services List (Selectable Cards)
// ============================================================

function ServicesList({
  services,
  accentColor,
  formatPriceLabel,
  selectedId,
  onSelect,
}: {
  services: ServiceData[];
  accentColor: string;
  formatPriceLabel: (amount?: number | null, currency?: string | null) => string;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <section className="space-y-3 py-6">
      {services.map((service, index) => {
        const isSelected = service.id === selectedId;
        const isSignature = index === 0;

        return (
          <button
            key={service.id}
            type="button"
            onClick={() => onSelect(service.id)}
            className={cn(
              "relative w-full rounded-xl text-left transition-all",
              // Signature Service (First Item) - Premium styling
              isSignature && !isSelected && "p-6 bg-white border border-[var(--accent-color)]/20 shadow-[0_8px_30px_-10px_rgba(0,0,0,0.08)]",
              // Regular Items - Flat styling
              !isSignature && !isSelected && "p-4 border border-stone-100 bg-white shadow-sm hover:shadow-md",
              // Selected State (any item)
              isSelected && "p-4 border-transparent bg-[var(--accent-color)]/5 ring-2 ring-[var(--accent-color)]",
              // Signature + Selected: use signature padding
              isSignature && isSelected && "p-6"
            )}
          >
            {/* "Popular" Badge for Signature Service */}
            {isSignature && (
              <span className="absolute top-3 right-3 text-[10px] font-semibold uppercase tracking-widest text-[var(--accent-color)]">
                Popular
              </span>
            )}
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1 pr-4">
                <p className={cn(
                  "font-medium text-stone-900 break-words",
                  isSignature ? "text-base" : "text-sm"
                )}>{service.name}</p>
                {service.description && (
                  <p className={cn(
                    "mt-1 text-stone-500 line-clamp-2 break-words",
                    isSignature ? "text-sm" : "text-xs"
                  )}>{service.description}</p>
                )}
                {service.duration_minutes && (
                  <p className="mt-1 text-xs text-stone-400">{service.duration_minutes} min</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "font-bold text-stone-900 tabular-nums",
                  isSignature ? "text-xl" : "text-lg"
                )}>
                  {formatPriceLabel(service.price, service.currency)}
                </span>
                {/* Checkmark for selected state */}
                {isSelected && (
                  <span
                    className="flex h-5 w-5 items-center justify-center rounded-full text-white"
                    style={{ backgroundColor: accentColor }}
                  >
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </section>
  );
}

// ============================================================
// Products List
// ============================================================

function ProductsList({
  products,
  formatPriceLabel,
}: {
  products: ProductData[];
  formatPriceLabel: (amount?: number | null, currency?: string | null) => string;
}) {
  return (
    <section className="py-6">
      <div className="space-y-3">
        {products.map((product) => (
          <div
            key={product.id}
            className="rounded-xl border border-black/5 bg-white/80 p-4"
          >
            <p className="text-sm font-medium text-stone-900 break-words">{product.title}</p>
            {product.description && (
              <p className="mt-1 text-xs text-stone-500 line-clamp-2 break-words">{product.description}</p>
            )}
            <p className="text-sm font-semibold text-stone-900 mt-2">
              {product.price_cents != null
                ? formatPriceLabel(product.price_cents, product.currency)
                : "Free"}
            </p>
            <div className="mt-3">
              <ProductPurchaseForm
                productId={product.id}
                fullWidth
                buttonLabel="Buy now"
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ============================================================
// Reviews List
// ============================================================

function ReviewsList({ reviews }: { reviews: ReviewData[] }) {
  return (
    <section className="py-6">
      <div className="space-y-3">
        {reviews.map((review, idx) => (
          <div
            key={`${review.author}-${idx}`}
            className="rounded-xl border border-black/5 bg-stone-50 p-4"
          >
            <p className="text-sm text-stone-700 break-words">&ldquo;{review.quote}&rdquo;</p>
            <p className="mt-2 text-xs font-medium text-stone-500 break-words">&mdash; {review.author}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ============================================================
// Mobile CTA (Smart Button)
// ============================================================

function MobileCTA({
  nextSlot,
  accentColor,
  selectedService,
  onBook,
  formatPriceLabel,
}: {
  nextSlot?: string | null;
  accentColor: string;
  selectedService?: ServiceData | null;
  onBook?: () => void;
  formatPriceLabel: (amount?: number | null, currency?: string | null) => string;
}) {
  return (
    <div className="fixed bottom-0 left-0 z-50 w-full border-t border-black/5 bg-white/90 px-4 pt-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] backdrop-blur-md md:hidden">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          {selectedService ? (
            <>
              <p className="text-xs uppercase tracking-[0.12em] text-stone-500">Selected</p>
              <p className="text-sm font-medium text-stone-900 break-words">
                {selectedService.name} • {formatPriceLabel(selectedService.price, selectedService.currency)}
              </p>
            </>
          ) : nextSlot ? (
            <>
              <p className="text-xs uppercase tracking-[0.12em] text-stone-500">Next Available</p>
              <p className="text-sm font-medium text-stone-900 break-words">{nextSlot}</p>
            </>
          ) : (
            <p className="text-sm font-medium text-stone-500">Choose a service to book</p>
          )}
        </div>
        <button
          type="button"
          onClick={onBook}
          disabled={!selectedService}
          className={cn(
            "shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold shadow-sm transition-all",
            selectedService
              ? "text-white"
              : "cursor-not-allowed bg-stone-200 text-stone-400"
          )}
          style={selectedService ? { backgroundColor: accentColor } : undefined}
        >
          {selectedService ? `Book ${selectedService.name}` : "Select a Service"}
        </button>
      </div>
    </div>
  );
}

// ============================================================
// Desktop CTA
// ============================================================

function DesktopCTA({
  nextSlot,
  accentColor,
  selectedService,
  onBook,
  formatPriceLabel,
}: {
  nextSlot?: string | null;
  accentColor: string;
  selectedService?: ServiceData | null;
  onBook?: () => void;
  formatPriceLabel: (amount?: number | null, currency?: string | null) => string;
}) {
  return (
    <div className="hidden md:block">
      <div className="mx-auto w-full max-w-3xl px-4 pb-12 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-black/5 bg-white/90 px-6 py-4 shadow-sm">
          <div className="min-w-0 flex-1">
            {selectedService ? (
              <>
                <p className="text-xs uppercase tracking-[0.12em] text-stone-500">Selected</p>
                <p className="text-sm font-medium text-stone-900 break-words">
                  {selectedService.name} • {formatPriceLabel(selectedService.price, selectedService.currency)}
                </p>
              </>
            ) : nextSlot ? (
              <>
                <p className="text-xs uppercase tracking-[0.12em] text-stone-500">Next Available</p>
                <p className="text-sm font-medium text-stone-900 break-words">{nextSlot}</p>
              </>
            ) : (
              <p className="text-sm font-medium text-stone-500">Choose a service to book</p>
            )}
          </div>
          <button
            type="button"
            onClick={onBook}
            disabled={!selectedService}
            className={cn(
              "shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold shadow-sm transition-all",
              selectedService
                ? "text-white"
                : "cursor-not-allowed bg-stone-200 text-stone-400"
            )}
            style={selectedService ? { backgroundColor: accentColor } : undefined}
          >
            {selectedService ? `Book ${selectedService.name}` : "Select a Service"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// FAQ List
// ============================================================

function FaqList({ items }: { items: FAQItem[] }) {
  return (
    <section className="space-y-3 py-6">
      {items.map((item, idx) => (
        <details
          key={`${item.q}-${idx}`}
          className="group rounded-xl border border-black/5 bg-white/80 p-4"
        >
          <summary className="cursor-pointer list-none text-sm font-medium text-stone-900">
            <span className="flex items-center justify-between gap-3">
              <span className="min-w-0 flex-1 break-words">{item.q}</span>
              <span className="text-stone-400 transition-transform group-open:rotate-180">▾</span>
            </span>
          </summary>
          <div className="mt-3 text-sm leading-relaxed text-stone-600 break-words">
            {item.a}
          </div>
        </details>
      ))}
    </section>
  );
}

// ============================================================
// Info Chip - Pill-shaped badge for metadata
// ============================================================

function InfoChip({ icon, children }: { icon: "flag" | "location" | "experience"; children: React.ReactNode }) {
  const iconMap = {
    flag: (
      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
        <line x1="4" y1="22" x2="4" y2="15" />
      </svg>
    ),
    location: (
      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
    experience: (
      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c3 3 9 3 12 0v-5" />
      </svg>
    ),
  };

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-transparent px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-stone-600">
      {iconMap[icon]}
      {children}
    </span>
  );
}

// ============================================================
// Live Status Indicator - Pulsing green dot for availability
// ============================================================

function LiveStatusIndicator() {
  return (
    <div
      className="absolute bottom-1 right-1 flex items-center justify-center"
      title="Accepting new students"
    >
      {/* Ping animation (outer) */}
      <span className="absolute h-3 w-3 animate-ping rounded-full bg-emerald-400 opacity-75" />
      {/* Solid dot (inner) */}
      <span className="relative h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
    </div>
  );
}

// ============================================================
// Signature Block - Graceful end to the scrolling experience
// ============================================================

function SignatureBlock({ firstName }: { firstName: string }) {
  const currentYear = new Date().getFullYear();

  return (
    <div className="mt-12 text-center">
      {/* Divider */}
      <div className="mx-auto h-px w-12 bg-stone-300" />

      {/* Signature */}
      <p
        className="mt-6 text-2xl text-stone-700 break-words"
        style={{ fontFamily: "'Brush Script MT', 'Segoe Script', cursive" }}
      >
        {firstName}
      </p>

      {/* Subtext */}
      <p className="mt-2 text-[10px] font-medium uppercase tracking-widest text-stone-400">
        TutorLingua Certified • Member since {currentYear}
      </p>
    </div>
  );
}
