import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { redirect } from "next/navigation";
import { getUserById } from "@/lib/actions/auth.actions";
import { getEmpreintesUtilisateur } from "@/lib/actions/empreinte.actions";
import { EnrollmentPageClient } from "./page-client";
import { ROLES_GESTION, hasGlobalAccess } from "@/lib/constants";

export default async function EmpreintesPage({ params }: { params: Promise<{ employeId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (!ROLES_GESTION.includes(session.user.role)) redirect("/pointages");

  const { employeId } = await params;
  const [user, empreintes] = await Promise.all([
    getUserById(employeId),
    getEmpreintesUtilisateur(employeId),
  ]);

  if (!user) redirect("/employes");

  // Non-global roles can only manage their own antenne's employees
  if (!hasGlobalAccess(session.user.role, session.user.accesGlobal ?? false) && user.antenneId !== session.user.antenneId) {
    redirect("/employes");
  }

  return (
    <EnrollmentPageClient
      user={JSON.parse(JSON.stringify(user))}
      empreintes={JSON.parse(JSON.stringify(empreintes))}
      enrollerId={session.user.id}
    />
  );
}
