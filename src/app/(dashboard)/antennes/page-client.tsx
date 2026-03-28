"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createAntenne, deleteAntenne } from "@/lib/actions/auth.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Building2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  antennes: any[];
}

export function AntennesPageClient({ antennes }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    nom: "", ville: "", adresse: "", telephone: "",
    loginKiosk: "", passwordKiosk: "",
  });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createAntenne({
        nom: form.nom,
        ville: form.ville || undefined,
        adresse: form.adresse || undefined,
        telephone: form.telephone || undefined,
        loginKiosk: form.loginKiosk,
        passwordKiosk: form.passwordKiosk,
      });
      toast.success("Antenne creee avec succes");
      setOpen(false);
      setForm({ nom: "", ville: "", adresse: "", telephone: "", loginKiosk: "", passwordKiosk: "" });
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cette antenne ?")) return;
    try {
      await deleteAntenne(id);
      toast.success("Antenne supprimee");
      router.refresh();
    } catch {
      toast.error("Impossible de supprimer (employes associes ?)");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            Antennes
          </h2>
          <p className="text-muted-foreground">{antennes.length} antennes enregistrees</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button />}><Plus className="h-4 w-4 mr-2" />Nouvelle antenne</DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Creer une antenne</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div><Label>Nom de l&apos;antenne</Label><Input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} placeholder="Antenne Abidjan" required /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Ville</Label><Input value={form.ville} onChange={(e) => setForm({ ...form, ville: e.target.value })} /></div>
                <div><Label>Telephone</Label><Input value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} /></div>
              </div>
              <div><Label>Adresse</Label><Input value={form.adresse} onChange={(e) => setForm({ ...form, adresse: e.target.value })} /></div>
              <div className="border-t pt-4">
                <p className="text-sm font-medium mb-3">Compte kiosk (pour le poste de pointage)</p>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Login kiosk</Label><Input value={form.loginKiosk} onChange={(e) => setForm({ ...form, loginKiosk: e.target.value })} placeholder="kiosk-abidjan" required /></div>
                  <div><Label>Mot de passe kiosk</Label><Input type="password" value={form.passwordKiosk} onChange={(e) => setForm({ ...form, passwordKiosk: e.target.value })} required /></div>
                </div>
              </div>
              <Button type="submit" className="w-full">Creer l&apos;antenne</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Ville</TableHead>
                <TableHead>Login kiosk</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {antennes.map((a: any) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.nom}</TableCell>
                  <TableCell>{a.ville ?? "-"}</TableCell>
                  <TableCell><code className="text-sm bg-muted px-1 rounded">{a.loginKiosk}</code></TableCell>
                  <TableCell>
                    <Badge className={a.actif ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                      {a.actif ? "Actif" : "Inactif"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(a.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
