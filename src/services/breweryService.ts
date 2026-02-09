import { BreweryLocation } from '../types';

export async function loadBreweriesFromJSON(): Promise<BreweryLocation[] | null> {
  try {
    const timestamp = new Date().getTime();
    const response = await fetch(`/breweries.json?v=${timestamp}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    if (!response.ok) return null;
    
    const breweries = await response.json() as BreweryLocation[];
    return Array.isArray(breweries) && breweries.length > 0 ? breweries : null;
  } catch (error) {
    console.error('Error loading from public/breweries.json:', error);
    return null;
  }
}
