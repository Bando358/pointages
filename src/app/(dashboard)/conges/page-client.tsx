"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { demanderConge, approuverConge, refuserConge } from "@/lib/actions/conge.actions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatDateFr } from "@/lib/date-utils";
import { CalendarPlus, Check, X } from "lucide-react";
import { toast } from "sonner";

const TYPE_LABELS: Record<string, string> = {
  ANNUEL: "Annuel", MALADIE: "Maladie", MATERNITE: "Maternite",
  PATERNITE: "Paternite", EXCEPTIONNEL: "Exceptionnel", SANS_SOLDE: "Sans solde",
};

const STATUT_COLORS: Record<string, string> = {
  BROUILLON: "bg-gray-100 text-gray-800", SOUMIS: "bg-blue-100 text-blue-800",
  APPROUVE: "bg-green-100 text-green-800", REFUSE: "bg-red-100 text-red-800",
  ANNULE: "bg-gray-200 text-gray-600",
};

interface Props {
  conges: any[];
  userId: string;
  role: string;
  isManager: boolean;
}

export function CongesPageClient({ conges, userId, role, isManager }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ dateDebut: "", dateFin: "", type: "ANNUEL", motif: "" });

  async function handleDemander(e: React.FormEvent) {
    e.preventDefault();
    try {
      await demanderConge({
        userId,
        dateDebut: new Date(form.dateDebut),
        dateFin: new Date(form.dateFin),
        type: form.type as any,
        motif: form.motif || undefined,
      });
      toast.success("Demande de conge soumise");
      setOpen(false);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  async function handleApprouver(id: string) {
    await approuverConge(id, userId);
    toast.success("Conge approuve");
    router.refresh();
  }

  async function handleRefuser(id: string) {
    await refuserConge(id);
    toast.success("Conge refuse");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Conges</h2>
          <p className="text-muted-foreground">{isManager ? "Toutes les demandes" : "Mes demandes"}</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button />}><CalendarPlus className="h-4 w-4 mr-2" />Nouvelle demande</DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Demander un conge</DialogTitle></DialogHeader>
            <form onSubmit={handleDemander} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Date debut</Label><Input type="date" value={form.dateDebut} onChange={(e) => setForm({ ...form, dateDebut: e.target.value })} required /></div>
                <div><Label>Date fin</Label><Input type="date" value={form.dateFin} onChange={(e) => setForm({ ...form, dateFin: e.target.value })} required /></div>
              </div>
              <div>
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v: string | null) => setForm({ ...form, type: v ?? "ANNUEL" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TYPE_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Motif</Label><Textarea value={form.motif} onChange={(e) => setForm({ ...form, motif: e.target.value })} /></div>
              <Button type="submit" className="w-full">Soumettre</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                {isManager && <TableHead>Employe</TableHead>}
                <TableHead>Type</TableHead>
                <TableHead>Debut</TableHead>
                <TableHead>Fin</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Motif</TableHead>
                {isManager && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {conges.map((c: any) => (
                <TableRow key={c.id}>
                  {isManager && <TableCell>{c.user?.nom} {c.user?.prenom}</TableCell>}
                  <TableCell>{TYPE_LABELS[c.type] ?? c.type}</TableCell>
                  <TableCell>{formatDateFr(c.dateDebut)}</TableCell>
                  <TableCell>{formatDateFr(c.dateFin)}</TableCell>
                  <TableCell><Badge className={STATUT_COLORS[c.statut] ?? ""}>{c.statut}</Badge></TableCell>
                  <TableCell className="max-w-[200px] truncate">{c.motif ?? "-"}</TableCell>
                  {isManager && c.statut === "SOUMIS" && (
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => handleApprouver(c.id)}>
                          <Check className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => handleRefuser(c.id)}>
                          <X className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                  {isManager && c.statut !== "SOUMIS" && <TableCell>-</TableCell>}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
