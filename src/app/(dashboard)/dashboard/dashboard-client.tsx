"use client";

import { useState, useEffect } from "react";
import { fetchDashboardData } from "@/lib/actions/dashboard.actions";
import { StatCard } from "@/components/dashboard/stat-card";
import { RetardsParJourChart, StatutsDonutChart, HeuresParSemaineChart } from "@/components/dashboard/dashboard-charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users, Clock, TrendingUp, AlertTriangle,
  CalendarDays, Timer, CheckCircle, XCircle, Fingerprint, Filter,
} from "lucide-react";
import { STATUT_POINTAGE_LABELS, STATUT_POINTAGE_COLORS, isGlobalRole } from "@/lib/constants";
import { formatTimeFr } from "@/lib/date-utils";

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {charts.retardsParJour?.length > 0 && (
          <RetardsParJourChart data={charts.retardsParJour} />
        )}
        {charts.statuts?.length > 0 && (
          <StatutsDonutChart data={charts.statuts} />
        )}
        {charts.heuresParSemaine?.length > 0 && (
          <HeuresParSemaineChart data={charts.heuresParSemaine} />
        )}
      </div>
    </div>
  );
}
