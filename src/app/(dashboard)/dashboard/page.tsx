import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { redirect } from "next/navigation";
import { fetchDashboardData } from "@/lib/actions/dashboard.actions";
import { DashboardClient } from "./dashboard-client";
import { hasGlobalAccess } from "@/lib/constants";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.loginType === "kiosk") redirect("/pointages");

  const accesGlobal = hasGlobalAccess(session.user.role, session.user.accesGlobal ?? false);
  const data = await fetchDashboardData({
    role: session.user.role,
    antenneId: accesGlobal ? undefined : session.user.antenneId,
    userId: session.user.id,
  });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bonjour" : hour < 18 ? "Bon apres-midi" : "Bonsoir";

  return (
    <DashboardClient
      data={JSON.parse(JSON.stringify(data))}
      greeting={greeting}
      userName={`${session.user.prenom} ${session.user.nom}`}
      role={session.user.role}
      antenneNom={session.user.antenneNom}
    />
  );
}
