import { Visit, BreweryStats } from './types';

export function processVisits(visits: Visit[]): BreweryStats[] {
  const breweryMap = new Map<string, { count: number; lastDate: string; isClosed: boolean }>();

  visits.forEach(visit => {
    const existing = breweryMap.get(visit.breweryName);
    const visitDate = new Date(visit.date);
    
    if (!existing) {
      breweryMap.set(visit.breweryName, {
        count: 1,
        lastDate: visit.date,
        isClosed: visit.isClosed || false
      });
    } else {
      const existingDate = new Date(existing.lastDate);
      breweryMap.set(visit.breweryName, {
        count: existing.count + 1,
        lastDate: visitDate > existingDate ? visit.date : existing.lastDate,
        isClosed: existing.isClosed || visit.isClosed || false
      });
    }
  });

  return Array.from(breweryMap.entries()).map(([name, data]) => ({
    name,
    visitCount: data.count,
    lastVisitDate: data.lastDate,
    isClosed: data.isClosed
  }));
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}

export function getTopBreweries(stats: BreweryStats[], count: number = 10): BreweryStats[] {
  return [...stats]
    .sort((a, b) => b.visitCount - a.visitCount)
    .slice(0, count);
}

export function getBottomBreweries(stats: BreweryStats[], count: number = 10): BreweryStats[] {
  return [...stats]
    .filter(brewery => !brewery.isClosed) // Exclude closed breweries
    .sort((a, b) => a.visitCount - b.visitCount)
    .slice(0, count);
}
