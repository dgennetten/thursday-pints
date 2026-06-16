import { useState, useEffect, useCallback, useRef } from 'react'
import { X, ChevronLeft, ChevronRight, Loader2, Maximize2, Minimize2 } from 'lucide-react'
import { fetchVisitPhotos } from '../services/photoService'
import { formatDate } from '../utils'
import type { VisitPhoto } from '../types'

interface PhotoGroup {
  date: string
  photos: VisitPhoto[]
}

interface Props {
  dates: string[]
  breweryName: string
  token: string
  refreshKey?: number
  onClose: () => void
}

function DateSeparatorBar({ date }: { date: string }) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 bg-gray-800 border-y border-gray-600"
      role="separator"
      aria-label={`Photos from ${formatDate(date)}`}
    >
      <div className="flex-1 h-px bg-gray-500" />
      <span className="text-gray-100 text-sm font-semibold shrink-0 tracking-wide">
        {formatDate(date)}
      </span>
      <div className="flex-1 h-px bg-gray-500" />
    </div>
  )
}

interface FullscreenPhotoProps {
  src: string
  alt: string
  className?: string
}

function FullscreenPhoto({ src, alt, className = 'max-w-full object-contain rounded' }: FullscreenPhotoProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    function onFullscreenChange() {
      setIsFullscreen(document.fullscreenElement === containerRef.current)
    }
    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange)
  }, [])

  async function toggleFullscreen(e: React.MouseEvent) {
    e.stopPropagation()
    if (!containerRef.current) return
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
      } else {
        await containerRef.current.requestFullscreen()
      }
    } catch {
      // fullscreen not supported or denied
    }
  }

  return (
    <div
      ref={containerRef}
      className="relative inline-flex items-center justify-center bg-black max-w-full [&:fullscreen]:w-screen [&:fullscreen]:h-screen"
    >
      <img
        src={src}
        alt={alt}
        className={isFullscreen ? 'max-h-screen max-w-screen object-contain' : className}
      />
      <button
        type="button"
        onClick={toggleFullscreen}
        className="absolute bottom-2 right-2 p-2 bg-black bg-opacity-50 hover:bg-opacity-80 rounded text-white transition"
        aria-label={isFullscreen ? 'Exit fullscreen' : 'View fullscreen'}
      >
        {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
      </button>
    </div>
  )
}

export default function PhotoModal({ dates, breweryName, token, refreshKey = 0, onClose }: Props) {
  const isMultiVisit = dates.length > 1

  const [photos, setPhotos] = useState<VisitPhoto[]>([])
  const [photoGroups, setPhotoGroups] = useState<PhotoGroup[]>([])
  const [idx, setIdx] = useState(0)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState('')

  useEffect(() => {
    setLoading(true)
    setFetchError('')
    setIdx(0)

    if (isMultiVisit) {
      Promise.all(
        dates.map(async date => ({
          date,
          photos: await fetchVisitPhotos(date, token),
        })),
      )
        .then(groups => setPhotoGroups(groups.filter(g => g.photos.length > 0)))
        .catch(err =>
          setFetchError(err instanceof Error ? err.message : 'Failed to load photos'),
        )
        .finally(() => setLoading(false))
      return
    }

    fetchVisitPhotos(dates[0], token)
      .then(p => {
        setPhotos(p)
        setIdx(0)
      })
      .catch(err =>
        setFetchError(err instanceof Error ? err.message : 'Failed to load photos'),
      )
      .finally(() => setLoading(false))
  }, [dates, token, isMultiVisit, refreshKey])

  const prev = useCallback(() => setIdx(i => Math.max(0, i - 1)), [])
  const next = useCallback(
    () => setIdx(i => Math.min(photos.length - 1, i + 1)),
    [photos.length],
  )

  function handleBackdrop(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose()
  }

  const totalMultiPhotos = photoGroups.reduce((n, g) => n + g.photos.length, 0)

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"
      onClick={handleBackdrop}
    >
      <div className="relative bg-black rounded-lg max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-gray-900 shrink-0">
          <div className="min-w-0">
            <p className="text-white font-semibold truncate">{breweryName}</p>
            {!isMultiVisit && dates[0] && (
              <p className="text-gray-400 text-sm">{formatDate(dates[0])}</p>
            )}
            {isMultiVisit && !loading && !fetchError && (
              <p className="text-gray-400 text-sm">
                {photoGroups.length} {photoGroups.length === 1 ? 'visit' : 'visits'} with photos
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors ml-3 shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isMultiVisit ? (
          <div className="flex-1 overflow-y-auto min-h-0 bg-black">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
            ) : fetchError ? (
              <p className="text-red-400 text-sm px-6 py-8 text-center">{fetchError}</p>
            ) : totalMultiPhotos === 0 ? (
              <p className="text-gray-400 text-sm px-6 py-8 text-center">No photos available.</p>
            ) : (
              photoGroups.map(group => (
                <section key={group.date}>
                  <DateSeparatorBar date={group.date} />
                  <div className="flex flex-col items-center gap-4 px-4 py-4">
                    {group.photos.map(photo => (
                      <FullscreenPhoto
                        key={photo.id}
                        src={photo.url}
                        alt={`${breweryName} visit on ${formatDate(group.date)}`}
                      />
                    ))}
                  </div>
                </section>
              ))
            )}
          </div>
        ) : (
          <>
            <div className="flex-1 flex items-center justify-center relative min-h-0 bg-black">
              {loading ? (
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              ) : fetchError ? (
                <p className="text-red-400 text-sm px-6 text-center">{fetchError}</p>
              ) : photos.length === 0 ? (
                <p className="text-gray-400 text-sm">No photos available.</p>
              ) : (
                <>
                  <FullscreenPhoto
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

            {!loading && photos.length > 1 && (
              <div className="text-center text-gray-400 text-sm py-2 bg-gray-900 shrink-0">
                {idx + 1} / {photos.length}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
