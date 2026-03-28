"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { affecterPlanning, desaffecterPlanning } from "@/lib/actions/planning.actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarRange, UserPlus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatDateFr } from "@/lib/date-utils";

const JOURS = ["", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const JOURS_SHORT = ["", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

interface Props {
  planning: any;
  employesSansPlanning: any[];
}

export function PlanningDetailClient({ planning, employesSansPlanning }: Props) {
  const router = useRouter();
  const [selectedUserId, setSelectedUserId] = useState("");
  const [dateDebut, setDateDebut] = useState(new Date().toISOString().split("T")[0]);

  async function handleAffecter(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUserId) return;

    // Calculer le lundi de la semaine de dateDebut comme reference
    const d = new Date(dateDebut);
    const day = d.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const monday = new Date(d);
    monday.setDate(d.getDate() + mondayOffset);

    try {
      await affecterPlanning({
        userId: selectedUserId,
        planningId: planning.id,
        dateDebut: new Date(dateDebut),
        dateRefSemaine1: monday,
      });
      toast.success("Employe affecte au planning");
      setSelectedUserId("");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  async function handleDesaffecter(id: string) {
    if (!confirm("Retirer cet employe du planning ?")) return;
    await desaffecterPlanning(id);
    toast.success("Affectation retiree");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <CalendarRange className="h-6 w-6" />
          {planning.nom}
        </h2>
        <p className="text-muted-foreground">{planning.description ?? ""}</p>
      </div>

      {/* Grille des semaines */}
      <div className="grid gap-4 md:grid-cols-2">
        {planning.semaines?.map((sem: any) => (
          <Card key={sem.id} className="animate-fade-in">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                {planning.nombreSemaines > 1 ? (sem.label ?? `Semaine ${sem.numeroSemaine}`) : "Horaires"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[1, 2, 3, 4, 5, 6, 7].map((j) => {
                  const jour = sem.jours?.find((d: any) => d.jourSemaine === j);
                  const travaille = jour?.travaille;
                  return (
                    <div key={j} className={`flex items-center justify-between p-2 rounded-lg text-sm ${
                      travaille ? "bg-primary/5 border border-primary/10" : "bg-muted/30"
                    }`}>
                      <span className={`font-medium ${travaille ? "" : "text-muted-foreground/50"}`}>
                        {JOURS[j]}
                      </span>
                      {travaille ? (
                        <Badge variant="secondary">{jour.heureDebut} - {jour.heureFin}</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground/50">Repos</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Affectation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Affecter un employe
          </CardTitle>
        </CardHeader>
        <CardContent>
          {employesSansPlanning.length > 0 ? (
            <form onSubmit={handleAffecter} className="flex gap-3 items-end flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <Label>Employe</Label>
                <Select value={selectedUserId} onValueChange={(v: string | null) => setSelectedUserId(v ?? "")}>
                  <SelectTrigger><SelectValue placeholder="Choisir un employe..." /></SelectTrigger>
                  <SelectContent>
                    {employesSansPlanning.map((u: any) => (
                      <SelectItem key={u.id} value={u.id}>{u.nom} {u.prenom}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Date debut</Label>
                <Input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} className="w-40" />
              </div>
              <Button type="submit" disabled={!selectedUserId}>Affecter</Button>
            </form>
          ) : (
            <p className="text-sm text-muted-foreground">Tous les employes ont deja un planning</p>
          )}
        </CardContent>
      </Card>

      {/* Employes affectes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Employes affectes ({planning.affectations?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employe</TableHead>
                <TableHead>Depuis</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {planning.affectations?.map((aff: any) => (
                <TableRow key={aff.id}>
                  <TableCell className="font-medium">{aff.user.nom} {aff.user.prenom}</TableCell>
                  <TableCell>{formatDateFr(aff.dateDebut)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => handleDesaffecter(aff.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {(!planning.affectations || planning.affectations.length === 0) && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground py-6">
                    Aucun employe affecte
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
