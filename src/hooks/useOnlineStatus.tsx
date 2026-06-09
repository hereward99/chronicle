import { useState, useEffect, useCallback } from "react";
import { notify } from "@/lib/notify";

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      notify.success("Back online", "Your connection has been restored.");
    };

    const handleOffline = () => {
      setIsOnline(false);
      notify.offline("Saving changes");
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
        notify.offline(actionName);
        return false;
      }
      return true;
    },
    [isOnline]
  );

  return { isOnline, requireOnline };
}
