"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  genererRotation,
  getRotation,
  getEquipes,
  createEquipe,
  deleteEquipe,
  addMembreEquipe,
  removeMembreEquipe,
  getEmployesSansEquipe,
  updateRotationEntry,
  supprimerRotation,
} from "@/lib/actions/rotation.actions";
import {
  TYPE_SHIFT_LABELS,
  TYPE_SHIFT_COLORS,
  TYPE_SHIFT_DOT_COLORS,
  SHIFT_DEFAULTS,
  hasGlobalAccess,
} from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  ArrowRight,
  CalendarRange,
  Plus,
  Trash2,
  Users,
  UserPlus,
  Zap,
  Sun,
  Moon,
  Coffee,
  ChevronLeft,
} from "lucide-react";
import { toast } from "sonner";

const MOIS_LABELS = [
  "Janvier", "Fevrier", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Aout", "Septembre", "Octobre", "Novembre", "Decembre",
];

const JOURS_COURTS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

const EQUIPE_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

interface EquipeData {
  id: string;
  nom: string;
  code: string;
  couleur: string;
  actif: boolean;
  antenneId: string | null;
  membres: { id: string; user: { id: string; nom: string; prenom: string } }[];
  _count: { membres: number };
}

interface RotationEntry {
  id: string;
  date: string;
  typeShift: string;
  heureDebut: string | null;
  heureFin: string | null;
  finLendemain: boolean;
  equipe: { id: string; nom: string; code: string; couleur: string };
}

interface Props {
  equipes: EquipeData[];
  rotation: RotationEntry[];
  antennes: any[];
  employesSansEquipe: { id: string; nom: string; prenom: string }[];
  currentAntenneId: string | null;
  currentRole: string;
  currentAccesGlobal: boolean;
  initialMois: number;
  initialAnnee: number;
}

function getShiftIcon(type: string) {
  switch (type) {
    case "PERMANENCE": return <Sun className="h-3 w-3" />;
    case "GARDE": return <Moon className="h-3 w-3" />;
    case "REPOS": return <Coffee className="h-3 w-3" />;
    default: return null;
  }
}

export function RotationPageClient({
  equipes: initialEquipes,
  rotation: initialRotation,
  antennes,
  employesSansEquipe: initialSansEquipe,
  currentAntenneId,
  currentRole,
  currentAccesGlobal,
  initialMois,
  initialAnnee,
}: Props) {
  const router = useRouter();
  const [mois, setMois] = useState(initialMois);
  const [annee, setAnnee] = useState(initialAnnee);
  const [equipes, setEquipes] = useState(initialEquipes);
  const [rotation, setRotation] = useState(initialRotation);
  const [sansEquipe, setSansEquipe] = useState(initialSansEquipe);

  // Dialog states
  const [openEquipe, setOpenEquipe] = useState(false);
  const [openGenerer, setOpenGenerer] = useState(false);
  const [newEquipeNom, setNewEquipeNom] = useState("");
  const [newEquipeCode, setNewEquipeCode] = useState("");
  const [newEquipeCouleur, setNewEquipeCouleur] = useState(EQUIPE_COLORS[0]);
  const [newEquipeAntenne, setNewEquipeAntenne] = useState(currentAntenneId ?? "");
  const [genDateDebut, setGenDateDebut] = useState("");
  const [genDateFin, setGenDateFin] = useState("");
  const [loading, setLoading] = useState(false);

  const daysInMonth = new Date(annee, mois + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const refreshData = useCallback(async (m: number, a: number) => {
    const antenneFilter = !hasGlobalAccess(currentRole, currentAccesGlobal) ? currentAntenneId ?? undefined : undefined;
    const [newRotation, newEquipes, newSansEquipe] = await Promise.all([
      getRotation({ mois: m, annee: a, antenneId: antenneFilter }),
      getEquipes(antenneFilter),
      getEmployesSansEquipe(antenneFilter),
    ]);
    setRotation(JSON.parse(JSON.stringify(newRotation)));
    setEquipes(JSON.parse(JSON.stringify(newEquipes)));
    setSansEquipe(JSON.parse(JSON.stringify(newSansEquipe)));
  }, [currentRole, currentAccesGlobal, currentAntenneId]);

  async function handleMoisChange(delta: number) {
    let m = mois + delta;
    let a = annee;
    if (m < 0) { m = 11; a--; }
    if (m > 11) { m = 0; a++; }
    setMois(m);
    setAnnee(a);
    await refreshData(m, a);
  }

  // ── Creer equipe ──
  async function handleCreateEquipe() {
    if (!newEquipeNom.trim() || !newEquipeCode.trim()) {
      toast.error("Nom et code requis");
      return;
    }
    try {
      await createEquipe({
        nom: newEquipeNom,
        code: newEquipeCode.toUpperCase(),
        couleur: newEquipeCouleur,
        antenneId: newEquipeAntenne || undefined,
      });
      toast.success("Equipe creee");
      setOpenEquipe(false);
      setNewEquipeNom("");
      setNewEquipeCode("");
      await refreshData(mois, annee);
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  // ── Supprimer equipe ──
  async function handleDeleteEquipe(id: string) {
    if (!confirm("Supprimer cette equipe ?")) return;
    await deleteEquipe(id);
    toast.success("Equipe supprimee");
    await refreshData(mois, annee);
  }

  // ── Ajouter membre ──
  async function handleAddMembre(equipeId: string, userId: string) {
    await addMembreEquipe(equipeId, userId);
    toast.success("Membre ajoute");
    await refreshData(mois, annee);
  }

  // ── Retirer membre ──
  async function handleRemoveMembre(equipeId: string, userId: string) {
    await removeMembreEquipe(equipeId, userId);
    toast.success("Membre retire");
    await refreshData(mois, annee);
  }

  // ── Generer rotation ──
  async function handleGenerer() {
    if (!genDateDebut || !genDateFin) {
      toast.error("Dates de debut et fin requises");
      return;
    }
    if (equipes.length < 2) {
      toast.error("Il faut au moins 2 equipes pour generer une rotation");
      return;
    }
    setLoading(true);
    try {
      const antenneFilter = !hasGlobalAccess(currentRole, currentAccesGlobal) ? currentAntenneId ?? undefined : undefined;
      const result = await genererRotation({
        dateDebut: genDateDebut,
        dateFin: genDateFin,
        antenneId: antenneFilter,
      });
      toast.success(`Rotation generee : ${result.count} entrees pour ${result.equipes} equipes`);
      setOpenGenerer(false);
      await refreshData(mois, annee);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  // ── Modifier un shift ──
  async function handleShiftClick(entry: RotationEntry) {
    const shifts: Array<"PERMANENCE" | "GARDE" | "REPOS"> = ["PERMANENCE", "GARDE", "REPOS"];
    const currentIdx = shifts.indexOf(entry.typeShift as any);
    const nextShift = shifts[(currentIdx + 1) % shifts.length];
    await updateRotationEntry(entry.id, nextShift);
    await refreshData(mois, annee);
  }

  // ── Build calendar data: map[day] => entry[] ──
  const calendarData: Record<number, RotationEntry[]> = {};
  for (const entry of rotation) {
    const d = new Date(entry.date);
    const day = d.getUTCDate();
    if (!calendarData[day]) calendarData[day] = [];
    calendarData[day].push(entry);
  }

  // Unique equipe ids for legend
  const uniqueEquipes = equipes.filter((e) => e.actif !== false);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 p-4 sm:p-6 text-white shadow-md">
        <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-white/10 hidden sm:block" />
        <div className="relative flex items-center gap-3">
          <Button variant="outline" size="icon" nativeButton={false} render={<Link href="/plannings" />} className="shrink-0 rounded-xl border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
            <CalendarRange className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Rotation de garde</h1>
            <p className="text-xs sm:text-sm text-white/80">
              Planification Permanence / Garde / Repos
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="calendrier">
        <TabsList className="w-full max-w-md">
          <TabsTrigger value="calendrier" className="flex-1">Calendrier</TabsTrigger>
          <TabsTrigger value="equipes" className="flex-1">Equipes ({equipes.length})</TabsTrigger>
        </TabsList>

        {/* ═══════════════ ONGLET CALENDRIER ═══════════════ */}
        <TabsContent value="calendrier" className="space-y-4">
          {/* Navigation mois + bouton generer */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => handleMoisChange(-1)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h3 className="text-lg font-bold min-w-[180px] text-center">
                {MOIS_LABELS[mois]} {annee}
              </h3>
              <Button variant="outline" size="icon" onClick={() => handleMoisChange(1)}>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>

            <Dialog open={openGenerer} onOpenChange={setOpenGenerer}>
              <DialogTrigger render={<Button />}>
                <Zap className="h-4 w-4 mr-2" />Generer
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Generer la rotation</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Cycle : <strong>Permanence</strong> (07:30-18:30) → <strong>Garde</strong> (18:30-08:30) → <strong>Repos</strong> × 2.
                    Chaque equipe est decalee de 1 jour.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Date debut</Label>
                      <Input type="date" value={genDateDebut} onChange={(e) => setGenDateDebut(e.target.value)} />
                    </div>
                    <div>
                      <Label>Date fin</Label>
                      <Input type="date" value={genDateFin} onChange={(e) => setGenDateFin(e.target.value)} />
                    </div>
                  </div>
                  <div className="bg-muted/50 rounded-xl p-3 text-sm">
                    <p className="font-medium mb-1">Equipes ({equipes.length})</p>
                    <div className="flex flex-wrap gap-2">
                      {equipes.map((e) => (
                        <Badge key={e.id} variant="outline" style={{ borderColor: e.couleur, color: e.couleur }}>
                          {e.nom} ({e._count.membres} membres)
                        </Badge>
                      ))}
                    </div>
                    {equipes.length < 2 && (
                      <p className="text-red-500 text-xs mt-2">Il faut au moins 2 equipes. Allez dans l&apos;onglet Equipes.</p>
                    )}
                  </div>
                  <Button className="w-full" onClick={handleGenerer} disabled={loading || equipes.length < 2}>
                    {loading ? "Generation..." : "Generer la rotation"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Legende */}
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span className="text-muted-foreground font-medium">Legende :</span>
            {(["PERMANENCE", "GARDE", "REPOS"] as const).map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${TYPE_SHIFT_DOT_COLORS[t]}`} />
                <span>{TYPE_SHIFT_LABELS[t]}</span>
                {t !== "REPOS" && (
                  <span className="text-xs text-muted-foreground">
                    ({SHIFT_DEFAULTS[t].heureDebut}-{SHIFT_DEFAULTS[t].heureFin})
                  </span>
                )}
              </span>
            ))}
            <span className="text-xs text-muted-foreground ml-auto">Cliquez sur un shift pour le modifier</span>
          </div>

          {/* Grille calendrier */}
          {rotation.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <CalendarRange className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">Aucune rotation pour {MOIS_LABELS[mois]} {annee}</p>
                <p className="text-sm mt-1">Cliquez sur &quot;Generer&quot; pour creer la rotation</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="px-2 py-2 text-left font-semibold border-b sticky left-0 bg-muted/50 z-10 min-w-[100px]">
                          Equipe
                        </th>
                        {days.map((d) => {
                          const date = new Date(annee, mois, d);
                          const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                          return (
                            <th
                              key={d}
                              className={`px-1 py-2 text-center font-medium border-b min-w-[52px] ${
                                isWeekend ? "bg-muted/80" : ""
                              }`}
                            >
                              <div className="text-[10px] text-muted-foreground">{JOURS_COURTS[date.getDay()]}</div>
                              <div className="text-sm">{d}</div>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {uniqueEquipes.map((equipe) => (
                        <tr key={equipe.id} className="border-b hover:bg-muted/10">
                          <td className="px-2 py-2 font-medium sticky left-0 bg-background z-10 border-r">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-3 h-3 rounded-full shrink-0"
                                style={{ backgroundColor: equipe.couleur }}
                              />
                              <span className="truncate">{equipe.nom}</span>
                            </div>
                          </td>
                          {days.map((d) => {
                            const entries = calendarData[d]?.filter((e) => e.equipe.id === equipe.id) ?? [];
                            const entry = entries[0];
                            const date = new Date(annee, mois, d);
                            const isWeekend = date.getDay() === 0 || date.getDay() === 6;

                            if (!entry) {
                              return (
                                <td key={d} className={`px-1 py-1.5 text-center border-r ${isWeekend ? "bg-muted/30" : ""}`}>
                                  <span className="text-muted-foreground/30">-</span>
                                </td>
                              );
                            }

                            return (
                              <td key={d} className={`px-0.5 py-1 text-center border-r ${isWeekend ? "bg-muted/30" : ""}`}>
                                <button
                                  type="button"
                                  onClick={() => handleShiftClick(entry)}
                                  className={`w-full rounded-md px-1 py-1.5 text-[10px] font-semibold border transition-all hover:scale-105 hover:shadow-sm cursor-pointer ${TYPE_SHIFT_COLORS[entry.typeShift]}`}
                                  title={`${TYPE_SHIFT_LABELS[entry.typeShift]}${entry.heureDebut ? ` (${entry.heureDebut}-${entry.heureFin})` : ""}\nCliquez pour modifier`}
                                >
                                  <div className="flex flex-col items-center gap-0.5">
                                    {getShiftIcon(entry.typeShift)}
                                    <span>{entry.typeShift === "PERMANENCE" ? "P" : entry.typeShift === "GARDE" ? "G" : "R"}</span>
                                  </div>
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Resume du cycle */}
          {rotation.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(["PERMANENCE", "GARDE", "REPOS"] as const).map((t) => {
                const count = rotation.filter((r) => r.typeShift === t).length;
                return (
                  <Card key={t}>
                    <CardContent className="p-3 flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${TYPE_SHIFT_COLORS[t]}`}>
                        {getShiftIcon(t)}
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{count}</p>
                        <p className="text-xs text-muted-foreground">{TYPE_SHIFT_LABELS[t]}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ═══════════════ ONGLET EQUIPES ═══════════════ */}
        <TabsContent value="equipes" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Gerez les equipes de rotation. Chaque employe ne peut appartenir qu&apos;a une seule equipe.
            </p>
            <Dialog open={openEquipe} onOpenChange={setOpenEquipe}>
              <DialogTrigger render={<Button size="sm" />}>
                <Plus className="h-4 w-4 mr-1" />Nouvelle equipe
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Creer une equipe</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Nom</Label>
                      <Input value={newEquipeNom} onChange={(e) => setNewEquipeNom(e.target.value)} placeholder="Equipe A" />
                    </div>
                    <div>
                      <Label>Code</Label>
                      <Input value={newEquipeCode} onChange={(e) => setNewEquipeCode(e.target.value)} placeholder="A" maxLength={3} />
                    </div>
                  </div>
                  <div>
                    <Label className="mb-2 block">Couleur</Label>
                    <div className="flex gap-2">
                      {EQUIPE_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setNewEquipeCouleur(c)}
                          className={`w-8 h-8 rounded-full transition-all ${newEquipeCouleur === c ? "ring-2 ring-offset-2 ring-primary scale-110" : "hover:scale-105"}`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                  {hasGlobalAccess(currentRole, currentAccesGlobal) && (
                    <div>
                      <Label>Antenne</Label>
                      <select
                        value={newEquipeAntenne}
                        onChange={(e) => setNewEquipeAntenne(e.target.value)}
                        className="flex h-8 w-full items-center rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                      >
                        <option value="">Global (toutes antennes)</option>
                        {antennes.map((a: any) => <option key={a.id} value={a.id}>{a.nom}</option>)}
                      </select>
                    </div>
                  )}
                  <Button className="w-full" onClick={handleCreateEquipe}>Creer</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {equipes.map((equipe) => (
              <Card key={equipe.id} className="hover:-translate-y-0.5 hover:shadow-md transition-all duration-300">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full" style={{ backgroundColor: equipe.couleur }} />
                      <CardTitle className="text-base">{equipe.nom}</CardTitle>
                      <Badge variant="secondary" className="text-xs">{equipe.code}</Badge>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteEquipe(equipe.id)}>
                      <Trash2 className="h-3 w-3 text-red-500" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Membres */}
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      Membres ({equipe._count.membres})
                    </p>
                    {equipe.membres.map((m) => (
                      <div key={m.id} className="flex items-center justify-between bg-muted/30 rounded-lg px-2 py-1.5">
                        <span className="text-sm">{m.user.prenom} {m.user.nom}</span>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handleRemoveMembre(equipe.id, m.user.id)}>
                          <Trash2 className="h-3 w-3 text-red-400" />
                        </Button>
                      </div>
                    ))}
                    {equipe.membres.length === 0 && (
                      <p className="text-xs text-muted-foreground italic">Aucun membre</p>
                    )}
                  </div>

                  {/* Ajouter membre */}
                  {sansEquipe.length > 0 && (
                    <div>
                      <select
                        className="flex h-8 w-full items-center rounded-lg border border-input bg-transparent px-2.5 py-1 text-xs outline-none focus-visible:border-ring"
                        defaultValue=""
                        onChange={async (e) => {
                          if (!e.target.value) return;
                          await handleAddMembre(equipe.id, e.target.value);
                          e.target.value = "";
                        }}
                      >
                        <option value="">+ Ajouter un membre...</option>
                        {sansEquipe.map((u) => (
                          <option key={u.id} value={u.id}>{u.prenom} {u.nom}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {equipes.length === 0 && (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Aucune equipe creee</p>
                <p className="text-sm">Creez au moins 2-3 equipes pour la rotation</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
