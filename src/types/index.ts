import { Timestamp } from 'firebase/firestore';

// ─── Enums ────────────────────────────────────────────────────────────────────

export enum UserRole {
  admin = 'admin',
  serveur = 'serveur',
  cuisine = 'cuisine',
  caissier = 'caissier',
  client = 'client',
}

export enum OrderStatus {
  PENDING = 'PENDING',
  VALIDATED = 'VALIDATED',
  IN_PREPARATION = 'IN_PREPARATION',
  READY = 'READY',
  SERVED = 'SERVED',
  PAID = 'PAID',
  REJECTED = 'REJECTED',
  PICKUP = 'PICKUP',
}

export enum TableZone {
  salle = 'salle',
  paillote = 'paillote',
  jardin = 'jardin',
}

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface Table {
  id: string;
  numero: number;
  zone: TableZone;
  capacite: number;
  statut: 'libre' | 'occupee';
  qrCodeUrl: string;
}

export interface Category {
  id: string;
  nom_fr: string;
  nom_en: string;
  ordre: number;
  icon: string;
}

export interface Product {
  id: string;
  nom_fr: string;
  nom_en: string;
  desc_fr: string;
  desc_en: string;
  prix: number;
  categorieId: string;
  imageUrl: string;
  disponible: boolean;
  orderCount: number;
  tags: string[];
}

export interface OrderItem {
  productId: string;
  nom_fr: string;
  nom_en: string;
  prix: number;
  quantite: number;
}

export interface Order {
  id: string;
  tableId: string;
  sessionId: string;
  clientPrenom: string;
  statut: OrderStatus;
  createdAt: Timestamp;
  validatedAt?: Timestamp;
  prepStartedAt?: Timestamp;
  estimatedMinutes?: number;
  items: OrderItem[];
  servedAt?: Timestamp;
  paidAt?: Timestamp;
  rejectedReason?: string;
  clientNom?: string;
  clientTelephone?: string;
  isTakeaway?: boolean;
}

export interface AppUser {
  id: string;
  nom: string;
  email: string;
  role: UserRole;
  actif: boolean;
}
