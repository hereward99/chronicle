import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download } from "lucide-react";
import type { PdfTheme } from "@/lib/pdfExport";

interface PdfExportButtonProps {
  onExport: (theme: PdfTheme) => void;
  label?: string;
  variant?: "outline" | "ghost" | "default";
  size?: "sm" | "default" | "icon";
  iconOnly?: boolean;
  title?: string;
}

export function PdfExportButton({
  onExport,
  label = "Export PDF",
  variant = "outline",
  size = "sm",
  iconOnly = false,
  title = "Export as PDF",
}: PdfExportButtonProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={iconOnly ? "icon" : size} title={title}>
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
