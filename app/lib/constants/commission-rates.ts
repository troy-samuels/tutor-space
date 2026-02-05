export type PlatformCommission = {
  name: string;
  rate: number;
  note: string;
  color?: string;
};

export const PLATFORM_COMMISSIONS: Record<string, PlatformCommission> = {
  preply: {
    name: "Preply",
    rate: 0.33,
    note: "33% (first 20 hrs) → 18% (after)",
    color: "#FF6B35",
  },
  italki: {
    name: "iTalki",
    rate: 0.15,
    note: "15% flat",
    color: "#FF5A5F",
  },
  verbling: {
    name: "Verbling",
    rate: 0.15,
    note: "~15%",
    color: "#6366F1",
  },
  cambly: {
    name: "Cambly",
    rate: 0.5,
    note: "Fixed rate ~$10.20/hr",
    color: "#FBBF24",
  },
  wyzant: {
    name: "Wyzant",
    rate: 0.25,
    note: "25% flat",
    color: "#22C55E",
  },
  other: {
    name: "Other Platform",
    rate: 0.2,
    note: "~20% average",
    color: "#9CA3AF",
  },
  tutorlingua: {
    name: "TutorLingua",
    rate: 0,
    note: "0% commission",
    color: "#10B981",
  },
};

export const SUPPORTED_CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  { code: "BRL", symbol: "R$", name: "Brazilian Real" },
  { code: "MXN", symbol: "MX$", name: "Mexican Peso" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "KRW", symbol: "₩", name: "Korean Won" },
  { code: "CNY", symbol: "¥", name: "Chinese Yuan" },
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
] as const;

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];
