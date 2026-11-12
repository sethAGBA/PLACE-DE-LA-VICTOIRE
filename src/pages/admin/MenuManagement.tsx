import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  writeBatch,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getCategories } from '@/lib/firestore';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { ProductForm } from '@/components/admin/ProductForm';
import { seedFirestore } from '@/seed/seedData';
import type { Product, Category } from '@/types';
import { Plus, Search, Upload, Trash2, Pencil } from 'lucide-react';

// ─── CSV Parser ───────────────────────────────────────────────────────────────

function parseCsvRow(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

interface CsvPreviewRow {
  nom_fr: string;
  nom_en: string;
  prix: number;
  categorieId: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function MenuManagement() {
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals
  const [addOpen, setAddOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // CSV
  const csvRef = useRef<HTMLInputElement>(null);
  const [csvPreview, setCsvPreview] = useState<CsvPreviewRow[]>([]);
  const [csvImporting, setCsvImporting] = useState(false);
  const [csvOpen, setCsvOpen] = useState(false);

  // Seed
  const [seedStatus, setSeedStatus] = useState<'idle' | 'running' | 'done'>('idle');

  async function loadData() {
    setLoading(true);
    try {
      const [cats, prodSnap] = await Promise.all([
        getCategories(),
        getDocs(query(collection(db, 'products'), orderBy('orderCount', 'desc'))),
      ]);
      setCategories(cats);
      setProducts(prodSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Product)));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  function getCategoryName(id: string) {
    const cat = categories.find((c) => c.id === id);
    return cat ? `${cat.icon} ${cat.nom_fr}` : id;
  }

  const filtered = products.filter(
    (p) =>
      p.nom_fr.toLowerCase().includes(search.toLowerCase()) ||
      p.nom_en.toLowerCase().includes(search.toLowerCase())
  );

  // Group by category
  const grouped = categories.map((cat) => ({
    cat,
    items: filtered.filter((p) => p.categorieId === cat.id),
  })).filter((g) => g.items.length > 0);

  // Uncategorised
  const known = new Set(categories.map((c) => c.id));
  const uncategorised = filtered.filter((p) => !known.has(p.categorieId));

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteDoc(doc(db, 'products', deleteTarget.id));
      setDeleteTarget(null);
      void loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteLoading(false);
    }
  }

  function handleCsvFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split(/\r?\n/).filter(Boolean);
      // Skip header row
      const rows: CsvPreviewRow[] = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = parseCsvRow(lines[i]!);
        rows.push({
          nom_fr: cols[0] ?? '',
          nom_en: cols[1] ?? '',
          prix: Number(cols[2] ?? 0),
          categorieId: cols[3] ?? '',
        });
      }
      setCsvPreview(rows.filter((r) => r.nom_fr));
      setCsvOpen(true);
    };
    reader.readAsText(file);
  }

  async function handleCsvImport() {
    setCsvImporting(true);
    try {
      const batch = writeBatch(db);
      for (const row of csvPreview) {
        const ref = doc(collection(db, 'products'));
        batch.set(ref, {
          nom_fr: row.nom_fr,
          nom_en: row.nom_en,
          desc_fr: '',
          desc_en: '',
          prix: row.prix,
          categorieId: row.categorieId,
          imageUrl: '',
          disponible: true,
          orderCount: 0,
          tags: [],
        });
      }
      await batch.commit();
      setCsvOpen(false);
      setCsvPreview([]);
      void loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setCsvImporting(false);
    }
  }

  async function handleSeed() {
    setSeedStatus('running');
    try {
      await seedFirestore();
      setSeedStatus('done');
      void loadData();
    } catch (err) {
      console.error(err);
      setSeedStatus('idle');
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">{t('admin.menu.title')}</h1>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="ghost" onClick={() => csvRef.current?.click()}>
            <Upload size={15} />
            {t('admin.menu.importCsv')}
          </Button>
          <input ref={csvRef} type="file" accept=".csv" className="hidden" onChange={handleCsvFile} />

          <Button
            size="sm"
            variant="ghost"
            onClick={() => void handleSeed()}
            loading={seedStatus === 'running'}
            disabled={seedStatus === 'done'}
          >
            {seedStatus === 'done'
              ? t('admin.seed.done')
              : seedStatus === 'running'
              ? t('admin.seed.running')
              : t('admin.menu.seed')}
          </Button>

          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus size={15} />
            {t('admin.menu.add')}
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('admin.menu.search')}
          className="w-full rounded-lg border py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Product list */}
      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-400">
          Aucun produit. Ajoutez-en un ou lancez le seed.
        </p>
      ) : (
        <div className="space-y-6">
          {grouped.map(({ cat, items }) => (
            <section key={cat.id}>
              <h2 className="mb-3 text-sm font-semibold text-gray-600">
                {cat.icon} {cat.nom_fr}
              </h2>
              <div className="rounded-xl bg-white shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="border-b bg-gray-50 text-xs text-gray-500">
                    <tr>
                      <th className="px-4 py-2 text-left">Photo</th>
                      <th className="px-4 py-2 text-left">Nom</th>
                      <th className="px-4 py-2 text-left">Prix</th>
                      <th className="px-4 py-2 text-left">Dispo</th>
                      <th className="px-4 py-2 text-left">Commandes</th>
                      <th className="px-4 py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {items.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2">
                          {p.imageUrl ? (
                            <img
                              src={p.imageUrl}
                              alt={p.nom_fr}
                              loading="lazy"
                              className="h-10 w-10 rounded-lg object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50 text-lg">
                              {cat.icon}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-2">
                          <p className="font-medium">{p.nom_fr}</p>
                          <p className="text-xs text-gray-400">{p.nom_en}</p>
                        </td>
                        <td className="px-4 py-2 font-medium text-primary">
                          {p.prix.toLocaleString('fr-FR')} FCFA
                        </td>
                        <td className="px-4 py-2">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                              p.disponible
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {p.disponible
                              ? t('admin.menu.available')
                              : t('admin.menu.unavailable')}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-gray-500">{p.orderCount}</td>
                        <td className="px-4 py-2 text-right">
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => setEditProduct(p)}
                              className="rounded-lg p-1.5 text-gray-500 hover:bg-orange-50 hover:text-primary"
                              aria-label="Modifier"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(p)}
                              className="rounded-lg p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600"
                              aria-label="Supprimer"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}

          {uncategorised.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold text-gray-600">Sans catégorie</h2>
              <div className="rounded-xl bg-white shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <tbody className="divide-y">
                    {uncategorised.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 font-medium">{p.nom_fr}</td>
                        <td className="px-4 py-2 text-primary">{p.prix.toLocaleString('fr-FR')} FCFA</td>
                        <td className="px-4 py-2 text-xs text-gray-400">{getCategoryName(p.categorieId)}</td>
                        <td className="px-4 py-2 text-right">
                          <div className="flex justify-end gap-1">
                            <button onClick={() => setEditProduct(p)} className="rounded-lg p-1.5 text-gray-500 hover:text-primary" aria-label={t('common.edit')}><Pencil size={14} /></button>
                            <button onClick={() => setDeleteTarget(p)} className="rounded-lg p-1.5 text-gray-500 hover:text-red-600" aria-label={t('common.delete')}><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>
      )}

      {/* Add modal */}
      <Modal open={addOpen} title={t('admin.menu.add')} onClose={() => setAddOpen(false)}>
        <ProductForm
          onSuccess={() => { setAddOpen(false); void loadData(); }}
          onCancel={() => setAddOpen(false)}
        />
      </Modal>

      {/* Edit modal */}
      <Modal
        open={!!editProduct}
        title={t('admin.menu.edit')}
        onClose={() => setEditProduct(null)}
      >
        {editProduct && (
          <ProductForm
            initial={editProduct}
            onSuccess={() => { setEditProduct(null); void loadData(); }}
            onCancel={() => setEditProduct(null)}
          />
        )}
      </Modal>

      {/* Delete confirm modal */}
      <Modal
        open={!!deleteTarget}
        title={t('admin.menu.delete')}
        onClose={() => setDeleteTarget(null)}
      >
        <p className="mb-4 text-sm text-gray-700">
          Supprimer <strong>{deleteTarget?.nom_fr}</strong> ? Cette action est irréversible.
        </p>
        <div className="flex justify-end gap-3">
          <Button size="sm" variant="ghost" onClick={() => setDeleteTarget(null)}>
            {t('common.cancel')}
          </Button>
          <Button
            size="sm"
            variant="danger"
            loading={deleteLoading}
            onClick={() => void handleDelete()}
          >
            {t('common.delete')}
          </Button>
        </div>
      </Modal>

      {/* CSV preview modal */}
      <Modal open={csvOpen} title={t('admin.menu.importCsv')} onClose={() => setCsvOpen(false)}>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            {csvPreview.length} produit(s) détecté(s). Format attendu: nom_fr, nom_en, prix, categorieId
          </p>
          <div className="max-h-60 overflow-auto rounded-lg border">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-3 py-2 text-left">Nom FR</th>
                  <th className="px-3 py-2 text-left">Nom EN</th>
                  <th className="px-3 py-2 text-left">Prix</th>
                  <th className="px-3 py-2 text-left">Catégorie</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {csvPreview.map((row, i) => (
                  <tr key={i}>
                    <td className="px-3 py-1">{row.nom_fr}</td>
                    <td className="px-3 py-1">{row.nom_en}</td>
                    <td className="px-3 py-1">{row.prix}</td>
                    <td className="px-3 py-1">{row.categorieId}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end gap-3">
            <Button size="sm" variant="ghost" onClick={() => setCsvOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button size="sm" loading={csvImporting} onClick={() => void handleCsvImport()}>
              Importer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
