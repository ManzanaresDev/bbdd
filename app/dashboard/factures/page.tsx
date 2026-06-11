"use client";

import { useState, useEffect, useCallback } from "react";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Facture, Projet, Devis, StatutFacture } from "@/types";
import Modal from "@/components/Modal";
import { Plus, Search, Pencil, Trash2, Receipt } from "lucide-react";

const STATUT_LABELS: Record<StatutFacture, string> = {
  en_attente: "En attente",
  payee: "Payée",
  en_retard: "En retard",
  annulee: "Annulée",
};

const STATUT_COLORS: Record<StatutFacture, string> = {
  en_attente: "bg-white/10 text-white/70",
  payee: "bg-green-500/20 text-green-300",
  en_retard: "bg-red-500/20 text-red-300",
  annulee: "bg-white/5 text-white/50",
};

const EMPTY = {
  projet_id: "",
  devis_id: "",
  numero: "",
  montant: "",
  date_emission: new Date().toISOString().split("T")[0],
  date_echeance: "",
  statut: "en_attente" as StatutFacture,
};

function FacturesPageInner() {
  const supabase = createClient();

  const [factures, setFactures] = useState<Facture[]>([]);
  const [projets, setProjets] = useState<Projet[]>([]);
  const [devisList, setDevisList] = useState<Devis[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [selected, setSelected] = useState<Facture | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const searchParams = useSearchParams();

  const load = useCallback(async () => {
    setLoading(true);

    const [{ data: f }, { data: p }, { data: d }] = await Promise.all([
      supabase
        .from("factures")
        .select("*, projets(nom, clients(nom))")
        .order("date_emission", { ascending: false }),
      supabase.from("projets").select("id, nom"),
      supabase
        .from("devis")
        .select("id, numero, titre, projet_id")
        .eq("statut", "accepte"),
    ]);

    setFactures(f ?? []);
    setProjets((p as Projet[]) ?? []);
    setDevisList((d as Devis[]) ?? []);
    setLoading(false);
    return f;
  }, []);

  useEffect(() => {
    load().then((loadedFactures) => {
      const fromDevisId = searchParams.get("from_devis");
      const projetId = searchParams.get("projet_id");

      if (fromDevisId && projetId) {
        const num = `FAC-${new Date().getFullYear()}-${String((loadedFactures ?? []).length + 1).padStart(3, "0")}`;
        setForm({
          ...EMPTY,
          numero: num,
          projet_id: projetId,
          devis_id: fromDevisId,
        });
        setModal("create");
      }
    });
  }, [load, searchParams]);

  function openCreate() {
    const num = `FAC-${new Date().getFullYear()}-${String(factures.length + 1).padStart(3, "0")}`;
    setForm({ ...EMPTY, numero: num });
    setSelected(null);
    setModal("create");
  }

  function openEdit(f: Facture) {
    setSelected(f);
    setForm({
      projet_id: f.projet_id,
      devis_id: f.devis_id ?? "",
      numero: f.numero,
      montant: f.montant.toString(),
      date_emission: f.date_emission,
      date_echeance: f.date_echeance ?? "",
      statut: f.statut,
    });
    setModal("edit");
  }

  async function handleSave() {
    setSaving(true);

    const payload = {
      ...form,
      montant: parseFloat(form.montant),
      devis_id: form.devis_id || null,
      date_echeance: form.date_echeance || null,
    };

    if (modal === "create") {
      await supabase.from("factures").insert([payload]);
    } else if (selected) {
      await supabase.from("factures").update(payload).eq("id", selected.id);
    }

    setSaving(false);
    setModal(null);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cette facture ?")) return;
    await supabase.from("factures").delete().eq("id", id);
    load();
  }

  const filtered = factures.filter((f) =>
    `${f.numero} ${(f.projets as any)?.nom} ${(f.projets as any)?.clients?.nom}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-6xl mx-auto text-white">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold">Factures</h1>
          <p className="text-white/50 text-sm">{factures.length} factures</p>
        </div>

        <button
          onClick={openCreate}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={16} /> Nouvelle facture
        </button>
      </div>

      <div className="relative mb-5">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
          size={15}
        />
        <input
          className="w-full bg-white/10 border border-white/20 rounded-xl py-2.5 pl-9 text-white"
          placeholder="Rechercher..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="card-glass rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-white/50">Chargement...</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-white/50 text-xs uppercase">
                <th className="px-5 py-3 text-left">Numéro</th>
                <th className="px-5 py-3 hidden md:table-cell">Projet</th>
                <th className="px-5 py-3 hidden lg:table-cell">Montant</th>
                <th className="px-5 py-3 hidden lg:table-cell">Statut</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((f) => (
                <tr key={f.id} className="border-b border-white/5">
                  <td className="px-5 py-3">
                    <Link
                      href={`/dashboard/factures/${f.id}`}
                      className="text-xl [text-shadow:0_0_5px_#39FF14] hover:opacity-70 transition-opacity"
                    >
                      {f.numero}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-white/60 hidden md:table-cell">
                    {(f.projets as any)?.nom || "—"}
                  </td>
                  <td className="px-5 py-3 text-white/60 hidden lg:table-cell">
                    {f.montant.toLocaleString("fr-FR")} €
                  </td>
                  <td className="px-5 py-3 hidden lg:table-cell">
                    <span
                      className={`px-2 py-1 rounded text-xs ${STATUT_COLORS[f.statut]}`}
                    >
                      {STATUT_LABELS[f.statut]}
                    </span>
                  </td>

                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => openEdit(f)}
                        className="text-white/50 hover:text-white"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(f.id)}
                        className="text-white/50 hover:text-red-400"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
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

export default function FacturesPage() {
  return (
    <Suspense>
      <FacturesPageInner />
    </Suspense>
  );
}
