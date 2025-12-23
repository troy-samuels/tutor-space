import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProductPurchaseForm } from "@/components/digital-products/purchase-form";
import { formatCurrency } from "@/lib/utils";
import { normalizeUsernameSlug } from "@/lib/utils/username-slug";
import { generateProductCatalogSchema } from "@/lib/utils/structured-data";

type PageProps = {
  params: Promise<{ username: string }>;
};

type ProductRecord = {
  id: string;
  title: string;
  description: string | null;
  price_cents: number | null;
  currency: string | null;
  slug: string | null;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const supabase = await createClient();
  const rawLower = resolvedParams.username.trim().toLowerCase();
  const normalized = normalizeUsernameSlug(resolvedParams.username) || rawLower;

  const { data: profile } = await supabase
    .from("public_profiles")
    .select("full_name, username, bio, avatar_url, languages_taught")
    .eq("username", normalized)
    .single();

  if (!profile) {
    return {
      title: "Products Not Found | TutorLingua",
    };
  }

  const name = profile.full_name ?? profile.username ?? resolvedParams.username;

  // Extract languages
  const languages = Array.isArray(profile.languages_taught)
    ? profile.languages_taught
    : profile.languages_taught
      ?.split(",")
      .map((lang: string) => lang.trim())
      .filter(Boolean) ?? [];

  const languagesList = languages.join(", ") || "Language";

  const title = `${languagesList} Learning Resources by ${name} | TutorLingua`;
  const description = `Browse ${languagesList} learning materials from ${name}. Digital resources including PDFs, worksheets, ebooks, and more to accelerate your language learning.`;

  return {
    title,
    description,
    keywords: [
      name,
      ...languages.map((lang: string) => `${lang} worksheets`),
      ...languages.map((lang: string) => `${lang} learning materials`),
      ...languages.map((lang: string) => `learn ${lang}`),
      "language learning resources",
      "digital language materials",
      "tutor resources",
    ].filter(Boolean),
    alternates: {
      canonical: `/products/${profile.username ?? resolvedParams.username}`,
    },
    openGraph: {
      title: `Learning Resources by ${name}`,
      description: `Digital ${languagesList} learning materials and resources`,
      type: "website",
      url: `https://tutorlingua.co/products/${profile.username ?? resolvedParams.username}`,
      images: profile.avatar_url ? [{ url: profile.avatar_url }] : undefined,
    },
    twitter: {
      card: "summary",
      title: `${name}'s Resources`,
      description: `${languagesList} learning materials on TutorLingua`,
      images: profile.avatar_url ? [profile.avatar_url] : undefined,
    },
  };
}

export default async function TutorProductsPage({ params }: PageProps) {
  const resolvedParams = await params;
  const supabase = await createClient();
  const rawLower = resolvedParams.username.trim().toLowerCase();
  const normalized = normalizeUsernameSlug(resolvedParams.username) || rawLower;

  let profileResult = await supabase
    .from("public_profiles")
    .select("id, full_name, bio, username")
    .eq("username", normalized)
    .maybeSingle();

  if (!profileResult.data && rawLower && rawLower !== normalized) {
    profileResult = await supabase
      .from("public_profiles")
      .select("id, full_name, bio, username")
      .eq("username", rawLower)
      .maybeSingle();
  }

  const profile = profileResult.data;

  if (!profile) {
    notFound();
  }

  if (profile.username && profile.username !== resolvedParams.username) {
    redirect(`/products/${profile.username}`);
  }

  const { data: products } = await supabase
    .from("digital_products")
    .select("id, title, description, price_cents, currency, slug")
    .eq("tutor_id", profile.id)
    .eq("published", true)
    .order("created_at", { ascending: false });

  // Generate structured data for product catalog
  const structuredData = products && products.length > 0
    ? generateProductCatalogSchema(
        { username: profile.username!, full_name: profile.full_name || "" },
        products as ProductRecord[]
      )
    : null;

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-12">
      {/* Structured Data for SEO & LLMs */}
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
      )}

      <header className="space-y-2 text-center">
        <p className="text-3xl font-semibold text-foreground">{profile.full_name}</p>
        <p className="text-sm text-muted-foreground">{profile.bio}</p>
      </header>

      {!products || products.length === 0 ? (
        <div className="rounded-3xl border border-border/70 bg-white/90 p-6 text-center text-sm text-muted-foreground">
          No digital products available yet.
        </div>
      ) : (
        <div className="grid gap-4">
          {products.map((product) => (
            <div key={product.id} className="rounded-3xl border border-border bg-white/90 p-6 shadow-sm">
              <p className="text-lg font-semibold text-foreground">{product.title}</p>
              <p className="text-sm text-muted-foreground">{product.description}</p>
              <p className="mt-2 text-base font-semibold text-primary">
                {product.price_cents != null
                  ? formatCurrency(product.price_cents, product.currency?.toUpperCase() || "USD")
                  : "Free"}
              </p>
              <div className="mt-4">
                <ProductPurchaseForm productId={product.id} tutorUsername={profile.username!} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
