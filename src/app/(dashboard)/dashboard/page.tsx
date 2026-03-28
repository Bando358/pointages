import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { redirect } from "next/navigation";
import { fetchDashboardData } from "@/lib/actions/dashboard.actions";
import { getAntennes } from "@/lib/actions/auth.actions";
import { DashboardClient } from "./dashboard-client";
import { hasGlobalAccess } from "@/lib/constants";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.loginType === "kiosk") redirect("/pointages");

  const accesGlobal = hasGlobalAccess(session.user.role, session.user.accesGlobal ?? false);

  const [data, antennes] = await Promise.all([
    fetchDashboardData({
      role: session.user.role,
      antenneId: accesGlobal ? undefined : session.user.antenneId,
      userId: session.user.id,
    }),
    getAntennes(),
  ]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bonjour" : hour < 18 ? "Bon apres-midi" : "Bonsoir";

  return (
    <DashboardClient
      initialData={JSON.parse(JSON.stringify(data))}
      antennes={JSON.parse(JSON.stringify(antennes))}
      greeting={greeting}
      userName={`${session.user.prenom} ${session.user.nom}`}
      role={session.user.role}
      antenneNom={session.user.antenneNom}
      currentAntenneId={session.user.antenneId}
      accesGlobal={accesGlobal}
    />
  );
}
