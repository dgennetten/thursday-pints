import { useState, useEffect, useCallback, useRef, FormEvent } from 'react';
import { CheckCircle, ChevronLeft, ChevronRight, Loader2, Camera, X } from 'lucide-react';
import { addVisit, getVisits, updateVisit } from '../../services/adminService';
import { fetchVisitPhotos, uploadVisitPhoto, deleteVisitPhoto } from '../../services/photoService';
import { getUpcomingThursday } from '../../utils';
import type { AdminVisit, VisitPhoto } from '../../types';

interface Props {
  token: string;
  breweryNames: string[];
  onSuccess: () => void;
}

export default function AddVisitForm({ token, breweryNames, onSuccess }: Props) {
  const [visits, setVisits]             = useState<AdminVisit[]>([]);
  const [currentIdx, setCurrentIdx]     = useState<number>(-1); // -1 = new entry
  const [loadingVisits, setLoadingVisits] = useState(true);

  // Form fields
  const [date, setDate]               = useState(getUpcomingThursday());
  const [breweryName, setBreweryName] = useState('');
  const [nextBrewery, setNextBrewery] = useState('');
  const [notes, setNotes]             = useState('');

  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Photos
  const [photos, setPhotos]           = useState<VisitPhoto[]>([]);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [uploading, setUploading]     = useState(false);
  const [photoError, setPhotoError]   = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  function populateForm(visit: AdminVisit) {
    setDate(visit.date);
    setBreweryName(visit.breweryName);
    setNextBrewery(visit.nextBrewery ?? '');
    setNotes(visit.notes ?? '');
  }

  function clearForm(targetDate?: string) {
    setDate(targetDate ?? getUpcomingThursday());
    setBreweryName('');
    setNextBrewery('');
    setNotes('');
  }

  const loadPhotos = useCallback(async (visitDate: string) => {
    setPhotoLoading(true);
    setPhotoError('');
    try {
      const p = await fetchVisitPhotos(visitDate, token);
      setPhotos(p);
    } catch {
      setPhotoError('Failed to load photos');
    } finally {
      setPhotoLoading(false);
    }
  }, [token]);

  const loadAndPosition = useCallback(async (
    opts?: { targetDate?: string; targetId?: number }
  ) => {
    const loaded = await getVisits(token);
    const sorted = [...loaded].sort((a, b) => a.date.localeCompare(b.date));
    setVisits(sorted);

    // After saving: navigate to the visit we just created/updated
    if (opts?.targetId != null) {
      const idx = sorted.findIndex(v => v.id === opts.targetId);
      if (idx >= 0) { setCurrentIdx(idx); populateForm(sorted[idx]); void loadPhotos(sorted[idx].date); return; }
    }
    if (opts?.targetDate) {
      const idx = sorted.findIndex(v => v.date === opts.targetDate);
      if (idx >= 0) { setCurrentIdx(idx); populateForm(sorted[idx]); void loadPhotos(sorted[idx].date); return; }
    }

    // Smart initialization: if the most recent visit is next Thursday, load it for editing.
    // Otherwise prep a blank new entry.
    const nextThu = getUpcomingThursday();
    const latest  = sorted[sorted.length - 1];
    if (latest && latest.date === nextThu) {
      setCurrentIdx(sorted.length - 1);
      populateForm(latest);
      void loadPhotos(latest.date);
    } else {
      setCurrentIdx(-1);
      clearForm(nextThu);
    }
  }, [token, loadPhotos]);

  useEffect(() => {
    setLoadingVisits(true);
    loadAndPosition().finally(() => setLoadingVisits(false));
  }, [loadAndPosition]);

  // Derived state
  const isNew           = currentIdx === -1;
  const visitNumber     = isNew ? visits.length + 1 : currentIdx + 1;
  const isPrevDisabled  = visits.length === 0 || currentIdx === 0;
  const isNextDisabled  = isNew;

  function navigateTo(idx: number) {
    setError('');
    setSuccessMsg('');
    setPhotos([]);
    setPhotoError('');
    if (idx === -1) {
      setCurrentIdx(-1);
      clearForm();
    } else {
      setCurrentIdx(idx);
      populateForm(visits[idx]);
      void loadPhotos(visits[idx].date);
    }
  }

  function handlePrev() {
    if (isNew)             navigateTo(visits.length - 1);
    else if (currentIdx > 0) navigateTo(currentIdx - 1);
  }

  function handleNext() {
    if (!isNew && currentIdx < visits.length - 1) navigateTo(currentIdx + 1);
    else if (!isNew && currentIdx === visits.length - 1) navigateTo(-1);
  }

  async function handlePhotoUpload(file: File) {
    if (!file || isNew) return;
    setUploading(true);
    setPhotoError('');
    try {
      const photo = await uploadVisitPhoto(date, visits[currentIdx].breweryName, file, token);
      setPhotos(prev => [...prev, photo]);
      onSuccess();
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handlePhotoDelete(id: number) {
    setPhotoError('');
    try {
      await deleteVisitPhoto(id, token);
      setPhotos(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : 'Delete failed');
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setSaving(true);
    try {
      const payload = {
        date,
        breweryName: breweryName.trim(),
        nextBrewery: nextBrewery.trim() || undefined,
        notes:       notes.trim()       || undefined,
      };

      if (isNew) {
        await addVisit(token, payload);
        onSuccess();
        setSuccessMsg('Visit added!');
        await loadAndPosition({ targetDate: date });
      } else {
        const id = visits[currentIdx].id;
        await updateVisit(token, id, payload);
        onSuccess();
        setSuccessMsg('Changes saved!');
        await loadAndPosition({ targetId: id });
      }

      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  if (loadingVisits) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* Visit number + Prev/Next */}
      <div className="flex items-center justify-between pb-1 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-gray-900">Visit #{visitNumber}</span>
          {isNew && (
            <span className="text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded px-1.5 py-0.5 leading-none">
              New
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handlePrev}
            disabled={isPrevDisabled}
            className="flex items-center gap-0.5 px-2 py-1 rounded-lg text-xs font-semibold text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            PREV
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={isNextDisabled}
            className="flex items-center gap-0.5 px-2 py-1 rounded-lg text-xs font-semibold text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            NEXT
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Date */}
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

      {/* Brewery */}
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

      {/* Next hint / limerick */}
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

      {/* Notes */}
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

      {/* Photos — only for existing visits */}
      {!isNew && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Camera className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Photos</span>
          </div>

          {photoLoading ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading…
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 items-start">
              {photos.map(photo => (
                <div key={photo.id} className="relative group">
                  <img
                    src={photo.url}
                    alt="Visit photo"
                    className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => handlePhotoDelete(photo.id)}
                    className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove photo"
                    aria-label="Remove photo"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}

              {/* Upload button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-20 h-20 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg text-gray-400 hover:border-blue-400 hover:text-blue-500 disabled:opacity-50 transition-colors"
                title="Upload photo"
              >
                {uploading
                  ? <Loader2 className="w-5 h-5 animate-spin" />
                  : <Camera className="w-5 h-5" />}
                <span className="text-xs mt-1">{uploading ? 'Uploading' : 'Add'}</span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) void handlePhotoUpload(file);
                }}
              />
            </div>
          )}

          {photoError && <p className="mt-2 text-sm text-red-600">{photoError}</p>}
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {successMsg && (
        <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          {successMsg}
        </div>
      )}

      <button
        type="submit"
        disabled={saving}
        className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
        {saving ? 'Saving…' : isNew ? 'Add Visit' : 'Save Changes'}
      </button>

    </form>
  );
}
