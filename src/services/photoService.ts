import type { VisitPhoto } from '../types'
import { getApiBase } from '../apiBase'

const API_BASE = getApiBase()

const noStore: RequestInit = { cache: 'no-store' }

export async function fetchPhotoAvailability(): Promise<string[]> {
  const res = await fetch(`${API_BASE}/photos.php?v=${Date.now()}`, noStore)
  if (!res.ok) return []
  const data = await res.json() as { dates?: string[] }
  return data.dates ?? []
}

export async function fetchVisitPhotos(date: string, token: string): Promise<VisitPhoto[]> {
  const res = await fetch(
    `${API_BASE}/admin/photos.php?date=${encodeURIComponent(date)}&v=${Date.now()}`,
    {
      ...noStore,
      headers: { Authorization: `Bearer ${token}` },
    },
  )
  if (!res.ok) {
    const data = await res.json().catch(() => ({})) as { error?: string }
    throw new Error(data.error ?? `HTTP ${res.status}`)
  }
  return res.json() as Promise<VisitPhoto[]>
}

export async function uploadVisitPhoto(
  date: string,
  breweryName: string,
  file: File,
  token: string,
): Promise<VisitPhoto> {
  const form = new FormData()
  form.append('visit_date', date)
  form.append('brewery_name', breweryName)
  form.append('photo', file)

  const res = await fetch(`${API_BASE}/admin/photos.php`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({})) as { error?: string }
    throw new Error(data.error ?? `Upload failed (${res.status})`)
  }
  return res.json() as Promise<VisitPhoto>
}

export async function deleteVisitPhoto(id: number, token: string): Promise<void> {
  const res = await fetch(`${API_BASE}/admin/photos.php`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({})) as { error?: string }
    throw new Error(data.error ?? `Delete failed (${res.status})`)
  }
}
