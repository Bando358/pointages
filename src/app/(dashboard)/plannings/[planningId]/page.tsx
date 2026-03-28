import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { redirect } from "next/navigation";
import { getPlanningById, getEmployesSansPlanning } from "@/lib/actions/planning.actions";
import { PlanningDetailClient } from "./page-client";
import { ROLES_GESTION, hasGlobalAccess } from "@/lib/constants";

export default async function PlanningDetailPage({ params }: { params: Promise<{ planningId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (!ROLES_GESTION.includes(session.user.role)) redirect("/dashboard");

  const { planningId } = await params;
  const planning = await getPlanningById(planningId);
  if (!planning) redirect("/plannings");

  const antenneId = !hasGlobalAccess(session.user.role, session.user.accesGlobal ?? false) ? session.user.antenneId ?? undefined : planning.antenneId ?? undefined;
  const employesSansPlanning = await getEmployesSansPlanning(antenneId);

  return (
    <PlanningDetailClient
      planning={JSON.parse(JSON.stringify(planning))}
      employesSansPlanning={JSON.parse(JSON.stringify(employesSansPlanning))}
    />
  );
}
