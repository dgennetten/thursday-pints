import { useState, useEffect, useCallback, useRef, FormEvent } from 'react';
import { CheckCircle, AlertCircle, AlertTriangle, Pencil } from 'lucide-react';
import { AdminBrewery } from '../../types';
import { getAdminBreweries, addBrewery, updateBrewery } from '../../services/adminService';
import { findFuzzyMatches } from '../../utils/fuzzy';

interface Props {
  token: string;
  onSuccess: () => void;
}

type NameStatus = 'idle' | 'ok' | 'duplicate' | 'fuzzy';

export default function ManageBreweriesPanel({ token, onSuccess }: Props) {
  const [breweries, setBreweries]       = useState<AdminBrewery[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');

  const [editingId, setEditingId]       = useState<number | null>(null);
  const [editStatus, setEditStatus]     = useState<'Open' | 'Closed'>('Open');
  const [editAddress, setEditAddress]   = useState('');
  const [editLat, setEditLat]           = useState('');
  const [editLng, setEditLng]           = useState('');
  const [editWebsite, setEditWebsite]   = useState('');
  const [editGeocoding, setEditGeocoding] = useState(false);
  const [saving, setSaving]             = useState(false);
  const [editError, setEditError]       = useState('');

  const [name, setName]                 = useState('');
  const [address, setAddress]           = useState('');
  const [lat, setLat]                   = useState('');
  const [lng, setLng]                   = useState('');
  const [website, setWebsite]           = useState('');
  const [adding, setAdding]             = useState(false);
  const [geocoding, setGeocoding]       = useState(false);
  const [addError, setAddError]         = useState('');
  const [addSuccess, setAddSuccess]     = useState('');
  const [nameStatus, setNameStatus]     = useState<NameStatus>('idle');
  const [fuzzyMatches, setFuzzyMatches] = useState<string[]>([]);

  const nameDebounceRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const addressDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const breweryNames = breweries.map(b => b.brewery_name);

  const load = useCallback(async () => {
    try {
      const data = await getAdminBreweries(token);
      setBreweries(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load breweries');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (nameDebounceRef.current) clearTimeout(nameDebounceRef.current);
    const trimmed = name.trim();
    if (!trimmed) {
      setNameStatus('idle');
      setFuzzyMatches([]);
      return;
    }
    nameDebounceRef.current = setTimeout(() => {
      const lower = trimmed.toLowerCase();
      const exact = breweryNames.some(n => n.toLowerCase() === lower);
      if (exact) {
        setNameStatus('duplicate');
        setFuzzyMatches([]);
        return;
      }
      const matches = findFuzzyMatches(trimmed, breweryNames);
      if (matches.length > 0) {
        setNameStatus('fuzzy');
        setFuzzyMatches(matches);
      } else {
        setNameStatus('ok');
        setFuzzyMatches([]);
      }
    }, 500);
  }, [name, breweryNames]);

  async function geocodeAddress(addr: string, setLatFn: (v: string) => void, setLngFn: (v: string) => void, setBusy: (v: boolean) => void) {
    const trimmed = addr.trim();
    if (!trimmed) return;
    setBusy(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(trimmed)}&format=json&limit=1`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'ThursdayPints/1.0 (thursdaypints.com)' },
      });
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setLatFn(parseFloat(data[0].lat).toFixed(7));
        setLngFn(parseFloat(data[0].lon).toFixed(7));
      }
    } catch {
      // leave for manual entry
    } finally {
      setBusy(false);
    }
  }

  function startEdit(brewery: AdminBrewery) {
    setEditingId(brewery.id);
    setEditStatus(brewery.status);
    setEditAddress(brewery.brewery_address);
    setEditLat(String(brewery.latitude));
    setEditLng(String(brewery.longitude));
    setEditWebsite(brewery.website_url ?? '');
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
      await updateBrewery(token, editingId, {
        status: editStatus,
        brewery_address: editAddress.trim(),
        latitude: parseFloat(editLat),
        longitude: parseFloat(editLng),
        website_url: editWebsite.trim() || null,
      });
      setEditingId(null);
      await load();
      onSuccess();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  }

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (nameStatus === 'duplicate') return;
    setAddError('');
    setAddSuccess('');
    setAdding(true);
    try {
      await addBrewery(token, {
        name: name.trim(),
        address: address.trim(),
        latitude: parseFloat(lat),
        longitude: parseFloat(lng),
        ...(website.trim() ? { website_url: website.trim() } : {}),
      });
      setAddSuccess(`${name.trim()} added.`);
      setName('');
      setAddress('');
      setLat('');
      setLng('');
      setWebsite('');
      setNameStatus('idle');
      await load();
      onSuccess();
      setTimeout(() => setAddSuccess(''), 3000);
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Failed to add brewery');
    } finally {
      setAdding(false);
    }
  }

  if (loading) return <p className="text-sm text-gray-500">Loading breweries…</p>;

  return (
    <div className="space-y-5">
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden">
        {breweries.map(brewery => {
          const isEditing = editingId === brewery.id;

          if (isEditing) {
            return (
              <form key={brewery.id} onSubmit={handleSaveEdit} className="px-3 py-3 bg-blue-50 space-y-2">
                <p className="text-sm font-medium text-gray-900">{brewery.brewery_name}</p>
                <select
                  value={editStatus}
                  onChange={e => setEditStatus(e.target.value as 'Open' | 'Closed')}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Open">Open</option>
                  <option value="Closed">Closed</option>
                </select>
                <input
                  type="text"
                  required
                  value={editAddress}
                  onChange={e => setEditAddress(e.target.value)}
                  onBlur={() => geocodeAddress(editAddress, setEditLat, setEditLng, setEditGeocoding)}
                  placeholder="Address"
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {editGeocoding && <p className="text-xs text-gray-400">Geocoding…</p>}
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    required
                    step="0.0000001"
                    value={editLat}
                    onChange={e => setEditLat(e.target.value)}
                    placeholder="Latitude"
                    className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    required
                    step="0.0000001"
                    value={editLng}
                    onChange={e => setEditLng(e.target.value)}
                    placeholder="Longitude"
                    className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <input
                  type="url"
                  value={editWebsite}
                  onChange={e => setEditWebsite(e.target.value)}
                  placeholder="Website or tap list URL"
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
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
            <div
              key={brewery.id}
              className={`flex items-center gap-3 px-3 py-2.5 ${brewery.status === 'Closed' ? 'opacity-60' : ''}`}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{brewery.brewery_name}</p>
                <p className="text-xs text-gray-500 truncate">{brewery.brewery_address}</p>
                <p className="text-xs text-gray-400 capitalize">{brewery.status}</p>
              </div>
              <button
                onClick={() => startEdit(brewery)}
                title="Edit brewery"
                className="p-1.5 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors shrink-0"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      <form onSubmit={handleAdd} className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">Add brewery</h3>
        <input
          type="text"
          required
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Brewery name"
          className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            nameStatus === 'duplicate' ? 'border-red-400' :
            nameStatus === 'fuzzy'     ? 'border-yellow-400' :
            nameStatus === 'ok'        ? 'border-green-400' :
                                         'border-gray-300'
          }`}
        />
        {nameStatus === 'duplicate' && (
          <div className="flex items-center gap-1.5 text-sm text-red-600">
            <AlertCircle className="w-4 h-4 shrink-0" />
            This brewery already exists.
          </div>
        )}
        {nameStatus === 'fuzzy' && fuzzyMatches.length > 0 && (
          <div className="flex items-start gap-1.5 text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Did you mean{' '}
              {fuzzyMatches.map((m, i) => (
                <span key={m}>
                  <button type="button" onClick={() => setName(m)} className="underline font-medium hover:text-yellow-900">
                    {m}
                  </button>
                  {i < fuzzyMatches.length - 1 ? ', ' : '?'}
                </span>
              ))}
            </span>
          </div>
        )}
        {nameStatus === 'ok' && (
          <div className="flex items-center gap-1.5 text-sm text-green-600">
            <CheckCircle className="w-4 h-4 shrink-0" />
            Name looks good.
          </div>
        )}
        <input
          type="text"
          required
          value={address}
          onChange={e => setAddress(e.target.value)}
          onBlur={() => {
            if (addressDebounceRef.current) clearTimeout(addressDebounceRef.current);
            addressDebounceRef.current = setTimeout(
              () => geocodeAddress(address, setLat, setLng, setGeocoding),
              0
            );
          }}
          placeholder="Address"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {geocoding && <p className="text-xs text-gray-400">Geocoding…</p>}
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            required
            step="0.0000001"
            value={lat}
            onChange={e => setLat(e.target.value)}
            placeholder="Latitude"
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="number"
            required
            step="0.0000001"
            value={lng}
            onChange={e => setLng(e.target.value)}
            placeholder="Longitude"
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <input
          type="url"
          value={website}
          onChange={e => setWebsite(e.target.value)}
          placeholder="Website or tap list URL (optional)"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={adding || nameStatus === 'duplicate'}
          className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {adding ? 'Adding…' : 'Add'}
        </button>
        {addError && <p className="text-sm text-red-600">{addError}</p>}
        {addSuccess && (
          <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">{addSuccess}</p>
        )}
      </form>
    </div>
  );
}
