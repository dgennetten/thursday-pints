import { useState, useEffect, useCallback } from 'react'
import { X, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { fetchVisitPhotos } from '../services/photoService'
import { formatDate } from '../utils'
import type { VisitPhoto } from '../types'

interface Props {
  date: string
  breweryName: string
  token: string
  onClose: () => void
}

export default function PhotoModal({ date, breweryName, token, onClose }: Props) {
  const [photos, setPhotos]   = useState<VisitPhoto[]>([])
  const [idx, setIdx]         = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetchVisitPhotos(date, token)
      .then(p => { setPhotos(p); setIdx(0) })
      .finally(() => setLoading(false))
  }, [date, token])

  const prev = useCallback(() => setIdx(i => Math.max(0, i - 1)), [])
  const next = useCallback(() => setIdx(i => Math.min(photos.length - 1, i + 1)), [photos.length])

  function handleBackdrop(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"
      onClick={handleBackdrop}
    >
      <div className="relative bg-black rounded-lg max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-900">
          <div className="min-w-0">
            <p className="text-white font-semibold truncate">{breweryName}</p>
            <p className="text-gray-400 text-sm">{formatDate(date)}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors ml-3 shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex items-center justify-center relative min-h-0 bg-black">
          {loading ? (
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          ) : photos.length === 0 ? (
            <p className="text-gray-400 text-sm">No photos available.</p>
          ) : (
            <>
              <img
                key={photos[idx].id}
                src={photos[idx].url}
                alt={`${breweryName} visit photo ${idx + 1}`}
                className="max-h-[70vh] max-w-full object-contain"
              />
              {photos.length > 1 && (
                <>
                  <button
                    onClick={prev}
                    disabled={idx === 0}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black bg-opacity-50 hover:bg-opacity-80 rounded-full text-white disabled:opacity-30 transition"
                    aria-label="Previous photo"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={next}
                    disabled={idx === photos.length - 1}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black bg-opacity-50 hover:bg-opacity-80 rounded-full text-white disabled:opacity-30 transition"
                    aria-label="Next photo"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
            </>
          )}
        </div>

        {/* Counter */}
        {!loading && photos.length > 1 && (
          <div className="text-center text-gray-400 text-sm py-2 bg-gray-900">
            {idx + 1} / {photos.length}
          </div>
        )}
      </div>
    </div>
  )
}
