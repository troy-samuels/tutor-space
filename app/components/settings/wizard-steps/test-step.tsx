"use client";

export function TestStep({
  onNext,
  onBack,
  initialValues,
  stepNumber,
}: {
  onNext: () => void;
  onBack: () => void;
  initialValues?: any;
  stepNumber: number;
}) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-brand-cream/50 p-6">
        <h3 className="mb-2 text-lg font-semibold text-foreground">
          Test Step {stepNumber}
        </h3>
        <p className="text-sm text-muted-foreground">
          This is a placeholder step to test the wizard navigation.
        </p>
        {initialValues && (
          <pre className="mt-4 rounded-lg bg-white p-4 text-xs">
            {JSON.stringify(initialValues, null, 2)}
          </pre>
        )}
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onNext}
          className="inline-flex h-11 items-center justify-center rounded-full bg-brand-brown px-8 text-sm font-semibold text-brand-white shadow-sm transition hover:bg-brand-brown/90"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
