export interface Visit {
  date: string; // ISO date string
  breweryName: string;
  isClosed?: boolean; // true if brewery is closed
  notes?: string; // optional notes for the visit
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
