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
} from "lucide-react";

const STATUT_CONFIG: Record<
  string,
  { label: string; color: string; icon: React.ReactNode }
> = {
  en_attente: {
    label: "En attente",
    color: "bg-white/10 text-white/60",
    icon: <Clock size={13} />,
  },
  en_retard: {
    label: "En retard",
    color: "bg-red-500/20 text-red-300",
    icon: <AlertCircle size={13} />,
  },
  payee: {
    label: "Payée",
    color: "bg-green-500/20 text-green-300",
    icon: <CheckCircle2 size={13} />,
  },
  annulee: {
    label: "Annulée",
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

export default function FacturePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [facture, setFacture] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("factures")
        .select("*, projets(nom), devis(numero, titre)")
        .eq("id", id)
        .single();
      setFacture(data);
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

  if (!facture) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-white/40">Facture introuvable.</p>
        <Link
          href="/dashboard/factures"
          className="text-sm text-white/60 hover:text-white underline"
        >
          Retour aux factures
        </Link>
      </div>
    );
  }

  const statutCfg = STATUT_CONFIG[facture.statut] ?? STATUT_CONFIG["en_attente"];

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
          <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center shrink-0">
            <FileText size={20} className="text-purple-300" strokeWidth={1.6} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-semibold">
                {facture.numero ?? `Facture`}
              </h1>
              <span
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs ${statutCfg.color}`}
              >
                {statutCfg.icon}
                {statutCfg.label}
              </span>
            </div>
            {facture.projets?.nom && (
              <Link
                href={`/dashboard/projets/${facture.projet_id}`}
                className="flex items-center gap-1.5 text-white/40 hover:text-white/70 text-sm transition-colors"
              >
                <FolderKanban size={13} />
                {facture.projets.nom}
              </Link>
            )}
          </div>
        </div>

        {/* Bouton PDF */}
        <Link
          href={`/print/factures/${id}`}
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
              Montant
            </h2>

            <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-6 text-center">
              <p className="text-xs text-purple-300/70 mb-2">Total</p>
              <p className="text-3xl font-semibold text-purple-200">
                {facture.montant != null
                  ? `${parseFloat(facture.montant).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €`
                  : "—"}
              </p>
            </div>
          </div>

          {/* Devis lié */}
          {facture.devis && (
            <div className="card-glass rounded-2xl p-5">
              <h2 className="text-xs uppercase tracking-widest text-white/40 mb-3">
                Devis associé
              </h2>
              <Link
                href={`/dashboard/devis/${facture.devis_id}`}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
                  <FileText size={14} className="text-amber-300" strokeWidth={1.8} />
                </div>
                <div>
                  <p className="text-sm font-medium group-hover:text-white transition-colors">
                    {facture.devis.numero}
                  </p>
                  {facture.devis.titre && (
                    <p className="text-xs text-white/40">{facture.devis.titre}</p>
                  )}
                </div>
                <ArrowLeft size={13} className="ml-auto rotate-180 text-white/30 group-hover:text-white/60 transition-colors" />
              </Link>
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
            value={facture.numero}
          />
          <InfoBlock
            icon={<Calendar size={14} />}
            label="Date d'émission"
            value={
              facture.date_emission
                ? new Date(facture.date_emission).toLocaleDateString("fr-FR")
                : null
            }
          />
          <InfoBlock
            icon={<Clock size={14} />}
            label="Date d'échéance"
            value={
              facture.date_echeance
                ? new Date(facture.date_echeance).toLocaleDateString("fr-FR")
                : null
            }
          />
          <InfoBlock
            icon={<Euro size={14} />}
            label="Montant"
            value={
              facture.montant != null
                ? `${parseFloat(facture.montant).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €`
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
