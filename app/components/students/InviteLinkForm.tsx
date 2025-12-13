"use client";

import { useState, useTransition } from "react";
import { X, Loader2, Check, Link as LinkIcon, Copy } from "lucide-react";
import { createInviteLink } from "@/lib/actions/invite-links";

type Service = {
  id: string;
  name: string;
};

interface InviteLinkFormProps {
  services: Service[];
  onSuccess: () => void;
  onCancel: () => void;
}

export function InviteLinkForm({ services, onSuccess, onCancel }: InviteLinkFormProps) {
  const [name, setName] = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const [createdLink, setCreatedLink] = useState<{ token: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const appUrl = typeof window !== "undefined" ? window.location.origin : "";

  function toggleService(serviceId: string) {
    setSelectedServices((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Please enter a name for this link");
      return;
    }

    startTransition(async () => {
      const result = await createInviteLink({
        name: name.trim(),
        serviceIds: selectedServices.length > 0 ? selectedServices : undefined,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.link) {
        setCreatedLink({ token: result.link.token });
      }
    });
  }

  async function copyToClipboard() {
    if (!createdLink) return;
    const url = `${appUrl}/join/${createdLink.token}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Success state - show the created link
  if (createdLink) {
    const url = `${appUrl}/join/${createdLink.token}`;

    return (
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3">
            <Check className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="text-lg font-medium text-foreground">Link created!</h3>
          <p className="text-sm text-muted-foreground">
            Share this link with students to let them sign up and book instantly.
          </p>
        </div>

        {/* Link display */}
        <div className="bg-muted rounded-lg p-4 mb-4">
          <label className="block text-xs font-medium text-muted-foreground mb-2">
            Your invite link
          </label>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-sm bg-background p-2 rounded border truncate">
              {url}
            </code>
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy
                </>
              )}
            </button>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={onSuccess}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <LinkIcon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-foreground">Create Invite Link</h3>
            <p className="text-sm text-muted-foreground">
              Students using this link will be auto-approved.
            </p>
          </div>
        </div>
        <button
          onClick={onCancel}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
        >
          <X className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Link name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1.5">
            Link name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Spring 2025 Class, Instagram Bio"
            className="w-full px-4 py-2.5 border border-input rounded-lg bg-background focus:ring-2 focus:ring-ring focus:border-ring transition-colors"
            disabled={isPending}
            autoFocus
          />
          <p className="mt-1 text-xs text-muted-foreground">
            A name to help you identify this link. Only visible to you.
          </p>
        </div>

        {/* Service scope (optional) */}
        {services.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Limit to specific services <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <p className="text-xs text-muted-foreground mb-3">
              Leave unchecked to give access to all your services.
            </p>
            <div className="space-y-2 max-h-40 overflow-y-auto border border-input rounded-lg p-3">
              {services.map((service) => (
                <label
                  key={service.id}
                  className="flex items-center gap-3 cursor-pointer hover:bg-muted/50 p-1 rounded"
                >
                  <input
                    type="checkbox"
                    checked={selectedServices.includes(service.id)}
                    onChange={() => toggleService(service.id)}
                    disabled={isPending}
                    className="h-4 w-4 text-primary border-input rounded focus:ring-ring"
                  />
                  <span className="text-sm text-foreground">{service.name}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Info about expiration */}
        <div className="bg-muted/50 rounded-lg p-3">
          <p className="text-xs text-muted-foreground">
            <strong>Note:</strong> This link will expire in 30 days. You can create a new link
            anytime or delete this one if you no longer need it.
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="px-4 py-2 border border-input rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending || !name.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <LinkIcon className="h-4 w-4" />
                Create Link
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
