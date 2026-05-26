import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PdfTheme } from "@/lib/pdfExport";

interface PdfExportButtonProps {
  onExport: (theme: PdfTheme) => void;
  label?: string;
  variant?: "outline" | "ghost" | "default";
  size?: "sm" | "default" | "icon";
  iconOnly?: boolean;
  title?: string;
  /** When true (and iconOnly), use the compact 8x8 toolbar size. */
  toolbar?: boolean;
}

export function PdfExportButton({
  onExport,
  label = "Export PDF",
  variant = "outline",
  size = "sm",
  iconOnly = false,
  title = "Export as PDF",
  toolbar = false,
}: PdfExportButtonProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={iconOnly ? "icon" : size}
          title={title}
          aria-label={title}
          className={cn(iconOnly && toolbar && "h-8 w-8")}
        >
          <Download className={iconOnly ? "h-4 w-4" : "h-4 w-4 mr-2"} />
          {!iconOnly && label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onExport("dark")}>
          Dark theme (screen)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onExport("light")}>
          Light theme (printer-friendly)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

