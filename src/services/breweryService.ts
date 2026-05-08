import { BreweryLocation } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

// Load breweries from MySQL via PHP API
export async function loadBreweriesFromAPI(): Promise<BreweryLocation[] | null> {
  try {
    const base = API_BASE || '/api';
    const response = await fetch(`${base}/breweries.php`, { cache: 'no-store' });
    if (!response.ok) return null;
    const breweries = await response.json() as BreweryLocation[];
    return Array.isArray(breweries) && breweries.length > 0 ? breweries : null;
  } catch (error) {
    console.error('Error loading breweries from API:', error);
    return null;
  }
}

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
