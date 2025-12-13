"use client";

import { useMemo, useState, useTransition } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { AdminListedUser } from "@/actions/admin/users";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  users: AdminListedUser[];
  page: number;
  pageSize: number;
  total: number;
  initialSearch: string;
};

const columnHelper = createColumnHelper<AdminListedUser>();

export function AdminUsersTable({ users, page, pageSize, total, initialSearch }: Props) {
  const [search, setSearch] = useState(initialSearch);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const columns = useMemo(
    () => [
      columnHelper.accessor("email", {
        header: "Email",
        cell: (info) => (
          <div className="font-medium text-foreground">{info.getValue() || "—"}</div>
        ),
      }),
      columnHelper.accessor("fullName", {
        header: "Name",
        cell: (info) => info.getValue() || "—",
      }),
      columnHelper.accessor("role", {
        header: "Role",
        cell: (info) => (
          <Badge variant="outline" className="capitalize">
            {info.getValue() || "unknown"}
          </Badge>
        ),
      }),
      columnHelper.accessor("plan", {
        header: "Plan",
        cell: (info) => info.getValue() || "—",
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: (info) => {
          const value = info.getValue();
          const isActive = value === "active";
          return (
            <Badge
              variant={isActive ? "secondary" : "destructive"}
              className={cn("px-2 py-1 text-xs", isActive ? "bg-emerald-50 text-emerald-800" : "")}
            >
              {isActive ? "Active" : "Banned"}
            </Badge>
          );
        },
      }),
      columnHelper.accessor("lastSignInAt", {
        header: "Last Sign-In",
        cell: (info) => formatDate(info.getValue()),
      }),
      columnHelper.accessor("createdAt", {
        header: "Created",
        cell: (info) => formatDate(info.getValue()),
      }),
    ],
    []
  );

  const table = useReactTable({
    data: users,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  function applyFilters(nextPage: number, nextSearch: string) {
    const params = new URLSearchParams(searchParams?.toString() || "");
    if (nextPage > 1) {
      params.set("page", String(nextPage));
    } else {
      params.delete("page");
    }
    if (nextSearch) {
      params.set("search", nextSearch);
    } else {
      params.delete("search");
    }
    const url = `${pathname}?${params.toString()}`;
    startTransition(() => {
      router.replace(url);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Users</h1>
          <p className="text-sm text-muted-foreground">
            View all platform users. Data is fetched with the admin service client.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search email or name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64"
          />
          <Button
            onClick={() => applyFilters(1, search.trim())}
            disabled={isPending}
            variant="secondary"
          >
            Search
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-slate-50">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="text-xs uppercase tracking-wide">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center text-muted-foreground">
                  No users found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Shield className="h-4 w-4 text-primary" />
          <span>
            Showing page {page} of {totalPages} • {total} user{total === 1 ? "" : "s"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => applyFilters(Math.max(1, page - 1), search.trim())}
            disabled={page <= 1 || isPending}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => applyFilters(Math.min(totalPages, page + 1), search.trim())}
            disabled={page >= totalPages || isPending}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function formatDate(input?: string | null) {
  if (!input) return "—";
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
}
