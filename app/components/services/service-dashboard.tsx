"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { Plus, Sparkles, Users, Clock, Trash2, Pencil } from "lucide-react";
import { format } from "date-fns";
import type { ServiceRecord } from "@/lib/actions/services";
import {
  createService,
  updateService,
  deleteService,
  type ServiceInput,
} from "@/lib/actions/services";
import type { SessionPackageRecord } from "@/lib/actions/session-packages";
import {
  createSessionPackage,
  updateSessionPackage,
  deleteSessionPackage,
  type SessionPackageInput,
} from "@/lib/actions/session-packages";
import { ServiceForm } from "@/components/services/service-form";
import { PackageForm } from "@/components/services/session-package-form";
import { formatCurrency } from "@/lib/utils";

type ServiceWithPackages = ServiceRecord & { packages: SessionPackageRecord[] };

export function ServiceDashboard({
  services,
  defaultCurrency,
}: {
  services: ServiceWithPackages[];
  defaultCurrency: string;
}) {
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
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const activeCount = useMemo(
    () => serviceList.filter((service) => service.is_active).length,
    [serviceList]
  );
  const totalMinutes = useMemo(
    () => serviceList.reduce((sum, service) => sum + service.duration_minutes, 0),
    [serviceList]
  );
  const totalPackages = useMemo(
    () => serviceList.reduce((sum, service) => sum + service.packages.length, 0),
    [serviceList]
  );

  function handleStatus(next: { type: "success" | "error"; message: string } | null) {
    setStatus(next);
    if (next) {
      setTimeout(() => setStatus(null), 4000);
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
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Services & packages</h1>
          <p className="text-sm text-muted-foreground">
            Shape how students book you. Publish 1:1 lessons, high-converting bundles, and future group sessions.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setActiveForm({ type: "create" })}
          className="inline-flex h-10 items-center justify-center rounded-full bg-brand-brown px-4 text-sm font-semibold text-brand-white shadow-sm transition hover:bg-brand-brown/90"
        >
          <Plus className="mr-2 h-4 w-4" />
          New service
        </button>
      </header>

      {status ? (
        <p
          className={`rounded-2xl px-4 py-3 text-sm ${
            status.type === "success"
              ? "bg-emerald-50 text-emerald-600"
              : "bg-destructive/10 text-destructive"
          }`}
        >
          {status.message}
        </p>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={<Sparkles className="h-4 w-4 text-brand-brown" />}
          label="Active services"
          value={activeCount}
        />
        <StatCard
          icon={<Clock className="h-4 w-4 text-brand-brown" />}
          label="Total lesson minutes"
          value={totalMinutes}
        />
        <StatCard
          icon={<Users className="h-4 w-4 text-brand-brown" />}
          label="Packages"
          value={totalPackages}
        />
      </section>

      {activeForm ? (
        <div className="rounded-3xl border border-brand-brown/20 bg-white/90 p-6 shadow-sm backdrop-blur">
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
              className="text-xs font-semibold text-muted-foreground transition hover:text-brand-brown"
            >
              Cancel
            </button>
          </div>
          <div className="mt-4">
            <ServiceForm
              defaultCurrency={defaultCurrency}
              initialValues={activeForm.type === "edit" ? activeForm.service : undefined}
              loading={isPending}
              onCancel={() => setActiveForm(null)}
              onSubmit={(values) => {
                const payload: ServiceInput = {
                  ...values,
                };
                if (activeForm.type === "edit") {
                  mutateService(() => updateService(activeForm.service.id, payload));
                } else {
                  mutateService(() => createService(payload));
                }
              }}
            />
          </div>
        </div>
      ) : null}

      <div className="space-y-6">
        {serviceList.length === 0 ? (
          <div className="rounded-3xl border border-brand-brown/20 bg-white/90 p-8 text-center text-sm text-muted-foreground shadow-sm backdrop-blur">
            You haven’t published any services yet. Add your first offer above to open booking.
          </div>
        ) : (
          serviceList.map((service) => (
            <div
              key={service.id}
              className="space-y-4 rounded-3xl border border-brand-brown/20 bg-white/90 p-6 shadow-sm backdrop-blur"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h2 className="text-base font-semibold text-foreground">{service.name}</h2>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                        service.is_active
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-brand-brown/10 text-brand-brown"
                      }`}
                    >
                      {service.is_active ? "Active" : "Hidden"}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {service.description ?? "No description provided yet."}
                  </p>
                  <Link
                    href={`/book?service=${service.id}`}
                    className="mt-2 inline-flex items-center text-xs font-semibold text-brand-brown hover:underline"
                  >
                    View booking link
                  </Link>
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span>{service.duration_minutes} min</span>
                    <span>
                      {formatCurrency(service.price, service.currency ?? defaultCurrency)}{" "}
                      {service.currency?.toUpperCase() ?? defaultCurrency}
                    </span>
                    <span>{service.max_students_per_session} student(s)</span>
                    {service.requires_approval ? <span>Manual approval</span> : <span>Auto-confirm</span>}
                    <span>Updated {format(new Date(service.updated_at), "MMM d, yyyy")}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveForm({ type: "edit", service })}
                    className="inline-flex h-9 items-center justify-center rounded-full border border-brand-brown/30 px-3 text-xs font-semibold text-brand-brown transition hover:bg-brand-brown/10"
                  >
                    <Pencil className="mr-1 h-4 w-4" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
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
                    className="inline-flex h-9 items-center justify-center rounded-full border border-destructive/30 px-3 text-xs font-semibold text-destructive transition hover:bg-destructive/10"
                  >
                    <Trash2 className="mr-1 h-4 w-4" />
                    Delete
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-brand-brown/15 bg-brand-brown/5 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">Packages</p>
                  <button
                    type="button"
                    onClick={() => setPackageContext({ service })}
                    className="text-xs font-semibold text-brand-brown hover:underline"
                  >
                    Add package
                  </button>
                </div>
                <ul className="mt-3 space-y-3 text-sm text-muted-foreground">
        {service.packages.length === 0 ? (
          <li className="rounded-xl border border-dashed border-brand-brown/30 px-3 py-3 text-xs">
            Create a discounted bundle or multi-session pass to boost conversions.
          </li>
        ) : (
          service.packages.map((pkg) => (
            <li
              key={pkg.id}
              className="flex flex-col gap-2 rounded-xl border border-brand-brown/20 bg-white px-4 py-3 text-sm text-foreground shadow-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-semibold">{pkg.name}</p>
                <p className="text-xs text-muted-foreground">
                  {pkg.total_minutes} minutes •{" "}
                  {pkg.session_count ? `${pkg.session_count} sessions` : "Flexible sessions"}
                </p>
                {pkg.description ? (
                  <p className="mt-1 text-xs text-muted-foreground">{pkg.description}</p>
                ) : null}
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-wide text-muted-foreground">
                  <span>
                    {formatCurrency(pkg.price_cents, pkg.currency)} {pkg.currency}
                  </span>
                  {pkg.price_cents > 0 ? (
                    pkg.stripe_price_id ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-600">
                        Stripe synced
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-700">
                        Stripe price pending
                      </span>
                    )
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-brand-brown/10 px-2 py-0.5 font-semibold text-brand-brown">
                      Free package
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <button
                  type="button"
                  onClick={() => setPackageContext({ service, package: pkg })}
                  className="font-semibold text-brand-brown hover:underline"
                >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => {
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
                            className="font-semibold text-destructive hover:underline"
                          >
                            Delete
                          </button>
                        </div>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>
          ))
        )}
      </div>

      {packageContext ? (
        <div className="rounded-3xl border border-brand-brown/20 bg-white/90 p-6 shadow-sm backdrop-blur">
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
              className="text-xs font-semibold text-muted-foreground hover:text-brand-brown"
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
    </div>
  );
}


function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-brand-brown/20 bg-white/90 px-4 py-3 shadow-sm backdrop-blur">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-brown/10">
        {icon}
      </span>
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="text-lg font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}
