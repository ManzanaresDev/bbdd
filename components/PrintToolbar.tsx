"use client";

// components/PrintToolbar.tsx

export default function PrintToolbar() {
  return (
    <div className="print-toolbar">
      <button className="btn-back" onClick={() => history.back()}>
        ← Retour
      </button>
      <button className="btn-print" onClick={() => window.print()}>
        ⬇ Télécharger PDF
      </button>
    </div>
  );
}
