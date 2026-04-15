import { useState, useEffect, useRef, FormEvent } from 'react';
import { CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react';
import { addBrewery } from '../../services/adminService';
import { findFuzzyMatches } from '../../utils/fuzzy';

interface Props {
  token: string;
  breweryNames: string[];
  onSuccess: () => void;
}

type NameStatus = 'idle' | 'ok' | 'duplicate' | 'fuzzy';

export default function AddBreweryForm({ token, breweryNames, onSuccess }: Props) {
  const [name, setName]           = useState('');
  const [address, setAddress]     = useState('');
  const [lat, setLat]             = useState('');
  const [lng, setLng]             = useState('');
  const [loading, setLoading]     = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState(false);

  const [nameStatus, setNameStatus]   = useState<NameStatus>('idle');
  const [fuzzyMatches, setFuzzyMatches] = useState<string[]>([]);

  const nameDebounceRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const addressDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fuzzy name check
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

  // Auto-geocode address via Nominatim
  function handleAddressBlur() {
    const trimmed = address.trim();
    if (!trimmed) return;

    if (addressDebounceRef.current) clearTimeout(addressDebounceRef.current);
    addressDebounceRef.current = setTimeout(async () => {
      setGeocoding(true);
      try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(trimmed)}&format=json&limit=1`;
        const res = await fetch(url, {
          headers: { 'User-Agent': 'ThursdayPints/1.0 (thursdaypints.com)' },
        });
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setLat(parseFloat(data[0].lat).toFixed(7));
          setLng(parseFloat(data[0].lon).toFixed(7));
        }
      } catch {
        // Geocode failed — leave fields for manual entry
      } finally {
        setGeocoding(false);
      }
    }, 0);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (nameStatus === 'duplicate') return;
    setError('');
    setLoading(true);
    try {
      await addBrewery(token, {
        name: name.trim(),
        address: address.trim(),
        latitude: parseFloat(lat),
        longitude: parseFloat(lng),
      });
      setSuccess(true);
      setName('');
      setAddress('');
      setLat('');
      setLng('');
      setNameStatus('idle');
      onSuccess();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add brewery');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name */}
      <div>
        <label htmlFor="brewery-name" className="block text-sm font-medium text-gray-700 mb-1">
          Brewery name
        </label>
        <input
          id="brewery-name"
          type="text"
          required
          value={name}
          onChange={e => setName(e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            nameStatus === 'duplicate' ? 'border-red-400' :
            nameStatus === 'fuzzy'     ? 'border-yellow-400' :
            nameStatus === 'ok'        ? 'border-green-400' :
                                         'border-gray-300'
          }`}
          placeholder="e.g. Odell Brewing Company"
        />

        {nameStatus === 'duplicate' && (
          <div className="flex items-center gap-1.5 mt-1.5 text-sm text-red-600">
            <AlertCircle className="w-4 h-4 shrink-0" />
            This brewery already exists.
          </div>
        )}

        {nameStatus === 'fuzzy' && fuzzyMatches.length > 0 && (
          <div className="flex items-start gap-1.5 mt-1.5 text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Did you mean{' '}
              {fuzzyMatches.map((m, i) => (
                <span key={m}>
                  <button
                    type="button"
                    onClick={() => setName(m)}
                    className="underline font-medium hover:text-yellow-900"
                  >
                    {m}
                  </button>
                  {i < fuzzyMatches.length - 1 ? ', ' : '?'}
                </span>
              ))}
            </span>
          </div>
        )}

        {nameStatus === 'ok' && (
          <div className="flex items-center gap-1.5 mt-1.5 text-sm text-green-600">
            <CheckCircle className="w-4 h-4 shrink-0" />
            Name looks good.
          </div>
        )}
      </div>

      {/* Address */}
      <div>
        <label htmlFor="brewery-address" className="block text-sm font-medium text-gray-700 mb-1">
          Address
          {geocoding && <span className="ml-2 text-xs text-gray-400 font-normal">Geocoding…</span>}
        </label>
        <input
          id="brewery-address"
          type="text"
          required
          value={address}
          onChange={e => setAddress(e.target.value)}
          onBlur={handleAddressBlur}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="500 Linden St, Fort Collins, CO 80524"
        />
        {lat && lng && !geocoding && (
          <p className="mt-1 text-xs text-green-600">Coordinates auto-filled from address.</p>
        )}
      </div>

      {/* Lat / Lng */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="brewery-lat" className="block text-sm font-medium text-gray-700 mb-1">
            Latitude
          </label>
          <input
            id="brewery-lat"
            type="number"
            required
            step="0.0000001"
            value={lat}
            onChange={e => setLat(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="40.5876543"
          />
        </div>
        <div>
          <label htmlFor="brewery-lng" className="block text-sm font-medium text-gray-700 mb-1">
            Longitude
          </label>
          <input
            id="brewery-lng"
            type="number"
            required
            step="0.0000001"
            value={lng}
            onChange={e => setLng(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="-105.0723456"
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {success && (
        <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          Brewery added successfully!
        </div>
      )}

      <button
        type="submit"
        disabled={loading || nameStatus === 'duplicate'}
        className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {loading ? 'Adding…' : 'Add Brewery'}
      </button>
    </form>
  );
}
