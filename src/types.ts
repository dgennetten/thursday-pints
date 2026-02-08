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
