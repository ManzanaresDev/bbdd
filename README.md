# CRM Agence

Application de gestion de clientèle (CRM) pour agences, construite avec Next.js 14 et Supabase. Gestion des clients, projets, devis et factures depuis une interface unique et sécurisée.

---

## Arborescence du projet

```
crm-agence/
├── app/
│   ├── auth/
│   │   ├── callback/
│   │   │   └── route.ts          # Gestion du callback Supabase (magic link, OAuth)
│   │   ├── login/
│   │   │   └── page.tsx          # Page de connexion
│   │   └── register/
│   │       └── page.tsx          # Page de création de compte
│   ├── dashboard/
│   │   ├── clients/
│   │   │   └── page.tsx          # Liste et gestion des clients
│   │   ├── devis/
│   │   │   └── page.tsx          # Liste et gestion des devis
│   │   ├── factures/
│   │   │   └── page.tsx          # Liste et gestion des factures
│   │   ├── projets/
│   │   │   └── page.tsx          # Liste et gestion des projets
│   │   ├── layout.tsx            # Layout du dashboard (sidebar + nav)
│   │   └── page.tsx              # Page d'accueil du dashboard (stats)
│   ├── globals.css               # Styles globaux Tailwind
│   └── layout.tsx                # Layout racine de l'application
├── components/
│   ├── Modal.tsx                 # Composant modal réutilisable
│   └── Sidebar.tsx               # Barre de navigation latérale
├── lib/
│   └── supabase/
│       ├── client.ts             # Client Supabase côté navigateur
│       └── server.ts             # Client Supabase côté serveur (SSR)
├── types/
│   └── index.ts                  # Types TypeScript (Client, Projet, Devis, Facture)
├── middleware.ts                  # Protection des routes (auth requise)
├── .env.example                   # Template des variables d'environnement
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## Dépendances

### Production

| Package                 | Version    | Rôle                                        |
| ----------------------- | ---------- | ------------------------------------------- |
| `next`                  | 14.2.0     | Framework React (App Router)                |
| `react` / `react-dom`   | ^18        | Interface utilisateur                       |
| `@supabase/supabase-js` | ^2.43.0    | Client Supabase (auth + base de données)    |
| `@supabase/ssr`         | **latest** | Gestion des cookies de session côté serveur |
| `lucide-react`          | ^0.383.0   | Icônes                                      |

### Développement

| Package                        | Version   | Rôle             |
| ------------------------------ | --------- | ---------------- |
| `typescript`                   | ^5        | Typage statique  |
| `tailwindcss`                  | ^3.4.0    | CSS utilitaire   |
| `postcss` / `autoprefixer`     | ^8 / ^10  | Compilation CSS  |
| `@types/node` / `@types/react` | ^20 / ^18 | Types TypeScript |

> ⚠️ **Important** : `@supabase/ssr` doit être en version `latest` (et non `^0.3.0`). La version 0.3.0 contient un bug de propagation des cookies en Next.js 14 qui empêche la connexion. Mets à jour avec :
>
> ```bash
> npm install @supabase/ssr@latest @supabase/supabase-js@latest
> ```

---

## Installation et configuration

### 1. Prérequis

- Node.js 18+
- Un compte [Supabase](https://supabase.com) avec un projet créé

### 2. Variables d'environnement

Copie `.env.example` en `.env.local` et remplis tes valeurs :

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://ton-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> Les clés se trouvent dans Supabase → **Settings → API → Legacy anon, service_role API keys**. Utilise la clé **anon** (format `eyJ...`), pas la clé publishable (`sb_publishable_...`).

### 3. Créer les tables dans Supabase

Dans **Supabase → SQL Editor → New query**, exécute ce script :

```sql
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  telephone TEXT,
  entreprise TEXT,
  adresse TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  prenom TEXT NOT NULL,
  nom TEXT NOT NULL,
  email TEXT,
  telephone TEXT,
  poste TEXT
);

CREATE TABLE projets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  description TEXT,
  date_debut DATE,
  date_fin DATE,
  statut TEXT DEFAULT 'en_cours' CHECK (statut IN ('en_cours', 'termine', 'pause', 'annule')),
  budget DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE devis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  projet_id UUID REFERENCES projets(id) ON DELETE SET NULL,
  numero TEXT UNIQUE NOT NULL,
  titre TEXT NOT NULL,
  description TEXT,
  montant_ht DECIMAL(10,2) NOT NULL,
  taux_tva DECIMAL(5,2) DEFAULT 20.00,
  montant_ttc DECIMAL(10,2) GENERATED ALWAYS AS (montant_ht * (1 + taux_tva / 100)) STORED,
  date_emission DATE DEFAULT CURRENT_DATE,
  date_validite DATE,
  statut TEXT DEFAULT 'brouillon' CHECK (statut IN ('brouillon', 'envoye', 'accepte', 'refuse', 'expire')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE factures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projet_id UUID REFERENCES projets(id) ON DELETE CASCADE,
  devis_id UUID REFERENCES devis(id) ON DELETE SET NULL,
  numero TEXT UNIQUE NOT NULL,
  montant DECIMAL(10,2) NOT NULL,
  date_emission DATE DEFAULT CURRENT_DATE,
  date_echeance DATE,
  statut TEXT DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'payee', 'en_retard', 'annulee'))
);
```

### 4. Activer la sécurité (RLS)

```sql
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE projets ENABLE ROW LEVEL SECURITY;
ALTER TABLE devis ENABLE ROW LEVEL SECURITY;
ALTER TABLE factures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Accès authentifié" ON clients FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Accès authentifié" ON contacts FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Accès authentifié" ON projets FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Accès authentifié" ON devis FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Accès authentifié" ON factures FOR ALL USING (auth.role() = 'authenticated');
```

### 5. Configurer les URLs d'authentification

Dans **Supabase → Authentication → URL Configuration** :

- **Site URL** : `http://localhost:3000`
- **Redirect URLs** : ajoute `http://localhost:3000/auth/callback`

### 6. Lancer l'application

```bash
npm install
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000).

---

## Accès et sécurité

### Créer le compte administrateur

Au premier lancement, crée ton compte via la page **Créer un compte**.

### Bloquer les nouvelles inscriptions

Une fois ton compte créé, **désactive les inscriptions publiques** pour être le seul à pouvoir accéder au CRM :

**Supabase → Authentication → Sign In / Providers → Email → désactive "Enable sign ups"**

Si tu dois ajouter un utilisateur ultérieurement, fais-le manuellement depuis **Authentication → Users → Add user**.

---

## Fonctionnalités

| Section       | Description                                                                          |
| ------------- | ------------------------------------------------------------------------------------ |
| **Dashboard** | Vue d'ensemble : stats clés, derniers clients, projets en cours                      |
| **Clients**   | Fiche client avec coordonnées, entreprise, historique                                |
| **Projets**   | Suivi des projets par statut (en cours, terminé, pause, annulé) avec budget et dates |
| **Devis**     | Création de devis avec calcul automatique TTC, suivi du statut                       |
| **Factures**  | Suivi des factures et de leur état de paiement                                       |

---

## Déploiement en production

1. Déploie sur [Vercel](https://vercel.com) (recommandé pour Next.js)
2. Ajoute les variables d'environnement dans les paramètres Vercel
3. Mets à jour dans Supabase → URL Configuration :
   - **Site URL** → ton domaine de production
   - **Redirect URLs** → ajoute `https://ton-domaine.com/auth/callback`

## Evolution - Mise à jour des tables Devis et Factures (Supabase SQL)

### Table `devis`

#### Ajouter les champs manquants

```sql
ALTER TABLE devis
ADD COLUMN IF NOT EXISTS remise NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS conditions_paiement TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS date_acceptation DATE,
ADD COLUMN IF NOT EXISTS date_refus DATE,
ADD COLUMN IF NOT EXISTS facture_id UUID;
```

#### Contrainte de liaison avec la facture générée

```sql
ALTER TABLE devis
ADD CONSTRAINT devis_facture_id_fkey
FOREIGN KEY (facture_id)
REFERENCES factures(id)
ON DELETE SET NULL;
```

---

### Création de la table `factures`

```sql
CREATE TABLE IF NOT EXISTS factures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    client_id UUID NOT NULL,
    projet_id UUID,

    numero TEXT UNIQUE NOT NULL,

    titre TEXT NOT NULL,
    description TEXT,

    montant_ht NUMERIC NOT NULL DEFAULT 0,
    taux_tva NUMERIC NOT NULL DEFAULT 20,
    montant_tva NUMERIC NOT NULL DEFAULT 0,
    montant_ttc NUMERIC NOT NULL DEFAULT 0,

    date_emission DATE NOT NULL DEFAULT CURRENT_DATE,
    date_echeance DATE,

    date_paiement DATE,

    statut TEXT NOT NULL DEFAULT 'brouillon',

    mode_paiement TEXT,

    reference_paiement TEXT,

    devis_id UUID,

    notes TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT factures_client_id_fkey
        FOREIGN KEY (client_id)
        REFERENCES clients(id)
        ON DELETE CASCADE,

    CONSTRAINT factures_projet_id_fkey
        FOREIGN KEY (projet_id)
        REFERENCES projets(id)
        ON DELETE SET NULL,

    CONSTRAINT factures_devis_id_fkey
        FOREIGN KEY (devis_id)
        REFERENCES devis(id)
        ON DELETE SET NULL
);
```

---

### Index recommandés

```sql
CREATE INDEX IF NOT EXISTS idx_factures_client_id
ON factures(client_id);

CREATE INDEX IF NOT EXISTS idx_factures_projet_id
ON factures(projet_id);

CREATE INDEX IF NOT EXISTS idx_factures_statut
ON factures(statut);

CREATE INDEX IF NOT EXISTS idx_devis_statut
ON devis(statut);
```

---

### Statuts recommandés

#### Devis

```text
brouillon
envoye
accepte
refuse
expire
converti
```

#### Factures

```text
brouillon
envoyee
payee
en_retard
annulee
```

---

### Calculs recommandés

#### Montant TVA

```text
montant_tva = montant_ht × taux_tva / 100
```

#### Montant TTC

```text
montant_ttc = montant_ht + montant_tva
```

---

### Conversion Devis → Facture

Lorsqu'un devis est accepté :

1. Créer une facture.
2. Copier :
   - client_id
   - projet_id
   - titre
   - description
   - montant_ht
   - taux_tva
   - montant_tva
   - montant_ttc

3. Mettre :

```text
devis.statut = "converti"
facture.devis_id = devis.id
```

Cela permettra de retrouver facilement quelle facture provient de quel devis.

Avec cette structure, tu pourras facilement implémenter :

la fiche projet,
la conversion devis → facture,
le calcul du CA encaissé / en attente,
l'impression PDF des devis et factures.
