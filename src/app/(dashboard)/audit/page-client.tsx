"use client";

import { useState } from "react";
import { getAuditLogs } from "@/lib/actions/audit.actions";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollText, FileEdit, UserX, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { formatDateFr } from "@/lib/date-utils";

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  SAISIE_MANUELLE: { label: "Saisie manuelle", color: "bg-amber-100 text-amber-800" },
  MARQUAGE_ABSENT: { label: "Marquage absent", color: "bg-red-100 text-red-800" },
};

interface Props {
  initialLogs: any;
  stats: { totalLogs: number; saisiesManuelles: number; marquagesAbsent: number };
}

export function AuditPageClient({ initialLogs, stats }: Props) {
  const [logs, setLogs] = useState(initialLogs);
  const [page, setPage] = useState(1);
  const [filterAction, setFilterAction] = useState("all");
  const [loading, setLoading] = useState(false);

  async function loadPage(p: number, action?: string) {
    setLoading(true);
    const result = await getAuditLogs({
      page: p,
      pageSize: 50,
      action: action && action !== "all" ? action : undefined,
    });
    setLogs(result);
    setPage(p);
    setLoading(false);
  }

  function handleFilterChange(action: string) {
    setFilterAction(action);
    loadPage(1, action);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <ScrollText className="h-6 w-6" />
          Journal d&apos;audit
        </h2>
        <p className="text-muted-foreground">Tracabilite des saisies manuelles et modifications</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 stagger">
        <StatCard title="Total actions" value={stats.totalLogs} icon={ScrollText} variant="primary" />
        <StatCard title="Saisies manuelles" value={stats.saisiesManuelles} icon={FileEdit} variant="warning" />
        <StatCard title="Marquages absent" value={stats.marquagesAbsent} icon={UserX} variant="danger" />
      </div>

      {/* Filtre */}
      <div className="flex gap-3 items-center">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <select
          value={filterAction}
          onChange={(e) => handleFilterChange(e.target.value)}
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="all">Toutes les actions</option>
          <option value="SAISIE_MANUELLE">Saisies manuelles</option>
          <option value="MARQUAGE_ABSENT">Marquages absent</option>
        </select>
        {loading && <span className="text-xs text-muted-foreground animate-pulse">Chargement...</span>}
      </div>

      {/* Tableau */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Historique ({logs.total} entree{logs.total > 1 ? "s" : ""})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Effectue par</TableHead>
                  <TableHead>Employe concerne</TableHead>
                  <TableHead>Date pointage</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      Aucune entree dans le journal d&apos;audit
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.data.map((log: any) => {
                    const actionInfo = ACTION_LABELS[log.action] ?? { label: log.action, color: "bg-gray-100 text-gray-800" };
                    const details = log.details;
                    return (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </TableCell>
                        <TableCell>
                          <Badge className={actionInfo.color}>{actionInfo.label}</Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium">{log.user?.prenom} {log.user?.nom}</p>
                            <p className="text-xs text-muted-foreground">{log.user?.role}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {details?.employeId ? (
                            <span className="font-mono text-xs">{details.employeId.substring(0, 8)}...</span>
                          ) : "-"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {details?.date ?? "-"}
                        </TableCell>
                        <TableCell className="text-sm max-w-[200px]">
                          <div className="space-y-0.5">
                            {details?.heureArrivee && <span className="text-xs">Arr: {details.heureArrivee}</span>}
                            {details?.heureDepart && <span className="text-xs ml-2">Dep: {details.heureDepart}</span>}
                            {details?.statut && <Badge variant="outline" className="text-xs ml-1">{details.statut}</Badge>}
                            {details?.justificatif && (
                              <p className="text-xs text-muted-foreground truncate" title={details.justificatif}>
                                Justif: {details.justificatif}
                              </p>
                            )}
                            {details?.observations && (
                              <p className="text-xs text-muted-foreground truncate" title={details.observations}>
                                Obs: {details.observations}
                              </p>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {logs.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Page {logs.page} sur {logs.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={logs.page <= 1}
                  onClick={() => loadPage(logs.page - 1, filterAction)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={logs.page >= logs.totalPages}
                  onClick={() => loadPage(logs.page + 1, filterAction)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
