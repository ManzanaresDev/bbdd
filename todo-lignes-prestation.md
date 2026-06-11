# Todo — Lignes de prestation (factures & devis)

## Contexte

Actuellement, une facture et un devis ont un montant global unique (`montant` / `montant_ht`).
L'objectif est de permettre plusieurs lignes de prestation par document, chacune avec une description, une quantité et un prix unitaire.

---

## 1. Base de données (Supabase)

### Créer la table `lignes_devis`

```sql
create table lignes_devis (
  id uuid primary key default gen_random_uuid(),
  devis_id uuid references devis(id) on delete cascade,
  description text not null,
  quantite numeric not null default 1,
  prix_unitaire numeric not null,
  montant numeric generated always as (quantite * prix_unitaire) stored,
  ordre integer default 0
);
```

### Créer la table `lignes_facture`

```sql
create table lignes_facture (
  id uuid primary key default gen_random_uuid(),
  facture_id uuid references factures(id) on delete cascade,
  description text not null,
  quantite numeric not null default 1,
  prix_unitaire numeric not null,
  montant numeric generated always as (quantite * prix_unitaire) stored,
  ordre integer default 0
);
```

### Modifier la table `devis`

- Rendre `montant_ht` et `montant_ttc` calculés (ou les mettre à jour via trigger/fonction)
- Alternative plus simple : les garder comme champs normaux et les recalculer côté app à chaque save

### Modifier la table `factures`

- Même approche que devis pour le champ `montant`

---

## 2. Types TypeScript (`types/index.ts`)

Ajouter les interfaces :

```typescript
export interface LigneDevis {
  id: string
  devis_id: string
  description: string
  quantite: number
  prix_unitaire: number
  montant: number
  ordre: number
}

export interface LigneFacture {
  id: string
  facture_id: string
  description: string
  quantite: number
  prix_unitaire: number
  montant: number
  ordre: number
}
```

---

## 3. Formulaire de création / édition

### Devis (`app/dashboard/devis/page.tsx` — modal)

- Remplacer le champ `montant_ht` unique par un composant `LignesEditor`
- Le composant permet d'ajouter / supprimer / réordonner des lignes
- Chaque ligne : `description` (texte) + `quantite` (number) + `prix_unitaire` (number) = `montant` calculé
- Le total HT est la somme des montants de lignes
- La TVA et le TTC sont recalculés automatiquement

### Factures (`app/dashboard/factures/page.tsx` — modal ou page dédiée)

- Même logique que devis

### Composant partagé à créer : `components/LignesEditor.tsx`

```
Props:
  - lignes: Ligne[]
  - onChange: (lignes: Ligne[]) => void
  - taux_tva: number

UI:
  - Tableau avec colonnes : Description | Qté | Prix unitaire | Total
  - Bouton "+ Ajouter une ligne"
  - Bouton suppression par ligne
  - Récap HT / TVA / TTC en bas
```

---

## 4. Sauvegarde (logique Supabase)

Au moment du save d'un devis ou d'une facture :

1. Upsert le document principal (devis/facture) avec le total recalculé
2. Supprimer les anciennes lignes (`delete from lignes_devis where devis_id = ?`)
3. Insérer les nouvelles lignes (`insert into lignes_devis`)

---

## 5. Pages de détail (`[id]/page.tsx`)

### Devis

- Remplacer le bloc "Montants" (3 cards HT/TVA/TTC) par un tableau de lignes
- Garder le récap HT/TVA/TTC en bas du tableau

### Factures

- Même chose

---

## 6. Pages print (`app/print/devis/[id]/page.tsx` et `app/print/factures/[id]/page.tsx`)

- Ajouter un tableau de lignes entre la section "Objet" et les totaux
- Colonnes : Description | Qté | Prix unitaire HT | Total HT
- Style : tableau propre avec alternance de fond de ligne légère
- Totaux inchangés en bas à droite

### Query à mettre à jour

```typescript
// Devis print — ajouter dans le select :
lignes_devis ( description, quantite, prix_unitaire, montant, ordre )

// Factures print — ajouter dans le select :
lignes_facture ( description, quantite, prix_unitaire, montant, ordre )
```

---

## Ordre d'implémentation recommandé

1. Migrations SQL (tables `lignes_devis` et `lignes_facture`)
2. Types TypeScript
3. Composant `LignesEditor`
4. Modal devis (création/édition)
5. Modal factures (création/édition)
6. Pages de détail
7. Pages print
