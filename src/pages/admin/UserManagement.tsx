import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { UserForm } from '@/components/admin/UserForm';
import { UserRole } from '@/types';
import type { AppUser } from '@/types';
import { Plus, Pencil } from 'lucide-react';

const ROLE_STYLES: Record<UserRole, string> = {
  [UserRole.admin]: 'bg-purple-100 text-purple-700',
  [UserRole.serveur]: 'bg-blue-100 text-blue-700',
  [UserRole.cuisine]: 'bg-orange-100 text-orange-700',
  [UserRole.client]: 'bg-gray-100 text-gray-700',
};

export default function UserManagement() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editUser, setEditUser] = useState<AppUser | null>(null);

  async function loadUsers() {
    setLoading(true);
    try {
      const snap = await getDocs(
        query(collection(db, 'users'), orderBy('nom', 'asc'))
      );
      setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() } as AppUser)));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadUsers();
  }, []);

  async function toggleActif(user: AppUser) {
    try {
      await updateDoc(doc(db, 'users', user.id), { actif: !user.actif });
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, actif: !u.actif } : u))
      );
    } catch (err) {
      console.error(err);
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t('admin.users.title')}</h1>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus size={15} />
          {t('admin.users.add')}
        </Button>
      </div>

      {users.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-400">
          Aucun utilisateur. Créez des comptes démo depuis le tableau de bord.
        </p>
      ) : (
        <div className="rounded-xl bg-white shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b bg-gray-50 text-xs text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">{t('admin.users.name')}</th>
                <th className="px-4 py-3 text-left">{t('admin.users.email')}</th>
                <th className="px-4 py-3 text-left">{t('admin.users.role')}</th>
                <th className="px-4 py-3 text-left">{t('admin.users.active')}</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{user.nom}</td>
                  <td className="px-4 py-3 text-gray-500">{user.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${ROLE_STYLES[user.role] ?? 'bg-gray-100 text-gray-700'}`}
                    >
                      {t(`roles.${user.role}`)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => void toggleActif(user)}
                      role="switch"
                      aria-checked={user.actif}
                      className={`relative inline-flex h-5 w-9 cursor-pointer rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                        user.actif ? 'bg-secondary' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 translate-y-0.5 transform rounded-full bg-white shadow transition-transform ${
                          user.actif ? 'translate-x-4' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setEditUser(user)}
                        className="rounded-lg p-1.5 text-gray-500 hover:bg-orange-50 hover:text-primary"
                        aria-label="Modifier"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => void toggleActif(user)}
                        className={`rounded-lg px-2 py-1 text-xs font-medium ${
                          user.actif
                            ? 'bg-red-50 text-red-600 hover:bg-red-100'
                            : 'bg-green-50 text-green-600 hover:bg-green-100'
                        }`}
                      >
                        {user.actif
                          ? t('admin.users.deactivate')
                          : t('admin.users.activate')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add modal */}
      <Modal open={addOpen} title={t('admin.users.add')} onClose={() => setAddOpen(false)}>
        <UserForm
          onSuccess={() => { setAddOpen(false); void loadUsers(); }}
          onCancel={() => setAddOpen(false)}
        />
      </Modal>

      {/* Edit modal */}
      <Modal
        open={!!editUser}
        title={t('admin.users.edit_user')}
        onClose={() => setEditUser(null)}
      >
        {editUser && (
          <UserForm
            initial={editUser}
            onSuccess={() => { setEditUser(null); void loadUsers(); }}
            onCancel={() => setEditUser(null)}
          />
        )}
      </Modal>
    </div>
  );
}
