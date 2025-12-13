"use client";

import { useState, useTransition } from "react";
import {
  Link as LinkIcon,
  Plus,
  Copy,
  Check,
  Trash2,
  Clock,
  Users,
  AlertCircle,
  ExternalLink,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { InviteLinkForm } from "./InviteLinkForm";
import { deleteInviteLink, toggleInviteLinkActive } from "@/lib/actions/invite-links";
import { formatDistanceToNow, isPast, parseISO } from "date-fns";

type InviteLink = {
  id: string;
  token: string;
  name: string;
  expiresAt: string;
  isActive: boolean;
  serviceIds: string[];
  usageCount: number;
  createdAt: string;
  services: Array<{ id: string; name: string }>;
};

type Service = {
  id: string;
  name: string;
};

interface InviteLinkManagerProps {
  inviteLinks: InviteLink[];
  services: Service[];
  onLinkChange: () => void;
}

export function InviteLinkManager({
  inviteLinks,
  services,
  onLinkChange,
}: InviteLinkManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const appUrl = typeof window !== "undefined" ? window.location.origin : "";

  function getInviteUrl(token: string) {
    return `${appUrl}/join/${token}`;
  }

  async function copyToClipboard(link: InviteLink) {
    const url = getInviteUrl(link.token);
    await navigator.clipboard.writeText(url);
    setCopiedId(link.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function handleDelete(linkId: string) {
    if (!confirm("Are you sure you want to delete this invite link? Students who haven't signed up yet won't be able to use it.")) {
      return;
    }

    setDeletingId(linkId);
    startTransition(async () => {
      await deleteInviteLink(linkId);
      setDeletingId(null);
      onLinkChange();
    });
  }

  function handleToggle(linkId: string, currentActive: boolean) {
    setTogglingId(linkId);
    startTransition(async () => {
      await toggleInviteLinkActive(linkId, !currentActive);
      setTogglingId(null);
      onLinkChange();
    });
  }

  function handleLinkCreated() {
    setShowForm(false);
    onLinkChange();
  }

  function getLinkStatus(link: InviteLink): { label: string; color: string } {
    if (!link.isActive) {
      return { label: "Paused", color: "bg-gray-100 text-gray-700" };
    }
    if (isPast(parseISO(link.expiresAt))) {
      return { label: "Expired", color: "bg-red-100 text-red-700" };
    }
    return { label: "Active", color: "bg-green-100 text-green-700" };
  }

  return (
    <div className="space-y-6">
      {/* Header with create button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-foreground">Invite Links</h2>
          <p className="text-sm text-muted-foreground">
            Create shareable links that let students sign up and book immediately.
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create Link
        </button>
      </div>

      {/* Create form dialog */}
      {showForm && (
        <InviteLinkForm
          services={services}
          onSuccess={handleLinkCreated}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Empty state */}
      {inviteLinks.length === 0 && !showForm && (
        <div className="text-center py-12 bg-card rounded-lg border border-border">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-muted rounded-full mb-4">
            <LinkIcon className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">No invite links yet</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
            Create an invite link to share with students. They&apos;ll be able to sign up and book
            lessons immediately — no approval required.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create your first link
          </button>
        </div>
      )}

      {/* Links list */}
      {inviteLinks.length > 0 && (
        <div className="space-y-3">
          {inviteLinks.map((link) => {
            const status = getLinkStatus(link);
            const isExpired = isPast(parseISO(link.expiresAt));
            const expiresText = isExpired
              ? `Expired ${formatDistanceToNow(parseISO(link.expiresAt), { addSuffix: true })}`
              : `Expires ${formatDistanceToNow(parseISO(link.expiresAt), { addSuffix: true })}`;

            return (
              <div
                key={link.id}
                className={`bg-card rounded-lg border border-border p-4 ${
                  !link.isActive || isExpired ? "opacity-60" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Link info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-foreground truncate">{link.name}</h3>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${status.color}`}>
                        {status.label}
                      </span>
                    </div>

                    {/* URL preview */}
                    <div className="flex items-center gap-2 mb-2">
                      <code className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded truncate max-w-xs">
                        {getInviteUrl(link.token)}
                      </code>
                      <button
                        onClick={() => copyToClipboard(link)}
                        className="p-1 hover:bg-muted rounded transition-colors"
                        title="Copy link"
                      >
                        {copiedId === link.id ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                      <a
                        href={getInviteUrl(link.token)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 hover:bg-muted rounded transition-colors"
                        title="Open link"
                      >
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      </a>
                    </div>

                    {/* Meta info */}
                    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {link.usageCount} {link.usageCount === 1 ? "student" : "students"}
                      </span>
                      <span className={`flex items-center gap-1 ${isExpired ? "text-red-600" : ""}`}>
                        <Clock className="h-3.5 w-3.5" />
                        {expiresText}
                      </span>
                      {link.services.length > 0 && (
                        <span className="flex items-center gap-1">
                          <AlertCircle className="h-3.5 w-3.5" />
                          Limited to: {link.services.map((s) => s.name).join(", ")}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggle(link.id, link.isActive)}
                      disabled={isPending || isExpired}
                      className="p-2 hover:bg-muted rounded transition-colors disabled:opacity-50"
                      title={link.isActive ? "Pause link" : "Activate link"}
                    >
                      {togglingId === link.id ? (
                        <span className="h-5 w-5 block animate-pulse bg-muted rounded" />
                      ) : link.isActive ? (
                        <ToggleRight className="h-5 w-5 text-green-600" />
                      ) : (
                        <ToggleLeft className="h-5 w-5 text-muted-foreground" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(link.id)}
                      disabled={isPending}
                      className="p-2 hover:bg-red-50 text-muted-foreground hover:text-red-600 rounded transition-colors disabled:opacity-50"
                      title="Delete link"
                    >
                      {deletingId === link.id ? (
                        <span className="h-5 w-5 block animate-pulse bg-muted rounded" />
                      ) : (
                        <Trash2 className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tips */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
          <LinkIcon className="h-4 w-4" />
          How invite links work
        </h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Students who use your invite link can sign up and book immediately</li>
          <li>• No approval needed — they bypass the normal access request flow</li>
          <li>• Share links in emails, social media, or your website</li>
          <li>• Links expire after 30 days for security</li>
          <li>• Optionally limit links to specific services</li>
        </ul>
      </div>
    </div>
  );
}
