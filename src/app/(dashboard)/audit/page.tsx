import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { redirect } from "next/navigation";
import { getAuditLogs, getAuditStats } from "@/lib/actions/audit.actions";
import { AuditPageClient } from "./page-client";

export default async function AuditPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) redirect("/dashboard");

  const [logs, stats] = await Promise.all([
    getAuditLogs({ page: 1, pageSize: 50 }),
    getAuditStats(),
  ]);

  return (
    <AuditPageClient
      initialLogs={JSON.parse(JSON.stringify(logs))}
      stats={stats}
    />
  );
}
