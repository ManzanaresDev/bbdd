// app/print/factures/[id]/page.tsx
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import PrintToolbar from "@/components/PrintToolbar";

export const dynamic = "force-dynamic";

const STATUT_LABELS: Record<string, string> = {
  en_attente: "En attente",
  payee: "Payée",
  en_retard: "En retard",
  annulee: "Annulée",
};

export default async function FacturePrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: facture } = await supabase
    .from("factures")
    .select(
      `id, numero, montant, date_emission, date_echeance, statut,
       projets ( nom, client_id, clients!projets_client_id_fkey ( nom, email, telephone, entreprise, adresse ) ),
       devis ( numero, titre, montant_ht, taux_tva, montant_ttc, clients!devis_client_id_fkey ( nom, email, telephone, entreprise, adresse ) )`
    )
    .eq("id", id)
    .single();

  if (!facture) notFound();

  const projet = facture.projets as any;
  const devisLie = (facture as any).devis as any;
  const client = devisLie?.clients ?? projet?.clients ?? null;

  const fmt = (n: number) =>
    n.toLocaleString("fr-FR", { minimumFractionDigits: 2 }) + " €";

  const fmtDate = (d?: string | null) =>
    d ? new Date(d).toLocaleDateString("fr-FR") : "—";

  const tva = devisLie
    ? (devisLie.montant_ttc - devisLie.montant_ht).toFixed(2)
    : null;

  const isLate =
    facture.statut === "en_retard" ||
    (facture.statut === "en_attente" &&
      facture.date_echeance &&
      new Date(facture.date_echeance) < new Date());

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
        .doc-meta .doc-status.late {
          border-color: #c0392b;
          color: #c0392b;
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
        .date-item .value.late { color: #c0392b; font-weight: 600; }

        .ref-block {
          margin-bottom: 8mm;
          padding: 4mm 6mm;
          border: 1px solid #e0e0e0;
          border-radius: 4px;
          display: flex;
          align-items: center;
          gap: 6mm;
        }
        .ref-block .ref-label {
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          color: #888;
        }
        .ref-block .ref-value {
          font-size: 14px;
          font-weight: 500;
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

        .late-notice {
          margin-top: 6mm;
          padding: 3mm 5mm;
          background: #fdf3f2;
          border-left: 3px solid #c0392b;
          font-size: 12px;
          color: #c0392b;
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
            <div className="doc-type">Facture</div>
            <div className="doc-number">{facture.numero}</div>
            <div className={`doc-status${isLate ? " late" : ""}`}>
              {STATUT_LABELS[facture.statut] ?? facture.statut}
            </div>
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
            <div className="value">{fmtDate(facture.date_emission)}</div>
          </div>
          <div className="date-item">
            <div className="label">Date d'échéance</div>
            <div className={`value${isLate ? " late" : ""}`}>
              {fmtDate(facture.date_echeance)}
              {isLate && " ⚠"}
            </div>
          </div>
          {projet && (
            <div className="date-item">
              <div className="label">Projet</div>
              <div className="value">{projet.nom}</div>
            </div>
          )}
        </div>

        {/* Devis lié */}
        {devisLie && (
          <div className="ref-block">
            <div>
              <div className="ref-label">Référence devis</div>
              <div className="ref-value">{devisLie.numero}</div>
            </div>
          </div>
        )}

        {/* Totals */}
        <div className="totals-section">
          <div className="totals-wrapper">
            <table className="totals-table">
              <tbody>
                {devisLie ? (
                  <>
                    <tr>
                      <td>Montant HT</td>
                      <td>{fmt(devisLie.montant_ht)}</td>
                    </tr>
                    <tr>
                      <td>TVA ({devisLie.taux_tva}%)</td>
                      <td>{tva} €</td>
                    </tr>
                    <tr className="total-ttc">
                      <td>Total TTC</td>
                      <td>{fmt(devisLie.montant_ttc)}</td>
                    </tr>
                  </>
                ) : (
                  <tr className="total-ttc">
                    <td>Montant</td>
                    <td>{fmt(facture.montant)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {isLate && (
            <div className="late-notice">
              Cette facture est en retard de paiement. Merci de régulariser rapidement.
            </div>
          )}
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
