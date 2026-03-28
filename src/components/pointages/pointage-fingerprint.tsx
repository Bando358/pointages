"use client";

import { useState, useCallback, useEffect } from "react";
import { useFingerprint } from "@/components/fingerprint/fingerprint-context";
import { FingerprintStatus } from "@/components/fingerprint/fingerprint-status";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Fingerprint, LogIn, LogOut, Loader2, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { MATCH_THRESHOLD } from "@/lib/constants";
import { soundCapture, soundArrivee, soundDepart, soundDejaComplet, soundError, soundNotRecognized } from "@/lib/sounds";
import type { IdentificationCandidate } from "@/lib/fingerprint/types";

type Phase = "idle" | "capturing" | "identifying" | "identified" | "pointage" | "success" | "error";

interface Props {
  antenneId?: string | null;
  onPointageComplete?: () => void;
}

export function PointageFingerprint({ antenneId, onPointageComplete }: Props) {
  const { service, status, refreshStatus } = useFingerprint();
  const [phase, setPhase] = useState<Phase>("idle");
  const [identifiedUser, setIdentifiedUser] = useState<{ userId: string; nom: string; prenom: string; score: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const [actionEffectuee, setActionEffectuee] = useState<string | null>(null);

  const handlePointageAuto = useCallback(async (user: { userId: string; nom: string; prenom: string; score: number }) => {
    setPhase("pointage");

    try {
      const res = await fetch("/api/fingerprint/pointage", {
        method: "POST",
        headers: { "Content-Type": "application/json",  },
        body: JSON.stringify({ userId: user.userId, score: user.score, antenneId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur serveur");

      if (data.action === "arrivee") soundArrivee();
      else if (data.action === "depart") soundDepart();
      else if (data.action === "deja_complet") soundDejaComplet();

      setActionEffectuee(data.action);
      setPhase("success");
      onPointageComplete?.();
      setTimeout(() => {
        setPhase("idle");
        setIdentifiedUser(null);
        setCapturedImage(null);
        setActionEffectuee(null);
      }, 5000);
    } catch (err: any) {
      soundError();
      setError(err.message);
      setPhase("error");
    }
  }, [antenneId, onPointageComplete]);

  const handleScan = useCallback(async () => {
    setPhase("capturing");
    setError(null);
    setCapturedImage(null);

    const capture = await service.capturer();
    if (!capture.success || !capture.templateBase64) {
      soundError();
      setError(capture.errorMessage ?? "Echec de capture");
      setPhase("error");
      return;
    }

    soundCapture();
    if (capture.imageDataUrl) setCapturedImage(capture.imageDataUrl);
    setPhase("identifying");

    try {
      const res = await fetch("/api/fingerprint/identify", {
        method: "POST",
        headers: { "Content-Type": "application/json",  },
        body: JSON.stringify({ antenneId }),
      });

      if (!res.ok) throw new Error("Erreur serveur");
      const { templates } = await res.json() as { templates: IdentificationCandidate[] };

      let bestMatch: { userId: string; nom: string; prenom: string; score: number } | null = null;

      const BATCH_SIZE = 5;
      for (let i = 0; i < templates.length; i += BATCH_SIZE) {
        const batch = templates.slice(i, i + BATCH_SIZE);
        const results = await Promise.all(
          batch.map(async (candidate) => {
            const result = await service.comparer(capture.templateBase64!, candidate.templateBase64);
            return { candidate, result };
          })
        );

        for (const { candidate, result } of results) {
          if (result.isMatch && result.score > (bestMatch?.score ?? 0)) {
            bestMatch = {
              userId: candidate.userId,
              nom: candidate.nom,
              prenom: candidate.prenom,
              score: result.score,
            };
          }
        }

        if (bestMatch && bestMatch.score >= MATCH_THRESHOLD) break;
      }

      if (!bestMatch || bestMatch.score < MATCH_THRESHOLD) {
        soundNotRecognized();
        setError("Empreinte non reconnue. Veuillez reessayer.");
        setPhase("error");
        return;
      }

      setIdentifiedUser(bestMatch);
      await handlePointageAuto(bestMatch);
    } catch {
      setError("Erreur lors de l'identification");
      setPhase("error");
    }
  }, [service, antenneId, handlePointageAuto]);

  // Auto-scan : lance automatiquement la capture des que le lecteur est pret
  useEffect(() => {
    if (phase === "idle" && status.available && status.deviceConnected) {
      const timer = setTimeout(() => handleScan(), 500);
      return () => clearTimeout(timer);
    }
  }, [phase, status.available, status.deviceConnected, handleScan]);

  // Auto-retry : relance apres une erreur
  useEffect(() => {
    if (phase === "error") {
      const timer = setTimeout(() => reset(), 4000);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  const reset = () => {
    setPhase("idle");
    setIdentifiedUser(null);
    setError(null);
    setCapturedImage(null);
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg border-border/60 animate-fade-in">
      <CardHeader className="text-center pb-2">
        <div className="flex justify-center mb-3">
          <div className="h-14 w-14 rounded-2xl bg-linear-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/25">
            <Fingerprint className="h-7 w-7 text-primary-foreground" />
          </div>
        </div>
        <CardTitle>Pointage Biometrique</CardTitle>
        <FingerprintStatus />
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Clock */}
        <div className="text-center">
          <Clock />
        </div>

        {/* Fingerprint image */}
        {capturedImage && (
          <div className="flex justify-center">
            <img src={capturedImage} alt="Empreinte" className="w-32 h-32 rounded-lg border" />
          </div>
        )}

        {/* Idle / Capturing - en attente du doigt */}
        {(phase === "idle" || phase === "capturing") && (
          <div className="text-center space-y-3">
            {status.available && status.deviceConnected ? (
              <>
                <div className="relative mx-auto w-20 h-20">
                  <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping" style={{ animationDuration: "2s" }} />
                  <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-primary/10">
                    <Fingerprint className="h-10 w-10 text-primary animate-pulse" />
                  </div>
                </div>
                <p className="text-muted-foreground font-medium">Placez votre doigt sur le lecteur...</p>
                <p className="text-xs text-muted-foreground/60">La capture demarre automatiquement</p>
              </>
            ) : (
              <div className="space-y-3">
                <div className="text-center p-4 bg-linear-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200/60">
                  <XCircle className="h-8 w-8 text-amber-600 mx-auto mb-2" />
                  <p className="font-medium text-amber-800">Lecteur non connecte</p>
                  <p className="text-xs text-amber-600 mt-1">
                    {!status.available
                      ? "Le service SecuGen WebAPI n'est pas accessible"
                      : "Branchez le lecteur d'empreinte et reessayez"}
                  </p>
                </div>
                <Button
                  className="w-full h-14 text-base bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-700 hover:shadow-xl hover:shadow-emerald-600/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 animate-pulse"
                  onClick={() => refreshStatus()}
                >
                  <RefreshCw className="h-5 w-5 mr-2" />
                  Reveiller le lecteur
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Identifying */}
        {phase === "identifying" && (
          <div className="text-center space-y-2">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Identification en cours...</p>
          </div>
        )}

        {/* Pointage in progress */}
        {phase === "pointage" && identifiedUser && (
          <div className="text-center space-y-3 animate-fade-in">
            <p className="text-lg font-semibold">{identifiedUser.prenom} {identifiedUser.nom}</p>
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Enregistrement...</p>
          </div>
        )}

        {/* Success */}
        {phase === "success" && identifiedUser && (
          <div className="text-center p-5 rounded-xl border animate-scale-in space-y-2"
            style={{
              background: actionEffectuee === "depart"
                ? "linear-gradient(to bottom right, #fff7ed, #ffedd5)"
                : actionEffectuee === "deja_complet"
                  ? "linear-gradient(to bottom right, #f0f9ff, #e0f2fe)"
                  : "linear-gradient(to bottom right, #ecfdf5, #d1fae5)",
              borderColor: actionEffectuee === "depart"
                ? "#fed7aa"
                : actionEffectuee === "deja_complet"
                  ? "#bae6fd"
                  : "#a7f3d0",
            }}
          >
            {actionEffectuee === "arrivee" && (
              <>
                <LogIn className="h-10 w-10 text-emerald-600 mx-auto" />
                <p className="text-lg font-bold text-emerald-700">Arrivee enregistree !</p>
              </>
            )}
            {actionEffectuee === "depart" && (
              <>
                <LogOut className="h-10 w-10 text-orange-600 mx-auto" />
                <p className="text-lg font-bold text-orange-700">Depart enregistre !</p>
              </>
            )}
            {actionEffectuee === "deja_complet" && (
              <>
                <CheckCircle className="h-10 w-10 text-blue-600 mx-auto" />
                <p className="text-lg font-bold text-blue-700">Deja pointe aujourd&apos;hui</p>
              </>
            )}
            <p className="text-base font-semibold">{identifiedUser.prenom} {identifiedUser.nom}</p>
          </div>
        )}

        {/* Error - auto-retry after 4s */}
        {phase === "error" && (
          <div className="space-y-3 animate-fade-in">
            <div className="text-center p-4 bg-linear-to-br from-red-50 to-rose-50 rounded-xl border border-red-200/60">
              <XCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
              <p className="text-red-700">{error}</p>
              <p className="text-xs text-muted-foreground mt-2">Nouvel essai automatique...</p>
            </div>
            <Button variant="outline" className="w-full" onClick={reset}>
              Reessayer
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Clock() {
  const [time, setTime] = useState<string>("");

  useEffect(() => {
    const update = () => setTime(new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <p className="text-3xl font-mono font-bold tabular-nums">
      {time || "\u00A0"}
    </p>
  );
}
