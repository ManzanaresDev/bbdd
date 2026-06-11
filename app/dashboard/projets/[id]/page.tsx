import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  FileText,
  Receipt,
  TrendingUp,
  User,
  Clock,
  CheckCircle2,
  XCircle,
  PauseCircle,
} from "lucide-react";

const STATUT_PROJET_CONFIG: Record<
  string,
  { label: string; color: string; icon: React.ReactNode }
> = {
  en_cours: {
    label: "En cours",
    color: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    icon: <Clock size={13} />,
  },
  termine: {
    label: "Terminé",
    color: "bg-green-500/20 text-green-300 border-green-500/30",
    icon: <CheckCircle2 size={13} />,
  },
  en_attente: {
    label: "En attente",
    color: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    icon: <PauseCircle size={13} />,
  },
  annule: {
    label: "Annulé",
    color: "bg-red-500/20 text-red-300 border-red-500/30",
    icon: <XCircle size={13} />,
  },
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

export default async function ProjetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: projet }, { data: devis }, { data: factures }] =
    await Promise.all([
      supabase
        .from("projets")
        .select("*, clients(id, nom, email, entreprise)")
        .eq("id", id)
        .single(),
      supabase
        .from("devis")
        .select(
          "id, numero, titre, montant_ht, taux_tva, montant_ttc, statut, date_emission, date_validite"
        )
        .eq("projet_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("factures")
        .select("id, numero, montant, statut, date_emission, date_echeance")
        .eq("projet_id", id)
        .order("date_emission", { ascending: false }),
    ]);

  if (!projet) notFound();

  const statutConfig =
    STATUT_PROJET_CONFIG[projet.statut] ?? STATUT_PROJET_CONFIG.en_cours;

  const caEncaisse = (factures ?? [])
    .filter((f) => f.statut === "payee")
    .reduce((sum, f) => sum + Number(f.montant), 0);

  const caEnAttente = (factures ?? [])
    .filter((f) => f.statut === "en_attente" || f.statut === "en_retard")
    .reduce((sum, f) => sum + Number(f.montant), 0);

  const devisAccepte = (devis ?? []).find((d) => d.statut === "accepte");
  const dejaFacture = (factures ?? []).some(
    (f) => f.statut !== "annulee"
  );

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-5xl mx-auto text-white">
      {/* Retour */}
      <Link
        href="/dashboard/projets"
        className="inline-flex items-center gap-2 text-white/50 hover:text-white text-sm mb-6 transition-colors"
      >
        <ArrowLeft size={15} />
        Retour aux projets
      </Link>

      {/* Header projet */}
      <div className="card-glass rounded-2xl p-6 mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <h1 className="font-display text-2xl font-semibold">
                {projet.nom}
              </h1>
              <span
                className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium border ${statutConfig.color}`}
              >
                {statutConfig.icon}
                {statutConfig.label}
              </span>
            </div>

            {projet.description && (
              <p className="text-white/60 text-sm leading-relaxed mt-2 max-w-2xl">
                {projet.description}
              </p>
            )}

            <div className="flex flex-wrap gap-5 mt-4">
              {(projet.clients as any) && (
                <Link
                  href={`/dashboard/clients/${(projet.clients as any).id}`}
                  className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
                >
                  <User size={14} />
                  {(projet.clients as any).nom}
                  {(projet.clients as any).entreprise &&
                    ` — ${(projet.clients as any).entreprise}`}
                </Link>
              )}
              {projet.date_debut && (
                <span className="flex items-center gap-2 text-sm text-white/60">
                  <Calendar size={14} />
                  Début :{" "}
                  {new Date(projet.date_debut).toLocaleDateString("fr-FR")}
                </span>
              )}
              {projet.date_fin && (
                <span className="flex items-center gap-2 text-sm text-white/60">
                  <Calendar size={14} />
                  Livraison :{" "}
                  {new Date(projet.date_fin).toLocaleDateString("fr-FR")}
                </span>
              )}
            </div>
          </div>

          {/* Bouton conversion devis → facture */}
          {devisAccepte && !dejaFacture && (
            <Link
              href={`/dashboard/factures?from_devis=${devisAccepte.id}&projet_id=${id}`}
              className="btn-primary shrink-0 flex items-center gap-2 text-sm"
            >
              <Receipt size={15} />
              Créer une facture
            </Link>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="card-glass rounded-2xl p-4">
          <p className="text-white/40 text-xs mb-1">Devis</p>
          <p className="font-display text-2xl font-semibold">
            {devis?.length ?? 0}
          </p>
        </div>
        <div className="card-glass rounded-2xl p-4">
          <p className="text-white/40 text-xs mb-1">Factures</p>
          <p className="font-display text-2xl font-semibold">
            {factures?.length ?? 0}
          </p>
        </div>
        <div className="card-glass rounded-2xl p-4">
          <p className="text-white/40 text-xs mb-1 flex items-center gap-1">
            <TrendingUp size={11} /> CA encaissé
          </p>
          <p className="font-display text-xl font-semibold tabular-nums">
            {caEncaisse.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €
          </p>
        </div>
        <div className="card-glass rounded-2xl p-4">
          <p className="text-white/40 text-xs mb-1">En attente</p>
          <p className="font-display text-xl font-semibold tabular-nums text-amber-300">
            {caEnAttente.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €
          </p>
        </div>
      </div>

      {/* Devis */}
      <div className="card-glass rounded-2xl p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <FileText size={15} className="text-white/60" />
            Devis
            <span className="text-white/30 font-normal">
              ({devis?.length ?? 0})
            </span>
          </div>
          <Link
            href={`/dashboard/devis`}
            className="text-xs text-white/40 hover:text-white transition-colors"
          >
            Voir tout →
          </Link>
        </div>

        {!devis?.length ? (
          <p className="text-white/30 text-sm">Aucun devis pour ce projet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-white/30 text-xs uppercase tracking-wide border-b border-white/10">
                <th className="text-left pb-2 font-medium">Numéro</th>
                <th className="text-left pb-2 font-medium hidden sm:table-cell">
                  Titre
                </th>
                <th className="text-right pb-2 font-medium">Montant TTC</th>
                <th className="text-left pb-2 font-medium pl-4">Statut</th>
                <th className="text-right pb-2 font-medium hidden md:table-cell">
                  Validité
                </th>
              </tr>
            </thead>
            <tbody>
              {devis.map((d) => (
                <tr
                  key={d.id}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  <td className="py-3 font-mono text-white/60 text-xs">
                    {d.numero}
                  </td>
                  <td className="py-3 text-white/80 hidden sm:table-cell">
                    {d.titre}
                  </td>
                  <td className="py-3 text-right tabular-nums font-medium">
                    {Number(d.montant_ttc).toLocaleString("fr-FR", {
                      minimumFractionDigits: 2,
                    })}{" "}
                    €
                  </td>
                  <td className="py-3 pl-4">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUT_DEVIS_COLORS[d.statut]}`}
                    >
                      {STATUT_DEVIS_LABELS[d.statut]}
                    </span>
                  </td>
                  <td className="py-3 text-right text-white/40 text-xs hidden md:table-cell">
                    {d.date_validite
                      ? new Date(d.date_validite).toLocaleDateString("fr-FR")
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Factures */}
      <div className="card-glass rounded-2xl p-5">
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
          <p className="text-white/30 text-sm">Aucune facture pour ce projet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-white/30 text-xs uppercase tracking-wide border-b border-white/10">
                <th className="text-left pb-2 font-medium">Numéro</th>
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
  );
}
