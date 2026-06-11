"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowLeft,
  FileText,
  Calendar,
  Hash,
  Euro,
  Percent,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FolderKanban,
  FileDown,
  CalendarCheck,
} from "lucide-react";

const STATUT_CONFIG: Record<
  string,
  { label: string; color: string; icon: React.ReactNode }
> = {
  brouillon: {
    label: "Brouillon",
    color: "bg-white/10 text-white/60",
    icon: <Clock size={13} />,
  },
  envoye: {
    label: "Envoyé",
    color: "bg-blue-500/20 text-blue-300",
    icon: <AlertCircle size={13} />,
  },
  accepte: {
    label: "Accepté",
    color: "bg-green-500/20 text-green-300",
    icon: <CheckCircle2 size={13} />,
  },
  refuse: {
    label: "Refusé",
    color: "bg-red-500/20 text-red-300",
    icon: <XCircle size={13} />,
  },
  expire: {
    label: "Expiré",
    color: "bg-white/5 text-white/50",
    icon: <XCircle size={13} />,
  },
};

function InfoBlock({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-3.5 border-b border-white/8 last:border-0">
      <div className="mt-0.5 text-white/30">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-white/40 mb-0.5">{label}</p>
        <p className="text-sm text-white truncate">{value || "—"}</p>
      </div>
    </div>
  );
}

export default function DevisDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [devis, setDevis] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("devis")
        .select("*, projets(nom), clients!devis_client_id_fkey(nom)")
        .eq("id", id)
        .single();
      console.log("devis data:", data);
      console.log("devis error:", error);
      setDevis(data);
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-white/30 text-sm animate-pulse">Chargement…</div>
      </div>
    );
  }

  if (!devis) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-white/40">Devis introuvable.</p>
        <Link
          href="/dashboard/devis"
          className="text-sm text-white/60 hover:text-white underline"
        >
          Retour aux devis
        </Link>
      </div>
    );
  }

  const statutCfg = STATUT_CONFIG[devis.statut] ?? STATUT_CONFIG["brouillon"];

  const tva = devis.taux_tva != null ? parseFloat(devis.taux_tva) : null;
  const montantHt =
    devis.montant_ht != null ? parseFloat(devis.montant_ht) : null;
  const montantTtc =
    devis.montant_ttc != null ? parseFloat(devis.montant_ttc) : null;

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-4xl mx-auto text-white">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-white/40 hover:text-white text-sm mb-6 transition-colors"
      >
        <ArrowLeft size={15} /> Retour
      </button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
            <FileText size={20} className="text-amber-300" strokeWidth={1.6} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-semibold">
                {devis.numero ?? `Devis`}
              </h1>
              <span
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs ${statutCfg.color}`}
              >
                {statutCfg.icon}
                {statutCfg.label}
              </span>
            </div>
            {devis.titre && (
              <p className="text-sm text-white/50">{devis.titre}</p>
            )}
            {devis.projets?.nom && (
              <Link
                href={`/dashboard/projets/${devis.projet_id}`}
                className="flex items-center gap-1.5 text-white/40 hover:text-white/70 text-sm transition-colors mt-0.5"
              >
                <FolderKanban size={13} />
                {devis.projets.nom}
              </Link>
            )}
          </div>
        </div>

        {/* Bouton PDF */}
        <Link
          href={`/print/devis/${id}`}
          target="_blank"
          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/20 text-white/60 hover:text-white hover:border-white/40 text-sm transition-colors shrink-0 self-start"
          title="Télécharger le PDF"
        >
          <FileDown size={15} />
          <span className="hidden sm:inline">PDF</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Montants */}
        <div className="lg:col-span-2 space-y-5">
          {/* Récap financier */}
          <div className="card-glass rounded-2xl p-5">
            <h2 className="text-xs uppercase tracking-widest text-white/40 mb-4">
              Montants
            </h2>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-6 text-center mb-4">
              <p className="text-xs text-amber-300/70 mb-2">Total TTC</p>
              <p className="text-3xl font-semibold text-amber-200">
                {montantTtc != null
                  ? `${montantTtc.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €`
                  : "—"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/5 rounded-xl p-4 text-center">
                <p className="text-xs text-white/40 mb-1.5">Montant HT</p>
                <p className="text-lg font-medium text-white/80">
                  {montantHt != null
                    ? `${montantHt.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €`
                    : "—"}
                </p>
              </div>
              <div className="bg-white/5 rounded-xl p-4 text-center">
                <p className="text-xs text-white/40 mb-1.5">Taux TVA</p>
                <p className="text-lg font-medium text-white/80">
                  {tva != null ? `${tva} %` : "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Description */}
          {devis.description && (
            <div className="card-glass rounded-2xl p-5">
              <h2 className="text-xs uppercase tracking-widest text-white/40 mb-3">
                Description
              </h2>
              <p className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap">
                {devis.description}
              </p>
            </div>
          )}
        </div>

        {/* Infos */}
        <div className="card-glass rounded-2xl p-5">
          <h2 className="text-xs uppercase tracking-widest text-white/40 mb-2">
            Informations
          </h2>

          <InfoBlock
            icon={<Hash size={14} />}
            label="Numéro"
            value={devis.numero}
          />
          {devis.client_id && (
            <InfoBlock
              icon={<Hash size={14} />}
              label="Client"
              value={
                <Link
                  href={`/dashboard/clients/${devis.client_id}`}
                  className="hover:text-white/70 transition-colors"
                >
                  {devis.clients?.nom ?? "Voir le client"}
                </Link>
              }
            />
          )}
          <InfoBlock
            icon={<Calendar size={14} />}
            label="Date d'émission"
            value={
              devis.date_emission
                ? new Date(devis.date_emission).toLocaleDateString("fr-FR")
                : null
            }
          />
          <InfoBlock
            icon={<CalendarCheck size={14} />}
            label="Date de validité"
            value={
              devis.date_validite
                ? new Date(devis.date_validite).toLocaleDateString("fr-FR")
                : null
            }
          />
          <InfoBlock
            icon={<Euro size={14} />}
            label="Montant TTC"
            value={
              montantTtc != null
                ? `${montantTtc.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €`
                : null
            }
          />
          <InfoBlock
            icon={<Percent size={14} />}
            label="Statut"
            value={
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${statutCfg.color}`}
              >
                {statutCfg.icon}
                {statutCfg.label}
              </span>
            }
          />
        </div>
      </div>
    </div>
  );
}
