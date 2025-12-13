"use client";

import { useEffect, useState, useTransition } from "react";
import {
  toggleDigitalProductPublish,
  deleteDigitalProduct,
} from "@/lib/actions/digital-products";
import type { DigitalProductRecord } from "@/lib/types/digital-product";
import { DigitalProductCard } from "./digital-product-card";

type StatusMessage = { type: "success" | "error"; message: string };

type ProductListProps = {
  products: DigitalProductRecord[];
  profileUsername?: string | null;
  onStatus?: (status: StatusMessage) => void;
  onCreateProduct?: () => void;
};

export function DigitalProductList({
  products,
  profileUsername,
  onStatus,
  onCreateProduct,
}: ProductListProps) {
  const [productList, setProductList] = useState<DigitalProductRecord[]>(products);
  const [activeProductId, setActiveProductId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setProductList(products);
  }, [products]);

  const handlePublish = (id: string, publish: boolean) => {
    setActiveProductId(id);
    startTransition(async () => {
      const result = await toggleDigitalProductPublish(id, publish);
      if (result?.error) {
        onStatus?.({ type: "error", message: result.error });
      } else {
        setProductList((prev) =>
          prev.map((product) =>
            product.id === id ? { ...product, published: publish } : product
          )
        );
        onStatus?.({
          type: "success",
          message: publish ? "Product published." : "Product hidden.",
        });
      }
      setActiveProductId(null);
    });
  };

  const handleDelete = (id: string) => {
    const confirmed = window.confirm("Delete this product? This cannot be undone.");
    if (!confirmed) return;

    setActiveProductId(id);
    startTransition(async () => {
      const result = await deleteDigitalProduct(id);
      if (result?.error) {
        onStatus?.({ type: "error", message: result.error });
      } else {
        setProductList((prev) => prev.filter((product) => product.id !== id));
        onStatus?.({ type: "success", message: "Product deleted." });
      }
      setActiveProductId(null);
    });
  };

  const handleCopyLink = async (url: string) => {
    await navigator.clipboard?.writeText(url);
    onStatus?.({ type: "success", message: "Link copied." });
  };

  if (productList.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-border/70 bg-white/80 px-6 py-8 text-center">
        <p className="text-base font-semibold text-foreground">No digital products yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Turn your best resources into instant downloads.
        </p>
        {onCreateProduct ? (
          <button
            type="button"
            onClick={onCreateProduct}
            className="mt-4 inline-flex h-10 items-center justify-center rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
          >
            Create product
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {productList.map((product) => {
        const shareUrl =
          profileUsername && product.published
            ? `${process.env.NEXT_PUBLIC_APP_URL || "https://app.tutorlingua.co"}/products/${profileUsername}#${product.slug}`
            : null;

        return (
          <DigitalProductCard
            key={product.id}
            product={product}
            shareUrl={shareUrl}
            isWorking={isPending && activeProductId === product.id}
            onPublishToggle={(publish) => handlePublish(product.id, publish)}
            onDelete={() => handleDelete(product.id)}
            onCopyLink={shareUrl ? () => handleCopyLink(shareUrl) : undefined}
          />
        );
      })}
    </div>
  );
}
