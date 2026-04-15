import { useState, useEffect, useCallback, FormEvent } from 'react';
import { Trash2, ShieldCheck, Shield } from 'lucide-react';
import { Admin } from '../../types';
import { getAdmins, addAdmin, updateAdminRole, deleteAdmin } from '../../services/adminService';
import { useAuth } from '../../contexts/AuthContext';

interface Props {
  token: string;
}

export default function ManageAdminsPanel({ token }: Props) {
  const { user } = useAuth();
  const [admins, setAdmins]     = useState<Admin[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole]   = useState<'admin' | 'superadmin'>('admin');
  const [adding, setAdding]     = useState(false);
  const [addError, setAddError] = useState('');

  const load = useCallback(async () => {
    try {
      const data = await getAdmins(token);
      setAdmins(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load admins');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setAddError('');
    setAdding(true);
    try {
      await addAdmin(token, newEmail.trim(), newRole);
      setNewEmail('');
      setNewRole('admin');
      await load();
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Failed to add admin');
    } finally {
      setAdding(false);
    }
  }

  async function handleRoleToggle(admin: Admin) {
    const newR = admin.role === 'superadmin' ? 'admin' : 'superadmin';
    try {
      await updateAdminRole(token, admin.id, newR);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update role');
    }
  }

  async function handleDelete(admin: Admin) {
    if (!confirm(`Remove ${admin.email} from admins?`)) return;
    try {
      await deleteAdmin(token, admin.id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove admin');
    }
  }

  if (loading) return <p className="text-sm text-gray-500">Loading admins…</p>;

  return (
    <div className="space-y-5">
      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* Admin list */}
      <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden">
        {admins.map(admin => {
          const isMe = admin.email === user?.email;
          return (
            <div key={admin.id} className={`flex items-center gap-3 px-3 py-2.5 ${!admin.is_active ? 'opacity-40' : ''}`}>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{admin.email}</p>
                <p className="text-xs text-gray-500 capitalize">{admin.role}{isMe ? ' (you)' : ''}</p>
              </div>
              {!isMe && admin.is_active && (
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleRoleToggle(admin)}
                    title={admin.role === 'superadmin' ? 'Demote to admin' : 'Promote to superadmin'}
                    className="p-1.5 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    {admin.role === 'superadmin'
                      ? <Shield className="w-4 h-4" />
                      : <ShieldCheck className="w-4 h-4" />
                    }
                  </button>
                  <button
                    onClick={() => handleDelete(admin)}
                    title="Remove admin"
                    className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add admin form */}
      <form onSubmit={handleAdd} className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">Add admin</h3>
        <input
          type="email"
          required
          value={newEmail}
          onChange={e => setNewEmail(e.target.value)}
          placeholder="new@example.com"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex gap-2">
          <select
            value={newRole}
            onChange={e => setNewRole(e.target.value as 'admin' | 'superadmin')}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="admin">Admin</option>
            <option value="superadmin">Superadmin</option>
          </select>
          <button
            type="submit"
            disabled={adding}
            className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {adding ? 'Adding…' : 'Add'}
          </button>
        </div>
        {addError && <p className="text-sm text-red-600">{addError}</p>}
      </form>
    </div>
  );
}
