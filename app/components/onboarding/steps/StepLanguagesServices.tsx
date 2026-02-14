"use client";

import { useState, useTransition } from "react";
import { Plus, X, Trash2, Package } from "lucide-react";
import { saveOnboardingStep } from "@/lib/actions/onboarding";
import { createService, updateService } from "@/lib/actions/services";
import {
  createSessionPackage,
  updateSessionPackage,
  deleteSessionPackage,
} from "@/lib/actions/session-packages";
import type { ServiceOfferType } from "@/lib/validators/service";

type ExistingService = {
  id: string;
  name: string;
  duration_minutes: number;
  price: number;
  currency: string;
  offer_type: ServiceOfferType;
};

type ExistingPackage = {
  id: string;
  service_id: string | null;
  name: string;
  session_count: number | null;
  total_minutes: number;
  price_cents: number;
  currency: string;
};

type StepLanguagesServicesProps = {
  onComplete: () => void;
  onSaveError?: (message: string) => void;
  existingServices?: ExistingService[];
  existingPackages?: ExistingPackage[];
};

type ServiceItem = {
  id: string;
  dbId?: string;
  name: string;
  duration: string;
  price: string;
  offer_type: ServiceOfferType;
  hasPackage?: boolean;
  packageDbId?: string;
  packageName?: string;
  packageSessions?: number;
  packagePrice?: string;
};

const COMMON_LANGUAGES = [
  "English",
  "Spanish",
  "French",
  "German",
  "Italian",
  "Portuguese",
  "Chinese",
  "Japanese",
  "Korean",
  "Arabic",
  "Russian",
  "Hindi",
];

const CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "CAD", symbol: "$", name: "Canadian Dollar" },
  { code: "AUD", symbol: "$", name: "Australian Dollar" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "CNY", symbol: "¥", name: "Chinese Yuan" },
  { code: "KRW", symbol: "₩", name: "Korean Won" },
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "BRL", symbol: "R$", name: "Brazilian Real" },
  { code: "MXN", symbol: "$", name: "Mexican Peso" },
];

export function StepLanguagesServices({
  onComplete,
  onSaveError,
  existingServices = [],
  existingPackages = [],
}: StepLanguagesServicesProps) {
  const [isPending, startTransition] = useTransition();
  const [formData, setFormData] = useState({
    languages_taught: [] as string[],
    currency: existingServices[0]?.currency || "USD",
  });

  // Initialize services from existing data or create a blank one
  const [services, setServices] = useState<ServiceItem[]>(() => {
    if (existingServices.length > 0) {
      return existingServices.map((s, index) => {
        const matchingPackage = existingPackages.find((p) => p.service_id === s.id);
        return {
          id: String(index + 1),
          dbId: s.id,
          name: s.name,
          duration: String(s.duration_minutes),
          price: s.price > 0 ? String(s.price / 100) : "",
          offer_type: s.offer_type,
          hasPackage: !!matchingPackage,
          packageDbId: matchingPackage?.id,
          packageName: matchingPackage?.name || "10 Lesson Package",
          packageSessions: matchingPackage?.session_count || 10,
          packagePrice:
            matchingPackage && matchingPackage.price_cents > 0
              ? String(matchingPackage.price_cents / 100)
              : "",
        };
      });
    }
    return [{ id: "1", name: "", duration: "60", price: "", offer_type: "one_off" as ServiceOfferType }];
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedCurrency = CURRENCIES.find((c) => c.code === formData.currency) || CURRENCIES[0];

  const handleChange = (field: string, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const toggleLanguage = (language: string) => {
    if (formData.languages_taught.includes(language)) {
      handleChange(
        "languages_taught",
        formData.languages_taught.filter((l) => l !== language)
      );
    } else {
      handleChange("languages_taught", [...formData.languages_taught, language]);
    }
  };

  // Service management functions
  const addService = () => {
    setServices([...services, {
      id: Date.now().toString(),
      name: "",
      duration: "60",
      price: "",
      offer_type: "one_off" as ServiceOfferType,
    }]);
  };

  const removeService = (id: string) => {
    if (services.length > 1) {
      setServices(services.filter(s => s.id !== id));
      // Clear any errors for the removed service
      const newErrors = { ...errors };
      delete newErrors[`service_name_${id}`];
      delete newErrors[`service_price_${id}`];
      delete newErrors[`package_price_${id}`];
      setErrors(newErrors);
    }
  };

  const updateLocalService = (id: string, field: keyof ServiceItem, value: string | boolean | number) => {
    setServices(services.map(s =>
      s.id === id ? { ...s, [field]: value } : s
    ));
    // Clear error for this field
    const errorKey = field === "packagePrice" ? `package_price_${id}` : `service_${field}_${id}`;
    if (errors[errorKey]) {
      setErrors((prev) => ({ ...prev, [errorKey]: "" }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.languages_taught.length === 0) {
      newErrors.languages_taught = "Select at least one language you teach";
    }

    // Validate all services
    services.forEach((service) => {
      if (!service.name.trim()) {
        newErrors[`service_name_${service.id}`] = "Service name is required";
      }

      const numericPrice = Number(service.price);
      if (!service.price) {
        newErrors[`service_price_${service.id}`] = "Price is required";
      } else if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
        newErrors[`service_price_${service.id}`] = "Enter a valid price";
      } else if (!Number.isInteger(numericPrice)) {
        newErrors[`service_price_${service.id}`] = "Use whole dollars (no cents)";
      }

      // Validate package price if package is enabled
      if (service.hasPackage) {
        if (!service.packagePrice) {
          newErrors[`package_price_${service.id}`] = "Package price is required";
        } else if (isNaN(Number(service.packagePrice)) || Number(service.packagePrice) <= 0) {
          newErrors[`package_price_${service.id}`] = "Enter a valid package price";
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    // Optimistic: Move to next step immediately
    onComplete();

    // Save to database in background
    startTransition(async () => {
      try {
        // Save languages and currency to profile
        const profileResult = await saveOnboardingStep(3, {
          languages_taught: formData.languages_taught,
          currency: formData.currency,
        });

        if (!profileResult.success) {
          console.error("Background save failed for step 3:", profileResult.error);
          onSaveError?.(profileResult.error || "Failed to save languages");
        }

        // Process each service
        for (const service of services) {
          const servicePayload = {
            name: service.name.trim(),
            description: "",
            duration_minutes: parseInt(service.duration),
            price_cents: Number.parseInt(service.price, 10) * 100,
            currency: formData.currency.toUpperCase(),
            is_active: true,
            requires_approval: false,
            max_students_per_session: 1,
            offer_type: service.offer_type,
          };

          let serviceId = service.dbId;

          if (service.dbId) {
            // Update existing service
            const result = await updateService(service.dbId, servicePayload);
            if (result.error) {
              console.error("Failed to update service:", result.error);
            }
          } else {
            // Create new service
            const result = await createService(servicePayload);
            if (result.error) {
              console.error("Failed to create service:", result.error);
            } else {
              serviceId = result.data?.id;
            }
          }

          // Handle session package for one_off services
          if (service.offer_type === "one_off" && serviceId) {
            if (service.hasPackage && service.packagePrice) {
              const packagePayload = {
                name: service.packageName || "10 Lesson Package",
                description: "Save when you commit to 10 lessons upfront.",
                session_count: service.packageSessions || 10,
                total_minutes: parseInt(service.duration) * (service.packageSessions || 10),
                price_cents: Math.round(parseFloat(service.packagePrice) * 100),
                currency: formData.currency.toUpperCase(),
                is_active: true,
              };

              if (service.packageDbId) {
                // Update existing package
                const result = await updateSessionPackage(service.packageDbId, packagePayload);
                if (result.error) {
                  console.error("Failed to update package:", result.error);
                }
              } else {
                // Create new package
                const result = await createSessionPackage(serviceId, packagePayload);
                if (result.error) {
                  console.error("Failed to create package:", result.error);
                }
              }
            } else if (!service.hasPackage && service.packageDbId) {
              // User unchecked package - delete it
              const result = await deleteSessionPackage(service.packageDbId);
              if (result.error) {
                console.error("Failed to delete package:", result.error);
              }
            }
          }
        }
      } catch (error) {
        console.error("Error saving step 3:", error);
        onSaveError?.("An error occurred while saving");
      }
    });
  };

  return (
    <div className="space-y-5">
      {/* Languages Taught */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-foreground">
          Languages You Teach <span className="text-red-500">*</span>
        </label>
        <p className="text-xs text-muted-foreground">
          Select all languages you offer lessons in
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          {COMMON_LANGUAGES.map((lang) => {
            const isSelected = formData.languages_taught.includes(lang);
            return (
              <button
                key={lang}
                type="button"
                onClick={() => toggleLanguage(lang)}
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : "border border-border text-muted-foreground hover:border-primary hover:text-foreground"
                }`}
              >
                {isSelected ? (
                  <X className="h-3 w-3" />
                ) : (
                  <Plus className="h-3 w-3" />
                )}
                {lang}
              </button>
            );
          })}
        </div>
        {errors.languages_taught && (
          <p className="text-xs text-red-600">{errors.languages_taught}</p>
        )}
      </div>

      {/* Currency */}
      <div className="space-y-2">
        <label htmlFor="currency" className="block text-sm font-medium text-foreground">
          Currency <span className="text-red-500">*</span>
        </label>
        <select
          id="currency"
          value={formData.currency}
          onChange={(e) => handleChange("currency", e.target.value)}
          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          {CURRENCIES.map((currency) => (
            <option key={currency.code} value={currency.code}>
              {currency.code} ({currency.symbol}) - {currency.name}
            </option>
          ))}
        </select>
      </div>

      {/* Divider */}
      <div className="border-t border-border pt-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-medium text-foreground">
            {services.length === 1 ? "Create Your First Service" : "Your Services"}
          </p>
          {services.length >= 1 && (
            <button
              type="button"
              onClick={addService}
              className="flex h-6 w-6 items-center justify-center rounded-full border border-border text-muted-foreground transition hover:border-primary hover:text-primary"
              aria-label="Add another service"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Services List */}
      {services.map((service, index) => (
        <div key={service.id} className="space-y-4">
          {/* Service separator for additional services */}
          {index > 0 && (
            <div className="border-t border-border pt-4" />
          )}

          {/* Service header with offer type badge and delete button */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {services.length > 1 && (
                <span className="text-xs font-medium text-muted-foreground">
                  Service {index + 1}
                </span>
              )}
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                  service.offer_type === "trial"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-blue-100 text-blue-700"
                }`}
              >
                {service.offer_type === "trial" ? "Trial" : "Standard"}
              </span>
            </div>
            {services.length > 1 && (
              <button
                type="button"
                onClick={() => removeService(service.id)}
                className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Service Name */}
          <div className="space-y-2">
            <label htmlFor={`service_name_${service.id}`} className="block text-sm font-medium text-foreground">
              Service Name <span className="text-red-500">*</span>
            </label>
            <input
              id={`service_name_${service.id}`}
              type="text"
              value={service.name}
              onChange={(e) => updateLocalService(service.id, "name", e.target.value)}
              placeholder="e.g., 1-on-1 Spanish Lesson"
              className={`w-full rounded-xl border bg-white px-4 py-3 text-sm transition focus:outline-none focus:ring-2 ${
                errors[`service_name_${service.id}`]
                  ? "border-red-300 focus:ring-red-500"
                  : "border-gray-300 focus:border-primary focus:ring-primary/20"
              }`}
            />
            {errors[`service_name_${service.id}`] && (
              <p className="text-xs text-red-600">{errors[`service_name_${service.id}`]}</p>
            )}
          </div>

          {/* Duration and Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor={`service_duration_${service.id}`} className="block text-sm font-medium text-foreground">
                Duration
              </label>
              <select
                id={`service_duration_${service.id}`}
                value={service.duration}
                onChange={(e) => updateLocalService(service.id, "duration", e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="55">55 minutes</option>
                <option value="60">60 minutes</option>
                <option value="90">90 minutes</option>
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor={`service_price_${service.id}`} className="block text-sm font-medium text-foreground">
                Price ({formData.currency}) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  {selectedCurrency.symbol}
                </span>
                <input
                  id={`service_price_${service.id}`}
                  type="number"
                  min="0"
                  step="1"
                  value={service.price}
                  onChange={(e) => updateLocalService(service.id, "price", e.target.value)}
                  placeholder="50"
                  className={`w-full rounded-xl border bg-white py-3 pl-8 pr-4 text-sm transition focus:outline-none focus:ring-2 ${
                    errors[`service_price_${service.id}`]
                      ? "border-red-300 focus:ring-red-500"
                      : "border-gray-300 focus:border-primary focus:ring-primary/20"
                  }`}
                />
              </div>
              {errors[`service_price_${service.id}`] && (
                <p className="text-xs text-red-600">{errors[`service_price_${service.id}`]}</p>
              )}
            </div>
          </div>

          {/* Package Section - only for one_off services */}
          {service.offer_type === "one_off" && (
            <div className="rounded-xl border border-dashed border-border bg-muted/30 p-4">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={service.hasPackage ?? false}
                  onChange={(e) =>
                    updateLocalService(service.id, "hasPackage", e.target.checked)
                  }
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <div className="flex items-center gap-1.5">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">
                    Offer a 10-lesson package
                  </span>
                </div>
              </label>
              <p className="ml-6 mt-1 text-xs text-muted-foreground">
                Students can prepay for 10 lessons at a discounted rate
              </p>

              {service.hasPackage && (
                <div className="ml-6 mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label
                      htmlFor={`package_name_${service.id}`}
                      className="text-xs font-medium text-muted-foreground"
                    >
                      Package name
                    </label>
                    <input
                      id={`package_name_${service.id}`}
                      type="text"
                      value={service.packageName || ""}
                      onChange={(e) =>
                        updateLocalService(service.id, "packageName", e.target.value)
                      }
                      placeholder="10 Lesson Package"
                      className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div className="space-y-1">
                    <label
                      htmlFor={`package_price_${service.id}`}
                      className="text-xs font-medium text-muted-foreground"
                    >
                      Package price ({formData.currency})
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        {selectedCurrency.symbol}
                      </span>
                      <input
                        id={`package_price_${service.id}`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={service.packagePrice || ""}
                        onChange={(e) =>
                          updateLocalService(service.id, "packagePrice", e.target.value)
                        }
                        placeholder="450"
                        className={`w-full rounded-xl border bg-white py-3 pl-8 pr-4 text-sm focus:outline-none focus:ring-2 ${
                          errors[`package_price_${service.id}`]
                            ? "border-red-300 focus:ring-red-500"
                            : "border-gray-300 focus:border-primary focus:ring-primary/20"
                        }`}
                      />
                    </div>
                    {errors[`package_price_${service.id}`] && (
                      <p className="text-xs text-red-600">
                        {errors[`package_price_${service.id}`]}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      {/* Add Service Button */}
      <button
        type="button"
        onClick={addService}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-primary"
      >
        <Plus className="h-4 w-4" />
        <span>Add service</span>
      </button>

      {errors.submit && (
        <p className="text-sm text-red-600">{errors.submit}</p>
      )}

      {/* Submit */}
      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={handleSubmit}
          className="inline-flex h-10 items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
