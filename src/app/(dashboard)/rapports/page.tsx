import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { redirect } from "next/navigation";
import { getAntennes } from "@/lib/actions/auth.actions";
import { fetchRapportMensuel } from "@/lib/actions/rapport.actions";
import { RapportsPageClient } from "./page-client";
import { ROLES_GESTION, hasGlobalAccess } from "@/lib/constants";

export default async function RapportsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (!ROLES_GESTION.includes(session.user.role)) redirect("/pointages");

  const now = new Date();
  const accesGlobal = hasGlobalAccess(session.user.role, session.user.accesGlobal ?? false);
  const antenneFilter = !accesGlobal ? session.user.antenneId ?? undefined : undefined;

  const [antennes, rapport] = await Promise.all([
    getAntennes(),
    fetchRapportMensuel({ month: now.getMonth() + 1, year: now.getFullYear(), antenneId: antenneFilter }),
  ]);

  return (
    <RapportsPageClient
      initialData={JSON.parse(JSON.stringify(rapport))}
      antennes={JSON.parse(JSON.stringify(antennes))}
      currentAntenneId={antenneFilter ?? null}
      currentRole={session.user.role}
      currentAccesGlobal={session.user.accesGlobal ?? false}
    />
  );
}
