import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StudentPortalLayout } from "@/components/student-auth/StudentPortalLayout";
import { StudentLibraryGrid, type LibraryItem } from "@/components/student-auth/StudentLibraryGrid";
import { getStudentAvatarUrl } from "@/lib/actions/student-avatar";
import { getStudentDisplayName } from "@/lib/utils/student-name";

export const metadata = {
  title: "My Library | TutorLingua",
  description: "Access your purchased courses and downloads.",
};

export default async function StudentLibraryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/student/login");
  }

  const studentName = await getStudentDisplayName(supabase, user);
  // Fetch avatar and purchases in parallel
  const [avatarUrl, { data: purchases }] = await Promise.all([
    getStudentAvatarUrl(),
    supabase
    .from("digital_product_purchases")
    .select(`
      id,
      download_token,
      status,
      created_at,
      digital_products (
        id,
        title,
        description,
        fulfillment_type,
        external_url,
        storage_path,
        category
      )
    `)
    .eq("customer_email", user.email)
    .eq("status", "paid")
    .order("created_at", { ascending: false }),
  ]);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.tutorlingua.co";

  const items: LibraryItem[] = (purchases || []).map((purchase) => {
    const productData = Array.isArray(purchase.digital_products)
      ? purchase.digital_products[0]
      : purchase.digital_products;

    const downloadUrl = purchase.download_token
      ? `${appUrl}/api/digital-products/download/${purchase.download_token}`
      : null;

    return {
      id: productData?.id ?? purchase.id,
      title: productData?.title ?? "Digital product",
      description: productData?.description ?? null,
      category: productData?.category ?? null,
      fulfillment: productData?.fulfillment_type ?? "file",
      externalUrl: productData?.external_url ?? null,
      downloadUrl,
      coverUrl: null,
      progress: productData?.category === "course" ? 0 : null,
    };
  });

  return (
    <StudentPortalLayout studentName={studentName} avatarUrl={avatarUrl}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Library</p>
            <h1 className="font-serif text-3xl text-foreground">Your purchases</h1>
            <p className="text-sm text-muted-foreground">All downloads, courses, and videos you own.</p>
          </div>
        </div>

        <StudentLibraryGrid items={items} />
      </div>
    </StudentPortalLayout>
  );
}
