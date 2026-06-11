"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Client } from "@/types";
import Modal from "@/components/Modal";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  User,
  Building2,
  Phone,
  Mail,
} from "lucide-react";

const EMPTY: Omit<Client, "id" | "created_at"> = {
  nom: "",
  email: "",
  telephone: "",
  entreprise: "",
  adresse: "",
};

export default function ClientsPage() {
  const supabase = createClient();

  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [selected, setSelected] = useState<Client | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("clients")
      .select("*")
      .order("created_at", { ascending: false });

    setClients(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setForm(EMPTY);
    setModal("create");
  }

  function openEdit(client: Client) {
    setSelected(client);
    setForm({
      nom: client.nom,
      email: client.email,
      telephone: client.telephone ?? "",
      entreprise: client.entreprise ?? "",
      adresse: client.adresse ?? "",
    });
    setModal("edit");
  }

  async function handleSave() {
    setSaving(true);

    if (modal === "create") {
      await supabase.from("clients").insert([form]);
    } else if (selected) {
      await supabase.from("clients").update(form).eq("id", selected.id);
    }

    setSaving(false);
    setModal(null);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer ce client ?")) return;
    await supabase.from("clients").delete().eq("id", id);
    load();
  }

  const filtered = clients.filter((c) =>
    `${c.nom} ${c.email} ${c.entreprise}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-6xl mx-auto text-white">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-semibold">Clients</h1>
          <p className="text-white/50 text-sm">
            {clients.length} client{clients.length !== 1 ? "s" : ""}
          </p>
        </div>

        <button
          onClick={openCreate}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={16} /> Nouveau client
        </button>
      </div>

      {/* SEARCH */}
      <div className="relative mb-5">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
          size={15}
        />
        <input
          className="w-full bg-white/10 border border-white/20 rounded-xl py-2.5 pl-9 pr-4 text-sm text-white"
          placeholder="Rechercher..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* TABLE */}
      <div className="card-glass rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-white/50">Chargement...</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-white/50">
            <User className="mx-auto mb-3" />
            Aucun client
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-white/50 text-xs uppercase">
                <th className="text-left px-5 py-3">Nom</th>
                <th className="text-left px-5 py-3 hidden md:table-cell">
                  Email
                </th>
                <th className="text-left px-5 py-3 hidden lg:table-cell">
                  Entreprise
                </th>
                <th className="text-left px-5 py-3 hidden lg:table-cell">
                  Téléphone
                </th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((client) => (
                <tr key={client.id} className="table-row">
                  <td className="px-5 py-3.5">
                    <Link
                      href={`/dashboard/clients/${client.id}`}
                      className="flex items-center gap-3 group"
                    >
                      <div className="w-8 h-8 rounded-full bg-ink-100 flex items-center justify-center text-ink-600 text-xs font-medium shrink-0">
                        {client.nom.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xl [text-shadow:0_0_5px_#39FF14] group-hover:underline">
                        {client.nom}
                      </span>
                    </Link>
                  </td>

                  <td className="px-5 py-3 text-white/60 hidden md:table-cell">
                    {client.email}
                  </td>

                  <td className="px-5 py-3 text-white/60 hidden lg:table-cell">
                    {client.entreprise || "—"}
                  </td>

                  <td className="px-5 py-3 text-white/60 hidden lg:table-cell">
                    {client.telephone || "—"}
                  </td>

                  <td className="px-5 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEdit(client)}
                        className="text-white/50 hover:text-white"
                      >
                        <Pencil size={14} />
                      </button>

                      <button
                        onClick={() => handleDelete(client.id)}
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

      {/* MODAL */}
      {modal && (
        <Modal
          title={modal === "create" ? "Nouveau client" : "Modifier client"}
          onClose={() => setModal(null)}
        >
          <div className="space-y-4">
            <input
              className="input"
              placeholder="Nom"
              value={form.nom}
              onChange={(e) => setForm({ ...form, nom: e.target.value })}
            />

            <input
              className="input"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />

            <input
              className="input"
              placeholder="Téléphone"
              value={form.telephone}
              onChange={(e) => setForm({ ...form, telephone: e.target.value })}
            />

            <input
              className="input"
              placeholder="Entreprise"
              value={form.entreprise}
              onChange={(e) => setForm({ ...form, entreprise: e.target.value })}
            />

            <textarea
              className="input"
              placeholder="Adresse"
              value={form.adresse}
              onChange={(e) => setForm({ ...form, adresse: e.target.value })}
            />

            <div className="flex gap-3">
              <button
                className="btn-secondary flex-1"
                onClick={() => setModal(null)}
              >
                Annuler
              </button>
              <button
                className="btn-primary flex-1"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "..." : "Enregistrer"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
