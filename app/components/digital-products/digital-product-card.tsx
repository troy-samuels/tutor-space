import { Eye, EyeOff, FileArchive, FileText, Link as LinkIcon, MoreVertical, Trash2 } from "lucide-react";
import type { DigitalProductRecord } from "@/lib/types/digital-product";
import { formatCurrency } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type DigitalProductCardProps = {
  product: DigitalProductRecord;
  shareUrl?: string | null;
  isWorking?: boolean;
  onPublishToggle: (publish: boolean) => void;
  onDelete: () => void;
  onCopyLink?: () => void;
};

function getFileLabel(product: DigitalProductRecord) {
  if (product.fulfillment_type === "link") return "Link";
  const path = product.storage_path || product.external_url || "";
  const extension = path.split(".").pop()?.toUpperCase();
  if (extension === "PDF") return "PDF";
  if (extension === "ZIP") return "ZIP";
  return extension || "File";
}

export function DigitalProductCard({
  product,
  shareUrl,
  isWorking,
  onPublishToggle,
  onDelete,
  onCopyLink,
}: DigitalProductCardProps) {
  const fileLabel = getFileLabel(product);
  const salesCount = product.total_sales ?? 0;
  const salesLabel = `${salesCount} sale${salesCount === 1 ? "" : "s"}`;
  const currencyCode = (product.currency || "USD").toUpperCase();
  const priceLabel = formatCurrency(product.price_cents, currencyCode);
  const FileIcon = fileLabel === "ZIP" ? FileArchive : FileText;

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border bg-white/90 p-4 shadow-sm">
      <div className="flex h-20 w-16 items-center justify-center rounded-lg bg-stone-100 text-stone-500">
        <FileIcon className="h-6 w-6" />
      </div>
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex items-center gap-2">
          <p className="text-lg font-semibold tracking-tight text-foreground line-clamp-1">
            {product.title}
          </p>
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
              product.published ? "bg-emerald-50 text-emerald-700" : "bg-muted text-muted-foreground"
            }`}
          >
            {product.published ? "Published" : "Draft"}
          </span>
        </div>
        {product.description ? (
          <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
        ) : null}
        <p className="text-xs font-medium text-muted-foreground">
          {fileLabel} • {salesLabel}
        </p>
      </div>
      <div className="flex items-start gap-2 pl-2">
        <div className="text-right">
          <p className="text-xl font-semibold tracking-tight text-foreground">{priceLabel}</p>
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{currencyCode}</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-secondary/60 text-muted-foreground transition hover:bg-secondary"
            aria-label="Product options"
            disabled={isWorking}
          >
            <MoreVertical className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem
              onClick={() => onPublishToggle(!product.published)}
              disabled={isWorking}
              className="flex items-center gap-2"
            >
              {product.published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {product.published ? "Hide product" : "Publish product"}
            </DropdownMenuItem>
            {shareUrl && onCopyLink ? (
              <DropdownMenuItem
                onClick={onCopyLink}
                disabled={isWorking}
                className="flex items-center gap-2"
              >
                <LinkIcon className="h-4 w-4" />
                Copy link
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem
              onClick={onDelete}
              disabled={isWorking}
              className="flex items-center gap-2 text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
