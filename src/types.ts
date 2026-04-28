export interface Visit {
  date: string; // ISO date string
  breweryName: string;
  isClosed?: boolean; // true if brewery is closed
  notes?: string; // optional notes for the visit
  nextBrewery?: string; // either a brewery name or a limerick
}

export interface BreweryStats {
  name: string;
  visitCount: number;
  lastVisitDate: string;
  isClosed: boolean;
}

export interface BreweryLocation {
  brewery_name: string;
  brewery_address: string;
  latitude: number;
  longitude: number;
  status: string; // "Open" or "Closed"
}

export interface BreweryWithLocation extends BreweryStats {
  lat?: number;
  lng?: number;
  address?: string;
}

export interface Admin {
  id: number;
  email: string;
  role: 'admin' | 'superadmin' | 'member';
  is_active: boolean;
  created_at: string;
}

export interface VisitPhoto {
  id: number;
  filename: string;
  url: string;
  created_at: string;
}

export interface AddVisitPayload {
  date: string;
  breweryName: string;
  nextBrewery?: string;
  notes?: string;
}

export interface AddBreweryPayload {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

export interface AdminVisit {
  id: number;
  date: string;         // YYYY-MM-DD
  breweryName: string;
  nextBrewery?: string;
  notes?: string;
  isClosed?: boolean;
}

export interface UpdateVisitPayload {
  date: string;
  breweryName: string;
  nextBrewery?: string;
  notes?: string;
}
