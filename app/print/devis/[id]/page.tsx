// app/print/devis/[id]/page.tsx
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import PrintToolbar from "@/components/PrintToolbar";

export const dynamic = "force-dynamic";

const STATUT_LABELS: Record<string, string> = {
  brouillon: "Brouillon",
  envoye: "Envoyé",
  accepte: "Accepté",
  refuse: "Refusé",
  expire: "Expiré",
};

export default async function DevisPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: devis } = await supabase
    .from("devis")
    .select(
      `id, numero, titre, description,
       montant_ht, taux_tva, montant_ttc,
       date_emission, date_validite, statut,
       clients!devis_client_id_fkey ( nom, email, telephone, entreprise, adresse ),
       projets ( nom )`
    )
    .eq("id", id)
    .single();

  if (!devis) notFound();

  const client = devis.clients as any;
  const projet = devis.projets as any;
  const tva = (devis.montant_ttc - devis.montant_ht).toFixed(2);

  const fmt = (n: number) =>
    n.toLocaleString("fr-FR", { minimumFractionDigits: 2 }) + " €";

  const fmtDate = (d?: string | null) =>
    d ? new Date(d).toLocaleDateString("fr-FR") : "—";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          font-family: 'DM Sans', sans-serif;
          background: #f4f4f0;
          color: #1a1a1a;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        .page {
          width: 210mm;
          min-height: 297mm;
          margin: 0 auto;
          background: #fff;
          padding: 14mm 16mm;
          position: relative;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 10mm;
          padding-bottom: 8mm;
          border-bottom: 2px solid #1a1a1a;
        }

        .logo-block img { height: 48px; width: auto; }
        .logo-block .company-name {
          font-size: 22px;
          font-weight: 600;
          letter-spacing: -0.5px;
          margin-top: 6px;
        }

        .doc-meta { text-align: right; }
        .doc-meta .doc-type {
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 2px;
          color: #666;
          margin-bottom: 4px;
        }
        .doc-meta .doc-number {
          font-size: 26px;
          font-weight: 600;
          letter-spacing: -0.5px;
        }
        .doc-meta .doc-status {
          display: inline-block;
          margin-top: 6px;
          padding: 3px 10px;
          border: 1.5px solid #1a1a1a;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .addresses {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8mm;
          margin-bottom: 8mm;
        }
        .address-block .label {
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          color: #888;
          margin-bottom: 5px;
        }
        .address-block .name {
          font-size: 15px;
          font-weight: 600;
          margin-bottom: 3px;
        }
        .address-block .detail {
          font-size: 13px;
          color: #444;
          line-height: 1.6;
        }

        .dates-row {
          display: flex;
          gap: 8mm;
          margin-bottom: 8mm;
          padding: 5mm 6mm;
          background: #f4f4f0;
          border-radius: 4px;
        }
        .date-item { flex: 1; }
        .date-item .label {
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          color: #888;
          margin-bottom: 3px;
        }
        .date-item .value {
          font-size: 14px;
          font-weight: 500;
        }

        .objet-block { margin-bottom: 8mm; }
        .objet-block .label {
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          color: #888;
          margin-bottom: 4px;
        }
        .objet-block .titre {
          font-size: 17px;
          font-weight: 600;
          margin-bottom: 4px;
        }
        .objet-block .description {
          font-size: 13px;
          color: #555;
          line-height: 1.6;
          white-space: pre-wrap;
        }

        .totals-section { margin-top: auto; padding-top: 6mm; }
        .totals-wrapper { margin-left: auto; width: 200px; }
        .totals-table { width: 100%; border-collapse: collapse; }
        .totals-table tr td {
          padding: 4px 0;
          font-size: 13px;
        }
        .totals-table tr td:first-child { color: #666; }
        .totals-table tr td:last-child {
          text-align: right;
          font-family: 'DM Mono', monospace;
          font-size: 13px;
        }
        .totals-table tr.total-ttc { border-top: 2px solid #1a1a1a; }
        .totals-table tr.total-ttc td {
          padding-top: 8px;
          font-size: 16px;
          font-weight: 600;
        }

        .footer {
          position: absolute;
          bottom: 10mm;
          left: 16mm;
          right: 16mm;
          border-top: 1px solid #e0e0e0;
          padding-top: 4mm;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 10px;
          color: #aaa;
          font-family: 'DM Mono', monospace;
        }

        .print-toolbar {
          position: fixed;
          top: 16px;
          right: 16px;
          display: flex;
          gap: 8px;
          z-index: 100;
        }
        .print-toolbar button {
          padding: 10px 20px;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 500;
        }
        .btn-print { background: #1a1a1a; color: #fff; }
        .btn-back { background: #fff; color: #1a1a1a; border: 1.5px solid #1a1a1a !important; }

        @media print {
          body { background: #fff; }
          .print-toolbar { display: none; }
          .page {
            width: 100%;
            min-height: 100vh;
            margin: 0;
            padding: 14mm 16mm;
            box-shadow: none;
          }
        }
      `}</style>

      <PrintToolbar />

      <div className="page">
        {/* Header */}
        <div className="header">
          <div className="logo-block">
            <Image
              src="/coderCatLogo.png"
              alt="CoderCat"
              width={140}
              height={48}
              style={{ height: 48, width: "auto", objectFit: "contain" }}
            />
          </div>
          <div className="doc-meta">
            <div className="doc-type">Devis</div>
            <div className="doc-number">{devis.numero}</div>
            <div className="doc-status">{STATUT_LABELS[devis.statut] ?? devis.statut}</div>
          </div>
        </div>

        {/* Addresses */}
        <div className="addresses">
          <div className="address-block">
            <div className="label">Émetteur</div>
            <div className="name">CoderCat</div>
            <div className="detail">contact@codercat.fr</div>
          </div>
          <div className="address-block">
            <div className="label">Client</div>
            <div className="name">{client?.nom ?? "—"}</div>
            <div className="detail">
              {client?.entreprise && <>{client.entreprise}<br /></>}
              {client?.email && <>{client.email}<br /></>}
              {client?.telephone && <>{client.telephone}<br /></>}
              {client?.adresse && <>{client.adresse}</>}
            </div>
          </div>
        </div>

        {/* Dates */}
        <div className="dates-row">
          <div className="date-item">
            <div className="label">Date d'émission</div>
            <div className="value">{fmtDate(devis.date_emission)}</div>
          </div>
          <div className="date-item">
            <div className="label">Valable jusqu'au</div>
            <div className="value">{fmtDate(devis.date_validite)}</div>
          </div>
          {projet && (
            <div className="date-item">
              <div className="label">Projet</div>
              <div className="value">{projet.nom}</div>
            </div>
          )}
        </div>

        {/* Objet */}
        <div className="objet-block">
          <div className="label">Objet</div>
          <div className="titre">{devis.titre}</div>
          {devis.description && (
            <div className="description">{devis.description}</div>
          )}
        </div>

        {/* Totals */}
        <div className="totals-section">
          <div className="totals-wrapper">
            <table className="totals-table">
              <tbody>
                <tr>
                  <td>Montant HT</td>
                  <td>{fmt(devis.montant_ht)}</td>
                </tr>
                <tr>
                  <td>TVA ({devis.taux_tva}%)</td>
                  <td>{tva} €</td>
                </tr>
                <tr className="total-ttc">
                  <td>Total TTC</td>
                  <td>{fmt(devis.montant_ttc)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="footer">
          <span>CoderCat — contact@codercat.fr</span>
          <span>Document généré le {new Date().toLocaleDateString("fr-FR")}</span>
        </div>
      </div>
    </>
  );
}
