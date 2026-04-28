import { useState, useEffect } from 'react';
import { X, CalendarPlus, Beer, Users } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getBreweryNames } from '../../services/adminService';
import AddVisitForm from './AddVisitForm';
import AddBreweryForm from './AddBreweryForm';
import ManageAdminsPanel from './ManageAdminsPanel';

type Tab = 'visit' | 'brewery' | 'admins';

interface Props {
  onClose: () => void;
  onDataChange: () => void;
}

export default function AdminPanel({ onClose, onDataChange }: Props) {
  const { user, logout } = useAuth();
  const [tab, setTab]                   = useState<Tab>('visit');
  const [breweryNames, setBreweryNames] = useState<string[]>([]);

  useEffect(() => {
    if (!user?.token) return;
    getBreweryNames(user.token).then(setBreweryNames).catch(() => {});
  }, [user?.token]);

  function handleLogout() {
    logout();
    onClose();
  }

  const tabs: { id: Tab; label: string; icon: typeof CalendarPlus }[] = [
    { id: 'visit',   label: 'Tour Visits', icon: CalendarPlus },
    { id: 'brewery', label: 'Add Brewery', icon: Beer },
    ...(user?.role === 'superadmin'
      ? [{ id: 'admins' as Tab, label: 'Users', icon: Users }]
      : []),
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-30 z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 shrink-0">
          <div className="min-w-0">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Admin</p>
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

        {/* Tabs */}
        <div className="flex border-b border-gray-200 shrink-0">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {tab === 'visit' && user?.token && (
            <AddVisitForm
              token={user.token}
              breweryNames={breweryNames}
              onSuccess={onDataChange}
            />
          )}
          {tab === 'brewery' && user?.token && (
            <AddBreweryForm
              token={user.token}
              breweryNames={breweryNames}
              onSuccess={() => {
                onDataChange();
                // Refresh brewery names list after adding a new one
                getBreweryNames(user.token).then(setBreweryNames).catch(() => {});
              }}
            />
          )}
          {tab === 'admins' && user?.token && user.role === 'superadmin' && (
            <ManageAdminsPanel token={user.token} />
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 px-5 py-3 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Close Admin
          </button>
        </div>
      </div>
    </>
  );
}
