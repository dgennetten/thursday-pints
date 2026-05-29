import { useState, useEffect, useCallback, FormEvent } from 'react';
import { Trash2, ShieldCheck, Shield, Copy, Check, Cake } from 'lucide-react';
import { Admin } from '../../types';
import { getAdmins, addAdmin, updateAdminRole, deleteAdmin } from '../../services/adminService';
import { useAuth } from '../../contexts/AuthContext';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

interface Props {
  token: string;
}

export default function ManageAdminsPanel({ token }: Props) {
  const { user } = useAuth();
  const isSuperadmin = user?.role === 'superadmin';
  const [admins, setAdmins]         = useState<Admin[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [newEmail, setNewEmail]     = useState('');
  const [newRole, setNewRole]       = useState<'admin' | 'superadmin' | 'member'>('member');
  const [firstName, setFirstName]   = useState('');
  const [lastName, setLastName]     = useState('');
  const [birthMonth, setBirthMonth] = useState<number | ''>('');
  const [birthDay, setBirthDay]     = useState<number | ''>('');
  const [adding, setAdding]         = useState(false);
  const [addError, setAddError]     = useState('');
  const [copied, setCopied]         = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getAdmins(token);
      setAdmins(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
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
      await addAdmin(
        token,
        newEmail.trim(),
        newRole,
        firstName.trim() || undefined,
        lastName.trim()  || undefined,
        birthMonth !== '' ? birthMonth : undefined,
        birthDay   !== '' ? birthDay   : undefined,
      );
      setNewEmail('');
      setNewRole(isSuperadmin ? 'admin' : 'member');
      setFirstName('');
      setLastName('');
      setBirthMonth('');
      setBirthDay('');
      await load();
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Failed to add user');
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
    if (!confirm(`Remove ${admin.email}?`)) return;
    try {
      await deleteAdmin(token, admin.id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove user');
    }
  }

  function handleCopyEmails() {
    const emails = admins.filter(a => a.is_active).map(a => a.email).join(', ');
    navigator.clipboard.writeText(emails).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  if (loading) return <p className="text-sm text-gray-500">Loading users…</p>;

  return (
    <div className="space-y-5">
      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* Copy emails button */}
      <button
        type="button"
        onClick={handleCopyEmails}
        className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-blue-600 transition-colors"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
        {copied ? 'Copied!' : 'Copy active member emails'}
      </button>

      {/* User list */}
      <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden">
        {admins.map(admin => {
          const isMe = admin.email === user?.email;
          const canModify = isSuperadmin && !isMe && admin.is_active;
          const hasBirthday = admin.birth_month != null && admin.birth_day != null;
          return (
            <div key={admin.id} className={`flex items-center gap-3 px-3 py-2.5 ${!admin.is_active ? 'opacity-40' : ''}`}>
              <div className="flex-1 min-w-0">
                {(admin.first_name || admin.last_name) && (
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {[admin.first_name, admin.last_name].filter(Boolean).join(' ')}
                  </p>
                )}
                <p className={`truncate ${admin.first_name || admin.last_name ? 'text-xs text-gray-400' : 'text-sm font-medium text-gray-900'}`}>{admin.email}</p>
                <p className="text-xs text-gray-500 capitalize flex items-center gap-1.5">
                  {admin.role}{isMe ? ' (you)' : ''}
                  {hasBirthday && (
                    <span className="flex items-center gap-0.5 text-pink-500">
                      <Cake className="w-3 h-3" />
                      {MONTHS[admin.birth_month! - 1]} {admin.birth_day}
                    </span>
                  )}
                </p>
              </div>
              {canModify && (
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
                    title="Remove user"
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

      {/* Add user form */}
      <form onSubmit={handleAdd} className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">Add {isSuperadmin ? 'user' : 'member'}</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={firstName}
            onChange={e => setFirstName(e.target.value)}
            placeholder="First name"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            value={lastName}
            onChange={e => setLastName(e.target.value)}
            placeholder="Last name"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <input
          type="email"
          required
          value={newEmail}
          onChange={e => setNewEmail(e.target.value)}
          placeholder="new@example.com"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* Birthday selectors */}
        <div className="flex gap-2">
          <select
            value={birthMonth}
            onChange={e => setBirthMonth(e.target.value === '' ? '' : Number(e.target.value))}
            className="flex-1 px-2 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Birth month</option>
            {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
          </select>
          <select
            value={birthDay}
            onChange={e => setBirthDay(e.target.value === '' ? '' : Number(e.target.value))}
            className="w-20 px-2 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Day</option>
            {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          {isSuperadmin ? (
            <select
              value={newRole}
              onChange={e => setNewRole(e.target.value as 'admin' | 'superadmin' | 'member')}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
              <option value="superadmin">Superadmin</option>
            </select>
          ) : (
            <span className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-500 bg-gray-50">
              Member
            </span>
          )}
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
