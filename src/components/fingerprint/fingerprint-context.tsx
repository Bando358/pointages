"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { IFingerprintService, FingerprintServiceStatus } from "@/lib/fingerprint/types";
import { getFingerprintService } from "@/lib/fingerprint";

interface FingerprintContextValue {
  service: IFingerprintService;
  status: FingerprintServiceStatus;
  refreshStatus: () => Promise<void>;
}

const FingerprintContext = createContext<FingerprintContextValue | null>(null);

export function FingerprintProvider({ children }: { children: ReactNode }) {
  const [service] = useState(() => getFingerprintService());
  const [status, setStatus] = useState<FingerprintServiceStatus>({
    available: false,
    deviceConnected: false,
  });

  const refreshStatus = async () => {
    const s = await service.verifierDisponibilite();
    setStatus(s);
  };

  useEffect(() => {
    refreshStatus();
    const interval = setInterval(refreshStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <FingerprintContext.Provider value={{ service, status, refreshStatus }}>
      {children}
    </FingerprintContext.Provider>
  );
}

export function useFingerprint() {
  const ctx = useContext(FingerprintContext);
  if (!ctx) throw new Error("useFingerprint doit etre utilise dans un FingerprintProvider");
  return ctx;
}
