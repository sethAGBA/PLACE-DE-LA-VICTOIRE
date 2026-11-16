import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  increment,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Category, Product, Table, Order, OrderStatus } from '@/types';

// ─── Categories ───────────────────────────────────────────────────────────────

export async function getCategories(): Promise<Category[]> {
  const snap = await getDocs(
    query(collection(db, 'categories'), orderBy('ordre', 'asc'))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Category));
}

// ─── Products ─────────────────────────────────────────────────────────────────

export async function getProducts(categoryId?: string): Promise<Product[]> {
  const ref = collection(db, 'products');
  const q = categoryId
    ? query(
        ref,
        where('categorieId', '==', categoryId),
        orderBy('orderCount', 'desc')
      )
    : query(ref, orderBy('orderCount', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product));
}

// ─── Tables ───────────────────────────────────────────────────────────────────

export async function getTableById(id: string): Promise<Table | null> {
  const snap = await getDoc(doc(db, 'tables', id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Table;
}

export function getTables(cb: (tables: Table[]) => void): Unsubscribe {
  return onSnapshot(
    query(collection(db, 'tables'), orderBy('numero', 'asc')),
    (snap) => {
      cb(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Table)));
    }
  );
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export async function createOrder(
  data: Omit<Order, 'id'>
): Promise<string> {
  const ref = await addDoc(collection(db, 'orders'), data);
  return ref.id;
}

export async function updateOrderStatus(
  id: string,
  patch: Partial<Order>
): Promise<void> {
  // Cast through unknown to satisfy Firestore's strict UpdateData type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await updateDoc(doc(db, 'orders', id), patch as any);
}

/**
 * Increment the orderCount of a product by the given quantity.
 * Called when an order is validated.
 */
export async function incrementProductOrderCount(
  productId: string,
  qty: number
): Promise<void> {
  await updateDoc(doc(db, 'products', productId), {
    orderCount: increment(qty),
  });
}

export function getOrdersByTable(
  tableId: string,
  cb: (orders: Order[]) => void
): Unsubscribe {
  return onSnapshot(
    query(
      collection(db, 'orders'),
      where('tableId', '==', tableId),
      orderBy('createdAt', 'desc')
    ),
    (snap) => {
      cb(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order)));
    }
  );
}

export function getOrdersByStatus(
  statuses: OrderStatus[],
  cb: (orders: Order[]) => void
): Unsubscribe {
  return onSnapshot(
    query(
      collection(db, 'orders'),
      where('statut', 'in', statuses),
      orderBy('createdAt', 'asc')
    ),
    (snap) => {
      cb(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order)));
    }
  );
}

export function getAllOrders(cb: (orders: Order[]) => void): Unsubscribe {
  return onSnapshot(
    query(collection(db, 'orders'), orderBy('createdAt', 'desc')),
    (snap) => {
      cb(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order)));
    }
  );
}

export function getOrdersBySessionId(
  sessionId: string,
  cb: (orders: Order[]) => void
): Unsubscribe {
  return onSnapshot(
    query(
      collection(db, 'orders'),
      where('sessionId', '==', sessionId),
      orderBy('createdAt', 'desc')
    ),
    (snap) => {
      cb(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order)));
    }
  );
}
