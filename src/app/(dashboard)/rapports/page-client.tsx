"use client";

import { useState, useEffect } from "react";
import { fetchRapportMensuel } from "@/lib/actions/rapport.actions";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import {
  BarChart3, TrendingUp, Clock, AlertTriangle, XCircle,
  Users, Timer, CheckCircle,
} from "lucide-react";
import { hasGlobalAccess } from "@/lib/constants";

const PIE_COLORS = ["#10b981", "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6"];

interface Props {
  initialData: any;
  antennes: any[];
  currentAntenneId: string | null;
  currentRole: string;
  currentAccesGlobal: boolean;
}

export function RapportsPageClient({ initialData, antennes, currentAntenneId, currentRole, currentAccesGlobal }: Props) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [antenneId, setAntenneId] = useState(currentAntenneId ?? "");
  const [data, setData] = useState<any>(initialData);
  const [loading, setLoading] = useState(false);

  const months = [
    "Janvier", "Fevrier", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Aout", "Septembre", "Octobre", "Novembre", "Decembre",
  ];

  useEffect(() => {
    async function reload() {
      setLoading(true);
      const result = await fetchRapportMensuel({ month, year, antenneId: antenneId || undefined });
      setData(result);
      setLoading(false);
    }
    reload();
  }, [month, year, antenneId]);

  const g = data?.global ?? {};
  const employes = data?.employes ?? [];
  const charts = data?.charts ?? {};

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="h-6 w-6" />
          Rapports
        </h2>
        <p className="text-muted-foreground">Synthese mensuelle - {months[month - 1]} {year}</p>
      </div>

      {/* Filtres */}
      <div className="flex gap-3 flex-wrap">
        <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
          {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
          {[year - 1, year, year + 1].map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        {hasGlobalAccess(currentRole, currentAccesGlobal) && (
          <select value={antenneId} onChange={(e) => setAntenneId(e.target.value)} className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
            <option value="">Toutes les antennes</option>
            {antennes.map((a: any) => <option key={a.id} value={a.id}>{a.nom}</option>)}
          </select>
        )}
        {loading && <span className="text-xs text-muted-foreground self-center animate-pulse">Chargement...</span>}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 stagger">
        <StatCard title="Employes" value={g.nbEmployes ?? 0} icon={Users} variant="primary" />
        <StatCard title="Ponctualite" value={`${g.tauxPonctualite ?? 0}%`} icon={TrendingUp} variant={(g.tauxPonctualite ?? 0) >= 80 ? "success" : (g.tauxPonctualite ?? 0) >= 60 ? "warning" : "danger"} />
        <StatCard title="Presences" value={g.presents ?? 0} icon={CheckCircle} variant="success" />
        <StatCard title="Retards" value={g.retards ?? 0} description={`${g.totalRetardMin ?? 0} min`} icon={AlertTriangle} variant={(g.retards ?? 0) > 0 ? "warning" : "success"} />
        <StatCard title="Absences" value={g.absents ?? 0} icon={XCircle} variant={(g.absents ?? 0) > 0 ? "danger" : "success"} />
        <StatCard title="Heures" value={`${g.totalHeures ?? 0}h`} description={`+${g.totalHeuresSupp ?? 0}h sup`} icon={Timer} variant="default" />
      </div>

      {/* Onglets */}
      <Tabs defaultValue="ponctualite" className="space-y-4">
        <TabsList>
          <TabsTrigger value="ponctualite">Ponctualite</TabsTrigger>
          <TabsTrigger value="heures">Heures</TabsTrigger>
          <TabsTrigger value="moyennes">Moyennes</TabsTrigger>
          {hasGlobalAccess(currentRole, currentAccesGlobal) && <TabsTrigger value="antennes">Par antenne</TabsTrigger>}
        </TabsList>

        {/* === ONGLET PONCTUALITE === */}
        <TabsContent value="ponctualite" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Graphique retards par jour */}
            <Card className="animate-fade-in">
              <CardHeader><CardTitle className="text-base">Retards par jour de la semaine</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={charts.retardsParJour ?? []}>
                    <XAxis dataKey="jour" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="presents" fill="#10b981" name="Presents" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="retards" fill="#f59e0b" name="Retards" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Top retardataires */}
            <Card className="animate-fade-in">
              <CardHeader><CardTitle className="text-base">Employes les plus en retard</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[...employes].sort((a: any, b: any) => b.totalRetardMin - a.totalRetardMin).slice(0, 8).map((e: any) => (
                    <div key={e.id} className="flex items-center justify-between py-1.5 border-b border-border/40 last:border-0">
                      <div>
                        <p className="text-sm font-medium">{e.prenom} {e.nom}</p>
                        <p className="text-xs text-muted-foreground">{e.antenne}</p>
                      </div>
                      <div className="text-right">
                        <Badge className={e.retards > 5 ? "bg-red-100 text-red-800" : e.retards > 0 ? "bg-amber-100 text-amber-800" : "bg-green-100 text-green-800"}>
                          {e.retards} retard(s)
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-0.5">{e.totalRetardMin} min</p>
                      </div>
                    </div>
                  ))}
                  {employes.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Aucune donnee</p>}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tableau ponctualite */}
          <Card>
            <CardHeader><CardTitle className="text-base">Detail ponctualite par employe</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employe</TableHead>
                      <TableHead>Antenne</TableHead>
                      <TableHead className="text-center">Presences</TableHead>
                      <TableHead className="text-center">Retards</TableHead>
                      <TableHead className="text-center">Absences</TableHead>
                      <TableHead className="text-center">Retard cumule</TableHead>
                      <TableHead className="text-center">Taux ponctualite</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employes.map((e: any) => (
                      <TableRow key={e.id}>
                        <TableCell className="font-medium">{e.nom} {e.prenom}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{e.antenne}</TableCell>
                        <TableCell className="text-center"><Badge className="bg-green-100 text-green-800">{e.presents}</Badge></TableCell>
                        <TableCell className="text-center"><Badge className={e.retards > 0 ? "bg-amber-100 text-amber-800" : "bg-green-100 text-green-800"}>{e.retards}</Badge></TableCell>
                        <TableCell className="text-center"><Badge className={e.absents > 0 ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}>{e.absents}</Badge></TableCell>
                        <TableCell className="text-center text-sm">{e.totalRetardMin > 0 ? `${e.totalRetardMin} min` : "-"}</TableCell>
                        <TableCell className="text-center">
                          <Badge className={e.tauxPonctualite >= 80 ? "bg-green-100 text-green-800" : e.tauxPonctualite >= 60 ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"}>
                            {e.tauxPonctualite}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* === ONGLET HEURES === */}
        <TabsContent value="heures" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Heures travaillees par employe</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employe</TableHead>
                      <TableHead>Antenne</TableHead>
                      <TableHead className="text-center">Presences</TableHead>
                      <TableHead className="text-center">Heures</TableHead>
                      <TableHead className="text-center">H. Sup</TableHead>
                      <TableHead className="text-center">Moy/jour</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employes.map((e: any) => (
                      <TableRow key={e.id}>
                        <TableCell className="font-medium">{e.nom} {e.prenom}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{e.antenne}</TableCell>
                        <TableCell className="text-center">{e.presents}</TableCell>
                        <TableCell className="text-center font-medium">{e.totalHeures}h</TableCell>
                        <TableCell className="text-center text-sm">{e.totalHeuresSupp > 0 ? `${e.totalHeuresSupp}h` : "-"}</TableCell>
                        <TableCell className="text-center text-sm">{e.presents > 0 ? `${(e.totalHeures / e.presents).toFixed(1)}h` : "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* === ONGLET MOYENNES === */}
        <TabsContent value="moyennes" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="animate-fade-in">
              <CardHeader><CardTitle className="text-base">Moyennes jours ouvrables (Lun-Ven)</CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employe</TableHead>
                        <TableHead className="text-center">Moy. arrivee</TableHead>
                        <TableHead className="text-center">Moy. depart</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {employes.map((e: any) => (
                        <TableRow key={e.id}>
                          <TableCell className="font-medium text-sm">{e.nom} {e.prenom}</TableCell>
                          <TableCell className="text-center">
                            <span className={`text-sm font-mono ${e.moyArriveeSemaine !== "-" && e.moyArriveeSemaine > "07:30" ? "text-amber-600" : "text-emerald-600"}`}>
                              {e.moyArriveeSemaine}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="text-sm font-mono">{e.moyDepartSemaine}</span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <Card className="animate-fade-in">
              <CardHeader><CardTitle className="text-base">Moyennes samedi</CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employe</TableHead>
                        <TableHead className="text-center">Moy. arrivee</TableHead>
                        <TableHead className="text-center">Moy. depart</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {employes.filter((e: any) => e.moyArriveeSamedi !== "-").map((e: any) => (
                        <TableRow key={e.id}>
                          <TableCell className="font-medium text-sm">{e.nom} {e.prenom}</TableCell>
                          <TableCell className="text-center">
                            <span className={`text-sm font-mono ${e.moyArriveeSamedi > "08:00" ? "text-amber-600" : "text-emerald-600"}`}>
                              {e.moyArriveeSamedi}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="text-sm font-mono">{e.moyDepartSamedi}</span>
                          </TableCell>
                        </TableRow>
                      ))}
                      {employes.filter((e: any) => e.moyArriveeSamedi !== "-").length === 0 && (
                        <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-4">Aucun pointage le samedi</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* === ONGLET PAR ANTENNE === */}
        {hasGlobalAccess(currentRole, currentAccesGlobal) && (
          <TabsContent value="antennes" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Graphique */}
              <Card className="animate-fade-in">
                <CardHeader><CardTitle className="text-base">Ponctualite par antenne</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={charts.antennes ?? []} layout="vertical">
                      <XAxis type="number" tick={{ fontSize: 12 }} />
                      <YAxis type="category" dataKey="antenne" tick={{ fontSize: 11 }} width={120} />
                      <Tooltip />
                      <Bar dataKey="tauxPonctualite" fill="#10b981" name="Ponctualite %" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Repartition */}
              <Card className="animate-fade-in">
                <CardHeader><CardTitle className="text-base">Repartition presences/retards/absences</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={charts.antennes ?? []}>
                      <XAxis dataKey="antenne" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="presents" fill="#10b981" name="Presents" stackId="a" />
                      <Bar dataKey="retards" fill="#f59e0b" name="Retards" stackId="a" />
                      <Bar dataKey="absents" fill="#ef4444" name="Absents" stackId="a" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Tableau antennes */}
            <Card>
              <CardHeader><CardTitle className="text-base">Synthese par antenne</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Antenne</TableHead>
                      <TableHead className="text-center">Presences</TableHead>
                      <TableHead className="text-center">Retards</TableHead>
                      <TableHead className="text-center">Absences</TableHead>
                      <TableHead className="text-center">Taux ponctualite</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(charts.antennes ?? []).map((a: any, i: number) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{a.antenne}</TableCell>
                        <TableCell className="text-center"><Badge className="bg-green-100 text-green-800">{a.presents}</Badge></TableCell>
                        <TableCell className="text-center"><Badge className="bg-amber-100 text-amber-800">{a.retards}</Badge></TableCell>
                        <TableCell className="text-center"><Badge className="bg-red-100 text-red-800">{a.absents}</Badge></TableCell>
                        <TableCell className="text-center">
                          <Badge className={a.tauxPonctualite >= 80 ? "bg-green-100 text-green-800" : a.tauxPonctualite >= 60 ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"}>
                            {a.tauxPonctualite}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
