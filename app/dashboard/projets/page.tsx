"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Modal from "@/components/Modal";
import { Plus, Search, Pencil, Trash2, FolderKanban } from "lucide-react";

const EMPTY = {
  nom: "",
  statut: "en_cours",
  date_fin: "",
  description: "",
  client_id: "",
};

const STATUT_LABELS = {
  en_cours: "En cours",
  termine: "Terminé",
  en_attente: "En attente",
  annule: "Annulé",
};

const STATUT_COLORS = {
  en_cours: "bg-white/10 text-white/70",
  termine: "bg-green-500/20 text-green-300",
  en_attente: "bg-blue-500/20 text-blue-300",
  annule: "bg-red-500/20 text-red-300",
};

export default function ProjetsPage() {
  const supabase = createClient();

  const [projets, setProjets] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [selected, setSelected] = useState<any>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);

    const [{ data: p }, { data: c }] = await Promise.all([
      supabase
        .from("projets")
        .select("*, clients(nom)")
        .order("created_at", { ascending: false }),
      supabase.from("clients").select("id, nom"),
    ]);

    setProjets(p ?? []);
    setClients(c ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setForm(EMPTY);
    setSelected(null);
    setModal("create");
  }

  function openEdit(p: any) {
    setSelected(p);
    setForm({
      nom: p.nom,
      statut: p.statut,
      date_fin: p.date_fin ?? "",
      description: p.description ?? "",
      client_id: p.client_id ?? "",
    });
    setModal("edit");
  }

  async function handleSave() {
    setSaving(true);

    const payload = {
      ...form,
      date_fin: form.date_fin || null,
      description: form.description || null,
      client_id: form.client_id || null,
    };

    if (modal === "create") {
      await supabase.from("projets").insert([payload]);
    } else if (selected) {
      await supabase.from("projets").update(payload).eq("id", selected.id);
    }

    setSaving(false);
    setModal(null);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer ce projet ?")) return;
    await supabase.from("projets").delete().eq("id", id);
    load();
  }

  const filtered = projets.filter((p) =>
    `${p.nom} ${(p.clients as any)?.nom ?? ""}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-6xl mx-auto text-white">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold">Projets</h1>
          <p className="text-white/50 text-sm">{projets.length} projets</p>
        </div>

        <button
          onClick={openCreate}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={16} /> Nouveau projet
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
                <th className="px-5 py-3">Projet</th>
                <th className="px-5 py-3 hidden md:table-cell">Client</th>
                <th className="px-5 py-3">Statut</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((projet) => (
                <tr key={projet.id} className="table-row">
                  <td className="px-5 py-3.5">
                    <Link
                      href={`/dashboard/projets/${projet.id}`}
                      className="flex items-center gap-3 group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                        <FolderKanban
                          size={14}
                          className="text-amber-600"
                          strokeWidth={1.8}
                        />
                      </div>

                      <span className="text-xl [text-shadow:0_0_5px_#39FF14]">
                        {projet.nom}
                      </span>
                    </Link>
                  </td>

                  <td className="px-5 py-3 text-white/60 hidden md:table-cell">
                    {(projet.clients as any)?.nom || "—"}
                  </td>

                  <td className="px-5 py-3">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        STATUT_COLORS[
                          projet.statut as keyof typeof STATUT_COLORS
                        ]
                      }`}
                    >
                      {
                        STATUT_LABELS[
                          projet.statut as keyof typeof STATUT_LABELS
                        ]
                      }
                    </span>
                  </td>

                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => openEdit(projet)}
                        className="text-white/50 hover:text-white"
                      >
                        <Pencil size={14} />
                      </button>

                      <button
                        onClick={() => handleDelete(projet.id)}
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

      {modal && (
        <Modal
          title={modal === "create" ? "Nouveau projet" : "Modifier projet"}
          onClose={() => setModal(null)}
        >
          <div className="space-y-4">
            <input
              className="input"
              placeholder="Nom"
              value={form.nom}
              onChange={(e) => setForm({ ...form, nom: e.target.value })}
            />

            <textarea
              className="input"
              placeholder="Description"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />

            <input
              className="input"
              type="date"
              value={form.date_fin}
              onChange={(e) => setForm({ ...form, date_fin: e.target.value })}
            />

            <div className="flex gap-3">
              <button
                className="btn-secondary flex-1"
                onClick={() => setModal(null)}
              >
                Annuler
              </button>
              <button className="btn-primary flex-1" onClick={handleSave}>
                {saving ? "..." : "Enregistrer"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
