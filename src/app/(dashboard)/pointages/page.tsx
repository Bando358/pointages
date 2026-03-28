import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { redirect } from "next/navigation";
import { getTodayPointage } from "@/lib/actions/pointage.actions";
import { PointagePageClient } from "./page-client";
import { isGestionRole } from "@/lib/constants";

export default async function PointagesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const isKiosk = session.user.loginType === "kiosk";
  const isManager = isGestionRole(session.user.role);

  // For kiosk, no need for today's pointage (employees scan)
  const todayPointage = isKiosk ? null : await getTodayPointage(session.user.id);

  return (
    <PointagePageClient
      userId={session.user.id}
      role={session.user.role}
      antenneId={session.user.antenneId}
      antenneNom={session.user.antenneNom}
      todayPointage={todayPointage ? JSON.parse(JSON.stringify(todayPointage)) : null}
      isManager={isManager}
      isKiosk={isKiosk}
    />
  );
}
