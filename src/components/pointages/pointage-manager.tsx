"use client";

import { useState, useEffect, useMemo } from "react";
import { getPointagesByAntenne, upsertPointageManuel } from "@/lib/actions/pointage.actions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { STATUT_POINTAGE_LABELS, STATUT_POINTAGE_COLORS } from "@/lib/constants";
import { formatTimeFr } from "@/lib/date-utils";
import { Save, Loader2, Search, Users, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface Props {
  antenneId: string | null;
}

type EmployeeRow = {
  userId: string;
  nom: string;
  prenom: string;
  antenne: string;
  pointage: any;
  heureArrivee: string;
  heureDepart: string;
  statut: string;
  observations: string;
  justificatif: string;
};

export function PointageManager({ antenneId }: Props) {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [rows, setRows] = useState<EmployeeRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatut, setFilterStatut] = useState("all");

  useEffect(() => {
    loadData();
  }, [date, antenneId]);

  async function loadData() {
    if (!antenneId) return;
    const data = await getPointagesByAntenne(antenneId, new Date(date));
    setRows(
      data.map((d: any) => ({
        ...d,
        heureArrivee: d.pointage?.heureArrivee ? formatTimeFr(d.pointage.heureArrivee) : "",
        heureDepart: d.pointage?.heureDepart ? formatTimeFr(d.pointage.heureDepart) : "",
        statut: d.pointage?.statut ?? "PRESENT",
        observations: d.pointage?.observations ?? "",
        justificatif: d.pointage?.justificatif ?? "",
      }))
    );
  }

  // Filtrage
  const filteredRows = useMemo(() => {
    let list = rows;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((r) => `${r.nom} ${r.prenom}`.toLowerCase().includes(q));
    }
    if (filterStatut === "pointe") {
      list = list.filter((r) => r.heureArrivee);
    } else if (filterStatut === "non_pointe") {
      list = list.filter((r) => !r.heureArrivee);
    } else if (filterStatut === "incomplet") {
      list = list.filter((r) => r.heureArrivee && !r.heureDepart);
    } else if (filterStatut !== "all") {
      list = list.filter((r) => r.statut === filterStatut);
    }
    return list;
  }, [rows, search, filterStatut]);

  // Stats rapides
  const totalEmployes = rows.length;
  const totalPointes = rows.filter((r) => r.heureArrivee).length;
  const totalNonPointes = rows.filter((r) => !r.heureArrivee).length;
  const totalIncomplets = rows.filter((r) => r.heureArrivee && !r.heureDepart).length;

  function updateRow(userId: string, field: string, value: string) {
    setRows((prev) => prev.map((r) => r.userId === userId ? { ...r, [field]: value } : r));
  }

  async function saveAll() {
    setSaving(true);
    let saved = 0;
    let errors = 0;

    for (const row of rows) {
      if (!row.heureArrivee && row.statut === "PRESENT") continue;
      try {
        await upsertPointageManuel(row.userId, {
          date: new Date(date),
          heureArrivee: row.heureArrivee || undefined,
          heureDepart: row.heureDepart || undefined,
          statut: row.statut,
          observations: row.observations || undefined,
          justificatif: row.justificatif || undefined,
        });
        saved++;
      } catch {
        errors++;
      }
    }

    setSaving(false);
    if (errors > 0) {
      toast.error(`${errors} erreur(s) lors de la sauvegarde`);
    } else {
      toast.success(`${saved} pointage(s) enregistre(s)`);
    }
    loadData();
  }

  const statuts = Object.entries(STATUT_POINTAGE_LABELS);

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="flex flex-row items-center justify-between">
          <CardTitle>Cahier de pointage</CardTitle>
          <div className="flex gap-3 items-center">
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-44"
            />
            <Button onClick={saveAll} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Sauvegarder
            </Button>
          </div>
        </div>

        {/* Stats rapides */}
        <div className="flex gap-3 flex-wrap">
          <button onClick={() => setFilterStatut("all")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all ${filterStatut === "all" ? "bg-primary/10 text-primary font-medium" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
            <Users className="h-3.5 w-3.5" /> {totalEmployes} Total
          </button>
          <button onClick={() => setFilterStatut("pointe")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all ${filterStatut === "pointe" ? "bg-primary/10 text-primary font-medium" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
            <CheckCircle className="h-3.5 w-3.5" /> {totalPointes} Pointes
          </button>
          <button onClick={() => setFilterStatut("non_pointe")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all ${filterStatut === "non_pointe" ? "bg-primary/10 text-primary font-medium" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
            <XCircle className="h-3.5 w-3.5" /> {totalNonPointes} Non pointes
          </button>
          <button onClick={() => setFilterStatut("incomplet")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all ${filterStatut === "incomplet" ? "bg-destructive/10 text-destructive font-medium" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
            <AlertTriangle className="h-3.5 w-3.5" /> {totalIncomplets} Incomplets
          </button>
        </div>

        {/* Recherche */}
        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un employe..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employe</TableHead>
                <TableHead>Arrivee</TableHead>
                <TableHead>Depart</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Observations</TableHead>
                <TableHead>Justificatif</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Aucun employe trouve
                  </TableCell>
                </TableRow>
              ) : (
                filteredRows.map((row) => (
                  <TableRow key={row.userId} className={row.heureArrivee && !row.heureDepart ? "bg-destructive/3" : ""}>
                    <TableCell className="font-medium whitespace-nowrap">
                      {row.nom} {row.prenom}
                    </TableCell>
                    <TableCell>
                      <Input type="time" value={row.heureArrivee} onChange={(e) => updateRow(row.userId, "heureArrivee", e.target.value)} className="w-24" />
                    </TableCell>
                    <TableCell>
                      <Input type="time" value={row.heureDepart} onChange={(e) => updateRow(row.userId, "heureDepart", e.target.value)} className="w-24" />
                    </TableCell>
                    <TableCell>
                      <select value={row.statut} onChange={(e) => updateRow(row.userId, "statut", e.target.value)} className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 w-32">
                        {statuts.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                      </select>
                    </TableCell>
                    <TableCell>
                      <Input value={row.observations} onChange={(e) => updateRow(row.userId, "observations", e.target.value)} placeholder="..." className="w-28" />
                    </TableCell>
                    <TableCell>
                      <Input value={row.justificatif} onChange={(e) => updateRow(row.userId, "justificatif", e.target.value)} placeholder="Declaration..." className="w-32" />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
