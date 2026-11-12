import React, { useState } from 'react';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import {
  initializeApp,
  getApps,
  deleteApp,
} from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
} from 'firebase/auth';
import { db } from '@/lib/firebase';
import { firebaseConfig } from '@/lib/firebase';
import { Button } from '@/components/ui/Button';
import { useTranslation } from 'react-i18next';
import { UserRole } from '@/types';
import type { AppUser } from '@/types';

interface UserFormProps {
  initial?: AppUser;
  onSuccess: () => void;
  onCancel: () => void;
}

const SECONDARY_APP_NAME = 'secondary-user-creation';

export function UserForm({ initial, onSuccess, onCancel }: UserFormProps) {
  const { t } = useTranslation();
  const isEditing = !!initial;

  const [nom, setNom] = useState(initial?.nom ?? '');
  const [email, setEmail] = useState(initial?.email ?? '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>(initial?.role ?? UserRole.serveur);
  const [actif, setActif] = useState(initial?.actif ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);

  async function handleCreate() {
    if (!nom.trim()) throw new Error('Le nom est requis.');
    if (!email.trim()) throw new Error('L\'email est requis.');
    if (!password || password.length < 6)
      throw new Error('Le mot de passe doit contenir au moins 6 caractères.');

    // Create via secondary app to avoid signing out the current admin
    const existing = getApps().find((a) => a.name === SECONDARY_APP_NAME);
    const secondaryApp =
      existing ?? initializeApp(firebaseConfig, SECONDARY_APP_NAME);
    const secondaryAuth = getAuth(secondaryApp);

    const credential = await createUserWithEmailAndPassword(
      secondaryAuth,
      email.trim(),
      password
    );
    await signOut(secondaryAuth);
    await deleteApp(secondaryApp);

    const uid = credential.user.uid;
    await setDoc(doc(db, 'users', uid), {
      nom: nom.trim(),
      email: email.trim(),
      role,
      actif,
    });
  }

  async function handleUpdate() {
    if (!initial) return;
    await updateDoc(doc(db, 'users', initial.id), {
      nom: nom.trim(),
      role,
      actif,
    });
  }

  async function handlePasswordReset() {
    if (!email.trim()) return;
    try {
      const { auth } = await import('@/lib/firebase');
      await sendPasswordResetEmail(auth, email.trim());
      setResetSent(true);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (isEditing) {
        await handleUpdate();
      } else {
        await handleCreate();
      }
      onSuccess();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Erreur lors de la sauvegarde.';
      setError(msg);
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
          {t('user.form.name')} *
        </label>
        <input
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          required
          className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">
          {t('user.form.email')} *
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isEditing}
          className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-50 disabled:text-gray-400"
        />
      </div>

      {!isEditing && (
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">
            {t('user.form.password')} *
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      )}

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">
          {t('user.form.role')}
        </label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as UserRole)}
          className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value={UserRole.serveur}>{t('roles.serveur')}</option>
          <option value={UserRole.cuisine}>{t('roles.cuisine')}</option>
          <option value={UserRole.admin}>{t('roles.admin')}</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <input
          id="actif"
          type="checkbox"
          checked={actif}
          onChange={(e) => setActif(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
        />
        <label htmlFor="actif" className="text-sm text-gray-700">
          {t('user.form.active')}
        </label>
      </div>

      {isEditing && (
        <div>
          <button
            type="button"
            onClick={() => void handlePasswordReset()}
            className="text-xs text-primary underline hover:text-orange-700"
          >
            Envoyer un e-mail de réinitialisation du mot de passe
          </button>
          {resetSent && (
            <p className="mt-1 text-xs text-green-600">E-mail envoyé !</p>
          )}
        </div>
      )}

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
