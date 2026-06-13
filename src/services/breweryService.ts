import { BreweryLocation } from '../types';
import { getApiBase } from '../apiBase';

const API_BASE = getApiBase();

// Load breweries from MySQL via PHP API
export async function loadBreweriesFromAPI(): Promise<BreweryLocation[]> {
  const response = await fetch(`${API_BASE}/breweries.php`, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Failed to load breweries (${response.status})`);
  }
  const breweries = await response.json() as BreweryLocation[];
  if (!Array.isArray(breweries)) {
    throw new Error('Invalid breweries response');
  }
  return breweries;
}
