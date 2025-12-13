import { redirect } from "next/navigation";
import { getAuditLogForAdmin } from "@/actions/admin/audit-log";
import { getAdminUser } from "@/lib/admin/get-admin-user";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

type PageProps = {
  searchParams?: Promise<{
    page?: string;
  }>;
};

export const metadata = {
  title: "Audit Log | Admin",
};

export default async function AuditLogPage({ searchParams }: PageProps) {
  const admin = await getAdminUser();
  if (!admin) {
    redirect("/admin/login");
  }
  if (admin.role !== "super_admin") {
    redirect("/admin/dashboard");
  }

  const resolvedSearchParams = (await searchParams) ?? {};
  const pageParam = Number(resolvedSearchParams.page) || 1;
  const result = await getAuditLogForAdmin(pageParam);

  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold flex items-center gap-3">
          Audit Log
          <Badge variant="destructive">Super Admin Only</Badge>
        </h1>
        <p className="text-sm text-muted-foreground">
          Read-only view of admin actions for compliance and investigations.
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead>Action</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Admin</TableHead>
              <TableHead>IP</TableHead>
              <TableHead>User Agent</TableHead>
              <TableHead>Metadata</TableHead>
              <TableHead>Timestamp</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.entries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No audit entries found.
                </TableCell>
              </TableRow>
            ) : (
              result.entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium">{entry.action}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-semibold">{entry.targetType ?? "—"}</span>
                      <span className="text-xs text-muted-foreground">{entry.targetId ?? ""}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{entry.adminName ?? "Unknown"}</span>
                      <span className="text-xs text-muted-foreground">{entry.adminRole ?? "—"}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {entry.ipAddress || "—"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {entry.userAgent ? truncate(entry.userAgent, 60) : "—"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-xs whitespace-pre-wrap">
                    {formatMetadata(entry.metadata)}
                  </TableCell>
                  <TableCell className="text-xs">{formatDate(entry.createdAt)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          Page {result.page} of {totalPages} • {result.total} entr{result.total === 1 ? "y" : "ies"}
        </span>
        <div className="flex items-center gap-2">
          <PaginationButton
            disabled={result.page <= 1}
            href={buildPageHref(result.page - 1)}
            direction="prev"
          />
          <PaginationButton
            disabled={result.page >= totalPages}
            href={buildPageHref(result.page + 1)}
            direction="next"
          />
        </div>
      </div>
    </div>
  );
}

function PaginationButton({
  href,
  disabled,
  direction,
}: {
  href: string;
  disabled?: boolean;
  direction: "prev" | "next";
}) {
  return (
    <Button variant="outline" size="sm" asChild disabled={disabled}>
      <a href={href}>
        {direction === "prev" ? (
          <>
            <ChevronLeft className="h-4 w-4" /> Prev
          </>
        ) : (
          <>
            Next <ChevronRight className="h-4 w-4" />
          </>
        )}
      </a>
    </Button>
  );
}

function buildPageHref(page: number) {
  const params = new URLSearchParams();
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `?${query}` : "";
}

function truncate(value: string, max = 60) {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 3)}...`;
}

function formatMetadata(meta: Record<string, unknown>) {
  const keys = Object.keys(meta || {});
  if (!keys.length) return "—";
  try {
    return JSON.stringify(meta, null, 2);
  } catch {
    return "—";
  }
}

function formatDate(input: string) {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
}
