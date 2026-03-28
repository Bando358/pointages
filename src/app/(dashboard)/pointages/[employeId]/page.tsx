import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { redirect } from "next/navigation";
import { getUserById } from "@/lib/actions/auth.actions";
import { PointageList } from "@/components/pointages/pointage-list";
import { ROLES_GESTION, hasGlobalAccess } from "@/lib/constants";

export default async function EmployePointagePage({ params }: { params: Promise<{ employeId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (!ROLES_GESTION.includes(session.user.role)) redirect("/pointages");

  const { employeId } = await params;
  const user = await getUserById(employeId);
  if (!user) redirect("/employes");

  // Non-global roles can only see their antenne's employees
  if (!hasGlobalAccess(session.user.role, session.user.accesGlobal ?? false) && user.antenneId !== session.user.antenneId) {
    redirect("/employes");
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Pointages de {user.prenom} {user.nom}</h2>
        <p className="text-muted-foreground">{user.antenne?.nom ?? "Aucune antenne"}</p>
      </div>
      <PointageList userId={employeId} />
    </div>
  );
}
