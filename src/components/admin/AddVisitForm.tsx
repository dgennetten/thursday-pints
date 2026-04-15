import { useState, FormEvent } from 'react';
import { CheckCircle } from 'lucide-react';
import { addVisit } from '../../services/adminService';
import { getUpcomingThursday } from '../../utils';

interface Props {
  token: string;
  breweryNames: string[];
  onSuccess: () => void;
}

export default function AddVisitForm({ token, breweryNames, onSuccess }: Props) {
  const [date, setDate]               = useState(getUpcomingThursday());
  const [breweryName, setBreweryName] = useState('');
  const [nextBrewery, setNextBrewery] = useState('');
  const [notes, setNotes]             = useState('');
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [success, setSuccess]         = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await addVisit(token, {
        date,
        breweryName: breweryName.trim(),
        nextBrewery: nextBrewery.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      setSuccess(true);
      setBreweryName('');
      setNextBrewery('');
      setNotes('');
      setDate(getUpcomingThursday());
      onSuccess();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add visit');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="visit-date" className="block text-sm font-medium text-gray-700 mb-1">
          Visit date
        </label>
        <input
          id="visit-date"
          type="date"
          required
          value={date}
          onChange={e => setDate(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="visit-brewery" className="block text-sm font-medium text-gray-700 mb-1">
          Brewery name
        </label>
        <input
          id="visit-brewery"
          type="text"
          required
          list="brewery-list"
          value={breweryName}
          onChange={e => setBreweryName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Start typing to autocomplete…"
        />
        <datalist id="brewery-list">
          {breweryNames.map(name => (
            <option key={name} value={name} />
          ))}
        </datalist>
      </div>

      <div>
        <label htmlFor="visit-next" className="block text-sm font-medium text-gray-700 mb-1">
          Next week hint / limerick
        </label>
        <textarea
          id="visit-next"
          rows={4}
          value={nextBrewery}
          onChange={e => setNextBrewery(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          placeholder="Limerick or hint for next Thursday's destination…"
        />
      </div>

      <div>
        <label htmlFor="visit-notes" className="block text-sm font-medium text-gray-700 mb-1">
          Notes <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <input
          id="visit-notes"
          type="text"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g. then went to Pour House"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {success && (
        <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          Visit added successfully!
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {loading ? 'Adding…' : 'Add Visit'}
      </button>
    </form>
  );
}
