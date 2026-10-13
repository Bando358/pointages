import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { redirect } from "next/navigation";
import { getEquipes, getRotation, getEmployesSansEquipe } from "@/lib/actions/rotation.actions";
import { getAntennes } from "@/lib/actions/auth.actions";
import { RotationPageClient } from "./page-client";
import { ROLES_GESTION, hasGlobalAccess } from "@/lib/constants";

export default async function RotationPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (!ROLES_GESTION.includes(session.user.role)) redirect("/dashboard");

  const now = new Date();
  const antenneFilter = !hasGlobalAccess(session.user.role, session.user.accesGlobal ?? false)
    ? session.user.antenneId ?? undefined
    : undefined;

  const [equipes, rotation, antennes, employesSansEquipe] = await Promise.all([
    getEquipes(antenneFilter),
    getRotation({ mois: now.getMonth(), annee: now.getFullYear(), antenneId: antenneFilter }),
    getAntennes(),
    getEmployesSansEquipe(antenneFilter),
  ]);

  return (
    <RotationPageClient
      equipes={JSON.parse(JSON.stringify(equipes))}
      rotation={JSON.parse(JSON.stringify(rotation))}
      antennes={JSON.parse(JSON.stringify(antennes))}
      employesSansEquipe={JSON.parse(JSON.stringify(employesSansEquipe))}
      currentAntenneId={session.user.antenneId}
      currentRole={session.user.role}
      currentAccesGlobal={session.user.accesGlobal ?? false}
      initialMois={now.getMonth()}
      initialAnnee={now.getFullYear()}
    />
  );
}
