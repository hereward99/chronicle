import { useState, useEffect, useCallback } from "react";
import { toast } from "@/hooks/use-toast";

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: "Back online",
        description: "Your connection has been restored.",
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: "You're offline",
        description: "Some features are unavailable without a connection.",
        variant: "destructive",
      });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const requireOnline = useCallback(
    (actionName: string): boolean => {
      if (!isOnline) {
        toast({
          title: "Offline",
          description: `"${actionName}" requires an internet connection.`,
          variant: "destructive",
        });
        return false;
      }
      return true;
    },
    [isOnline]
  );

  return { isOnline, requireOnline };
}
