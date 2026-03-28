"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createPlanning, deletePlanning } from "@/lib/actions/planning.actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarRange, Plus, Trash2, Eye, Users, Clock, Coffee } from "lucide-react";
import { toast } from "sonner";
import { hasGlobalAccess } from "@/lib/constants";

const JOURS_FULL = ["", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const JOURS = ["", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const TYPE_LABELS: Record<string, string> = {
  ADMINISTRATIF: "Administratif",
  GARDE: "Garde",
  PERSONNALISE: "Personnalise",
};
const TYPE_DESC: Record<string, string> = {
  ADMINISTRATIF: "Horaires fixes en semaine. Ne travaille pas les jours feries.",
  GARDE: "Rotation pour prestataires de sante. Travaille meme les jours feries.",
  PERSONNALISE: "Planning sur mesure.",
};

interface JourConfig {
  actif: boolean;
  heureDebut: string;
  heureFin: string;
  pauseDebut: string;
  pauseFin: string;
}

interface SemaineConfig {
  label: string;
  jours: JourConfig[]; // index 0=Lun(1) ... 6=Dim(7)
}

function defaultJour(actif = false): JourConfig {
  return { actif, heureDebut: "07:30", heureFin: "16:30", pauseDebut: "12:00", pauseFin: "13:00" };
}

function defaultSemaine(label: string): SemaineConfig {
  return {
    label,
    jours: [
      defaultJour(true),  // Lun
      defaultJour(true),  // Mar
      defaultJour(true),  // Mer
      defaultJour(true),  // Jeu
      defaultJour(true),  // Ven
      defaultJour(false), // Sam
      defaultJour(false), // Dim
    ],
  };
}

interface Props {
  plannings: any[];
  antennes: any[];
  currentAntenneId: string | null;
  currentRole: string;
  currentAccesGlobal: boolean;
}

function getMonday(d: Date): Date {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const mon = new Date(d);
  mon.setDate(d.getDate() + diff);
  return mon;
}

function getWeekNumber(d: Date): number {
  const start = new Date(d.getFullYear(), 0, 1);
  const diff = d.getTime() - start.getTime();
  const oneWeek = 604800000;
  return Math.ceil((diff / oneWeek) + start.getDay() / 7);
}

function formatDMY(d: Date): string {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear());
  return `${dd}-${mm}-${yy}`;
}

function generatePlanningName(dateDebut: string): string {
  const d = new Date(dateDebut);
  const monday = getMonday(d);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const numSemaine = getWeekNumber(monday);
  return `S${numSemaine}_${formatDMY(monday)}-${formatDMY(sunday)}`;
}

export function PlanningsPageClient({ plannings, antennes, currentAntenneId, currentRole, currentAccesGlobal }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const today = new Date().toISOString().split("T")[0];
  const [dateDebutSemaine, setDateDebutSemaine] = useState(today);
  const [nom, setNom] = useState(() => generatePlanningName(today));
  const [description, setDescription] = useState("");
  const [type, setType] = useState("ADMINISTRATIF");
  const [nombreSemaines, setNombreSemaines] = useState(1);
  const [antenneId, setAntenneId] = useState(currentAntenneId ?? "");
  const [semaines, setSemaines] = useState<SemaineConfig[]>([defaultSemaine("Semaine")]);

  function handleDateChange(date: string) {
    setDateDebutSemaine(date);
    setNom(generatePlanningName(date));
  }

  function resetForm() {
    setStep(1);
    setDateDebutSemaine(today);
    setNom(generatePlanningName(today));
    setDescription("");
    setType("ADMINISTRATIF");
    setNombreSemaines(1);
    setAntenneId(currentAntenneId ?? "");
    setSemaines([defaultSemaine("Semaine")]);
  }

  function handleNombreSemainesChange(n: number) {
    setNombreSemaines(n);
    const updated = [...semaines];
    while (updated.length < n) {
      updated.push(defaultSemaine(`Semaine ${String.fromCharCode(65 + updated.length)}`));
    }
    while (updated.length > n) updated.pop();
    // Rename if multi
    if (n > 1) updated.forEach((s, i) => (s.label = `Semaine ${String.fromCharCode(65 + i)}`));
    else updated[0].label = "Semaine";
    setSemaines(updated);
  }

  function updateJour(semaineIdx: number, jourIdx: number, field: keyof JourConfig, value: any) {
    setSemaines((prev) => {
      const copy = prev.map((s) => ({ ...s, jours: s.jours.map((j) => ({ ...j })) }));
      (copy[semaineIdx].jours[jourIdx] as any)[field] = value;
      return copy;
    });
  }

  function applyToAllDays(semaineIdx: number) {
    setSemaines((prev) => {
      const copy = prev.map((s) => ({ ...s, jours: s.jours.map((j) => ({ ...j })) }));
      const firstActive = copy[semaineIdx].jours.find((j) => j.actif);
      if (!firstActive) return copy;
      copy[semaineIdx].jours.forEach((j) => {
        if (j.actif) {
          j.heureDebut = firstActive.heureDebut;
          j.heureFin = firstActive.heureFin;
          j.pauseDebut = firstActive.pauseDebut;
          j.pauseFin = firstActive.pauseFin;
        }
      });
      return copy;
    });
    toast.success("Horaires appliques a tous les jours actifs");
  }

  async function handleCreate() {
    if (!nom.trim()) { toast.error("Nom requis"); return; }
    const activeCount = semaines.reduce((s, sem) => s + sem.jours.filter((j) => j.actif).length, 0);
    if (activeCount === 0) { toast.error("Au moins un jour travaille requis"); return; }

    try {
      await createPlanning({
        nom,
        description: description || undefined,
        type: type as any,
        nombreSemaines,
        antenneId: antenneId || undefined,
        semaines: semaines.map((sem, si) => ({
          numeroSemaine: si + 1,
          label: nombreSemaines > 1 ? sem.label : undefined,
          jours: sem.jours
            .map((j, ji) => ({
              jourSemaine: ji + 1,
              travaille: j.actif,
              heureDebut: j.heureDebut,
              heureFin: j.heureFin,
              pauseDebut: j.pauseDebut,
              pauseFin: j.pauseFin,
            }))
            .filter((j) => j.travaille),
        })),
      });
      toast.success("Planning cree avec succes");
      setOpen(false);
      resetForm();
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Desactiver ce planning ?")) return;
    await deletePlanning(id);
    toast.success("Planning desactive");
    router.refresh();
  }

  const totalJoursActifs = semaines.reduce((s, sem) => s + sem.jours.filter((j) => j.actif).length, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <CalendarRange className="h-6 w-6" />
            Plannings
          </h2>
          <p className="text-muted-foreground">{plannings.length} planning(s) actif(s)</p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger render={<Button />}><Plus className="h-4 w-4 mr-2" />Nouveau planning</DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Creer un planning</DialogTitle>
              <p className="text-sm text-muted-foreground">Etape {step}/2</p>
            </DialogHeader>

            {/* === STEP 1 : Infos generales === */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <Label>Semaine du</Label>
                  <Input type="date" value={dateDebutSemaine} onChange={(e) => handleDateChange(e.target.value)} required />
                </div>
                <div className="bg-muted/50 rounded-xl p-3">
                  <p className="text-xs text-muted-foreground">Nom genere automatiquement</p>
                  <p className="text-base font-bold mt-0.5">{nom}</p>
                </div>
                <div>
                  <Label>Description (optionnel)</Label>
                  <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Horaires pour le personnel administratif..." />
                </div>

                <div>
                  <Label className="mb-2 block">Type de planning</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(TYPE_LABELS).map(([k, v]) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setType(k)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          type === k
                            ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                            : "border-border hover:border-primary/30"
                        }`}
                      >
                        <p className="text-sm font-medium">{v}</p>
                        <p className="text-xs text-muted-foreground mt-1">{TYPE_DESC[k]}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Rotation</Label>
                    <select
                      value={nombreSemaines}
                      onChange={(e) => handleNombreSemainesChange(Number(e.target.value))}
                      className="flex h-8 w-full items-center rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      <option value={1}>1 semaine (fixe)</option>
                      <option value={2}>2 semaines (A/B)</option>
                      <option value={3}>3 semaines (A/B/C)</option>
                      <option value={4}>4 semaines</option>
                    </select>
                  </div>
                  {hasGlobalAccess(currentRole, currentAccesGlobal) && (
                    <div>
                      <Label>Antenne</Label>
                      <select
                        value={antenneId}
                        onChange={(e) => setAntenneId(e.target.value)}
                        className="flex h-8 w-full items-center rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                      >
                        <option value="">Global (toutes antennes)</option>
                        {antennes.map((a: any) => <option key={a.id} value={a.id}>{a.nom}</option>)}
                      </select>
                    </div>
                  )}
                </div>

                <Button className="w-full" onClick={() => { if (!nom.trim()) { toast.error("Nom requis"); return; } setStep(2); }}>
                  Suivant - Configurer les horaires
                </Button>
              </div>
            )}

            {/* === STEP 2 : Configuration des jours === */}
            {step === 2 && (
              <div className="space-y-4">
                {nombreSemaines > 1 ? (
                  <Tabs defaultValue="0">
                    <TabsList className="w-full">
                      {semaines.map((sem, si) => (
                        <TabsTrigger key={si} value={String(si)} className="flex-1">
                          {sem.label}
                          <Badge variant="secondary" className="ml-1.5 text-xs">{sem.jours.filter((j) => j.actif).length}j</Badge>
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    {semaines.map((sem, si) => (
                      <TabsContent key={si} value={String(si)}>
                        <SemaineEditor
                          semaine={sem}
                          semaineIdx={si}
                          updateJour={updateJour}
                          applyToAll={() => applyToAllDays(si)}
                        />
                      </TabsContent>
                    ))}
                  </Tabs>
                ) : (
                  <SemaineEditor
                    semaine={semaines[0]}
                    semaineIdx={0}
                    updateJour={updateJour}
                    applyToAll={() => applyToAllDays(0)}
                  />
                )}

                {/* Resume */}
                <div className="bg-muted/50 rounded-xl p-3 text-sm space-y-1">
                  <p className="font-medium">Resume</p>
                  <p className="text-muted-foreground">
                    {nom} - {TYPE_LABELS[type]} - {nombreSemaines > 1 ? `${nombreSemaines} semaines de rotation` : "Fixe"} - {totalJoursActifs} jour(s) travaille(s)
                  </p>
                  {type === "GARDE" && <p className="text-xs text-amber-600">Les gardes travaillent meme les jours feries</p>}
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>Retour</Button>
                  <Button className="flex-1" onClick={handleCreate}>Creer le planning</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Liste des plannings */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 stagger">
        {plannings.map((p: any) => (
          <Card key={p.id} className="hover:-translate-y-0.5 hover:shadow-md transition-all duration-300">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">{p.nom}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">{p.description}</p>
                </div>
                <Badge variant="outline">{TYPE_LABELS[p.type] ?? p.type}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-4 text-sm">
                <span className="text-muted-foreground">
                  {p.nombreSemaines > 1 ? `${p.nombreSemaines} semaines` : "Fixe"}
                </span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Users className="h-3 w-3" />
                  {p._count?.affectations ?? 0}
                </span>
              </div>

              {p.semaines?.map((sem: any) => (
                <div key={sem.id}>
                  {p.nombreSemaines > 1 && (
                    <p className="text-xs font-medium text-muted-foreground mb-1">{sem.label ?? `Sem. ${sem.numeroSemaine}`}</p>
                  )}
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5, 6, 7].map((j) => {
                      const jour = sem.jours?.find((d: any) => d.jourSemaine === j && d.travaille);
                      return (
                        <div
                          key={j}
                          className={`w-8 h-8 rounded text-xs flex items-center justify-center font-medium ${
                            jour ? "bg-primary/15 text-primary" : "bg-muted/50 text-muted-foreground/40"
                          }`}
                          title={jour ? `${jour.heureDebut}-${jour.heureFin}` : "Repos"}
                        >
                          {JOURS[j]}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {p.antenne && <p className="text-xs text-muted-foreground">Antenne: {p.antenne.nom}</p>}

              <div className="flex gap-2 pt-1">
                <Button variant="outline" size="sm" nativeButton={false} render={<Link href={`/plannings/${p.id}`} />}>
                  <Eye className="h-3 w-3 mr-1" />Details
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(p.id)}>
                  <Trash2 className="h-3 w-3 mr-1 text-red-500" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {plannings.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            <CalendarRange className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>Aucun planning cree</p>
            <p className="text-sm">Creez un planning pour definir les jours et horaires de travail</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== COMPOSANT EDITEUR DE SEMAINE ====================

function SemaineEditor({
  semaine,
  semaineIdx,
  updateJour,
  applyToAll,
}: {
  semaine: SemaineConfig;
  semaineIdx: number;
  updateJour: (si: number, ji: number, field: keyof JourConfig, value: any) => void;
  applyToAll: () => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Cliquez sur un jour pour l&apos;activer/desactiver</p>
        <Button variant="ghost" size="sm" onClick={applyToAll} className="text-xs">
          Appliquer les memes horaires a tous
        </Button>
      </div>

      {semaine.jours.map((jour, ji) => (
        <div
          key={ji}
          className={`rounded-xl border p-3 transition-all ${
            jour.actif
              ? "border-primary/30 bg-primary/5"
              : "border-border/50 bg-muted/20 opacity-60"
          }`}
        >
          <div className="flex items-center gap-3">
            {/* Toggle jour */}
            <button
              type="button"
              onClick={() => updateJour(semaineIdx, ji, "actif", !jour.actif)}
              className={`w-12 h-12 rounded-lg text-sm font-bold transition-all shrink-0 ${
                jour.actif
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {JOURS[ji + 1]}
            </button>

            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${jour.actif ? "" : "text-muted-foreground"}`}>
                {JOURS_FULL[ji + 1]}
                {!jour.actif && <span className="text-xs ml-2 text-muted-foreground/60">- Repos</span>}
              </p>

              {jour.actif && (
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <Input
                      type="time"
                      value={jour.heureDebut}
                      onChange={(e) => updateJour(semaineIdx, ji, "heureDebut", e.target.value)}
                      className="h-7 w-[90px] text-xs"
                    />
                    <span className="text-xs text-muted-foreground">-</span>
                    <Input
                      type="time"
                      value={jour.heureFin}
                      onChange={(e) => updateJour(semaineIdx, ji, "heureFin", e.target.value)}
                      className="h-7 w-[90px] text-xs"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <Coffee className="h-3 w-3 text-muted-foreground" />
                    <Input
                      type="time"
                      value={jour.pauseDebut}
                      onChange={(e) => updateJour(semaineIdx, ji, "pauseDebut", e.target.value)}
                      className="h-7 w-[90px] text-xs"
                    />
                    <span className="text-xs text-muted-foreground">-</span>
                    <Input
                      type="time"
                      value={jour.pauseFin}
                      onChange={(e) => updateJour(semaineIdx, ji, "pauseFin", e.target.value)}
                      className="h-7 w-[90px] text-xs"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
