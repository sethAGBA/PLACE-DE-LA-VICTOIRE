import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/Button';
import { useTranslation } from 'react-i18next';
import { TableZone } from '@/types';

interface TableFormProps {
  onCreated: (tableId: string, numero: number) => void;
  onCancel: () => void;
}

export function TableForm({ onCreated, onCancel }: TableFormProps) {
  const { t } = useTranslation();
  const [numero, setNumero] = useState<number>(1);
  const [zone, setZone] = useState<TableZone>(TableZone.salle);
  const [capacite, setCapacite] = useState<number>(4);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!numero || numero < 1) {
      setError('Le numéro doit être supérieur à 0.');
      return;
    }
    setSaving(true);
    try {
      const ref = await addDoc(collection(db, 'tables'), {
        numero,
        zone,
        capacite: capacite || 4,
        statut: 'libre',
        qrCodeUrl: '',
      });
      onCreated(ref.id, numero);
    } catch (err) {
      console.error(err);
      setError('Erreur lors de la création de la table.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">
          {t('table.form.number')} *
        </label>
        <input
          type="number"
          value={numero}
          min={1}
          required
          onChange={(e) => setNumero(Number(e.target.value))}
          className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">
          {t('table.form.zone')}
        </label>
        <select
          value={zone}
          onChange={(e) => setZone(e.target.value as TableZone)}
          className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value={TableZone.salle}>{t('table.zones.salle')}</option>
          <option value={TableZone.paillote}>{t('table.zones.paillote')}</option>
          <option value={TableZone.jardin}>{t('table.zones.jardin')}</option>
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">
          {t('table.form.capacity')}
        </label>
        <input
          type="number"
          value={capacite}
          min={1}
          max={20}
          onChange={(e) => setCapacite(Number(e.target.value))}
          className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" size="sm" loading={saving}>
          {t('common.save')}
        </Button>
      </div>
    </form>
  );
}
