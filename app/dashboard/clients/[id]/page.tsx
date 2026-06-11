import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  MapPin,
  FolderKanban,
  FileText,
  Receipt,
  Calendar,
  TrendingUp,
} from "lucide-react";

const STATUT_PROJET_COLORS: Record<string, string> = {
  en_cours: "bg-amber-500/20 text-amber-300",
  termine: "bg-green-500/20 text-green-300",
  en_attente: "bg-blue-500/20 text-blue-300",
  annule: "bg-red-500/20 text-red-300",
};
const STATUT_PROJET_LABELS: Record<string, string> = {
  en_cours: "En cours",
  termine: "Terminé",
  en_attente: "En attente",
  annule: "Annulé",
};

const STATUT_DEVIS_COLORS: Record<string, string> = {
  brouillon: "bg-white/10 text-white/50",
  envoye: "bg-blue-500/20 text-blue-300",
  accepte: "bg-green-500/20 text-green-300",
  refuse: "bg-red-500/20 text-red-300",
  expire: "bg-orange-500/20 text-orange-300",
};
const STATUT_DEVIS_LABELS: Record<string, string> = {
  brouillon: "Brouillon",
  envoye: "Envoyé",
  accepte: "Accepté",
  refuse: "Refusé",
  expire: "Expiré",
};

const STATUT_FACTURE_COLORS: Record<string, string> = {
  en_attente: "bg-amber-500/20 text-amber-300",
  payee: "bg-green-500/20 text-green-300",
  en_retard: "bg-red-500/20 text-red-300",
  annulee: "bg-white/10 text-white/50",
};
const STATUT_FACTURE_LABELS: Record<string, string> = {
  en_attente: "En attente",
  payee: "Payée",
  en_retard: "En retard",
  annulee: "Annulée",
};

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [
    { data: client },
    { data: projets },
    { data: devis },
    { data: factures },
  ] = await Promise.all([
    supabase.from("clients").select("*").eq("id", id).single(),
    supabase
      .from("projets")
      .select("id, nom, statut, date_fin, description")
      .eq("client_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("devis")
      .select(
        "id, numero, titre, montant_ttc, statut, date_emission, date_validite",
      )
      .eq("client_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("factures")
      .select(
        "id, numero, montant, statut, date_emission, date_echeance, projets(nom)",
      )
      .in(
        "projet_id",
        (
          await supabase.from("projets").select("id").eq("client_id", id)
        ).data?.map((p) => p.id) ?? [],
      )
      .order("date_emission", { ascending: false }),
  ]);

  if (!client) notFound();

  const caTotal = (factures ?? [])
    .filter((f) => f.statut === "payee")
    .reduce((sum, f) => sum + Number(f.montant), 0);

  const caEnAttente = (factures ?? [])
    .filter((f) => f.statut === "en_attente" || f.statut === "en_retard")
    .reduce((sum, f) => sum + Number(f.montant), 0);

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-5xl mx-auto text-white">
      {/* Retour */}
      <Link
        href="/dashboard/clients"
        className="inline-flex items-center gap-2 text-white/50 hover:text-white text-sm mb-6 transition-colors"
      >
        <ArrowLeft size={15} />
        Retour aux clients
      </Link>

      {/* Header client */}
      <div className="card-glass rounded-2xl p-6 mb-6">
        <div className="flex items-start gap-5">
          <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-2xl font-bold shrink-0">
            {client.nom.charAt(0).toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="font-display text-2xl font-semibold">
              {client.nom}
            </h1>
            {client.entreprise && (
              <p className="text-white/60 text-sm mt-0.5">
                {client.entreprise}
              </p>
            )}

            <div className="flex flex-wrap gap-4 mt-4">
              {client.email && (
                <a
                  href={`mailto:${client.email}`}
                  className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors"
                >
                  <Mail size={14} />
                  {client.email}
                </a>
              )}
              {client.telephone && (
                <a
                  href={`tel:${client.telephone}`}
                  className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors"
                >
                  <Phone size={14} />
                  {client.telephone}
                </a>
              )}
              {client.entreprise && (
                <span className="flex items-center gap-2 text-sm text-white/70">
                  <Building2 size={14} />
                  {client.entreprise}
                </span>
              )}
              {client.adresse && (
                <span className="flex items-center gap-2 text-sm text-white/70">
                  <MapPin size={14} />
                  {client.adresse}
                </span>
              )}
            </div>
          </div>

          <p className="text-white/30 text-xs shrink-0">
            Client depuis le{" "}
            {new Date(client.created_at).toLocaleDateString("fr-FR")}
          </p>
        </div>
      </div>

      {/* Stats CA */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="card-glass rounded-2xl p-5">
          <div className="flex items-center gap-2 text-white/50 text-xs mb-2">
            <TrendingUp size={13} />
            CA encaissé
          </div>
          <p className="font-display text-2xl font-semibold tabular-nums">
            {caTotal.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €
          </p>
        </div>
        <div className="card-glass rounded-2xl p-5">
          <div className="flex items-center gap-2 text-white/50 text-xs mb-2">
            <Receipt size={13} />
            En attente de paiement
          </div>
          <p className="font-display text-2xl font-semibold tabular-nums text-amber-300">
            {caEnAttente.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}{" "}
            €
          </p>
        </div>
      </div>

      {/* Grid projets + devis + factures */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Projets */}
        <div className="card-glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <FolderKanban size={15} className="text-white/60" />
              Projets
              <span className="text-white/30 font-normal">
                ({projets?.length ?? 0})
              </span>
            </div>
            <Link
              href="/dashboard/projets"
              className="text-xs text-white/40 hover:text-white transition-colors"
            >
              Voir tout →
            </Link>
          </div>

          {!projets?.length ? (
            <p className="text-white/30 text-sm">Aucun projet.</p>
          ) : (
            <div className="space-y-2">
              {projets.map((p) => (
                <Link
                  key={p.id}
                  href={`/dashboard/projets/${p.id}`}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate group-hover:text-white/90">
                      {p.nom}
                    </p>
                    {p.date_fin && (
                      <p className="text-xs text-white/40 flex items-center gap-1 mt-0.5">
                        <Calendar size={10} />
                        {new Date(p.date_fin).toLocaleDateString("fr-FR")}
                      </p>
                    )}
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full shrink-0 font-medium ${STATUT_PROJET_COLORS[p.statut]}`}
                  >
                    {STATUT_PROJET_LABELS[p.statut]}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Devis */}
        <div className="card-glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <FileText size={15} className="text-white/60" />
              Devis
              <span className="text-white/30 font-normal">
                ({devis?.length ?? 0})
              </span>
            </div>
            <Link
              href="/dashboard/devis"
              className="text-xs text-white/40 hover:text-white transition-colors"
            >
              Voir tout →
            </Link>
          </div>

          {!devis?.length ? (
            <p className="text-white/30 text-sm">Aucun devis.</p>
          ) : (
            <div className="space-y-2">
              {devis.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{d.titre}</p>
                    <p className="text-xs text-white/40 font-mono mt-0.5">
                      {d.numero}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm tabular-nums font-medium">
                      {Number(d.montant_ttc).toLocaleString("fr-FR", {
                        minimumFractionDigits: 2,
                      })}{" "}
                      €
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUT_DEVIS_COLORS[d.statut]}`}
                    >
                      {STATUT_DEVIS_LABELS[d.statut]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Factures — pleine largeur */}
        <div className="card-glass rounded-2xl p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Receipt size={15} className="text-white/60" />
              Factures
              <span className="text-white/30 font-normal">
                ({factures?.length ?? 0})
              </span>
            </div>
            <Link
              href="/dashboard/factures"
              className="text-xs text-white/40 hover:text-white transition-colors"
            >
              Voir tout →
            </Link>
          </div>

          {!factures?.length ? (
            <p className="text-white/30 text-sm">Aucune facture.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-white/30 text-xs uppercase tracking-wide border-b border-white/10">
                  <th className="text-left pb-2 font-medium">Numéro</th>
                  <th className="text-left pb-2 font-medium hidden sm:table-cell">
                    Projet
                  </th>
                  <th className="text-right pb-2 font-medium">Montant</th>
                  <th className="text-left pb-2 font-medium pl-4">Statut</th>
                  <th className="text-right pb-2 font-medium hidden md:table-cell">
                    Échéance
                  </th>
                </tr>
              </thead>
              <tbody>
                {factures.map((f) => (
                  <tr
                    key={f.id}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="py-3 font-mono text-white/60 text-xs">
                      {f.numero}
                    </td>
                    <td className="py-3 text-white/70 hidden sm:table-cell">
                      {(f.projets as any)?.nom ?? "—"}
                    </td>
                    <td className="py-3 text-right tabular-nums font-medium">
                      {Number(f.montant).toLocaleString("fr-FR", {
                        minimumFractionDigits: 2,
                      })}{" "}
                      €
                    </td>
                    <td className="py-3 pl-4">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUT_FACTURE_COLORS[f.statut ?? "en_attente"]}`}
                      >
                        {STATUT_FACTURE_LABELS[f.statut ?? "en_attente"]}
                      </span>
                    </td>
                    <td className="py-3 text-right text-white/40 text-xs hidden md:table-cell">
                      {f.date_echeance
                        ? new Date(f.date_echeance).toLocaleDateString("fr-FR")
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
