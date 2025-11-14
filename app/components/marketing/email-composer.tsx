"use client";

import { useActionState, useState } from "react";
import { MailPlus, Sparkles } from "lucide-react";
import { sendBroadcastEmail } from "@/lib/actions/email-campaigns";
import { emailTemplates, type EmailTemplateId } from "@/lib/constants/email-templates";
import { emailAudiences, type EmailAudienceId } from "@/lib/constants/email-audiences";

type AudienceCounts = Record<EmailAudienceId, number>;

const initialState = {
  error: undefined,
  success: undefined,
};

type EmailComposerProps = {
  counts: AudienceCounts;
  recommendedTemplates: EmailTemplateId[];
};

export function EmailComposer({ counts, recommendedTemplates }: EmailComposerProps) {
  const [state, formAction, isPending] = useActionState(sendBroadcastEmail, initialState);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<EmailAudienceId>("all");
  const [templateId, setTemplateId] = useState<EmailTemplateId | "">("");
  const [sendOption, setSendOption] = useState<"now" | "schedule">("now");
  const [scheduledFor, setScheduledFor] = useState("");

  const recommendedSet = new Set(recommendedTemplates);

  const applyTemplate = (id: EmailTemplateId) => {
    const template = emailTemplates.find((tpl) => tpl.id === id);
    if (!template) return;
    setSubject(template.subject);
    setBody(template.body);
    setTemplateId(template.id);
  };

  return (
    <div className="rounded-3xl border border-border bg-white/90 p-6 shadow-sm backdrop-blur">
      <header className="flex flex-col gap-2 border-b border-border/60 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-lg font-semibold text-foreground">Send a campaign</p>
          <p className="text-sm text-muted-foreground">
            Personalize with <code>{"{{student_name}}"}</code> and <code>{"{{tutor_name}}"}</code> tokens.
          </p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full border border-brand-brown/40 px-3 py-1 text-xs font-semibold text-brand-brown">
          <Sparkles className="h-4 w-4" />
          SMTP ready
        </span>
      </header>

      {state.success ? (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {state.success}
        </div>
      ) : null}
      {state.error ? (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      ) : null}

      <form action={formAction} className="mt-6 space-y-6">
        <input type="hidden" name="template_id" value={templateId} />
        <input type="hidden" name="send_option" value={sendOption} />

        <section className="space-y-3">
          <p className="text-sm font-semibold text-foreground">Templates</p>
          <div className="grid gap-2 md:grid-cols-2">
            {emailTemplates.map((template) => {
              const isActive = templateId === template.id;
              return (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => applyTemplate(template.id)}
                  className={`rounded-2xl border px-4 py-3 text-left transition ${
                    isActive
                      ? "border-brand-brown bg-brand-brown/10 text-brand-brown"
                      : "border-border bg-muted/40 hover:border-brand-brown/40"
                  }`}
                  disabled={isPending}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold">{template.label}</p>
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{template.subject}</p>
                    </div>
                    {recommendedSet.has(template.id) ? (
                      <span className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-semibold uppercase text-brand-brown shadow">
                        Recommended
                      </span>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <div className="space-y-2">
          <label htmlFor="subject" className="text-sm font-semibold text-foreground">
            Subject
          </label>
          <input
            id="subject"
            name="subject"
            type="text"
            required
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            className="w-full rounded-xl border border-border bg-transparent px-4 py-2.5 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Subject line"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="body" className="text-sm font-semibold text-foreground">
            Message
          </label>
          <textarea
            id="body"
            name="body"
            required
            rows={8}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            className="w-full rounded-2xl border border-border bg-transparent px-4 py-3 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Share wins, reminders, or offers. Use {{student_name}} for personalization."
          />
        </div>

        <section className="space-y-3">
          <p className="text-sm font-semibold text-foreground">Audience</p>
          <div className="grid gap-2 md:grid-cols-2">
            {emailAudiences.map((option) => {
              const optionId = option.id;
              const isSelected = audience === optionId;
              const count = counts[optionId] ?? 0;
              return (
                <label
                  key={optionId}
                  className={`flex cursor-pointer flex-col rounded-2xl border px-4 py-3 transition ${
                    isSelected ? "border-brand-brown bg-brand-brown/10" : "border-border bg-muted/20 hover:border-brand-brown/40"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{option.label}</p>
                      <p className="text-xs text-muted-foreground">{option.helper}</p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand-brown shadow">
                      {count}
                    </span>
                  </div>
                  <input
                    type="radio"
                    name="audience_filter"
                    value={optionId}
                    checked={isSelected}
                    onChange={() => setAudience(optionId)}
                    className="sr-only"
                  />
                </label>
              );
            })}
          </div>
        </section>

        <section className="space-y-3">
          <p className="text-sm font-semibold text-foreground">Delivery</p>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="flex cursor-pointer flex-col gap-1 rounded-2xl border border-border/70 bg-muted/20 px-4 py-3">
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  name="send_option_ui"
                  value="now"
                  checked={sendOption === "now"}
                  onChange={() => setSendOption("now")}
                  className="h-4 w-4 accent-brand-brown"
                />
                <div>
                  <p className="text-sm font-semibold text-foreground">Send now</p>
                  <p className="text-xs text-muted-foreground">Queue immediately (batches of 50)</p>
                </div>
              </div>
            </label>
            <label className="flex cursor-pointer flex-col gap-2 rounded-2xl border border-border/70 bg-muted/20 px-4 py-3">
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  name="send_option_ui"
                  value="schedule"
                  checked={sendOption === "schedule"}
                  onChange={() => setSendOption("schedule")}
                  className="h-4 w-4 accent-brand-brown"
                />
                <div>
                  <p className="text-sm font-semibold text-foreground">Schedule</p>
                  <p className="text-xs text-muted-foreground">Pick a future date & time</p>
                </div>
              </div>
              {sendOption === "schedule" && (
                <input
                  type="datetime-local"
                  name="scheduled_for"
                  required
                  value={scheduledFor}
                  onChange={(event) => setScheduledFor(event.target.value)}
                  className="h-10 rounded-lg border border-border bg-white px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  min={new Date().toISOString().slice(0, 16)}
                />
              )}
            </label>
          </div>
        </section>

        <div className="flex items-center justify-between rounded-2xl border border-dashed border-border/70 bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
          <p>
            Need ideas? Templates above are editable. Tokens: <code>{"{{student_name}}"}</code>,{" "}
            <code>{"{{tutor_name}}"}</code>
          </p>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-brown px-6 text-sm font-semibold text-white shadow transition hover:bg-brand-brown/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? (
            <>
              <MailPlus className="h-4 w-4 animate-spin" />
              Sending…
            </>
          ) : (
            <>
              <MailPlus className="h-4 w-4" />
              Send campaign
            </>
          )}
        </button>
      </form>
    </div>
  );
}
