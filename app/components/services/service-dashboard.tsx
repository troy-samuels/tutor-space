"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Plus, Trash2, Pencil, Package, MoreVertical, Link as LinkIcon } from "lucide-react";
import { format } from "date-fns";
import type { ServiceRecord } from "@/lib/types/service";
import type { DigitalProductRecord } from "@/lib/types/digital-product";
import type { ServiceOfferType, ServiceInput } from "@/lib/validators/service";
import {
  createService,
  updateService,
  deleteService,
} from "@/lib/actions/services";
import { saveServiceSubscriptionTiers } from "@/lib/actions/subscriptions";
import type { TierPricing } from "./SubscriptionTierInput";
import type { SessionPackageRecord } from "@/lib/types/session-package";
import type { SessionPackageInput } from "@/lib/validators/session-package";
import {
  createSessionPackage,
  updateSessionPackage,
  deleteSessionPackage,
} from "@/lib/actions/session-packages";
import { ServiceForm } from "@/components/services/service-form";
import { PackageForm } from "@/components/services/session-package-form";
import { DigitalProductForm } from "@/components/digital-products/product-form";
import { DigitalProductList } from "@/components/digital-products/product-list";
import { formatCurrency } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetOverlay } from "@/components/ui/sheet";
import { StatusAlert } from "@/components/ui/status-alert";

type ServiceWithPackages = ServiceRecord & {
  packages: SessionPackageRecord[];
  subscriptionTiers?: TierPricing[];
};

type ServiceDashboardProps = {
  services: ServiceWithPackages[];
  defaultCurrency: string;
  digitalProducts: DigitalProductRecord[];
};

const OFFER_TYPE_STYLES: Record<ServiceOfferType, { label: string; className: string }> = {
  subscription: { label: "Subscription", className: "bg-indigo-50 text-indigo-700" },
  lesson_block: { label: "Lesson block", className: "bg-sky-50 text-sky-700" },
  one_off: { label: "One-off", className: "bg-slate-100 text-slate-700" },
  trial: { label: "Trial", className: "bg-amber-50 text-amber-700" },
};

export function ServiceDashboard({
  services,
  defaultCurrency,
  digitalProducts,
}: ServiceDashboardProps) {
  const router = useRouter();
  const [serviceList, setServiceList] = useState<ServiceWithPackages[]>(services);
  const [activeForm, setActiveForm] = useState<
    | { type: "create" }
    | { type: "edit"; service: ServiceWithPackages }
    | null
  >(null);
  const [packageContext, setPackageContext] = useState<{
    service: ServiceWithPackages;
    package?: SessionPackageRecord;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<"services" | "digital">("services");
  const [productSheetOpen, setProductSheetOpen] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleStatus(next: { type: "success" | "error"; message: string } | null) {
    setStatus(next);
    if (next) {
      // Show errors longer so users can read them
      const timeout = next.type === "error" ? 8000 : 4000;
      setTimeout(() => setStatus(null), timeout);
    }
  }

  function upsertService(service: ServiceRecord) {
    setServiceList((prev) => {
      const existing = prev.find((item) => item.id === service.id);
      if (existing) {
        return prev.map((item) =>
          item.id === service.id
            ? { ...item, ...service }
            : item
        );
      }
      return [...prev, { ...service, packages: [] }];
    });
  }

  function removeService(id: string) {
    setServiceList((prev) => prev.filter((item) => item.id !== id));
  }

  function upsertPackage(serviceId: string, pkg: SessionPackageRecord) {
    setServiceList((prev) =>
      prev.map((service) =>
        service.id === serviceId
          ? {
              ...service,
              packages: service.packages.some((item) => item.id === pkg.id)
                ? service.packages.map((item) => (item.id === pkg.id ? pkg : item))
                : [...service.packages, pkg],
            }
          : service
      )
    );
  }

  function removePackage(serviceId: string, packageId: string) {
    setServiceList((prev) =>
      prev.map((service) =>
        service.id === serviceId
          ? { ...service, packages: service.packages.filter((pkg) => pkg.id !== packageId) }
          : service
      )
    );
  }

  function mutateService(
    callback: () => Promise<{ error?: string; data?: ServiceRecord }>
  ) {
    startTransition(() => {
      (async () => {
        const result = await callback();
        if (result.error) {
          handleStatus({ type: "error", message: result.error });
          return;
        }
        if (result.data) {
          upsertService(result.data);
        }
        handleStatus({ type: "success", message: "Service saved." });
        setActiveForm(null);
      })();
    });
  }

  function mutatePackage(
    serviceId: string,
    callback: () => Promise<{ error?: string; data?: SessionPackageRecord }>
  ) {
    startTransition(() => {
      (async () => {
        const result = await callback();
        if (result.error) {
          handleStatus({ type: "error", message: result.error });
          return;
        }
        if (result.data) {
          upsertPackage(serviceId, result.data);
        }
        handleStatus({ type: "success", message: "Package saved." });
        setPackageContext(null);
      })();
    });
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          {activeTab === "digital" ? "Digital products" : "Services"}
        </h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-full bg-secondary/50 p-1 text-xs font-semibold text-muted-foreground">
            <button
              type="button"
              onClick={() => {
                setActiveTab("services");
                setProductSheetOpen(false);
              }}
              className={`rounded-full px-3 py-1.5 transition ${activeTab === "services" ? "bg-white shadow-sm text-foreground" : ""}`}
            >
              Services
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("digital");
                setActiveForm(null);
                setPackageContext(null);
              }}
              className={`rounded-full px-3 py-1.5 transition ${activeTab === "digital" ? "bg-white shadow-sm text-foreground" : ""}`}
            >
              Digital Products
            </button>
          </div>
          {activeTab === "services" ? (
            <button
              type="button"
              onClick={() => setActiveForm({ type: "create" })}
              className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
            >
              <Plus className="mr-2 h-4 w-4" />
              New service
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setProductSheetOpen(true)}
              className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
            >
              <Plus className="mr-2 h-4 w-4" />
              New product
            </button>
          )}
        </div>
      </header>

      {status ? (
        <StatusAlert
          status={status.type === "success" ? "success" : "error"}
          title={status.type === "success" ? "Changes saved" : "Update failed"}
          message={status.message}
        />
      ) : null}

      <AnimatePresence mode="wait" initial={false}>
        {activeTab === "services" ? (
          <motion.div
            key="services-tab"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="space-y-8"
          >
            {serviceList.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border bg-muted/30 p-8 text-center">
                <p className="text-lg font-semibold text-foreground">No services yet</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Add your first offer so students can book you.
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveForm({ type: "create" })}
                    className="inline-flex h-10 items-center justify-center rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    New service
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("digital");
                      setProductSheetOpen(true);
                    }}
                    className="inline-flex h-10 items-center justify-center rounded-full border border-border px-4 text-sm font-semibold text-foreground shadow-sm transition hover:bg-muted"
                  >
                    <Package className="mr-2 h-4 w-4" />
                    Digital products
                  </button>
                </div>
              </div>
            ) : null}

            {activeForm ? (
              <div className="rounded-3xl border border-border bg-white/90 p-6 shadow-sm backdrop-blur">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-foreground">
                      {activeForm.type === "create" ? "New service" : "Edit service"}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Define what you offer, how long it lasts, and how it&apos;s booked.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveForm(null)}
                    className="text-xs font-semibold text-muted-foreground transition hover:text-primary"
                  >
                    Cancel
                  </button>
                </div>
                <div className="mt-4">
                  <ServiceForm
                    defaultCurrency={defaultCurrency}
                    initialValues={activeForm.type === "edit" ? activeForm.service : undefined}
                    initialSubscriptionTiers={activeForm.type === "edit" ? activeForm.service.subscriptionTiers : undefined}
                    loading={isPending}
                    existingNames={serviceList.map((s) => s.name)}
                    onCancel={() => setActiveForm(null)}
                    onSubmit={(values, subscriptionTiers) => {
                      const payload: ServiceInput = {
                        ...values,
                      };

                      // Wrapper that creates/updates service then saves subscription tiers
                      const saveWithTiers = async (
                        serviceAction: () => Promise<{ error?: string; data?: ServiceRecord }>
                      ): Promise<{ error?: string; data?: ServiceRecord }> => {
                        const result = await serviceAction();
                        if (result.error || !result.data) {
                          return result;
                        }

                        // Save subscription tiers if this is a subscription offer type
                        if (subscriptionTiers && values.offer_type === "subscription") {
                          const tiersWithCents = subscriptionTiers.map((t) => ({
                            tier_id: t.tier_id,
                            price_cents: t.price !== null ? Math.round(t.price * 100) : null,
                          }));

                          const tiersResult = await saveServiceSubscriptionTiers(
                            result.data.id,
                            true,
                            tiersWithCents
                          );

                          if (tiersResult.error) {
                            return { error: tiersResult.error, data: result.data };
                          }
                        }

                        return result;
                      };

                      if (activeForm.type === "edit") {
                        mutateService(() => saveWithTiers(() => updateService(activeForm.service.id, payload)));
                      } else {
                        mutateService(() => saveWithTiers(() => createService(payload)));
                      }
                    }}
                  />
                </div>
              </div>
            ) : null}

            <div className="space-y-6">
              {serviceList.length === 0 ? (
                <div className="rounded-3xl border border-border bg-white/90 p-8 text-center text-sm text-muted-foreground shadow-sm backdrop-blur">
                  You haven’t published any services yet. Add your first offer above to open booking.
                </div>
              ) : (
                serviceList.map((service) => {
                  const offerMeta =
                    OFFER_TYPE_STYLES[service.offer_type] ?? OFFER_TYPE_STYLES.one_off;
                  return (
                    <div
                      key={service.id}
                      className={`space-y-4 rounded-3xl bg-white p-8 shadow-sm transition hover:shadow-md ${
                        service.is_active ? "" : "opacity-70"
                      }`}
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
                            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                              {service.name}
                            </h2>
                          </div>
                          {service.description ? (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {service.description}
                            </p>
                          ) : null}
                          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            <div className="flex items-center gap-3">
                              <span className="text-xl font-semibold tracking-tight text-foreground">
                                {service.price === 0
                                  ? "Free"
                                  : formatCurrency(service.price, service.currency ?? defaultCurrency)}
                              </span>
                              <span className="h-4 w-px bg-stone-200" aria-hidden />
                              <span className="text-muted-foreground">
                                {service.duration_minutes} min
                              </span>
                            </div>
                            <span>{offerMeta.label}</span>
                            {service.requires_approval ? <span>Manual approval</span> : <span>Auto-book</span>}
                            <span>Updated {format(new Date(service.updated_at), "MMM d, yyyy")}</span>
                            <Link
                              href={`/book?service=${service.id}`}
                              className="inline-flex items-center gap-1 text-muted-foreground transition hover:text-foreground"
                              aria-label={`Open booking link for ${service.name}`}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5 21 3m0 0h-5.25M21 3v5.25M10.5 13.5 3 21m0 0h5.25M3 21v-5.25" />
                              </svg>
                            </Link>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-secondary/60 text-muted-foreground transition hover:bg-secondary"
                              aria-label="Service options"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem
                              onClick={() => setActiveForm({ type: "edit", service })}
                              className="flex items-center gap-2"
                            >
                              <Pencil className="h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                const confirmed = window.confirm(
                                  `Are you sure you want to delete "${service.name}"? This action cannot be undone.`
                                );
                                if (!confirmed) return;

                                startTransition(() => {
                                  (async () => {
                                    const result = await deleteService(service.id);
                                    if (result.error) {
                                      handleStatus({ type: "error", message: result.error });
                                      return;
                                    }
                                    removeService(service.id);
                                    handleStatus({ type: "success", message: "Service removed." });
                                  })();
                                });
                              }}
                              className="flex items-center gap-2 text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                navigator.clipboard?.writeText(`${window.location.origin}/book?service=${service.id}`);
                                handleStatus({ type: "success", message: "Link copied." });
                              }}
                              className="flex items-center gap-2"
                            >
                              <LinkIcon className="h-4 w-4" />
                              Copy link
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {service.packages.length > 0 ? (
                        <div className="mt-6 space-y-2">
                          {service.packages.map((pkg) => (
                            <div
                              key={pkg.id}
                              className="flex items-center justify-between rounded-xl bg-stone-50 px-4 py-3 text-sm text-foreground"
                            >
                              <div className="min-w-0">
                                <p className="font-semibold">
                                  {pkg.name || `${pkg.session_count ?? 1} lessons`}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {pkg.session_count ? `${pkg.session_count} sessions` : "Flexible sessions"} • {pkg.total_minutes} minutes total
                                </p>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span className="font-semibold text-foreground whitespace-nowrap">
                                  {formatCurrency(pkg.price_cents, pkg.currency)} {pkg.currency}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setPackageContext({ service, package: pkg })}
                                  className="text-primary hover:underline"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const confirmed = window.confirm(
                                      `Are you sure you want to delete the package "${pkg.name}"? This action cannot be undone.`
                                    );
                                    if (!confirmed) return;

                                    startTransition(() => {
                                      (async () => {
                                        const result = await deleteSessionPackage(pkg.id);
                                        if (result.error) {
                                          handleStatus({ type: "error", message: result.error });
                                          return;
                                        }
                                        removePackage(service.id, pkg.id);
                                        handleStatus({ type: "success", message: "Package removed." });
                                      })();
                                    });
                                  }}
                                  className="text-destructive hover:underline"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setPackageContext({ service })}
                          className="mt-6 inline-flex items-center gap-2 rounded-full bg-secondary/60 px-3 py-2 text-xs font-semibold text-muted-foreground transition hover:bg-secondary"
                        >
                          <Plus className="h-4 w-4" />
                          Add package bundle
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {packageContext ? (
              <div className="rounded-3xl border border-border bg-white/90 p-6 shadow-sm backdrop-blur">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-foreground">
                      {packageContext.package ? "Edit package" : `New package for ${packageContext.service.name}`}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Encourage pre-paid bundles to improve retention and cash flow.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPackageContext(null)}
                    className="text-xs font-semibold text-muted-foreground hover:text-primary"
                  >
                    Cancel
                  </button>
                </div>
                <div className="mt-4">
                  <PackageForm
                    service={packageContext.service}
                    initialValues={packageContext.package}
                    loading={isPending}
                    onCancel={() => setPackageContext(null)}
                    onSubmit={(values) => {
                      const payload: SessionPackageInput = values;
                      if (packageContext.package) {
                        mutatePackage(packageContext.service.id, () =>
                          updateSessionPackage(packageContext.package!.id, payload)
                        );
                      } else {
                        mutatePackage(packageContext.service.id, () =>
                          createSessionPackage(packageContext.service.id, payload)
                        );
                      }
                    }}
                  />
                </div>
              </div>
            ) : null}
          </motion.div>
        ) : (
          <motion.div
            key="digital-tab"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="space-y-4"
          >
            <div className="rounded-3xl border border-border bg-white/90 p-6 shadow-sm backdrop-blur">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">Digital library</p>
                  <p className="text-xs text-muted-foreground">
                    Upload PDFs, templates, or lesson packs for async students.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setProductSheetOpen(true)}
                  className="inline-flex h-10 items-center justify-center rounded-full border border-border px-4 text-xs font-semibold text-foreground shadow-sm transition hover:bg-muted"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create product
                </button>
              </div>
              <div className="mt-4">
                <DigitalProductList
                  products={digitalProducts}
                  onStatus={handleStatus}
                  onCreateProduct={() => setProductSheetOpen(true)}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Sheet open={productSheetOpen} onOpenChange={setProductSheetOpen} side="right">
        <SheetOverlay onClick={() => setProductSheetOpen(false)} />
        <SheetContent className="flex w-full max-w-xl flex-col overflow-y-auto bg-white p-6 shadow-xl" side="right">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Digital product</p>
            <p className="text-2xl font-semibold tracking-tight text-foreground">Create Product</p>
          </div>
          <DigitalProductForm
            onSuccess={() => {
              handleStatus({ type: "success", message: "Product saved." });
              setProductSheetOpen(false);
              setActiveTab("digital");
              router.refresh();
            }}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}
