import { createClient } from "@/lib/supabase/server";
import { DigitalProductForm } from "@/components/digital-products/product-form";
import { DigitalProductList } from "@/components/digital-products/product-list";
import { listDigitalProductsForTutor } from "@/lib/actions/marketplace";

export const dynamic = "force-dynamic";

export default async function DigitalProductsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="rounded-3xl border border-border bg-white/80 p-6 text-center text-sm text-muted-foreground">
        Sign in to manage digital products.
      </div>
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();

  const products = await listDigitalProductsForTutor();

  return (
    <div className="space-y-8">
      <div>
        <p className="text-2xl font-semibold text-foreground">Digital products</p>
        <p className="text-sm text-muted-foreground">
          Package worksheets, recordings, and async challenges into paid downloads.
        </p>
      </div>

      <DigitalProductForm />

      <DigitalProductList products={products} profileUsername={profile?.username} />
    </div>
  );
}
