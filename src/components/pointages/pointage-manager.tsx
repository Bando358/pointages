"use client";

import { useState, useEffect } from "react";
import { getPointagesByAntenne, upsertPointageManuel } from "@/lib/actions/pointage.actions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { STATUT_POINTAGE_LABELS, STATUT_POINTAGE_COLORS } from "@/lib/constants";
import { formatTimeFr } from "@/lib/date-utils";
import { Save, Loader2 } from "lucide-react";
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

  function updateRow(index: number, field: string, value: string) {
    setRows((prev) => {
      const copy = [...prev];
      (copy[index] as any)[field] = value;
      return copy;
    });
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
      <CardHeader className="flex flex-row items-center justify-between">
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
              {rows.map((row, i) => (
                <TableRow key={row.userId}>
                  <TableCell className="font-medium whitespace-nowrap">
                    {row.nom} {row.prenom}
                  </TableCell>
                  <TableCell>
                    <Input type="time" value={row.heureArrivee} onChange={(e) => updateRow(i, "heureArrivee", e.target.value)} className="w-24" />
                  </TableCell>
                  <TableCell>
                    <Input type="time" value={row.heureDepart} onChange={(e) => updateRow(i, "heureDepart", e.target.value)} className="w-24" />
                  </TableCell>
                  <TableCell>
                    <Select value={row.statut} onValueChange={(v: string | null) => updateRow(i, "statut", v ?? "PRESENT")}>
                      <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {statuts.map(([key, label]) => (<SelectItem key={key} value={key}>{label}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input value={row.observations} onChange={(e) => updateRow(i, "observations", e.target.value)} placeholder="..." className="w-28" />
                  </TableCell>
                  <TableCell>
                    <Input value={row.justificatif} onChange={(e) => updateRow(i, "justificatif", e.target.value)} placeholder="Declaration..." className="w-32" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
