import { useState, useEffect, useCallback, FormEvent } from 'react';
import { Trash2, Copy, Check, Cake, Pencil } from 'lucide-react';
import { Admin } from '../../types';
import { getAdmins, addAdmin, deleteAdmin, updateMemberInfo } from '../../services/adminService';
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
  const [addSuccess, setAddSuccess] = useState('');
  const [copied, setCopied]         = useState(false);
  const [editingId, setEditingId]   = useState<number | null>(null);
  const [editEmail, setEditEmail]   = useState('');
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName]   = useState('');
  const [editBirthMonth, setEditBirthMonth] = useState<number | ''>('');
  const [editBirthDay, setEditBirthDay]     = useState<number | ''>('');
  const [editRole, setEditRole]             = useState<'admin' | 'superadmin' | 'member'>('member');
  const [saving, setSaving]         = useState(false);
  const [editError, setEditError]   = useState('');

  const load = useCallback(async () => {
    try {
      const data = await getAdmins(token);
      data.sort((a, b) => {
        const la = (a.last_name  ?? '').toLowerCase();
        const lb = (b.last_name  ?? '').toLowerCase();
        const fa = (a.first_name ?? '').toLowerCase();
        const fb = (b.first_name ?? '').toLowerCase();
        return la !== lb ? la.localeCompare(lb) : fa.localeCompare(fb);
      });
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
    setAddSuccess('');
    setAdding(true);
    try {
      const result = await addAdmin(
        token,
        newEmail.trim(),
        newRole,
        firstName.trim() || undefined,
        lastName.trim()  || undefined,
        birthMonth !== '' ? birthMonth : undefined,
        birthDay   !== '' ? birthDay   : undefined,
      );
      const addedEmail = newEmail.trim();
      if (newRole === 'member') {
        if (result.welcomeEmailSent) {
          setAddSuccess(`Member added. Welcome email sent to ${addedEmail} (you were CC'd).`);
        } else {
          setAddSuccess(`Member added, but the welcome email could not be sent to ${addedEmail}.`);
        }
      } else {
        setAddSuccess(`${newRole.charAt(0).toUpperCase()}${newRole.slice(1)} added.`);
      }
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

  function canEditProfile(admin: Admin): boolean {
    if (!admin.is_active) return false;
    return isSuperadmin || admin.role === 'member';
  }

  function startEdit(admin: Admin) {
    setEditingId(admin.id);
    setEditEmail(admin.email);
    setEditFirstName(admin.first_name ?? '');
    setEditLastName(admin.last_name ?? '');
    setEditBirthMonth(admin.birth_month ?? '');
    setEditBirthDay(admin.birth_day ?? '');
    setEditRole(admin.role);
    setEditError('');
  }

  function cancelEdit() {
    setEditingId(null);
    setEditError('');
  }

  async function handleSaveEdit(e: FormEvent) {
    e.preventDefault();
    if (editingId == null) return;
    setEditError('');
    setSaving(true);
    try {
      const editingAdmin = admins.find(a => a.id === editingId);
      const isEditingSelf = editingAdmin?.email === user?.email;
      await updateMemberInfo(
        token,
        editingId,
        editEmail.trim(),
        editFirstName.trim() || undefined,
        editLastName.trim()  || undefined,
        editBirthMonth !== '' ? editBirthMonth : undefined,
        editBirthDay   !== '' ? editBirthDay   : undefined,
        isSuperadmin && !isEditingSelf ? editRole : undefined,
      );
      setEditingId(null);
      await load();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setSaving(false);
    }
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
          const canDelete = isSuperadmin && !isMe && admin.is_active;
          const canEdit = canEditProfile(admin);
          const hasBirthday = admin.birth_month != null && admin.birth_day != null;
          const isEditing = editingId === admin.id;

          if (isEditing) {
            return (
              <form key={admin.id} onSubmit={handleSaveEdit} className="px-3 py-3 bg-blue-50 space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editFirstName}
                    onChange={e => setEditFirstName(e.target.value)}
                    placeholder="First name"
                    className="flex-1 px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    value={editLastName}
                    onChange={e => setEditLastName(e.target.value)}
                    placeholder="Last name"
                    className="flex-1 px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={e => setEditEmail(e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex gap-2">
                  <select
                    value={editBirthMonth}
                    onChange={e => setEditBirthMonth(e.target.value === '' ? '' : Number(e.target.value))}
                    className="flex-1 px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Birth month</option>
                    {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                  </select>
                  <select
                    value={editBirthDay}
                    onChange={e => setEditBirthDay(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-20 px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Day</option>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                {isSuperadmin && !isMe && (
                  <select
                    value={editRole}
                    onChange={e => setEditRole(e.target.value as 'admin' | 'superadmin' | 'member')}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                    <option value="superadmin">Superadmin</option>
                  </select>
                )}
                {editError && <p className="text-xs text-red-600">{editError}</p>}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="flex-1 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </form>
            );
          }

          return (
            <div key={admin.id} className={`flex items-center gap-3 px-3 py-2.5 ${!admin.is_active ? 'opacity-40' : ''}`}>
              <div className="flex-1 min-w-0">
                {(admin.first_name || admin.last_name) && (
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {[admin.last_name, admin.first_name].filter(Boolean).join(', ')}
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
              <div className="flex items-center gap-1 shrink-0">
                {canEdit && (
                  <button
                    onClick={() => startEdit(admin)}
                    title="Edit user info"
                    className="p-1.5 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={() => handleDelete(admin)}
                    title="Remove user"
                    className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
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
        {addSuccess && <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">{addSuccess}</p>}
      </form>
    </div>
  );
}
