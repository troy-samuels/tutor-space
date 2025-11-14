"use client";

import { useTransition } from "react";
import { Eye, EyeOff, Trash2 } from "lucide-react";
import {
  toggleDigitalProductPublish,
  deleteDigitalProduct,
} from "@/lib/actions/digital-products";

type DigitalProduct = {
  id: string;
  tutor_id: string;
  slug: string;
  title: string;
  description: string | null;
  price_cents: number;
  currency: string;
  fulfillment_type: string;
  storage_path: string | null;
  external_url: string | null;
  stripe_product_id: string | null;
  stripe_price_id: string | null;
  published: boolean;
  created_at: string;
};

type ProductListProps = {
  products: DigitalProduct[];
  profileUsername?: string | null;
};

export function DigitalProductList({ products, profileUsername }: ProductListProps) {
  const [isPending, startTransition] = useTransition();

  const handlePublish = (id: string, publish: boolean) => {
    startTransition(async () => {
      await toggleDigitalProductPublish(id, publish);
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this product? This cannot be undone.")) return;
    startTransition(async () => {
      await deleteDigitalProduct(id);
    });
  };

  if (products.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-border/70 bg-muted/40 px-6 py-8 text-center text-sm text-muted-foreground">
        No digital products yet. Use the form to add your first resource.
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {products.map((product) => {
        const priceLabel = `$${(product.price_cents / 100).toFixed(2)} ${product.currency.toUpperCase()}`;
        const shareUrl =
          profileUsername && product.published
            ? `${process.env.NEXT_PUBLIC_APP_URL || "https://app.tutorlingua.co"}/products/${profileUsername}#${product.slug}`
            : null;
        return (
          <div
            key={product.id}
            className="rounded-3xl border border-border bg-white/90 p-5 shadow-sm backdrop-blur"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-base font-semibold text-foreground">{product.title}</p>
                <p className="text-xs text-muted-foreground">{priceLabel}</p>
                {product.description ? (
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                    {product.description}
                  </p>
                ) : null}
                {shareUrl ? (
                  <p className="mt-2 text-xs text-brand-brown">
                    Share link: <span className="break-all">{shareUrl}</span>
                  </p>
                ) : null}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handlePublish(product.id, !product.published)}
                  disabled={isPending}
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                    product.published
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {product.published ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  {product.published ? "Published" : "Hidden"}
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(product.id)}
                  disabled={isPending}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground transition hover:text-destructive"
                  aria-label="Delete product"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
