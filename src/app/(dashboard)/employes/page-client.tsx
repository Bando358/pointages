"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createUser, updateUser } from "@/lib/actions/auth.actions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ROLES_LABELS, isGlobalRole, hasGlobalAccess } from "@/lib/constants";
import { UserPlus, Fingerprint, Clock, Search, Users, ShieldCheck, ShieldAlert, ChevronUp, ChevronDown, Globe, Pencil } from "lucide-react";
import { toast } from "sonner";

interface Props {
  users: any[];
  antennes: any[];
  currentRole: string;
  currentAntenneId: string | null;
  currentAccesGlobal: boolean;
}

type SortField = "nom" | "role" | "antenne" | "empreinte";
type SortDir = "asc" | "desc";

export function EmployesPageClient({ users, antennes, currentRole, currentAntenneId, currentAccesGlobal }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterAntenne, setFilterAntenne] = useState("all");
  const [filterRole, setFilterRole] = useState("all");
  const [filterEmpreinte, setFilterEmpreinte] = useState("all");
  const [sortField, setSortField] = useState<SortField>("nom");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const defaultForm = {
    nom: "", prenom: "", email: "", username: "", password: "",
    role: "EMPLOYE",
    antenneId: currentAntenneId ?? "",
    accesGlobal: false,
    heureDebutFixe: "07:30", heureFinFixe: "16:30",
    heureDebutSamedi: "08:00", heureFinSamedi: "16:00",
    pauseDebutFixe: "12:00", pauseFinFixe: "13:00",
    travailleSamedi: false,
  };
  const [form, setForm] = useState(defaultForm);

  // Filtrage + recherche + tri
  const filteredUsers = useMemo(() => {
    let list = [...users];

    if (search) {
      const q = search.toLowerCase();
      list = list.filter((u: any) =>
        `${u.nom} ${u.prenom} ${u.username}`.toLowerCase().includes(q)
      );
    }
    if (filterAntenne !== "all") list = list.filter((u: any) => u.antenneId === filterAntenne);
    if (filterRole !== "all") list = list.filter((u: any) => u.role === filterRole);
    if (filterEmpreinte === "oui") list = list.filter((u: any) => u.empreinteEnrolee);
    if (filterEmpreinte === "non") list = list.filter((u: any) => !u.empreinteEnrolee);

    list.sort((a: any, b: any) => {
      let va = "", vb = "";
      switch (sortField) {
        case "nom": va = `${a.nom} ${a.prenom}`; vb = `${b.nom} ${b.prenom}`; break;
        case "role": va = a.role; vb = b.role; break;
        case "antenne": va = a.antenne?.nom ?? ""; vb = b.antenne?.nom ?? ""; break;
        case "empreinte": va = a.empreinteEnrolee ? "a" : "z"; vb = b.empreinteEnrolee ? "a" : "z"; break;
      }
      const cmp = va.localeCompare(vb);
      return sortDir === "asc" ? cmp : -cmp;
    });

    return list;
  }, [users, search, filterAntenne, filterRole, filterEmpreinte, sortField, sortDir]);

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return null;
    return sortDir === "asc" ? <ChevronUp className="h-3 w-3 inline ml-0.5" /> : <ChevronDown className="h-3 w-3 inline ml-0.5" />;
  }

  // Stats
  const totalActifs = users.filter((u: any) => u.actif).length;
  const totalEnroles = users.filter((u: any) => u.empreinteEnrolee).length;
  const totalNonEnroles = totalActifs - totalEnroles;

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createUser({
        ...form,
        role: form.role as any,
        antenneId: form.antenneId || undefined,
        accesGlobal: form.accesGlobal || undefined,
        heureDebutSamedi: form.travailleSamedi ? form.heureDebutSamedi : undefined,
        heureFinSamedi: form.travailleSamedi ? form.heureFinSamedi : undefined,
      });
      toast.success("Employe cree avec succes");
      setOpen(false);
      setForm(defaultForm);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  async function toggleActif(userId: string, actif: boolean) {
    await updateUser(userId, { actif: !actif });
    router.refresh();
  }

  // === Edition ===
  const [editOpen, setEditOpen] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    nom: "", prenom: "", email: "", role: "EMPLOYE",
    antenneId: "", accesGlobal: false,
    heureDebutFixe: "07:30", heureFinFixe: "16:30",
  });

  function openEdit(u: any) {
    setEditUser(u);
    setEditForm({
      nom: u.nom, prenom: u.prenom, email: u.email, role: u.role,
      antenneId: u.antenneId ?? "",
      accesGlobal: u.accesGlobal ?? false,
      heureDebutFixe: u.heureDebutFixe ?? "07:30",
      heureFinFixe: u.heureFinFixe ?? "16:30",
    });
    setEditOpen(true);
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editUser) return;
    try {
      await updateUser(editUser.id, {
        nom: editForm.nom,
        prenom: editForm.prenom,
        email: editForm.email,
        role: editForm.role as any,
        antenneId: editForm.antenneId || null,
        accesGlobal: editForm.accesGlobal,
        heureDebutFixe: editForm.heureDebutFixe,
        heureFinFixe: editForm.heureFinFixe,
      });
      toast.success("Employe modifie");
      setEditOpen(false);
      setEditUser(null);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  const allowedRoles = isGlobalRole(currentRole)
    ? Object.entries(ROLES_LABELS)
    : [["EMPLOYE", ROLES_LABELS.EMPLOYE]];

  return (
    <div className="space-y-6">
      {/* Dialog Edition */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Modifier l&apos;employe</DialogTitle></DialogHeader>
          {editUser && (
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Nom</Label><Input value={editForm.nom} onChange={(e) => setEditForm({ ...editForm, nom: e.target.value })} required /></div>
                <div><Label>Prenom</Label><Input value={editForm.prenom} onChange={(e) => setEditForm({ ...editForm, prenom: e.target.value })} required /></div>
              </div>
              <div><Label>Email</Label><Input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} required /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Role</Label>
                  <select value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })} className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
                    {allowedRoles.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <Label>Antenne</Label>
                  <select value={editForm.antenneId} onChange={(e) => setEditForm({ ...editForm, antenneId: e.target.value })} disabled={!hasGlobalAccess(currentRole, currentAccesGlobal)} className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50">
                    <option value="">Aucune</option>
                    {antennes.map((a: any) => <option key={a.id} value={a.id}>{a.nom}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Heure debut</Label><Input type="time" value={editForm.heureDebutFixe} onChange={(e) => setEditForm({ ...editForm, heureDebutFixe: e.target.value })} /></div>
                <div><Label>Heure fin</Label><Input type="time" value={editForm.heureFinFixe} onChange={(e) => setEditForm({ ...editForm, heureFinFixe: e.target.value })} /></div>
              </div>
              {(isGlobalRole(currentRole) || currentAccesGlobal) && (
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Acces global</Label>
                    <p className="text-xs text-muted-foreground">Acces aux donnees de toutes les antennes</p>
                  </div>
                  <Switch checked={editForm.accesGlobal} onCheckedChange={(v) => setEditForm({ ...editForm, accesGlobal: !!v })} />
                </div>
              )}
              <Button type="submit" className="w-full">Enregistrer les modifications</Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Employes</h2>
          <p className="text-muted-foreground">{users.length} employes enregistres</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button />}><UserPlus className="h-4 w-4 mr-2" />Nouvel employe</DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Creer un employe</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Nom</Label><Input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} required /></div>
                <div><Label>Prenom</Label><Input value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} required /></div>
              </div>
              <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Identifiant</Label><Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required /></div>
                <div><Label>Mot de passe</Label><Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Role</Label>
                  <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
                    {allowedRoles.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <Label>Antenne</Label>
                  <select value={form.antenneId} onChange={(e) => setForm({ ...form, antenneId: e.target.value })} disabled={!isGlobalRole(currentRole) && !currentAccesGlobal} className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50">
                    <option value="">Choisir...</option>
                    {antennes.map((a: any) => <option key={a.id} value={a.id}>{a.nom}</option>)}
                  </select>
                </div>
              </div>
              {(isGlobalRole(currentRole) || currentAccesGlobal) && (
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Acces global</Label>
                    <p className="text-xs text-muted-foreground">Acces aux donnees de toutes les antennes</p>
                  </div>
                  <Switch checked={form.accesGlobal} onCheckedChange={(v) => setForm({ ...form, accesGlobal: !!v })} />
                </div>
              )}
              <div className="border-t pt-3 mt-1">
                <p className="text-sm font-medium mb-2">Horaires semaine (lun-ven)</p>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Debut</Label><Input type="time" value={form.heureDebutFixe} onChange={(e) => setForm({ ...form, heureDebutFixe: e.target.value })} /></div>
                  <div><Label>Fin</Label><Input type="time" value={form.heureFinFixe} onChange={(e) => setForm({ ...form, heureFinFixe: e.target.value })} /></div>
                </div>
              </div>
              <div className="border-t pt-3 mt-1">
                <p className="text-sm font-medium mb-2">Pause dejeuner (deduite automatiquement)</p>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Debut pause</Label><Input type="time" value={form.pauseDebutFixe} onChange={(e) => setForm({ ...form, pauseDebutFixe: e.target.value })} /></div>
                  <div><Label>Fin pause</Label><Input type="time" value={form.pauseFinFixe} onChange={(e) => setForm({ ...form, pauseFinFixe: e.target.value })} /></div>
                </div>
              </div>
              <div className="border-t pt-3 mt-1">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">Travaille le samedi</p>
                  <Switch checked={form.travailleSamedi} onCheckedChange={(v) => setForm({ ...form, travailleSamedi: !!v })} />
                </div>
                {form.travailleSamedi && (
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Debut samedi</Label><Input type="time" value={form.heureDebutSamedi} onChange={(e) => setForm({ ...form, heureDebutSamedi: e.target.value })} /></div>
                    <div><Label>Fin samedi</Label><Input type="time" value={form.heureFinSamedi} onChange={(e) => setForm({ ...form, heureFinSamedi: e.target.value })} /></div>
                  </div>
                )}
              </div>
              <Button type="submit" className="w-full">Creer</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 stagger">
        <Card className="bg-linear-to-br from-primary/10 to-primary/5 border-primary/20 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300">
          <CardContent className="pt-4 flex items-center gap-3">
            <div className="rounded-lg bg-primary/15 p-2"><Users className="h-5 w-5 text-primary" /></div>
            <div><p className="text-2xl font-bold">{totalActifs}</p><p className="text-xs text-muted-foreground">Actifs</p></div>
          </CardContent>
        </Card>
        <Card className="bg-linear-to-br from-emerald-50 to-teal-50/80 border-emerald-200/60 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300">
          <CardContent className="pt-4 flex items-center gap-3">
            <div className="rounded-lg bg-emerald-100 p-2"><ShieldCheck className="h-5 w-5 text-emerald-600" /></div>
            <div><p className="text-2xl font-bold text-emerald-600">{totalEnroles}</p><p className="text-xs text-muted-foreground">Enroles</p></div>
          </CardContent>
        </Card>
        <Card className="bg-linear-to-br from-amber-50 to-orange-50/80 border-amber-200/60 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300">
          <CardContent className="pt-4 flex items-center gap-3">
            <div className="rounded-lg bg-amber-100 p-2"><ShieldAlert className="h-5 w-5 text-amber-600" /></div>
            <div><p className="text-2xl font-bold text-amber-600">{totalNonEnroles}</p><p className="text-xs text-muted-foreground">Non enroles</p></div>
          </CardContent>
        </Card>
        <Card className="bg-linear-to-br from-blue-50 to-indigo-50/80 border-blue-200/60 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300">
          <CardContent className="pt-4 flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-2"><Fingerprint className="h-5 w-5 text-blue-600" /></div>
            <div><p className="text-2xl font-bold text-blue-600">{totalActifs > 0 ? Math.round((totalEnroles / totalActifs) * 100) : 0}%</p><p className="text-xs text-muted-foreground">Taux enrolement</p></div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un employe..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        {hasGlobalAccess(currentRole, currentAccesGlobal) && (
          <select value={filterAntenne} onChange={(e) => setFilterAntenne(e.target.value)} className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
            <option value="all">Toutes les antennes</option>
            {antennes.map((a: any) => <option key={a.id} value={a.id}>{a.nom}</option>)}
          </select>
        )}
        <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
          <option value="all">Tous les roles</option>
          {Object.entries(ROLES_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={filterEmpreinte} onChange={(e) => setFilterEmpreinte(e.target.value)} className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
          <option value="all">Empreinte: Tous</option>
          <option value="oui">Enroles</option>
          <option value="non">Non enroles</option>
        </select>
        <span className="text-xs text-muted-foreground">{filteredUsers.length} resultat(s)</span>
      </div>

      {/* Tableau */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("nom")}>Nom <SortIcon field="nom" /></TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("role")}>Role <SortIcon field="role" /></TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("antenne")}>Antenne <SortIcon field="antenne" /></TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("empreinte")}>Empreinte <SortIcon field="empreinte" /></TableHead>
                  <TableHead>Actif</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      Aucun employe trouve
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((u: any) => (
                    <TableRow key={u.id} className={!u.actif ? "opacity-50" : ""}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{u.nom} {u.prenom}</p>
                          <p className="text-xs text-muted-foreground">{u.username}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={u.role === "SUPER_ADMIN" ? "border-primary text-primary" : u.role === "ADMIN" ? "border-primary text-primary" : u.role === "GESTIONNAIRE" ? "border-purple-500 text-purple-600" : u.role === "RESPONSABLE" ? "border-blue-500 text-blue-600" : ""}>
                          {ROLES_LABELS[u.role] ?? u.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        <span className="flex items-center gap-1">
                          {u.antenne?.nom ?? "-"}
                          {u.accesGlobal && <span title="Acces global"><Globe className="h-3.5 w-3.5 text-blue-500" /></span>}
                        </span>
                      </TableCell>
                      <TableCell>
                        {u.empreinteEnrolee ? (
                          <Badge className="bg-emerald-100 text-emerald-800">
                            <Fingerprint className="h-3 w-3 mr-1" />Enrolee
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-muted-foreground">Non enrolee</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Switch checked={u.actif} onCheckedChange={() => toggleActif(u.id, u.actif)} />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(u)} title="Modifier">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" nativeButton={false} render={<Link href={`/pointages/${u.id}`} />} title="Voir pointages">
                            <Clock className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" nativeButton={false} render={<Link href={`/employes/${u.id}/empreintes`} />} title="Gerer empreintes">
                            <Fingerprint className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
