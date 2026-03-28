"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FingerprintProvider, useFingerprint } from "@/components/fingerprint/fingerprint-context";
import { FingerprintStatus } from "@/components/fingerprint/fingerprint-status";
import { supprimerEmpreinte } from "@/lib/actions/empreinte.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { DOIGT_LABELS, MIN_QUALITY, ENROLLMENT_CAPTURES } from "@/lib/constants";
import { Fingerprint, Trash2, Loader2, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { formatDateFr } from "@/lib/date-utils";

interface Props {
  user: any;
  empreintes: any[];
  enrollerId: string;
}

export function EnrollmentPageClient({ user, empreintes, enrollerId }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Empreintes de {user.prenom} {user.nom}</h2>
        <p className="text-muted-foreground">{user.antenne?.nom ?? ""}</p>
      </div>

      <FingerprintProvider>
        <div className="grid gap-6 md:grid-cols-2">
          <EnrollmentForm userId={user.id} enrollerId={enrollerId} existingFingers={empreintes.map((e: any) => e.doigt)} />
          <EnrolledList empreintes={empreintes} />
        </div>
      </FingerprintProvider>
    </div>
  );
}

function EnrollmentForm({ userId, enrollerId, existingFingers }: { userId: string; enrollerId: string; existingFingers: number[] }) {
  const { service, status, refreshStatus } = useFingerprint();
  const router = useRouter();
  const [doigt, setDoigt] = useState("2");
  const [phase, setPhase] = useState<"idle" | "capturing" | "success" | "error">("idle");
  const [captures, setCaptures] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function handleEnroll() {
    setPhase("capturing");
    setError(null);
    setCaptures(0);

    let bestTemplate: string | null = null;
    let bestQuality = 0;

    for (let i = 0; i < ENROLLMENT_CAPTURES; i++) {
      setCaptures(i + 1);
      const result = await service.capturer();
      if (!result.success || !result.templateBase64) {
        setError(result.errorMessage ?? "Echec de capture");
        setPhase("error");
        return;
      }
      if ((result.quality ?? 0) < MIN_QUALITY) {
        setError(`Qualite insuffisante (${result.quality}). Minimum: ${MIN_QUALITY}`);
        setPhase("error");
        return;
      }
      if ((result.quality ?? 0) > bestQuality) {
        bestQuality = result.quality ?? 0;
        bestTemplate = result.templateBase64;
      }
    }

    try {
      const res = await fetch("/api/fingerprint/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, doigt: Number(doigt), templateBase64: bestTemplate, qualite: bestQuality }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      setPhase("success");
      toast.success("Empreinte enrolee avec succes");
      router.refresh();
      setTimeout(() => setPhase("idle"), 3000);
    } catch (err: any) {
      setError(err.message);
      setPhase("error");
    }
  }

  const availableFingers = Object.entries(DOIGT_LABELS).filter(
    ([k]) => !existingFingers.includes(Number(k))
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Fingerprint className="h-5 w-5" />
          Enrolement
        </CardTitle>
        <FingerprintStatus />
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Doigt a enroler</Label>
          <Select value={doigt} onValueChange={(v: string | null) => setDoigt(v ?? "2")}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {availableFingers.map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {phase === "idle" && status.available && status.deviceConnected && (
          <Button className="w-full" onClick={handleEnroll}>
            <Fingerprint className="h-4 w-4 mr-2" />
            Demarrer l&apos;enrolement ({ENROLLMENT_CAPTURES} captures)
          </Button>
        )}

        {phase === "idle" && (!status.available || !status.deviceConnected) && (
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
              className="w-full h-12 text-base bg-blue-600 text-white shadow-lg shadow-blue-600/30 hover:bg-blue-800 hover:shadow-xl hover:shadow-blue-800/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
              onClick={() => refreshStatus()}
            >
              <RefreshCw className="h-5 w-5 mr-2" />
              Reveiller le lecteur
            </Button>
          </div>
        )}

        {phase === "capturing" && (
          <div className="text-center space-y-2 p-4 bg-blue-50 rounded-lg">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
            <p>Capture {captures}/{ENROLLMENT_CAPTURES}...</p>
            <p className="text-sm text-muted-foreground">Placez le doigt sur le lecteur</p>
          </div>
        )}

        {phase === "success" && (
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="text-green-700 font-medium">Enrolement reussi !</p>
          </div>
        )}

        {phase === "error" && (
          <div className="space-y-2">
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <XCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
              <p className="text-red-700">{error}</p>
            </div>
            <Button variant="outline" className="w-full" onClick={() => setPhase("idle")}>Reessayer</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function EnrolledList({ empreintes }: { empreintes: any[] }) {
  const router = useRouter();

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cette empreinte ?")) return;
    await supprimerEmpreinte(id);
    toast.success("Empreinte supprimee");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Empreintes enrolees ({empreintes.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {empreintes.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">Aucune empreinte enrolee</p>
        ) : (
          <div className="space-y-3">
            {empreintes.map((e: any) => (
              <div key={e.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{DOIGT_LABELS[e.doigt] ?? `Doigt ${e.doigt}`}</p>
                  <p className="text-sm text-muted-foreground">Qualite: {e.qualite}% - {formatDateFr(e.createdAt)}</p>
                  {e.enrolledBy && <p className="text-xs text-muted-foreground">Par: {e.enrolledBy.prenom} {e.enrolledBy.nom}</p>}
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(e.id)}>
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
