"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createAntenne, updateAntenne, changeAntennePassword, deleteAntenne } from "@/lib/actions/auth.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Building2, Plus, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";

interface Props {
  antennes: any[];
}

export function AntennesPageClient({ antennes }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    nom: "", ville: "", loginKiosk: "", passwordKiosk: "",
  });

  // Edition
  const [editOpen, setEditOpen] = useState(false);
  const [editAntenne, setEditAntenne] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    nom: "", ville: "", actif: true,
  });
  const [newKioskPassword, setNewKioskPassword] = useState("");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createAntenne({
        nom: form.nom,
        ville: form.ville || undefined,
        loginKiosk: form.loginKiosk,
        passwordKiosk: form.passwordKiosk,
      });
      toast.success("Antenne creee avec succes");
      setOpen(false);
      setForm({ nom: "", ville: "", loginKiosk: "", passwordKiosk: "" });
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  function openEdit(a: any) {
    setEditAntenne(a);
    setEditForm({
      nom: a.nom, ville: a.ville ?? "", actif: a.actif,
    });
    setNewKioskPassword("");
    setEditOpen(true);
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editAntenne) return;
    try {
      await updateAntenne(editAntenne.id, {
        nom: editForm.nom,
        ville: editForm.ville || undefined,
        actif: editForm.actif,
      });
      if (newKioskPassword.trim()) {
        await changeAntennePassword(editAntenne.id, newKioskPassword);
      }
      toast.success("Antenne modifiee");
      setEditOpen(false);
      setEditAntenne(null);
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
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Nom de l&apos;antenne</Label><Input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} placeholder="Antenne Abidjan" required /></div>
                <div><Label>Ville</Label><Input value={form.ville} onChange={(e) => setForm({ ...form, ville: e.target.value })} /></div>
              </div>
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

      {/* Dialog Edition */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Modifier l&apos;antenne</DialogTitle></DialogHeader>
          {editAntenne && (
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Nom</Label><Input value={editForm.nom} onChange={(e) => setEditForm({ ...editForm, nom: e.target.value })} required /></div>
                <div><Label>Ville</Label><Input value={editForm.ville} onChange={(e) => setEditForm({ ...editForm, ville: e.target.value })} /></div>
              </div>
              <div className="flex items-center justify-between">
                <Label>Actif</Label>
                <Switch checked={editForm.actif} onCheckedChange={(v) => setEditForm({ ...editForm, actif: !!v })} />
              </div>
              <div className="border-t pt-4">
                <p className="text-sm font-medium mb-2">Compte kiosk</p>
                <p className="text-xs text-muted-foreground mb-3">Login : <code className="bg-muted px-1 rounded">{editAntenne.loginKiosk}</code></p>
                <div>
                  <Label>Nouveau mot de passe kiosk (laisser vide pour ne pas changer)</Label>
                  <Input type="password" value={newKioskPassword} onChange={(e) => setNewKioskPassword(e.target.value)} placeholder="Nouveau mot de passe..." />
                </div>
              </div>
              <Button type="submit" className="w-full">Enregistrer les modifications</Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Ville</TableHead>
                <TableHead>Login kiosk</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {antennes.map((a: any) => (
                <TableRow key={a.id} className={!a.actif ? "opacity-50" : ""}>
                  <TableCell className="font-medium">{a.nom}</TableCell>
                  <TableCell>{a.ville ?? "-"}</TableCell>
                  <TableCell><code className="text-sm bg-muted px-1 rounded">{a.loginKiosk}</code></TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={a.actif ? "text-primary border-primary/30" : "text-destructive border-destructive/30"}>
                      {a.actif ? "Actif" : "Inactif"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 justify-center">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(a)} title="Modifier">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(a.id)} title="Supprimer">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
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
