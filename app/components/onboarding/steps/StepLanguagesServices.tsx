"use client";

import { useState, useTransition } from "react";
import { Plus, X, Trash2 } from "lucide-react";
import { saveOnboardingStep } from "@/lib/actions/onboarding";
import { createService } from "@/lib/actions/services";

type StepLanguagesServicesProps = {
  onComplete: () => void;
  onSaveError?: (message: string) => void;
};

type ServiceItem = {
  id: string;
  name: string;
  duration: string;
  price: string;
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
}: StepLanguagesServicesProps) {
  const [isPending, startTransition] = useTransition();
  const [formData, setFormData] = useState({
    languages_taught: [] as string[],
    currency: "USD",
  });
  const [services, setServices] = useState<ServiceItem[]>([
    { id: "1", name: "", duration: "60", price: "" }
  ]);

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
      price: ""
    }]);
  };

  const removeService = (id: string) => {
    if (services.length > 1) {
      setServices(services.filter(s => s.id !== id));
      // Clear any errors for the removed service
      const newErrors = { ...errors };
      delete newErrors[`service_name_${id}`];
      delete newErrors[`service_price_${id}`];
      setErrors(newErrors);
    }
  };

  const updateService = (id: string, field: keyof ServiceItem, value: string) => {
    setServices(services.map(s =>
      s.id === id ? { ...s, [field]: value } : s
    ));
    // Clear error for this field
    const errorKey = `service_${field}_${id}`;
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

      if (!service.price) {
        newErrors[`service_price_${service.id}`] = "Price is required";
      } else if (isNaN(Number(service.price)) || Number(service.price) <= 0) {
        newErrors[`service_price_${service.id}`] = "Enter a valid price";
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
        // Save first service via atomic RPC
        const result = await saveOnboardingStep(3, {
          languages_taught: formData.languages_taught,
          currency: formData.currency,
          service: {
            name: services[0].name.trim(),
            duration_minutes: parseInt(services[0].duration),
            price: parseFloat(services[0].price),
            currency: formData.currency.toLowerCase(),
          },
        });

        if (!result.success) {
          console.error("Background save failed for step 3:", {
            success: result.success,
            error: result.error,
            fullResult: result,
          });
          onSaveError?.(result.error || "Failed to save languages and service");
        }

        // Save additional services via createService
        for (let i = 1; i < services.length; i++) {
          const service = services[i];
          const serviceResult = await createService({
            name: service.name.trim(),
            description: "",
            duration_minutes: parseInt(service.duration),
            price_cents: Math.round(parseFloat(service.price) * 100),
            currency: formData.currency.toUpperCase(),
            is_active: true,
            requires_approval: false,
            max_students_per_session: 1,
            offer_type: "one_off",
          });

          if (serviceResult.error) {
            console.error(`Failed to create service ${i + 1}:`, serviceResult.error);
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

          {/* Service header with delete button */}
          {services.length > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Service {index + 1}
              </span>
              <button
                type="button"
                onClick={() => removeService(service.id)}
                className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Service Name */}
          <div className="space-y-2">
            <label htmlFor={`service_name_${service.id}`} className="block text-sm font-medium text-foreground">
              Service Name <span className="text-red-500">*</span>
            </label>
            <input
              id={`service_name_${service.id}`}
              type="text"
              value={service.name}
              onChange={(e) => updateService(service.id, "name", e.target.value)}
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
                onChange={(e) => updateService(service.id, "duration", e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
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
                  step="0.01"
                  value={service.price}
                  onChange={(e) => updateService(service.id, "price", e.target.value)}
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
