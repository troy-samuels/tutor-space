"use client";

import { useState, useTransition } from "react";
import { Plus, X } from "lucide-react";
import { saveOnboardingStep } from "@/lib/actions/onboarding";

type StepLanguagesServicesProps = {
  onComplete: () => void;
  onSaveError?: (message: string) => void;
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
    service_name: "",
    service_duration: "60",
    service_price: "",
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

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.languages_taught.length === 0) {
      newErrors.languages_taught = "Select at least one language you teach";
    }

    if (!formData.service_name.trim()) {
      newErrors.service_name = "Service name is required";
    }

    if (!formData.service_price) {
      newErrors.service_price = "Price is required";
    } else if (isNaN(Number(formData.service_price)) || Number(formData.service_price) <= 0) {
      newErrors.service_price = "Enter a valid price";
    }

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
        const result = await saveOnboardingStep(3, {
          languages_taught: formData.languages_taught,
          currency: formData.currency,
          service: {
            name: formData.service_name.trim(),
            duration_minutes: parseInt(formData.service_duration),
            price: parseFloat(formData.service_price),
            currency: formData.currency.toLowerCase(),
          },
        });

        if (!result.success) {
          console.error("Background save failed for step 3:", result.error);
          onSaveError?.(result.error || "Failed to save languages and service");
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
        <p className="mb-3 text-sm font-medium text-foreground">
          Create Your First Service
        </p>
      </div>

      {/* Service Name */}
      <div className="space-y-2">
        <label htmlFor="service_name" className="block text-sm font-medium text-foreground">
          Service Name <span className="text-red-500">*</span>
        </label>
        <input
          id="service_name"
          type="text"
          value={formData.service_name}
          onChange={(e) => handleChange("service_name", e.target.value)}
          placeholder="e.g., 1-on-1 Spanish Lesson"
          className={`w-full rounded-xl border bg-white px-4 py-3 text-sm transition focus:outline-none focus:ring-2 ${
            errors.service_name
              ? "border-red-300 focus:ring-red-500"
              : "border-gray-300 focus:border-primary focus:ring-primary/20"
          }`}
        />
        {errors.service_name && (
          <p className="text-xs text-red-600">{errors.service_name}</p>
        )}
      </div>

      {/* Duration and Price */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="service_duration" className="block text-sm font-medium text-foreground">
            Duration
          </label>
          <select
            id="service_duration"
            value={formData.service_duration}
            onChange={(e) => handleChange("service_duration", e.target.value)}
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="30">30 minutes</option>
            <option value="45">45 minutes</option>
            <option value="60">60 minutes</option>
            <option value="90">90 minutes</option>
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="service_price" className="block text-sm font-medium text-foreground">
            Price ({formData.currency}) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              {selectedCurrency.symbol}
            </span>
            <input
              id="service_price"
              type="number"
              min="0"
              step="0.01"
              value={formData.service_price}
              onChange={(e) => handleChange("service_price", e.target.value)}
              placeholder="50"
              className={`w-full rounded-xl border bg-white py-3 pl-8 pr-4 text-sm transition focus:outline-none focus:ring-2 ${
                errors.service_price
                  ? "border-red-300 focus:ring-red-500"
                  : "border-gray-300 focus:border-primary focus:ring-primary/20"
              }`}
            />
          </div>
          {errors.service_price && (
            <p className="text-xs text-red-600">{errors.service_price}</p>
          )}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        You can add more services and packages later from your dashboard.
      </p>

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
