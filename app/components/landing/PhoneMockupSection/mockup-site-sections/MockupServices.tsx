import { Clock } from "lucide-react";
import type { SophieMockData } from "../sophie-data";
import { formatPrice } from "../sophie-data";

type MockupServicesProps = {
  services: SophieMockData["services"];
  theme: SophieMockData["theme"];
};

export function MockupServices({ services, theme }: MockupServicesProps) {
  return (
    <section className="px-4 py-6" style={{ backgroundColor: theme.background }}>
      <h2
        className="text-base font-semibold"
        style={{
          color: theme.primary,
          fontFamily: '"Merriweather", Georgia, serif',
        }}
      >
        Lessons
      </h2>

      <div className="mt-3 space-y-3">
        {services.map((service) => (
          <div
            key={service.id}
            className="rounded-xl p-3"
            style={{
              backgroundColor: "#ffffff",
              border: `1px solid ${theme.primary}15`,
            }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3
                  className="text-sm font-semibold"
                  style={{ color: theme.text }}
                >
                  {service.name}
                </h3>
                <p
                  className="mt-0.5 text-xs"
                  style={{ color: `${theme.text}99` }}
                >
                  {service.description}
                </p>
              </div>
              <span
                className="text-sm font-bold"
                style={{ color: theme.primary }}
              >
                {formatPrice(service.price, service.currency)}
              </span>
            </div>
            <div
              className="mt-2 flex items-center gap-1 text-xs"
              style={{ color: `${theme.text}66` }}
            >
              <Clock className="h-3 w-3" />
              <span>{service.durationMinutes} min</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
