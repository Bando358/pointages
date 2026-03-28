"use client";

import { useFingerprint } from "./fingerprint-context";
import { Badge } from "@/components/ui/badge";
import { Fingerprint } from "lucide-react";

export function FingerprintStatus() {
  const { status } = useFingerprint();

  if (!status.available) {
    return (
      <Badge variant="destructive" className="gap-1">
        <Fingerprint className="h-3 w-3" />
        Service hors ligne
      </Badge>
    );
  }

  if (!status.deviceConnected) {
    return (
      <Badge variant="secondary" className="gap-1 bg-yellow-100 text-yellow-800">
        <Fingerprint className="h-3 w-3" />
        Lecteur non connecte
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="gap-1 bg-green-100 text-green-800">
      <Fingerprint className="h-3 w-3" />
      Lecteur pret
    </Badge>
  );
}
