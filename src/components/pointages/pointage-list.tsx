"use client";

import { useState, useEffect } from "react";
import { getPointagesByUser, getPointageSummary } from "@/lib/actions/pointage.actions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { STATUT_POINTAGE_LABELS, STATUT_POINTAGE_COLORS } from "@/lib/constants";
import { formatDateFr, formatTimeFr } from "@/lib/date-utils";

interface Props {
  userId: string;
}

export function PointageList({ userId }: Props) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [pointages, setPointages] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    async function load() {
      const [res, sum] = await Promise.all([
        getPointagesByUser(userId, month, year),
        getPointageSummary(userId, month, year),
      ]);
      setPointages(res.data);
      setSummary(sum);
    }
    load();
  }, [userId, month, year]);

  const months = [
    "Janvier", "Fevrier", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Aout", "Septembre", "Octobre", "Novembre", "Decembre",
  ];

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-3">
        <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {months.map((m, i) => (
              <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[year - 1, year, year + 1].map((y) => (
              <SelectItem key={y} value={String(y)}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 stagger">
          <Card className="bg-linear-to-br from-emerald-50 to-teal-50/80 border-emerald-200/60 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300">
            <CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold text-emerald-600">{summary.presents}</p>
              <p className="text-xs text-muted-foreground">Presents</p>
            </CardContent>
          </Card>
          <Card className="bg-linear-to-br from-red-50 to-rose-50/80 border-red-200/60 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300">
            <CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold text-red-600">{summary.absents}</p>
              <p className="text-xs text-muted-foreground">Absents</p>
            </CardContent>
          </Card>
          <Card className="bg-linear-to-br from-amber-50 to-orange-50/80 border-amber-200/60 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300">
            <CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold text-amber-600">{summary.retards}</p>
              <p className="text-xs text-muted-foreground">Retards</p>
            </CardContent>
          </Card>
          <Card className="bg-linear-to-br from-blue-50 to-indigo-50/80 border-blue-200/60 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300">
            <CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{Math.round(summary.totalHeures)}h</p>
              <p className="text-xs text-muted-foreground">Total heures</p>
            </CardContent>
          </Card>
          <Card className="bg-linear-to-br from-purple-50 to-violet-50/80 border-purple-200/60 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300">
            <CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold text-purple-600">{summary.totalHeuresSupp.toFixed(1)}h</p>
              <p className="text-xs text-muted-foreground">Heures sup</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Historique - {months[month - 1]} {year}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Arrivee</TableHead>
                <TableHead>Depart</TableHead>
                <TableHead>Heures</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Retard</TableHead>
                <TableHead>Antenne</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pointages.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Aucun pointage pour cette periode
                  </TableCell>
                </TableRow>
              ) : (
                pointages.map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell>{formatDateFr(p.date)}</TableCell>
                    <TableCell>{p.heureArrivee ? formatTimeFr(p.heureArrivee) : "-"}</TableCell>
                    <TableCell>{p.heureDepart ? formatTimeFr(p.heureDepart) : "-"}</TableCell>
                    <TableCell>{p.totalHeures > 0 ? `${p.totalHeures.toFixed(1)}h` : "-"}</TableCell>
                    <TableCell>
                      <Badge className={STATUT_POINTAGE_COLORS[p.statut] ?? ""}>
                        {STATUT_POINTAGE_LABELS[p.statut] ?? p.statut}
                      </Badge>
                    </TableCell>
                    <TableCell>{p.retardMinutes > 0 ? `${p.retardMinutes} min` : "-"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{p.antenne?.nom ?? "-"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
