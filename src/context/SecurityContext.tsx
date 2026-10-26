import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { AppState } from "react-native";
import { GuardStatus, getGuard, isApiBlocked, isRestricted, refreshGuard, subscribeGuard } from "../security/guard";

interface SecurityContextType {
  status: GuardStatus;
  restricted: boolean;
  apiBlocked: boolean;
  recheck: () => Promise<void>;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export const SecurityProvider = ({ children }: { children: ReactNode }) => {
  const [status, setStatus] = useState<GuardStatus>(getGuard());

  useEffect(() => {
    const unsub = subscribeGuard(setStatus);
    refreshGuard();
    // periksa ulang saat app kembali aktif dan berkala selama app di layar
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active") refreshGuard();
    });
    const timer = setInterval(() => {
      if (AppState.currentState === "active") refreshGuard();
    }, 8000);
    return () => {
      unsub();
      sub.remove();
      clearInterval(timer);
    };
  }, []);

  const recheck = useCallback(async () => {
    await refreshGuard();
  }, []);

  const value = useMemo(
    () => ({ status, restricted: isRestricted(status), apiBlocked: isApiBlocked(status), recheck }),
    [status, recheck]
  );
  return <SecurityContext.Provider value={value}>{children}</SecurityContext.Provider>;
};

export const useSecurity = () => {
  const ctx = useContext(SecurityContext);
  if (!ctx) throw new Error("useSecurity must be used within SecurityProvider");
  return ctx;
};
