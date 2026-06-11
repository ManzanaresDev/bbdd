import { createClient } from "@/lib/supabase/server";
import {
  Users,
  FolderKanban,
  FileText,
  Receipt,
  TrendingUp,
  Clock,
  Euro,
  Hourglass,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();

  const [
    { count: totalClients },
    { count: projetsEnCours },
    { count: totalDevisActifs },
    { count: facturesEnAttente },
    { data: derniersClients },
    { data: prochainsProjets },
    { data: facturesPayees },
    { data: facturesAttente },
    { data: facturesRetard },
    { data: derniersDevis },
    { count: totalDevis },
    { count: devisAcceptes },
  ] = await Promise.all([
    supabase.from("clients").select("*", { count: "exact", head: true }),
    supabase
      .from("projets")
      .select("*", { count: "exact", head: true })
      .eq("statut", "en_cours"),
    // Tous les devis hors brouillon
    supabase
      .from("devis")
      .select("*", { count: "exact", head: true })
      .neq("statut", "brouillon"),
    supabase
      .from("factures")
      .select("*", { count: "exact", head: true })
      .eq("statut", "en_attente"),
    supabase
      .from("clients")
      .select("id, nom, entreprise, created_at")
      .order("created_at", { ascending: false })
      .limit(4),
    supabase
      .from("projets")
      .select("id, nom, statut, date_fin, clients(nom)")
      .eq("statut", "en_cours")
      .order("date_fin", { ascending: true })
      .limit(4),
    // CA encaissé
    supabase.from("factures").select("montant").eq("statut", "payee"),
    // CA en attente
    supabase.from("factures").select("montant").eq("statut", "en_attente"),
    // CA en retard
    supabase.from("factures").select("montant").eq("statut", "en_retard"),
    // Derniers devis — FK explicite pour éviter PGRST201
    supabase
      .from("devis")
      .select(
        "id, numero, titre, montant_ttc, statut, client_id, clients!devis_client_id_fkey(nom)",
      )
      .order("created_at", { ascending: false })
      .limit(4),
    // Total devis hors brouillon (pour taux conversion)
    supabase
      .from("devis")
      .select("*", { count: "exact", head: true })
      .neq("statut", "brouillon"),
    // Devis acceptés
    supabase
      .from("devis")
      .select("*", { count: "exact", head: true })
      .eq("statut", "accepte"),
  ]);

  const caEncaisse = (facturesPayees ?? []).reduce(
    (sum, f) => sum + (f.montant ?? 0),
    0,
  );
  const caEnAttente = (facturesAttente ?? []).reduce(
    (sum, f) => sum + (f.montant ?? 0),
    0,
  );
  const caEnRetard = (facturesRetard ?? []).reduce(
    (sum, f) => sum + (f.montant ?? 0),
    0,
  );

  const tauxConversion =
    (totalDevis ?? 0) > 0
      ? Math.round(((devisAcceptes ?? 0) / (totalDevis ?? 1)) * 100)
      : 0;

  const fmt = (n: number) =>
    n.toLocaleString("fr-FR", { minimumFractionDigits: 2 }) + " €";

  const STATUT_DEVIS: Record<string, { label: string; color: string }> = {
    brouillon: { label: "Brouillon", color: "text-white/40" },
    envoye: { label: "Envoyé", color: "text-blue-300" },
    accepte: { label: "Accepté", color: "text-green-300" },
    refuse: { label: "Refusé", color: "text-red-300" },
    expire: { label: "Expiré", color: "text-orange-300" },
  };

  const stats = [
    {
      label: "Clients",
      value: totalClients ?? 0,
      icon: Users,
      href: "/dashboard/clients",
      accent: "text-blue-200",
    },
    {
      label: "Projets en cours",
      value: projetsEnCours ?? 0,
      icon: FolderKanban,
      href: "/dashboard/projets",
      accent: "text-amber-200",
    },
    {
      label: "Devis",
      value: totalDevisActifs ?? 0,
      icon: FileText,
      href: "/dashboard/devis",
      accent: "text-purple-200",
    },
    {
      label: "Factures en attente",
      value: facturesEnAttente ?? 0,
      icon: Receipt,
      href: "/dashboard/factures",
      accent: "text-red-200",
    },
  ];

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-6xl mx-auto text-white">
      {/* HEADER */}
      <div className="mb-8">
        <p className="text-white/60 text-sm">Vue d'ensemble de votre agence</p>
      </div>

      {/* STATS COMPTEURS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map(({ label, value, icon: Icon, href, accent }) => (
          <Link
            key={label}
            href={href}
            className="card-glass p-5 min-w-0 hover:bg-white/15 hover:scale-[1.02] transition-all duration-200 group"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-white/10 border border-white/20">
                <Icon size={18} className={accent} />
              </div>
              <TrendingUp
                size={14}
                className="text-white/30 group-hover:text-white/60 transition-colors"
              />
            </div>
            <p className="font-display text-2xl sm:text-3xl font-semibold">
              {value}
            </p>
            <p className="text-white/60 text-xs mt-0.5">{label}</p>
          </Link>
        ))}
      </div>

      {/* CA SECTION */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {/* CA Encaissé */}
        <div className="card-glass p-5 border border-green-500/20">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 size={15} className="text-green-400" />
            <p className="text-xs text-white/50 uppercase tracking-widest">
              CA encaissé
            </p>
          </div>
          <p className="text-2xl font-semibold text-green-300">
            {fmt(caEncaisse)}
          </p>
          <p className="text-xs text-white/30 mt-1">
            {(facturesPayees ?? []).length} facture
            {(facturesPayees ?? []).length !== 1 ? "s" : ""} payée
            {(facturesPayees ?? []).length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* CA En attente */}
        <div className="card-glass p-5 border border-blue-500/20">
          <div className="flex items-center gap-2 mb-3">
            <Hourglass size={15} className="text-blue-400" />
            <p className="text-xs text-white/50 uppercase tracking-widest">
              En attente
            </p>
          </div>
          <p className="text-2xl font-semibold text-blue-300">
            {fmt(caEnAttente)}
          </p>
          <p className="text-xs text-white/30 mt-1">
            {(facturesAttente ?? []).length} facture
            {(facturesAttente ?? []).length !== 1 ? "s" : ""} en attente
          </p>
        </div>

        {/* CA En retard */}
        <div className="card-glass p-5 border border-red-500/20">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={15} className="text-red-400" />
            <p className="text-xs text-white/50 uppercase tracking-widest">
              En retard
            </p>
          </div>
          <p className="text-2xl font-semibold text-red-300">
            {fmt(caEnRetard)}
          </p>
          <p className="text-xs text-white/30 mt-1">
            {(facturesRetard ?? []).length} facture
            {(facturesRetard ?? []).length !== 1 ? "s" : ""} en retard
          </p>
        </div>
      </div>

      {/* TAUX DE CONVERSION */}
      <div className="card-glass p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp size={15} className="text-purple-400" />
            <p className="text-xs text-white/50 uppercase tracking-widest">
              Taux de conversion devis → facture
            </p>
          </div>
          <span className="text-lg font-semibold text-purple-300">
            {tauxConversion}%
          </span>
        </div>
        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-purple-400 rounded-full transition-all duration-700"
            style={{ width: `${tauxConversion}%` }}
          />
        </div>
        <p className="text-xs text-white/30 mt-2">
          {devisAcceptes ?? 0} accepté{(devisAcceptes ?? 0) !== 1 ? "s" : ""}{" "}
          sur {totalDevis ?? 0} devis envoyé{(totalDevis ?? 0) !== 1 ? "s" : ""}
        </p>
      </div>

      {/* GRID CONTENT */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* DERNIERS CLIENTS */}
        <div className="card-glass p-6 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-base font-semibold">
              Derniers clients
            </h2>
            <Link
              href="/dashboard/clients"
              className="text-xs text-white/60 hover:text-white"
            >
              Voir tout →
            </Link>
          </div>

          {derniersClients && derniersClients.length > 0 ? (
            <div className="space-y-3">
              {derniersClients.map((client: any) => (
                <Link
                  key={client.id}
                  href={`/dashboard/clients/${client.id}`}
                  className="flex items-center gap-3 group min-w-0"
                >
                  <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-xs font-medium shrink-0">
                    {client.nom.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="group-hover:text-white/80 truncate">
                      {client.nom}
                    </p>
                    <p className="text-white/50 text-xs truncate">
                      {client.entreprise || "Particulier"}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-white/50 text-sm">
              Aucun client pour l'instant.
            </p>
          )}
        </div>

        {/* PROJETS EN COURS */}
        <div className="card-glass p-6 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-base font-semibold">
              Projets en cours
            </h2>
            <Link
              href="/dashboard/projets"
              className="text-xs text-white/60 hover:text-white"
            >
              Voir tout →
            </Link>
          </div>

          {prochainsProjets && prochainsProjets.length > 0 ? (
            <div className="space-y-3">
              {prochainsProjets.map((projet: any) => (
                <Link
                  key={projet.id}
                  href={`/dashboard/projets/${projet.id}`}
                  className="flex items-center gap-3 group min-w-0"
                >
                  <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                    <Clock size={14} className="text-white/70" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate group-hover:text-white/80">
                      {projet.nom}
                    </p>
                    <p className="text-white/50 text-xs truncate">
                      {(projet.clients as any)?.nom || "—"}
                      {projet.date_fin
                        ? ` · Livraison ${new Date(projet.date_fin).toLocaleDateString("fr-FR")}`
                        : ""}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-white/50 text-sm">Aucun projet en cours.</p>
          )}
        </div>

        {/* DERNIERS DEVIS */}
        <div className="card-glass p-6 min-w-0 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-base font-semibold">
              Derniers devis
            </h2>
            <Link
              href="/dashboard/devis"
              className="text-xs text-white/60 hover:text-white"
            >
              Voir tout →
            </Link>
          </div>

          {derniersDevis && derniersDevis.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {derniersDevis.map((d: any) => {
                const cfg = STATUT_DEVIS[d.statut] ?? STATUT_DEVIS["brouillon"];
                return (
                  <Link
                    key={d.id}
                    href={`/dashboard/devis/${d.id}`}
                    className="flex items-center gap-3 group p-3 rounded-xl hover:bg-white/5 transition-colors min-w-0"
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
                      <FileText
                        size={13}
                        className="text-amber-300"
                        strokeWidth={1.8}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate [text-shadow:0_0_5px_#39FF14]">
                          {d.numero}
                        </p>
                        <span className={`text-xs shrink-0 ${cfg.color}`}>
                          {cfg.label}
                        </span>
                      </div>
                      <p className="text-white/50 text-xs truncate">
                        {(d.clients as any)?.nom || "—"}
                        {d.montant_ttc != null
                          ? ` · ${Number(d.montant_ttc).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €`
                          : ""}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="text-white/50 text-sm">Aucun devis pour l'instant.</p>
          )}
        </div>
      </div>
    </div>
  );
}
