import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DetailPageHeaderProps {
  title: string;
  subtitle?: ReactNode;
  backTo: string;
  actions?: ReactNode;
}

export function DetailPageHeader({ title, subtitle, backTo, actions }: DetailPageHeaderProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate(backTo);
  };

  return (
    <div className="mb-6 space-y-3">
      <Button variant="ghost" size="sm" onClick={handleBack} className="-ml-2">
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back
      </Button>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl font-bold tracking-tight break-words">{title}</h1>
          {subtitle && <div className="text-muted-foreground mt-1">{subtitle}</div>}
        </div>
        {actions && <div className="flex flex-wrap gap-2 shrink-0">{actions}</div>}
      </div>
    </div>
  );
}

export function DetailNotFound({ label, backTo }: { label: string; backTo: string }) {
  const navigate = useNavigate();
  return (
    <div className="max-w-2xl mx-auto text-center py-16 space-y-4">
      <h1 className="text-2xl font-bold">{label} not found</h1>
      <p className="text-muted-foreground">
        This entity may have been deleted, belongs to a different chronicle, or the link is invalid.
      </p>
      <Button onClick={() => navigate(backTo)}>Go back</Button>
    </div>
  );
}
