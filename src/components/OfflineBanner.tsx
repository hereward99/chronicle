import { WifiOff } from "lucide-react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

export function OfflineBanner() {
  const { isOnline } = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="bg-destructive/90 text-destructive-foreground px-4 py-2 text-center text-sm flex items-center justify-center gap-2 z-50">
      <WifiOff className="h-4 w-4" />
      <span>You're offline — some features are unavailable</span>
    </div>
  );
}
