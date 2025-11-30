"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Download,
  Users,
  GraduationCap,
  DollarSign,
  Loader2,
  FileSpreadsheet,
} from "lucide-react";

type ExportType = "tutors" | "students" | "revenue";

interface ExportConfig {
  type: ExportType;
  title: string;
  description: string;
  icon: typeof Users;
  filters: {
    name: string;
    label: string;
    type: "select" | "date";
    options?: { value: string; label: string }[];
  }[];
}

const exportConfigs: ExportConfig[] = [
  {
    type: "tutors",
    title: "Tutors",
    description: "Export all tutor accounts with profile information",
    icon: Users,
    filters: [
      {
        name: "plan",
        label: "Subscription Plan",
        type: "select",
        options: [
          { value: "all", label: "All Plans" },
          { value: "free", label: "Free" },
          { value: "professional", label: "Professional" },
          { value: "business", label: "Business" },
        ],
      },
    ],
  },
  {
    type: "students",
    title: "Students",
    description: "Export all student records across the platform",
    icon: GraduationCap,
    filters: [],
  },
  {
    type: "revenue",
    title: "Revenue",
    description: "Export paid booking transactions",
    icon: DollarSign,
    filters: [
      {
        name: "startDate",
        label: "Start Date",
        type: "date",
      },
      {
        name: "endDate",
        label: "End Date",
        type: "date",
      },
    ],
  },
];

export default function AdminExportPage() {
  const [loading, setLoading] = useState<ExportType | null>(null);
  const [filters, setFilters] = useState<Record<string, Record<string, string>>>({
    tutors: { plan: "all" },
    students: {},
    revenue: {},
  });

  async function handleExport(type: ExportType) {
    setLoading(type);

    try {
      const params = new URLSearchParams();
      const typeFilters = filters[type];

      Object.entries(typeFilters).forEach(([key, value]) => {
        if (value && value !== "all") {
          params.set(key, value);
        }
      });

      const url = `/api/admin/export/${type}?${params.toString()}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Export failed");
      }

      // Get the filename from the Content-Disposition header
      const disposition = response.headers.get("Content-Disposition");
      let filename = `${type}-export.csv`;
      if (disposition) {
        const match = disposition.match(/filename="(.+)"/);
        if (match) {
          filename = match[1];
        }
      }

      // Create blob and download
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Export error:", error);
      alert("Failed to export data. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  function updateFilter(type: ExportType, name: string, value: string) {
    setFilters((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        [name]: value,
      },
    }));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Data Export</h1>
        <p className="text-muted-foreground">
          Export platform data as CSV files
        </p>
      </div>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-blue-800 flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            CSV Export
          </CardTitle>
        </CardHeader>
        <CardContent className="text-blue-800 text-sm">
          <ul className="list-disc list-inside space-y-1">
            <li>All exports are logged in the admin audit trail</li>
            <li>Data is exported in CSV format for easy spreadsheet import</li>
            <li>Large exports may take a few seconds to generate</li>
          </ul>
        </CardContent>
      </Card>

      {/* Export Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {exportConfigs.map((config) => {
          const Icon = config.icon;
          const isLoading = loading === config.type;

          return (
            <Card key={config.type}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon className="h-5 w-5" />
                  {config.title}
                </CardTitle>
                <CardDescription>{config.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Filters */}
                {config.filters.map((filter) => (
                  <div key={filter.name} className="space-y-2">
                    <Label htmlFor={`${config.type}-${filter.name}`}>
                      {filter.label}
                    </Label>
                    {filter.type === "select" && filter.options && (
                      <Select
                        value={filters[config.type][filter.name] || "all"}
                        onValueChange={(value) =>
                          updateFilter(config.type, filter.name, value)
                        }
                      >
                        <SelectTrigger id={`${config.type}-${filter.name}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {filter.options.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    {filter.type === "date" && (
                      <Input
                        id={`${config.type}-${filter.name}`}
                        type="date"
                        value={filters[config.type][filter.name] || ""}
                        onChange={(e) =>
                          updateFilter(config.type, filter.name, e.target.value)
                        }
                      />
                    )}
                  </div>
                ))}

                {/* Export Button */}
                <Button
                  className="w-full"
                  onClick={() => handleExport(config.type)}
                  disabled={!!loading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Export {config.title}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
