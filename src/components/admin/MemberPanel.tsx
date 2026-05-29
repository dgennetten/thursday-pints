import { useState, useEffect } from 'react';
import { X, Cake } from 'lucide-react';
import { Member } from '../../types';
import { fetchMembers } from '../../services/adminService';
import { useAuth } from '../../contexts/AuthContext';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

interface Props {
  onClose: () => void;
}

export default function MemberPanel({ onClose }: Props) {
  const { user, logout } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    if (!user?.token) return;
    fetchMembers(user.token)
      .then(setMembers)
      .catch(() => setError('Failed to load members'))
      .finally(() => setLoading(false));
  }, [user?.token]);

  function handleLogout() {
    logout();
    onClose();
  }

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-30 z-40" onClick={onClose} />

      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 shrink-0">
          <div className="min-w-0">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Members</p>
            <p className="text-sm text-gray-700 truncate">{user?.email}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-3">
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-gray-700 border border-gray-300 rounded-lg px-3 py-1.5 transition-colors"
            >
              Log out
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors" aria-label="Close">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {loading && <p className="text-sm text-gray-500">Loading members…</p>}
          {error   && <p className="text-sm text-red-600">{error}</p>}
          {!loading && !error && (
            <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden">
              {members.map((m, i) => {
                const name = [m.last_name, m.first_name].filter(Boolean).join(', ') || '—';
                const hasBirthday = m.birth_month != null && m.birth_day != null;
                return (
                  <div key={i} className="flex items-center justify-between px-3 py-2.5">
                    <p className="text-sm text-gray-900">{name}</p>
                    {hasBirthday && (
                      <span className="flex items-center gap-0.5 text-xs text-pink-500">
                        <Cake className="w-3 h-3" />
                        {MONTHS[m.birth_month! - 1]} {m.birth_day}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 px-5 py-3 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
}
