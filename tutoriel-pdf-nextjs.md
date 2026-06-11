# Tutoriel — Génération PDF pour Devis & Factures
### Stack : Next.js App Router · Supabase · @react-pdf/renderer

---

## Vue d'ensemble

```
Bouton "Télécharger PDF" (UI)
        ↓
GET /api/pdf/devis/[id]   ou   GET /api/pdf/facture/[id]
        ↓
Route API Next.js — fetch Supabase + génère le PDF
        ↓
Réponse : fichier .pdf téléchargé dans le navigateur
```

---

## Étape 1 — Installation

```bash
npm install @react-pdf/renderer
npm install -D @types/react-pdf
```

---

## Étape 2 — Structure des fichiers à créer

```
app/
├── api/
│   └── pdf/
│       ├── devis/
│       │   └── [id]/
│       │       └── route.ts
│       └── facture/
│           └── [id]/
│               └── route.ts
├── components/
│   └── pdf/
│       ├── DevisDocument.tsx      ← template PDF devis
│       └── FactureDocument.tsx    ← template PDF facture
```

---

## Étape 3 — Template PDF pour un Devis

Créer `app/components/pdf/DevisDocument.tsx` :

```tsx
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 48,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#1a1a2e",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 40,
  },
  company: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: "#2563c4",
  },
  title: {
    fontSize: 24,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  numero: {
    fontSize: 11,
    color: "#6b7280",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  tableHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    backgroundColor: "#f9fafb",
    paddingHorizontal: 8,
    marginBottom: 2,
  },
  tableHeaderText: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    color: "#374151",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  totalBlock: {
    marginTop: 16,
    alignSelf: "flex-end",
    width: 220,
  },
  totalFinal: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: "#2563c4",
    marginTop: 4,
  },
  totalFinalText: {
    fontFamily: "Helvetica-Bold",
    fontSize: 12,
    color: "#ffffff",
  },
  footer: {
    position: "absolute",
    bottom: 32,
    left: 48,
    right: 48,
    textAlign: "center",
    fontSize: 8,
    color: "#9ca3af",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 8,
  },
  badge: {
    backgroundColor: "#dbeafe",
    color: "#1d4ed8",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
  },
});

interface Props {
  devis: {
    numero: string;
    titre: string;
    description?: string;
    montant_ht: number;
    taux_tva: number;
    montant_ttc: number;
    date_emission: string;
    date_validite?: string;
    statut: string;
    clients?: { nom: string; email?: string; entreprise?: string; adresse?: string };
    projets?: { nom: string };
  };
}

export default function DevisDocument({ devis }: Props) {
  const tva = devis.montant_ht * (devis.taux_tva / 100);

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* En-tête */}
        <View style={styles.header}>
          <View>
            <Text style={styles.company}>Votre Agence</Text>
            <Text style={{ color: "#6b7280", marginTop: 4 }}>votre@email.com</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.title}>DEVIS</Text>
            <Text style={styles.numero}>{devis.numero}</Text>
            <View style={{ marginTop: 6 }}>
              <Text style={styles.badge}>{devis.statut.toUpperCase()}</Text>
            </View>
          </View>
        </View>

        {/* Infos dates */}
        <View style={[styles.section, { flexDirection: "row", gap: 40 }]}>
          <View>
            <Text style={{ color: "#6b7280", marginBottom: 2 }}>Date d'émission</Text>
            <Text style={{ fontFamily: "Helvetica-Bold" }}>
              {new Date(devis.date_emission).toLocaleDateString("fr-FR")}
            </Text>
          </View>
          {devis.date_validite && (
            <View>
              <Text style={{ color: "#6b7280", marginBottom: 2 }}>Valide jusqu'au</Text>
              <Text style={{ fontFamily: "Helvetica-Bold" }}>
                {new Date(devis.date_validite).toLocaleDateString("fr-FR")}
              </Text>
            </View>
          )}
          {devis.projets && (
            <View>
              <Text style={{ color: "#6b7280", marginBottom: 2 }}>Projet</Text>
              <Text style={{ fontFamily: "Helvetica-Bold" }}>{devis.projets.nom}</Text>
            </View>
          )}
        </View>

        {/* Client */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Adressé à</Text>
          <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 12, marginBottom: 2 }}>
            {devis.clients?.nom}
          </Text>
          {devis.clients?.entreprise && (
            <Text style={{ color: "#6b7280" }}>{devis.clients.entreprise}</Text>
          )}
          {devis.clients?.email && (
            <Text style={{ color: "#6b7280" }}>{devis.clients.email}</Text>
          )}
          {devis.clients?.adresse && (
            <Text style={{ color: "#6b7280", marginTop: 2 }}>{devis.clients.adresse}</Text>
          )}
        </View>

        {/* Objet */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Objet</Text>
          <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 13 }}>{devis.titre}</Text>
          {devis.description && (
            <Text style={{ color: "#6b7280", marginTop: 6, lineHeight: 1.5 }}>
              {devis.description}
            </Text>
          )}
        </View>

        {/* Tableau montants */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Détail</Text>
          <View style={styles.tableHeader}>
            <Text style={styles.tableHeaderText}>Description</Text>
            <Text style={styles.tableHeaderText}>Montant</Text>
          </View>
          <View style={styles.row}>
            <Text>{devis.titre}</Text>
            <Text>
              {devis.montant_ht.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €
            </Text>
          </View>

          {/* Totaux */}
          <View style={styles.totalBlock}>
            <View style={styles.totalRow}>
              <Text style={{ color: "#6b7280" }}>Sous-total HT</Text>
              <Text>
                {devis.montant_ht.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €
              </Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={{ color: "#6b7280" }}>TVA ({devis.taux_tva}%)</Text>
              <Text>{tva.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €</Text>
            </View>
            <View style={styles.totalFinal}>
              <Text style={styles.totalFinalText}>TOTAL TTC</Text>
              <Text style={styles.totalFinalText}>
                {devis.montant_ttc.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €
              </Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Devis généré le {new Date().toLocaleDateString("fr-FR")} · Votre Agence
        </Text>
      </Page>
    </Document>
  );
}
```

---

## Étape 4 — Route API pour le Devis

Créer `app/api/pdf/devis/[id]/route.ts` :

```typescript
import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import DevisDocument from "@/components/pdf/DevisDocument";
import React from "react";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();

  const { data: devis, error } = await supabase
    .from("devis")
    .select(
      `id, numero, titre, description, montant_ht, taux_tva, montant_ttc,
       date_emission, date_validite, statut,
       clients ( nom, email, entreprise, adresse ),
       projets ( nom )`
    )
    .eq("id", params.id)
    .single();

  if (error || !devis) {
    return NextResponse.json({ error: "Devis introuvable" }, { status: 404 });
  }

  const buffer = await renderToBuffer(
    React.createElement(DevisDocument, { devis: devis as any })
  );

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${devis.numero}.pdf"`,
    },
  });
}
```

---

## Étape 5 — Route API pour la Facture

Créer `app/api/pdf/facture/[id]/route.ts` :

```typescript
import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import FactureDocument from "@/components/pdf/FactureDocument";
import React from "react";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();

  const { data: facture, error } = await supabase
    .from("factures")
    .select(
      `id, numero, montant, date_emission, date_echeance, statut,
       projets ( nom, clients ( nom, email, entreprise, adresse ) ),
       devis ( numero, montant_ht, taux_tva, montant_ttc )`
    )
    .eq("id", params.id)
    .single();

  if (error || !facture) {
    return NextResponse.json({ error: "Facture introuvable" }, { status: 404 });
  }

  const buffer = await renderToBuffer(
    React.createElement(FactureDocument, { facture: facture as any })
  );

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${facture.numero}.pdf"`,
    },
  });
}
```

> **Note** : `FactureDocument.tsx` suit exactement le même pattern que `DevisDocument.tsx` — adapte les champs selon ta table `factures`.

---

## Étape 6 — Bouton de téléchargement dans l'UI

Dans ta page `devis/page.tsx`, ajoute l'import et le bouton dans le tableau :

```tsx
import { Download } from "lucide-react";

// Dans la colonne actions du tableau :
<button
  onClick={() => window.open(`/api/pdf/devis/${d.id}`, "_blank")}
  className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
  title="Télécharger PDF"
>
  <Download size={14} />
</button>
```

Même chose dans `factures/page.tsx` :

```tsx
<button
  onClick={() => window.open(`/api/pdf/facture/${f.id}`, "_blank")}
  className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
  title="Télécharger PDF"
>
  <Download size={14} />
</button>
```

---

## Étape 7 — Personnalisation (optionnel)

### Ajouter ton logo

```tsx
import { Image } from "@react-pdf/renderer";

// Dans le header du Document :
<Image
  src="/logo.png"   // fichier dans /public
  style={{ width: 80, height: "auto" }}
/>
```

### Changer le nom de ton agence

Remplace `"Votre Agence"` et `"votre@email.com"` dans `DevisDocument.tsx` par tes vraies infos, ou mieux, crée une constante dans un fichier de config :

```typescript
// lib/config.ts
export const AGENCE = {
  nom: "Mon Agence",
  email: "contact@monagence.fr",
  telephone: "+33 6 00 00 00 00",
  adresse: "1 rue de la Paix, 75001 Paris",
  siret: "123 456 789 00010",
};
```

---

## Récapitulatif des fichiers créés

| Fichier | Rôle |
|---|---|
| `components/pdf/DevisDocument.tsx` | Template visuel PDF devis |
| `components/pdf/FactureDocument.tsx` | Template visuel PDF facture |
| `api/pdf/devis/[id]/route.ts` | Endpoint GET → génère et retourne le PDF |
| `api/pdf/facture/[id]/route.ts` | Endpoint GET → génère et retourne le PDF |

---

## Problèmes courants

**Erreur `Cannot use import statement`**
> `@react-pdf/renderer` est une lib Node.js uniquement. Les route handlers (`route.ts`) fonctionnent, mais n'importe jamais ce composant dans un Client Component (`"use client"`).

**Le PDF s'ouvre dans le navigateur au lieu de se télécharger**
> Change `attachment` en `inline` dans le header `Content-Disposition` si tu veux l'aperçu, ou garde `attachment` pour forcer le téléchargement.

**Les polices ne s'affichent pas correctement**
> `@react-pdf/renderer` n'utilise pas les polices web. Enregistre une police custom avec :
> ```tsx
> import { Font } from "@react-pdf/renderer";
> Font.register({ family: "Inter", src: "/fonts/Inter-Regular.ttf" });
> ```
