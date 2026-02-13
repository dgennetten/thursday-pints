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

export function mergeBreweryStatsWithAllBreweries(
  stats: BreweryStats[],
  allBreweries: Map<string, { lat: number; lng: number; address: string; status: string }>
): BreweryStats[] {
  // If no brewery data loaded yet, just return stats from visits
  // This prevents blank page during initial load
  if (!allBreweries || allBreweries.size === 0) {
    return stats;
  }

  const statsMap = new Map<string, BreweryStats>();
  stats.forEach(stat => statsMap.set(stat.name, stat));

  // Create stats for all breweries, using visit stats if available
  const allStats: BreweryStats[] = [];
  
  // Add all breweries from breweries.json
  allBreweries.forEach((locationData, breweryName) => {
    if (!locationData) return; // Skip invalid entries
    
    const existingStat = statsMap.get(breweryName);
    if (existingStat) {
      // Use existing stats from visits
      allStats.push(existingStat);
    } else {
      // Brewery with no visits - create zero-visit entry
      allStats.push({
        name: breweryName,
        visitCount: 0,
        lastVisitDate: '', // Empty string for no visits
        isClosed: locationData.status === 'Closed'
      });
    }
  });

  // Also add any stats that might not be in breweries.json (edge case)
  stats.forEach(stat => {
    if (!allBreweries.has(stat.name)) {
      allStats.push(stat);
    }
  });

  return allStats;
}

export function formatDate(dateString: string): string {
  if (!dateString || dateString.trim() === '') {
    return '';
  }
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return '';
  }
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
