"use client";

import { useActionState } from "react";
import { Loader2, Upload } from "lucide-react";
import {
  createDigitalProduct,
  type ProductFormState,
} from "@/lib/actions/digital-products";

const initialState: ProductFormState = {};

export function DigitalProductForm() {
  const [state, formAction, isPending] = useActionState(createDigitalProduct, initialState);

  return (
    <form action={formAction} className="space-y-4 rounded-3xl border border-border bg-white/90 p-6 shadow-sm">
      <div>
        <p className="text-sm font-semibold text-foreground">Add a digital product</p>
        <p className="text-xs text-muted-foreground">
          Upload study guides, async lesson packs, or templates. Students receive a download link after payment.
        </p>
      </div>

      {state.error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {state.error}
        </div>
      ) : null}
      {state.success ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
          {state.success}
        </div>
      ) : null}

      <div className="space-y-2">
        <label className="text-sm font-semibold text-foreground">Title</label>
        <input
          name="title"
          required
          className="w-full rounded-xl border border-border bg-transparent px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="IELTS Writing Task 2 Toolkit"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-foreground">Description</label>
        <textarea
          name="description"
          rows={3}
          className="w-full rounded-2xl border border-border bg-transparent px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="What’s included, who it’s for, and how to use it."
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-2 sm:col-span-2">
          <label className="text-sm font-semibold text-foreground">Price</label>
          <input
            type="number"
            step="0.5"
            min="1"
            name="price"
            required
            className="w-full rounded-xl border border-border bg-transparent px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="29"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground">Currency</label>
          <select
            name="currency"
            className="w-full rounded-xl border border-border bg-transparent px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="usd">USD</option>
            <option value="eur">EUR</option>
            <option value="gbp">GBP</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-foreground">Fulfillment type</label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex cursor-pointer flex-col gap-2 rounded-2xl border border-border/70 bg-muted/30 px-4 py-3">
            <div className="flex items-center gap-2">
              <input type="radio" name="fulfillment_type" value="file" defaultChecked />
              <div>
                <p className="text-sm font-semibold text-foreground">Upload file</p>
                <p className="text-xs text-muted-foreground">PDF, ZIP, audio, etc.</p>
              </div>
            </div>
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-border/70 bg-white px-3 py-2 text-xs font-semibold text-muted-foreground hover:border-brand-brown/40">
              <Upload className="h-4 w-4" />
              Choose file
              <input type="file" name="file" className="sr-only" />
            </label>
          </label>
          <label className="flex cursor-pointer flex-col gap-2 rounded-2xl border border-border/70 bg-muted/30 px-4 py-3">
            <div className="flex items-center gap-2">
              <input type="radio" name="fulfillment_type" value="link" />
              <div>
                <p className="text-sm font-semibold text-foreground">External download link</p>
                <p className="text-xs text-muted-foreground">Use Google Drive, Loom, etc.</p>
              </div>
            </div>
            <input
              type="url"
              name="external_url"
              placeholder="https://drive.google.com/..."
              className="rounded-xl border border-border bg-white px-3 py-2 text-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </label>
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-brand-brown px-4 text-sm font-semibold text-white shadow transition hover:bg-brand-brown/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save product"}
      </button>
    </form>
  );
}
