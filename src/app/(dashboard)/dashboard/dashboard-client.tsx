"use client";

import { StatCard } from "@/components/dashboard/stat-card";
import { RetardsParJourChart, StatutsDonutChart, HeuresParSemaineChart } from "@/components/dashboard/dashboard-charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users, Clock, TrendingUp, AlertTriangle,
  CalendarDays, Timer, CheckCircle, XCircle, Fingerprint,
} from "lucide-react";
import { STATUT_POINTAGE_LABELS, STATUT_POINTAGE_COLORS, isGlobalRole } from "@/lib/constants";
import { formatTimeFr } from "@/lib/date-utils";

interface Props {
  data: any;
  greeting: string;
  userName: string;
  role: string;
  antenneNom: string | null;
}

export function DashboardClient({ data, greeting, userName, role, antenneNom }: Props) {
  const { kpis, aujourdhui, semaine, charts } = data;

  const title = isGlobalRole(role)
    ? "Dashboard National"
    : role === "RESPONSABLE" || role === "GESTIONNAIRE"
      ? `Dashboard - ${antenneNom ?? "Antenne"}`
      : "Mon Espace";

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

      {/* KPIs principaux */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger">
        {role !== "EMPLOYE" && (
          <StatCard
            title="Employes"
            value={kpis.totalEmployes}
            icon={Users}
            variant="primary"
          />
        )}
        <StatCard
          title="Taux de ponctualite"
          value={`${kpis.tauxPonctualite}%`}
          description="Ce mois"
          icon={TrendingUp}
          variant={kpis.tauxPonctualite >= 80 ? "success" : kpis.tauxPonctualite >= 60 ? "warning" : "danger"}
        />
        <StatCard
          title="Retards ce mois"
          value={kpis.retardsMois}
          description={`${kpis.totalRetardMin} min cumulees`}
          icon={AlertTriangle}
          variant={kpis.retardsMois > 0 ? "warning" : "success"}
        />
        <StatCard
          title="Absences ce mois"
          value={kpis.absentsMois}
          icon={XCircle}
          variant={kpis.absentsMois > 0 ? "danger" : "success"}
        />
      </div>

      {/* KPIs secondaires */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger">
        <StatCard
          title="Presences ce mois"
          value={kpis.presentsMois}
          icon={CheckCircle}
          variant="success"
        />
        <StatCard
          title="Heures travaillees"
          value={`${kpis.totalHeures}h`}
          description="Ce mois"
          icon={Timer}
          variant="default"
        />
        <StatCard
          title="Absences temporaires"
          value={kpis.absencesTempMois}
          description="Ce mois"
          icon={Clock}
          variant="default"
        />
        <StatCard
          title="Conges en attente"
          value={kpis.congesEnAttente}
          icon={CalendarDays}
          variant={kpis.congesEnAttente > 0 ? "warning" : "default"}
        />
      </div>

      {/* Aujourd'hui + Semaine */}
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
              <div className="text-center p-2 rounded-lg bg-emerald-50 border border-emerald-200/60">
                <p className="text-xl font-bold text-emerald-600">{aujourdhui.presents}</p>
                <p className="text-xs text-muted-foreground">Presents</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-amber-50 border border-amber-200/60">
                <p className="text-xl font-bold text-amber-600">{aujourdhui.retards}</p>
                <p className="text-xs text-muted-foreground">Retards</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-blue-50 border border-blue-200/60">
                <p className="text-xl font-bold text-blue-600">{aujourdhui.total}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>

            {/* Derniers pointages */}
            {aujourdhui.derniersPointages.length > 0 ? (
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
              <div className="text-center p-3 rounded-lg bg-emerald-50 border border-emerald-200/60">
                <p className="text-2xl font-bold text-emerald-600">{semaine.presents}</p>
                <p className="text-xs text-muted-foreground">Presences</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-amber-50 border border-amber-200/60">
                <p className="text-2xl font-bold text-amber-600">{semaine.retards}</p>
                <p className="text-xs text-muted-foreground">Retards</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-red-50 border border-red-200/60">
                <p className="text-2xl font-bold text-red-600">{semaine.absents}</p>
                <p className="text-xs text-muted-foreground">Absences</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {charts.retardsParJour.length > 0 && (
          <RetardsParJourChart data={charts.retardsParJour} />
        )}
        {charts.statuts.length > 0 && (
          <StatutsDonutChart data={charts.statuts} />
        )}
        {charts.heuresParSemaine.length > 0 && (
          <HeuresParSemaineChart data={charts.heuresParSemaine} />
        )}
      </div>
    </div>
  );
}
