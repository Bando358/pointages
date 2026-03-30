"use client";

import { useState, useEffect } from "react";
import { fetchDashboardData } from "@/lib/actions/dashboard.actions";
import { StatCard } from "@/components/dashboard/stat-card";
import { RetardsParJourChart, StatutsDonutChart, HeuresParSemaineChart } from "@/components/dashboard/dashboard-charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Users, Clock, TrendingUp, AlertTriangle, AlertOctagon,
  CalendarDays, Timer, CheckCircle, XCircle, Fingerprint, Filter,
} from "lucide-react";
import { STATUT_POINTAGE_LABELS, STATUT_POINTAGE_COLORS, TYPE_ABSENCE_TEMP_LABELS, isGlobalRole } from "@/lib/constants";
import { formatTimeFr } from "@/lib/date-utils";

const CONGE_TYPE_LABELS: Record<string, string> = {
  ANNUEL: "Annuel", MALADIE: "Maladie", MATERNITE: "Maternite",
  PATERNITE: "Paternite", EXCEPTIONNEL: "Exceptionnel", SANS_SOLDE: "Sans solde",
};
const CONGE_STATUT_COLORS: Record<string, string> = {
  BROUILLON: "bg-muted text-muted-foreground", SOUMIS: "text-primary",
  APPROUVE: "text-primary", REFUSE: "text-destructive", ANNULE: "text-muted-foreground",
};
const ABSENCE_TEMP_LABELS: Record<string, string> = TYPE_ABSENCE_TEMP_LABELS;
const ABSENCE_STATUT_COLORS: Record<string, string> = {
  EN_ATTENTE: "text-primary", APPROUVE: "text-primary", REFUSE: "text-destructive",
};

const MONTHS = [
  "Janvier", "Fevrier", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Aout", "Septembre", "Octobre", "Novembre", "Decembre",
];

interface Props {
  initialData: any;
  antennes: any[];
  greeting: string;
  userName: string;
  role: string;
  antenneNom: string | null;
  currentAntenneId: string | null;
  accesGlobal: boolean;
}

export function DashboardClient({
  initialData, antennes, greeting, userName, role, antenneNom, currentAntenneId, accesGlobal,
}: Props) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [antenneId, setAntenneId] = useState(accesGlobal ? "" : (currentAntenneId ?? ""));
  const [data, setData] = useState<any>(initialData);
  const [loading, setLoading] = useState(false);

  const isCurrentMonth = month === now.getMonth() + 1 && year === now.getFullYear();

  useEffect(() => {
    async function reload() {
      setLoading(true);
      const result = await fetchDashboardData({
        role,
        antenneId: antenneId || undefined,
        month,
        year,
      });
      setData(result);
      setLoading(false);
    }
    reload();
  }, [month, year, antenneId]);

  const title = isGlobalRole(role)
    ? "Dashboard National"
    : role === "RESPONSABLE" || role === "GESTIONNAIRE"
      ? `Dashboard - ${antenneNom ?? "Antenne"}`
      : "Mon Espace";

  const g = data?.kpis ?? {};
  const aujourdhui = data?.aujourdhui ?? {};
  const semaine = data?.semaine ?? {};
  const charts = data?.charts ?? {};
  const listings = data?.listings ?? {};

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-xl bg-linear-to-br from-primary to-primary/80 p-6 text-primary-foreground shadow-lg shadow-primary/25">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/3" />
        <div className="relative">
          <p className="text-primary-foreground/80 text-sm">{greeting},</p>
          <h1 className="text-2xl font-bold mt-1">{userName}</h1>
          <p className="text-primary-foreground/70 text-sm mt-1">{title}</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex gap-3 flex-wrap items-center">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <select
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {[year - 1, year, year + 1].map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        {accesGlobal && (
          <select
            value={antenneId}
            onChange={(e) => setAntenneId(e.target.value)}
            className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="">Toutes les antennes</option>
            {antennes.map((a: any) => <option key={a.id} value={a.id}>{a.nom}</option>)}
          </select>
        )}
        {loading && <span className="text-xs text-muted-foreground animate-pulse">Chargement...</span>}
        {!isCurrentMonth && (
          <button
            onClick={() => { setMonth(now.getMonth() + 1); setYear(now.getFullYear()); }}
            className="text-xs text-primary hover:underline"
          >
            Revenir au mois en cours
          </button>
        )}
      </div>

      {/* Periode affichee */}
      <p className="text-sm text-muted-foreground">
        {MONTHS[month - 1]} {year}
        {antenneId && antennes.length > 0 && ` - ${antennes.find((a: any) => a.id === antenneId)?.nom ?? ""}`}
      </p>

      {/* KPIs principaux */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 stagger">
        {role !== "EMPLOYE" && (
          <StatCard title="Employes" value={g.totalEmployes ?? 0} icon={Users} variant="primary" />
        )}
        <StatCard
          title="Ponctualite"
          value={`${g.tauxPonctualite ?? 0}%`}
          description="Ce mois"
          icon={TrendingUp}
          variant={(g.tauxPonctualite ?? 0) >= 80 ? "success" : (g.tauxPonctualite ?? 0) >= 60 ? "warning" : "danger"}
        />
        <StatCard title="Presences" value={g.presentsMois ?? 0} icon={CheckCircle} variant="success" />
        <StatCard
          title="Retards"
          value={g.retardsMois ?? 0}
          description={`${g.totalRetardMin ?? 0} min`}
          icon={AlertTriangle}
          variant={(g.retardsMois ?? 0) > 0 ? "warning" : "success"}
        />
        <StatCard title="Absences" value={g.absentsMois ?? 0} icon={XCircle} variant={(g.absentsMois ?? 0) > 0 ? "danger" : "success"} />
        <StatCard title="Heures" value={`${g.totalHeures ?? 0}h`} description={`+${g.totalHeuresSupp ?? 0}h sup`} icon={Timer} variant="default" />
      </div>

      {/* KPIs secondaires */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 stagger">
        <StatCard title="Absences temp." value={g.absencesTempMois ?? 0} description="Ce mois" icon={Clock} variant="default" />
        <StatCard title="Conges en attente" value={g.congesEnAttente ?? 0} icon={CalendarDays} variant={(g.congesEnAttente ?? 0) > 0 ? "warning" : "default"} />
        {role !== "EMPLOYE" && (
          <StatCard title="Enrolements" value={`${g.totalEmployes > 0 ? Math.round(((g.totalEmployes - (g.nonEnroles ?? 0)) / g.totalEmployes) * 100) : 0}%`} description="Empreintes" icon={Fingerprint} variant="primary" />
        )}
      </div>

      {/* Aujourd'hui + Semaine (seulement si mois en cours) */}
      {isCurrentMonth && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Aujourd'hui */}
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Fingerprint className="h-4 w-4" />
                Aujourd&apos;hui
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center p-2 rounded-lg bg-primary/5 border border-primary/10">
                  <p className="text-xl font-bold text-primary">{aujourdhui.presents ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Presents</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-muted border border-border">
                  <p className="text-xl font-bold">{aujourdhui.retards ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Retards</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-muted border border-border">
                  <p className="text-xl font-bold">{aujourdhui.total ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </div>

              {aujourdhui.derniersPointages?.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Derniers pointages</p>
                  {aujourdhui.derniersPointages.map((p: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b border-border/40 last:border-0">
                      <span className="font-medium">{p.prenom} {p.nom}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {p.heureArrivee ? formatTimeFr(p.heureArrivee) : "-"}
                        </span>
                        <Badge className={`text-xs ${STATUT_POINTAGE_COLORS[p.statut] ?? ""}`}>
                          {STATUT_POINTAGE_LABELS[p.statut]?.substring(0, 7) ?? p.statut}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Aucun pointage aujourd&apos;hui</p>
              )}
            </CardContent>
          </Card>

          {/* Resume semaine */}
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                Cette semaine
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 rounded-lg bg-primary/5 border border-primary/10">
                  <p className="text-2xl font-bold text-primary">{semaine.presents ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Presences</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted border border-border">
                  <p className="text-2xl font-bold">{semaine.retards ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Retards</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-destructive/5 border border-destructive/10">
                  <p className="text-2xl font-bold text-destructive">{semaine.absents ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Absences</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Graphiques */}
      {(() => {
        const hasRetards = charts.retardsParJour?.length > 0;
        const hasStatuts = charts.statuts?.length > 0;
        const hasHeures = charts.heuresParSemaine?.length > 0;
        const count = [hasRetards, hasStatuts, hasHeures].filter(Boolean).length;
        if (count === 0) return null;
        const gridClass = count === 1 ? "grid-cols-1" : count === 2 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";
        return (
          <div className={`grid ${gridClass} gap-4`}>
            {hasRetards && <RetardsParJourChart data={charts.retardsParJour} />}
            {hasStatuts && <StatutsDonutChart data={charts.statuts} />}
            {hasHeures && <HeuresParSemaineChart data={charts.heuresParSemaine} />}
          </div>
        );
      })()}

      {/* Listings detailles */}
      {role !== "EMPLOYE" && (
        <Tabs defaultValue="retardataires" className="space-y-4">
          <TabsList>
            <TabsTrigger value="retardataires">
              Retardataires
              {listings.retardataires?.length > 0 && <Badge variant="secondary" className="ml-1.5 text-xs">{listings.retardataires.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="absents">
              Absents
              {listings.absents?.length > 0 && <Badge variant="secondary" className="ml-1.5 text-xs">{listings.absents.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="conges">
              Conges
              {listings.conges?.length > 0 && <Badge variant="secondary" className="ml-1.5 text-xs">{listings.conges.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="absencesTemp">
              Absences temp.
              {listings.absencesTemp?.length > 0 && <Badge variant="secondary" className="ml-1.5 text-xs">{listings.absencesTemp.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="incomplets">
              <AlertOctagon className="h-3.5 w-3.5 mr-1" />
              Incomplets
              {listings.incomplets?.length > 0 && <Badge variant="destructive" className="ml-1.5 text-xs">{listings.incomplets.length}</Badge>}
            </TabsTrigger>
          </TabsList>

          {/* Tab Retardataires */}
          <TabsContent value="retardataires">
            <Card>
              <CardHeader><CardTitle className="text-base">Top retardataires - {MONTHS[month - 1]} {year}</CardTitle></CardHeader>
              <CardContent>
                {listings.retardataires?.length > 0 ? (
                  <div className="space-y-2">
                    {listings.retardataires.map((r: any, i: number) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-muted-foreground w-6">{i + 1}.</span>
                          <div>
                            <p className="text-sm font-medium">{r.prenom} {r.nom}</p>
                            <p className="text-xs text-muted-foreground">{r.antenne}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold">{r.count} retard{r.count > 1 ? "s" : ""}</p>
                          <p className="text-xs text-muted-foreground">{r.totalMinutes} min cumulees</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-6">Aucun retard ce mois</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Absents */}
          <TabsContent value="absents">
            <Card>
              <CardHeader><CardTitle className="text-base">Absences - {MONTHS[month - 1]} {year}</CardTitle></CardHeader>
              <CardContent>
                {listings.absents?.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employe</TableHead>
                        <TableHead>Antenne</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Observations</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {listings.absents.map((a: any, i: number) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{a.prenom} {a.nom}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{a.antenne}</TableCell>
                          <TableCell className="text-sm">{new Date(a.date).toLocaleDateString("fr-FR")}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-xs">
                              {STATUT_POINTAGE_LABELS[a.statut] ?? a.statut}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-[150px] truncate">{a.observations ?? "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-6">Aucune absence ce mois</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Conges */}
          <TabsContent value="conges">
            <Card>
              <CardHeader><CardTitle className="text-base">Conges - {MONTHS[month - 1]} {year}</CardTitle></CardHeader>
              <CardContent>
                {listings.conges?.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employe</TableHead>
                        <TableHead>Antenne</TableHead>
                        <TableHead>Debut</TableHead>
                        <TableHead>Fin</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Statut</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {listings.conges.map((c: any, i: number) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{c.prenom} {c.nom}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{c.antenne}</TableCell>
                          <TableCell className="text-sm">{new Date(c.dateDebut).toLocaleDateString("fr-FR")}</TableCell>
                          <TableCell className="text-sm">{new Date(c.dateFin).toLocaleDateString("fr-FR")}</TableCell>
                          <TableCell className="text-sm">{CONGE_TYPE_LABELS[c.type] ?? c.type}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={`text-xs ${CONGE_STATUT_COLORS[c.statut] ?? ""}`}>
                              {c.statut}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-6">Aucun conge ce mois</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Absences temporaires */}
          <TabsContent value="absencesTemp">
            <Card>
              <CardHeader><CardTitle className="text-base">Absences temporaires - {MONTHS[month - 1]} {year}</CardTitle></CardHeader>
              <CardContent>
                {listings.absencesTemp?.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employe</TableHead>
                        <TableHead>Sortie</TableHead>
                        <TableHead>Retour</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Motif</TableHead>
                        <TableHead>Statut</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {listings.absencesTemp.map((a: any, i: number) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{a.prenom} {a.nom}</TableCell>
                          <TableCell className="text-sm">{formatTimeFr(a.heureSortie)}</TableCell>
                          <TableCell className="text-sm">{a.heureRetour ? formatTimeFr(a.heureRetour) : <span className="text-muted-foreground">En cours</span>}</TableCell>
                          <TableCell className="text-sm">{ABSENCE_TEMP_LABELS[a.type] ?? a.type}</TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-[150px] truncate">{a.motif}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={`text-xs ${ABSENCE_STATUT_COLORS[a.statut] ?? ""}`}>
                              {a.statut === "EN_ATTENTE" ? "En attente" : a.statut === "APPROUVE" ? "Approuve" : "Refuse"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-6">Aucune absence temporaire ce mois</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Pointages incomplets */}
          <TabsContent value="incomplets">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertOctagon className="h-4 w-4 text-destructive" />
                  Pointages incomplets - {MONTHS[month - 1]} {year}
                </CardTitle>
                <p className="text-xs text-muted-foreground">Employes ayant pointe l&apos;arrivee mais pas le depart</p>
              </CardHeader>
              <CardContent>
                {listings.incomplets?.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employe</TableHead>
                        <TableHead>Antenne</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Heure arrivee</TableHead>
                        <TableHead>Depart</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {listings.incomplets.map((p: any, i: number) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{p.prenom} {p.nom}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{p.antenne}</TableCell>
                          <TableCell className="text-sm">{new Date(p.date).toLocaleDateString("fr-FR")}</TableCell>
                          <TableCell className="text-sm">{p.heureArrivee ? formatTimeFr(p.heureArrivee) : "-"}</TableCell>
                          <TableCell>
                            <Badge variant="destructive" className="text-xs">Manquant</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-6">Tous les pointages sont complets</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
