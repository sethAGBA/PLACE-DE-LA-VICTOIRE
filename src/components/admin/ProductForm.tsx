import React, { useState, useEffect, useRef } from 'react';
import {
  collection,
  addDoc,
  updateDoc,
  doc,
} from 'firebase/firestore';
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { getCategories } from '@/lib/firestore';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useTranslation } from 'react-i18next';
import type { Product, Category } from '@/types';

type ProductDraft = Omit<Product, 'id' | 'orderCount'>;

const EMPTY: ProductDraft = {
  nom_fr: '',
  nom_en: '',
  desc_fr: '',
  desc_en: '',
  prix: 0,
  categorieId: '',
  imageUrl: '',
  disponible: true,
  tags: [],
};

const AVAILABLE_TAGS = ['populaire', 'recommandé', 'végétarien'] as const;

interface ProductFormProps {
  initial?: Product;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ProductForm({ initial, onSuccess, onCancel }: ProductFormProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState<ProductDraft>(
    initial ? { ...initial } : { ...EMPTY }
  );
  const [categories, setCategories] = useState<Category[]>([]);
  const [catLoading, setCatLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getCategories()
      .then((cats) => {
        setCategories(cats);
        if (!form.categorieId && cats.length > 0) {
          setForm((f) => ({ ...f, categorieId: cats[0]!.id }));
        }
      })
      .catch(console.error)
      .finally(() => setCatLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setForm((f) => ({ ...f, [name]: checked }));
    } else if (name === 'prix') {
      setForm((f) => ({ ...f, prix: Number(value) }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  }

  function handleTagChange(tag: string, checked: boolean) {
    setForm((f) => ({
      ...f,
      tags: checked ? [...f.tags, tag] : f.tags.filter((t) => t !== tag),
    }));
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      // Use existing product id if editing, otherwise generate a temp name
      const productId = initial?.id ?? `prod-${Date.now()}`;
      const fileRef2 = storageRef(storage, `products/${productId}.jpg`);
      await uploadBytes(fileRef2, file);
      const url = await getDownloadURL(fileRef2);
      setForm((f) => ({ ...f, imageUrl: url }));
    } catch (err) {
      console.error(err);
      setError('Erreur lors du téléversement de l\'image.');
    } finally {
      setUploading(false);
    }
  }

  function validate(): boolean {
    if (!form.nom_fr.trim()) { setError('Le nom (FR) est requis.'); return false; }
    if (!form.nom_en.trim()) { setError('Le nom (EN) est requis.'); return false; }
    if (!form.categorieId) { setError('La catégorie est requise.'); return false; }
    if (!form.prix || form.prix <= 0) { setError('Le prix doit être supérieur à 0.'); return false; }
    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!validate()) return;

    setSaving(true);
    try {
      if (initial) {
        await updateDoc(doc(db, 'products', initial.id), { ...form });
      } else {
        await addDoc(collection(db, 'products'), { ...form, orderCount: 0 });
      }
      onSuccess();
    } catch (err) {
      console.error(err);
      setError('Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  }

  if (catLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    );
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      {/* Nom FR / EN */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">
            {t('product.form.nomFr')} *
          </label>
          <input
            name="nom_fr"
            value={form.nom_fr}
            onChange={handleChange}
            required
            className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">
            {t('product.form.nomEn')} *
          </label>
          <input
            name="nom_en"
            value={form.nom_en}
            onChange={handleChange}
            required
            className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Desc FR / EN */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">
            {t('product.form.descFr')}
          </label>
          <textarea
            name="desc_fr"
            value={form.desc_fr}
            onChange={handleChange}
            rows={2}
            className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">
            {t('product.form.descEn')}
          </label>
          <textarea
            name="desc_en"
            value={form.desc_en}
            onChange={handleChange}
            rows={2}
            className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Prix + Catégorie */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">
            {t('product.form.price')} *
          </label>
          <input
            type="number"
            name="prix"
            value={form.prix}
            onChange={handleChange}
            min={1}
            required
            className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">
            {t('product.form.category')} *
          </label>
          <select
            name="categorieId"
            value={form.categorieId}
            onChange={handleChange}
            required
            className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon} {c.nom_fr}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Image URL + upload */}
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">
          {t('product.form.image')}
        </label>
        <div className="flex gap-2">
          <input
            name="imageUrl"
            value={form.imageUrl}
            onChange={handleChange}
            placeholder="https://…"
            className="flex-1 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <label className="flex cursor-pointer items-center gap-1 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-xs text-gray-600 hover:bg-gray-50">
            {uploading ? <Spinner size="sm" /> : '📷'}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => void handleFileUpload(e)}
            />
          </label>
        </div>
        {form.imageUrl && (
          <img
            src={form.imageUrl}
            alt="preview"
            className="mt-2 h-16 w-16 rounded-lg object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        )}
      </div>

      {/* Disponible */}
      <div className="flex items-center gap-2">
        <input
          id="disponible"
          type="checkbox"
          name="disponible"
          checked={form.disponible}
          onChange={handleChange}
          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
        />
        <label htmlFor="disponible" className="text-sm text-gray-700">
          {t('product.form.available')}
        </label>
      </div>

      {/* Tags */}
      <div>
        <p className="mb-1 text-xs font-medium text-gray-700">{t('product.form.tags')}</p>
        <div className="flex flex-wrap gap-3">
          {AVAILABLE_TAGS.map((tag) => (
            <label key={tag} className="flex items-center gap-1.5 text-sm">
              <input
                type="checkbox"
                checked={form.tags.includes(tag)}
                onChange={(e) => handleTagChange(tag, e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              {tag}
            </label>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" size="sm" loading={saving || uploading}>
          {t('common.save')}
        </Button>
      </div>
    </form>
  );
}
