"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Devis, Client, Projet, StatutDevis } from "@/types";
import Modal from "@/components/Modal";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";

const STATUT_LABELS: Record<StatutDevis, string> = {
  brouillon: "Brouillon",
  envoye: "Envoyé",
  accepte: "Accepté",
  refuse: "Refusé",
  expire: "Expiré",
};

const STATUT_COLORS: Record<StatutDevis, string> = {
  brouillon: "bg-white/10 text-white/60",
  envoye: "bg-blue-500/20 text-blue-300",
  accepte: "bg-green-500/20 text-green-300",
  refuse: "bg-red-500/20 text-red-300",
  expire: "bg-orange-500/20 text-orange-300",
};

const EMPTY = {
  client_id: "",
  projet_id: "",
  numero: "",
  titre: "",
  description: "",
  montant_ht: "",
  taux_tva: "20",
  date_validite: "",
  statut: "brouillon" as StatutDevis,
};

export default function DevisPage() {
  const supabase = createClient();

  const [devis, setDevis] = useState<Devis[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projets, setProjets] = useState<Projet[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [selected, setSelected] = useState<Devis | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: d, error: e }, { data: c }, { data: p }] = await Promise.all([
      supabase
        .from("devis")
        .select(
          `id, client_id, projet_id, numero, titre, description,
           montant_ht, taux_tva, montant_ttc, date_emission,
           date_validite, statut, created_at,
           clients!devis_client_id_fkey ( nom ), projets ( nom )`,
        )
        .order("created_at", { ascending: false }),
      supabase
        .from("clients")
        .select("id, nom, email, telephone, entreprise, adresse, created_at")
        .order("nom"),
      supabase.from("projets").select("id, nom, client_id, statut, created_at"),
    ]);
    console.log("devis list:", d, "error:", e);
    setDevis((d ?? []) as any);
    setClients(c ?? []);
    setProjets(p ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const projetsFiltered = projets.filter(
    (p) => !form.client_id || p.client_id === form.client_id,
  );

  function openCreate() {
    const num = `DEV-${new Date().getFullYear()}-${String(devis.length + 1).padStart(3, "0")}`;
    setForm({ ...EMPTY, numero: num });
    setSelected(null);
    setModal("create");
  }

  function openEdit(d: Devis) {
    setSelected(d);
    setForm({
      client_id: d.client_id,
      projet_id: d.projet_id ?? "",
      numero: d.numero,
      titre: d.titre,
      description: d.description ?? "",
      montant_ht: d.montant_ht.toString(),
      taux_tva: d.taux_tva.toString(),
      date_validite: d.date_validite ?? "",
      statut: d.statut,
    });
    setModal("edit");
  }

  async function handleSave() {
    if (!form.client_id || !form.titre || !form.montant_ht) return;
    setSaving(true);
    const ht = parseFloat(form.montant_ht);
    const tva = parseFloat(form.taux_tva || "0");
    const payload = {
      ...form,
      montant_ht: ht,
      taux_tva: tva,
      montant_ttc: parseFloat((ht * (1 + tva / 100)).toFixed(2)),
      projet_id: form.projet_id || null,
      date_validite: form.date_validite || null,
      date_emission: new Date().toISOString().split("T")[0],
    };
    if (modal === "create") {
      await supabase.from("devis").insert([payload]);
    } else if (selected) {
      await supabase.from("devis").update(payload).eq("id", selected.id);
    }
    setSaving(false);
    setModal(null);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer ce devis ?")) return;
    await supabase.from("devis").delete().eq("id", id);
    load();
  }

  const filtered = devis.filter((d) =>
    `${d.numero} ${d.titre} ${(d.clients as any)?.nom ?? ""}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  const ttc = form.montant_ht
    ? (
        parseFloat(form.montant_ht) *
        (1 + parseFloat(form.taux_tva || "0") / 100)
      ).toFixed(2)
    : "0.00";

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-6xl mx-auto text-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-semibold">Devis</h1>
          <p className="text-white/50 text-sm mt-0.5">{devis.length} devis</p>
        </div>
        <button
          onClick={openCreate}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={16} /> Nouveau devis
        </button>
      </div>

      {/* Search */}
      <div className="mb-5 relative">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
        />
        <input
          className="w-full bg-white/10 border border-white/20 rounded-xl py-2.5 pl-9 pr-4 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
          placeholder="Rechercher par numéro, titre ou client…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="card-glass rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-white/50">Chargement…</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-white/50">
            Aucun devis trouvé.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-white/50 text-xs uppercase tracking-wide">
                <th className="text-left px-5 py-3">Numéro</th>
                <th className="text-left px-5 py-3">Titre</th>
                <th className="text-left px-5 py-3">Client</th>
                <th className="text-right px-5 py-3">Montant TTC</th>
                <th className="text-left px-5 py-3">Statut</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr
                  key={d.id}
                  className="border-b border-white/5 transition-colors"
                >
                  <td className="px-5 py-3.5">
                    <Link
                      href={`/dashboard/devis/${d.id}`}
                      className="text-xl [text-shadow:0_0_5px_#39FF14] hover:opacity-70 transition-opacity"
                    >
                      {d.numero}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 font-medium">{d.titre}</td>
                  <td className="px-5 py-3.5 text-white/70">
                    {(d.clients as any)?.nom ?? "—"}
                  </td>
                  <td className="px-5 py-3.5 text-right tabular-nums">
                    {Number(d.montant_ttc).toLocaleString("fr-FR", {
                      minimumFractionDigits: 2,
                    })}{" "}
                    €
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUT_COLORS[d.statut]}`}
                    >
                      {STATUT_LABELS[d.statut]}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(d)}
                        className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(d.id)}
                        className="p-1.5 rounded-lg text-white/40 hover:text-red-300 hover:bg-red-500/10 transition-colors"
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

      {/* Modal */}
      {modal && (
        <Modal
          title={modal === "create" ? "Nouveau devis" : "Modifier le devis"}
          onClose={() => setModal(null)}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1">
                Numéro
              </label>
              <input
                className="input w-full"
                value={form.numero}
                onChange={(e) => setForm({ ...form, numero: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1">
                Client *
              </label>
              <select
                className="input w-full"
                value={form.client_id}
                onChange={(e) =>
                  setForm({ ...form, client_id: e.target.value, projet_id: "" })
                }
              >
                <option value="">Sélectionner un client…</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nom}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1">
                Projet <span className="text-ink-400">(optionnel)</span>
              </label>
              <select
                className="input w-full"
                value={form.projet_id}
                onChange={(e) =>
                  setForm({ ...form, projet_id: e.target.value })
                }
                disabled={!form.client_id}
              >
                <option value="">Aucun projet</option>
                {projetsFiltered.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nom}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1">
                Titre *
              </label>
              <input
                className="input w-full"
                placeholder="Objet du devis"
                value={form.titre}
                onChange={(e) => setForm({ ...form, titre: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1">
                Description
              </label>
              <textarea
                className="input w-full resize-none"
                rows={3}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">
                  Montant HT (€) *
                </label>
                <input
                  className="input w-full"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={form.montant_ht}
                  onChange={(e) =>
                    setForm({ ...form, montant_ht: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">
                  TVA (%)
                </label>
                <input
                  className="input w-full"
                  type="number"
                  min="0"
                  max="100"
                  value={form.taux_tva}
                  onChange={(e) =>
                    setForm({ ...form, taux_tva: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex items-center justify-between bg-ink-50 rounded-xl px-4 py-3 text-sm">
              <span className="text-ink-500">Total TTC</span>
              <span className="font-semibold text-ink-900 tabular-nums">
                {ttc} €
              </span>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1">
                Date de validité
              </label>
              <input
                className="input w-full"
                type="date"
                value={form.date_validite}
                onChange={(e) =>
                  setForm({ ...form, date_validite: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1">
                Statut
              </label>
              <select
                className="input w-full"
                value={form.statut}
                onChange={(e) =>
                  setForm({ ...form, statut: e.target.value as StatutDevis })
                }
              >
                {Object.entries(STATUT_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="btn-ghost"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={
                  saving || !form.client_id || !form.titre || !form.montant_ht
                }
                className="btn-primary"
              >
                {saving ? "Enregistrement…" : "Enregistrer"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
