import { useState, useMemo, useEffect } from 'react';
import { Visit } from './types';
import { processVisits, getTopBreweries, getBottomBreweries } from './utils';
import StatsCard from './components/StatsCard';
import BreweryList from './components/BreweryList';
import VisitList from './components/VisitList';
import ToggleButton from './components/ToggleButton';
import BreweryMap from './components/BreweryMap';
import { Beer, MapPin, RefreshCw, TrendingUp, TrendingDown, Route, Building2, Map } from 'lucide-react';
import { loadVisitsFromPublicJSON } from './services/spreadsheetService';

type ViewMode = 'top' | 'bottom' | 'tour' | 'breweries';

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('top');
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMap, setShowMap] = useState(false);
  
  // Check if running on localhost
  const isLocalhost = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || 
     window.location.hostname === '127.0.0.1' ||
     window.location.hostname === '');

  // Load data from public/data.json
  useEffect(() => {
    async function loadData() {
      try {
        const publicVisits = await loadVisitsFromPublicJSON();
        if (publicVisits && publicVisits.length > 0) {
          setVisits(publicVisits);
        }
      } catch (err) {
        console.error('Error loading data:', err);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, []);

  const breweryStats = useMemo(() => processVisits(visits), [visits]);

  const totalBreweries = breweryStats.length;
  const totalVisits = visits.length;

  const topBreweries = useMemo(
    () => getTopBreweries(breweryStats, 25),
    [breweryStats]
  );

  const bottomBreweries = useMemo(
    () => getBottomBreweries(breweryStats, 25),
    [breweryStats]
  );

  const displayedBreweries = viewMode === 'top' ? topBreweries : 
                             viewMode === 'bottom' ? bottomBreweries : 
                             viewMode === 'breweries'
                             ? [...breweryStats].sort((a, b) => {
                                 const dateA = new Date(a.lastVisitDate).getTime();
                                 const dateB = new Date(b.lastVisitDate).getTime();
                                 return dateB - dateA; // Newest first
                               })
                             : [...breweryStats].sort((a, b) => b.visitCount - a.visitCount);
  
  const listTitle = viewMode === 'top' 
    ? 'Top 25 Visited' 
    : viewMode === 'bottom'
    ? 'Bottom 25 Visited*'
    : viewMode === 'breweries'
    ? 'Breweries by Last Visit'
    : 'All Breweries';


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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Thursday Pints
              </h1>
              <p className="text-gray-600 mt-1">
                Brewery Visit Tracker
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

        {/* Stats Cards */}
        {visits.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:gap-6 mb-8">
            <StatsCard
              title="Total Breweries"
              value={totalBreweries}
              icon={MapPin}
            />
            <StatsCard
              title="Total Visits"
              value={totalVisits}
              icon={Beer}
            />
          </div>
        )}

        {/* Top/Bottom Toggle */}
        {visits.length > 0 && (
          <>
            <div className="mb-6 flex items-center justify-between gap-4">
              <div className="flex-1">
                <ToggleButton
                  options={[
                    { label: 'Top 25', value: 'top', icon: TrendingUp },
                    { label: 'Bottom 25*', value: 'bottom', icon: TrendingDown },
                    { label: 'Tour', value: 'tour', icon: Route },
                    { label: 'Breweries', value: 'breweries', icon: Building2 }
                  ]}
                  selected={viewMode}
                  onChange={(value) => setViewMode(value as ViewMode)}
                />
                {viewMode === 'bottom' && (
                  <p className="text-xs text-gray-500 mt-2">
                    *Closed breweries excluded
                  </p>
                )}
              </div>
              {isLocalhost && (
                <button
                  onClick={() => setShowMap(!showMap)}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    showMap
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Map className="w-4 h-4" />
                  Map
                </button>
              )}
            </div>

            {/* Content with optional map */}
            <div className={`grid gap-6 ${showMap ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
              {/* List */}
              <div>
                {viewMode === 'tour' ? (
                  <VisitList
                    visits={visits}
                    title="Tour"
                  />
                ) : (
                  <BreweryList
                    breweries={displayedBreweries}
                    title={listTitle}
                  />
                )}
              </div>

              {/* Map */}
              {isLocalhost && showMap && (
                <div className="h-[500px] md:h-[600px]">
                  <BreweryMap
                    breweries={viewMode === 'tour' 
                      ? breweryStats.sort((a, b) => b.visitCount - a.visitCount)
                      : displayedBreweries
                    }
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
