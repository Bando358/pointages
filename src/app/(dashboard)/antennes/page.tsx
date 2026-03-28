import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { redirect } from "next/navigation";
import { getAntennes } from "@/lib/actions/auth.actions";
import { AntennesPageClient } from "./page-client";

export default async function AntennesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) redirect("/pointages");

  const antennes = await getAntennes();
  return <AntennesPageClient antennes={JSON.parse(JSON.stringify(antennes))} />;
}
