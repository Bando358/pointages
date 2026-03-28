import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { redirect } from "next/navigation";
import { getConges } from "@/lib/actions/conge.actions";
import { CongesPageClient } from "./page-client";
import { isGestionRole } from "@/lib/constants";

export default async function CongesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.loginType === "kiosk") redirect("/pointages");

  const isManager = isGestionRole(session.user.role);
  const conges = await getConges(isManager ? undefined : session.user.id);

  return (
    <CongesPageClient
      conges={JSON.parse(JSON.stringify(conges))}
      userId={session.user.id}
      role={session.user.role}
      isManager={isManager}
    />
  );
}
