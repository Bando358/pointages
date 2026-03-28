import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { redirect } from "next/navigation";
import { getPlannings } from "@/lib/actions/planning.actions";
import { PlanningsPageClient } from "./page-client";
import { getAntennes } from "@/lib/actions/auth.actions";
import { ROLES_GESTION, hasGlobalAccess } from "@/lib/constants";

export default async function PlanningsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (!ROLES_GESTION.includes(session.user.role)) redirect("/dashboard");

  const antenneFilter = !hasGlobalAccess(session.user.role, session.user.accesGlobal ?? false) ? session.user.antenneId ?? undefined : undefined;
  const [plannings, antennes] = await Promise.all([
    getPlannings(antenneFilter),
    getAntennes(),
  ]);

  return (
    <PlanningsPageClient
      plannings={JSON.parse(JSON.stringify(plannings))}
      antennes={JSON.parse(JSON.stringify(antennes))}
      currentAntenneId={session.user.antenneId}
      currentRole={session.user.role}
      currentAccesGlobal={session.user.accesGlobal ?? false}
    />
  );
}
