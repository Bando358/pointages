import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { redirect } from "next/navigation";
import { getUsers, getAntennes } from "@/lib/actions/auth.actions";
import { EmployesPageClient } from "./page-client";
import { ROLES_GESTION, hasGlobalAccess } from "@/lib/constants";

export default async function EmployesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (!ROLES_GESTION.includes(session.user.role)) redirect("/pointages");

  // Non-global roles can only see their antenne's employees
  const antenneFilter = !hasGlobalAccess(session.user.role, session.user.accesGlobal ?? false) ? session.user.antenneId ?? undefined : undefined;
  const [users, antennes] = await Promise.all([
    getUsers(antenneFilter),
    getAntennes(),
  ]);

  return (
    <EmployesPageClient
      users={JSON.parse(JSON.stringify(users))}
      antennes={JSON.parse(JSON.stringify(antennes))}
      currentRole={session.user.role}
      currentAntenneId={session.user.antenneId}
      currentAccesGlobal={session.user.accesGlobal ?? false}
    />
  );
}
