// app/dashboard/layout.tsx

import { createClient } from "@/lib/supabase/server";
import DashboardShell from "@/app/dashboard/_components/DashboardShell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const [
    { count: clients },
    { count: projets },
    { count: devis },
    { count: factures },
  ] = await Promise.all([
    supabase.from("clients").select("*", { count: "exact", head: true }),
    supabase
      .from("projets")
      .select("*", { count: "exact", head: true })
      .eq("statut", "en_cours"),
    supabase
      .from("devis")
      .select("*", { count: "exact", head: true })
      .in("statut", ["brouillon", "envoye"]),
    supabase
      .from("factures")
      .select("*", { count: "exact", head: true })
      .eq("statut", "en_attente"),
  ]);

  return (
    <DashboardShell
      counts={{
        clients: clients ?? 0,
        projets: projets ?? 0,
        devis: devis ?? 0,
        factures: factures ?? 0,
      }}
    >
      {children}
    </DashboardShell>
  );
}
