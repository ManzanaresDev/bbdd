export type StatutProjet = 'en_cours' | 'termine' | 'pause' | 'annule'
export type StatutDevis = 'brouillon' | 'envoye' | 'accepte' | 'refuse' | 'expire'
export type StatutFacture = 'en_attente' | 'payee' | 'en_retard' | 'annulee'

export interface Client {
  id: string
  nom: string
  email: string
  telephone?: string
  entreprise?: string
  adresse?: string
  created_at: string
}

export interface Contact {
  id: string
  client_id: string
  prenom: string
  nom: string
  email?: string
  telephone?: string
  poste?: string
}

export interface Projet {
  id: string
  client_id: string
  nom: string
  description?: string
  date_debut?: string
  date_fin?: string
  statut: StatutProjet
  budget?: number
  created_at: string
  clients?: Client
}

export interface Devis {
  id: string
  client_id: string
  projet_id?: string
  numero: string
  titre: string
  description?: string
  montant_ht: number
  taux_tva: number
  montant_ttc: number
  date_emission: string
  date_validite?: string
  statut: StatutDevis
  created_at: string
  clients?: Client
  projets?: Projet
}

export interface Facture {
  id: string
  projet_id: string
  devis_id?: string
  numero: string
  montant: number
  date_emission: string
  date_echeance?: string
  statut: StatutFacture
  projets?: Projet & { clients?: Client }
}
