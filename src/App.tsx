import { useState, useMemo, useEffect } from 'react';
import { Visit, BreweryWithLocation } from './types';
import { processVisits } from './utils';
import BreweryList from './components/BreweryList';
import VisitList from './components/VisitList';
import ToggleButton from './components/ToggleButton';
import BreweryMap from './components/BreweryMap';
import { RefreshCw, Route, Building2, Star, Map as MapIcon } from 'lucide-react';
import { loadVisitsFromPublicJSON } from './services/spreadsheetService';
import { loadBreweriesFromJSON } from './services/breweryService';

type ViewMode = 'breweries' | 'ranked' | 'tour';

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('breweries');
  const [visits, setVisits] = useState<Visit[]>([]);
  const [breweriesData, setBreweriesData] = useState<Map<string, { lat: number; lng: number; address: string; status: string }>>(new Map() as Map<string, { lat: number; lng: number; address: string; status: string }>);
  const [loading, setLoading] = useState(true);
  const [showMap, setShowMap] = useState(false);
  const [selectedBrewery, setSelectedBrewery] = useState<string | null>(null);
  const [filteredBreweries, setFilteredBreweries] = useState<BreweryWithLocation[]>([]);

  // Load data from public/data.json and public/breweries.json
  useEffect(() => {
    async function loadData() {
      try {
        const [publicVisits, breweries] = await Promise.all([
          loadVisitsFromPublicJSON(),
          loadBreweriesFromJSON()
        ]);
        
        if (publicVisits && publicVisits.length > 0) {
          setVisits(publicVisits);
        }
        
        if (breweries) {
          const breweriesMap = new Map<string, { lat: number; lng: number; address: string; status: string }>();
          breweries.forEach(brewery => {
            breweriesMap.set(brewery.brewery_name, {
              lat: brewery.latitude,
              lng: brewery.longitude,
              address: brewery.brewery_address,
              status: brewery.status
            });
          });
          setBreweriesData(breweriesMap);
        }
      } catch (err) {
        console.error('Error loading data:', err);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, []);

  // Clear selected brewery when switching tabs
  useEffect(() => {
    setSelectedBrewery(null);
  }, [viewMode]);

  const breweryStats = useMemo(() => processVisits(visits), [visits]);

  // Merge brewery stats with location data
  const breweriesWithLocation = useMemo(() => {
    return breweryStats.map(brewery => {
      const locationData = breweriesData.get(brewery.name);
      return {
        ...brewery,
        lat: locationData?.lat,
        lng: locationData?.lng,
        address: locationData?.address,
        isClosed: locationData?.status === 'Closed' || brewery.isClosed
      } as BreweryWithLocation;
    });
  }, [breweryStats, breweriesData]);

  const displayedBreweries = useMemo(() => {
    let sorted = viewMode === 'breweries'
      ? [...breweriesWithLocation].sort((a, b) => {
          const dateA = new Date(a.lastVisitDate).getTime();
          const dateB = new Date(b.lastVisitDate).getTime();
          return dateB - dateA; // Newest first
        })
      : viewMode === 'ranked'
      ? [...breweriesWithLocation].sort((a, b) => b.visitCount - a.visitCount)
      : [...breweriesWithLocation].sort((a, b) => b.visitCount - a.visitCount);
    
    return sorted;
  }, [breweriesWithLocation, viewMode]);
  
  const listTitle = viewMode === 'breweries'
    ? 'By Last Visit'
    : viewMode === 'ranked'
    ? 'By Popularity'
    : 'Thursday Pints Tour';

  // Calculate map center and zoom based on displayed breweries
  const mapCenter = useMemo(() => {
    if (selectedBrewery) {
      const brewery = displayedBreweries.find(b => b.name === selectedBrewery);
      if (brewery?.lat && brewery?.lng) {
        return { center: [brewery.lat, brewery.lng] as [number, number], zoom: 17 };
      }
    }
    
    const withLocation = filteredBreweries.length > 0 
      ? filteredBreweries.filter(b => b.lat && b.lng)
      : displayedBreweries.filter(b => b.lat && b.lng);
    
    if (withLocation.length === 0) {
      return { center: [40.5853, -105.0844] as [number, number], zoom: 11 }; // Fort Collins default
    }
    
    const lats = withLocation.map(b => b.lat!).filter(lat => lat != null);
    const lngs = withLocation.map(b => b.lng!).filter(lng => lng != null);
    const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
    const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
    
    // Calculate zoom based on bounds
    const latRange = Math.max(...lats) - Math.min(...lats);
    const lngRange = Math.max(...lngs) - Math.min(...lngs);
    const maxRange = Math.max(latRange, lngRange);
    let zoom = 11;
    if (maxRange < 0.01) zoom = 14;
    else if (maxRange < 0.05) zoom = 12;
    else if (maxRange < 0.1) zoom = 11;
    else zoom = 10;
    
    return { center: [centerLat, centerLng] as [number, number], zoom };
  }, [displayedBreweries, selectedBrewery, filteredBreweries]);


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading brewery data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">
                Thursday Pints
              </h1>
              <p className="text-gray-600 mt-1">
                Brewery Tour Tracker
              </p>
            </div>
            <img 
              src="/logo.svg" 
              alt="Thursday Pints Logo" 
              className="h-16 w-auto"
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Initial Load Message */}
        {visits.length === 0 && !loading && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-blue-900 mb-2">Welcome to Thursday Pints Tracker!</h2>
            <p className="text-sm text-blue-800">
              No visit data found. Please ensure data.json is available.
            </p>
          </div>
        )}

        {/* Top/Bottom Toggle */}
        {visits.length > 0 && (
          <>
            <div className="mb-6 flex items-center justify-between gap-4">
              <div className="flex-1">
                <ToggleButton
                  options={[
                    { label: 'Breweries', value: 'breweries', icon: Building2 },
                    { label: 'Ranked', value: 'ranked', icon: Star },
                    { label: 'Tour', value: 'tour', icon: Route }
                  ]}
                  selected={viewMode}
                  onChange={(value) => setViewMode(value as ViewMode)}
                />
              </div>
              <button
                onClick={() => setShowMap(!showMap)}
                className={`flex items-center gap-2 px-4 py-2 text-lg font-medium rounded-lg transition-colors ${
                  showMap
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <MapIcon className="w-6 h-6" />
                Map
              </button>
            </div>

            {/* Content with optional map */}
            <div className={`grid gap-6 ${showMap ? 'grid-cols-2' : 'grid-cols-1'} ${showMap ? 'h-[calc(100vh-280px)]' : ''}`}>
              {/* List */}
              <div className={`min-w-0 ${showMap ? 'overflow-y-auto' : ''}`}>
                {viewMode === 'tour' ? (
                  <VisitList
                    visits={visits}
                    title={listTitle}
                    hideBadge={showMap}
                    mapActive={showMap}
                    onBrewerySelect={setSelectedBrewery}
                    selectedBrewery={selectedBrewery}
                    breweriesData={(() => {
                      const map = new Map() as Map<string, BreweryWithLocation>;
                      breweriesWithLocation.forEach(b => map.set(b.name, b));
                      return map;
                    })()}
                    setFilteredBreweries={setFilteredBreweries}
                  />
                ) : (
                  <BreweryList
                    breweries={displayedBreweries}
                    title={listTitle}
                    hideBadge={showMap}
                    mapActive={showMap}
                    onBrewerySelect={setSelectedBrewery}
                    selectedBrewery={selectedBrewery}
                    setFilteredBreweries={setFilteredBreweries}
                  />
                )}
              </div>

              {/* Map */}
              {showMap && (
                <div className="h-full min-w-0">
                  <BreweryMap
                    breweries={filteredBreweries.length > 0 ? filteredBreweries : displayedBreweries}
                    center={mapCenter.center}
                    zoom={mapCenter.zoom}
                    viewMode={viewMode}
                    selectedBrewery={selectedBrewery}
                  />
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-500">
            Thursday Pints Social Club • Since 2020
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
