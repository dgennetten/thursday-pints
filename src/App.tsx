import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Visit, BreweryWithLocation } from './types';
import { processVisits, mergeBreweryStatsWithAllBreweries, getNextThursday } from './utils';
import BreweryList from './components/BreweryList';
import VisitList from './components/VisitList';
import ToggleButton from './components/ToggleButton';
import BreweryMap from './components/BreweryMap';
import WelcomePopup from './components/WelcomePopup';
import NextBreweryCard from './components/NextBreweryCard';
import AdminLoginModal from './components/admin/AdminLoginModal';
import AdminPanel from './components/admin/AdminPanel';
import MemberPanel from './components/admin/MemberPanel';
import { RefreshCw, Route, Beer, Star, Map as MapIcon } from 'lucide-react';
import { loadVisitsFromAPI } from './services/spreadsheetService';
import { loadBreweriesFromAPI } from './services/breweryService';
import { fetchPhotoAvailability } from './services/photoService';
import { fetchBirthdays } from './services/adminService';
import { useAuth } from './contexts/AuthContext';
import PhotoModal from './components/PhotoModal';
import packageJson from '../package.json';
import { Birthday, DataChangeOptions } from './types';

const APP_VERSION = packageJson.version;

type ViewMode = 'breweries' | 'ranked' | 'tour';

function App() {
  const { user, logout } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('tour');
  const [visits, setVisits] = useState<Visit[]>([]);
  const [breweriesData, setBreweriesData] = useState<Map<string, { lat: number; lng: number; address: string; status: string }>>(new Map() as Map<string, { lat: number; lng: number; address: string; status: string }>);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [selectedBrewery, setSelectedBrewery] = useState<string | null>(null);
  const [hoveredBrewery, setHoveredBrewery] = useState<string | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);
  const [filteredBreweries, setFilteredBreweries] = useState<BreweryWithLocation[]>([]);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showAdminLogin, setShowAdminLogin]   = useState(false);
  const [showAdminPanel, setShowAdminPanel]   = useState(false);
  const [showMemberPanel, setShowMemberPanel] = useState(false);
  const [birthdays, setBirthdays]               = useState<Birthday[]>([]);
  const [photoVisitDates, setPhotoVisitDates]   = useState<Set<string>>(new Set());
  const [photoViewDates, setPhotoViewDates]     = useState<string[]>([]);
  const [photoViewBrewery, setPhotoViewBrewery] = useState<string | null>(null);
  const [showPhotoModal, setShowPhotoModal]     = useState(false);
  const [photoRefreshKey, setPhotoRefreshKey]   = useState(0);
  const buttonsContainerRef = useRef<HTMLDivElement>(null);
  const contentContainerRef = useRef<HTMLDivElement>(null);
  const hasUserInteracted = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (!showMap || !isDesktop) {
      setHoveredBrewery(null);
    }
  }, [showMap, isDesktop]);

  const mapHoverEnabled = showMap && isDesktop;

  // Extracted as a callback so the admin panel can trigger a refresh
  const loadData = useCallback(async () => {
    setLoadError(null);
    try {
      const [publicVisits, breweries, photoDates] = await Promise.all([
        loadVisitsFromAPI(),
        loadBreweriesFromAPI(),
        fetchPhotoAvailability().catch(() => [] as string[]),
      ]);

      setVisits(publicVisits);

      const latestWithNext = publicVisits
        .filter(v => v.nextBrewery)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
      if (latestWithNext) {
        fetchBirthdays(latestWithNext.date, getNextThursday(latestWithNext.date))
          .then(setBirthdays)
          .catch(() => {});
      }

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

      setPhotoVisitDates(new Set(photoDates));
    } catch (err) {
      console.error('Error loading data:', err);
      setLoadError(err instanceof Error ? err.message : 'Failed to load data from API');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDataChange = useCallback((opts?: DataChangeOptions) => {
    if (opts?.photoDate) {
      setPhotoVisitDates(prev => new Set([...prev, opts.photoDate!]));
    }
    setPhotoRefreshKey(k => k + 1);
    void loadData();
  }, [loadData]);

  // Load data from MySQL API on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Check if welcome popup should be shown
  useEffect(() => {
    const welcomeDismissed = localStorage.getItem('thursday-pints-welcome-dismissed');
    const lastVersion = localStorage.getItem('thursday-pints-version');
    
    // Show welcome if never dismissed, or if version has changed
    if (!welcomeDismissed || lastVersion !== APP_VERSION) {
      setShowWelcome(true);
      // Update stored version
      localStorage.setItem('thursday-pints-version', APP_VERSION);
    }
  }, []);

  // Clear selected brewery when switching tabs
  useEffect(() => {
    setSelectedBrewery(null);
  }, [viewMode]);

  // Update content height to fill available space
  const updateContentHeight = useCallback(() => {
    if (contentContainerRef.current && buttonsContainerRef.current && showMap) {
      const buttonsRect = buttonsContainerRef.current.getBoundingClientRect();
      const buttonsBottom = buttonsRect.bottom + window.scrollY;
      const currentScrollY = window.scrollY;
      const viewportHeight = window.innerHeight;
      const availableHeight = viewportHeight - (buttonsBottom - currentScrollY) - 24;
      contentContainerRef.current.style.minHeight = `${Math.max(availableHeight, 400)}px`;
    }
  }, [showMap]);

  // Update content container height when viewMode changes
  useEffect(() => {
    if (showMap) {
      setTimeout(() => {
        updateContentHeight();
      }, 100);
    }
  }, [viewMode, showMap, updateContentHeight]);

  // Update content height when map is toggled or window is resized
  useEffect(() => {
    if (showMap) {
      setTimeout(() => {
        updateContentHeight();
      }, 100);
      const handleResize = () => updateContentHeight();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [showMap, updateContentHeight]);

  const breweryStats = useMemo(() => processVisits(visits), [visits]);

  // Merge brewery stats with all breweries from the database (including zero-visit breweries)
  const allBreweryStats = useMemo(() => {
    if (breweriesData.size === 0) {
      return breweryStats; // If no brewery data loaded yet, just return stats
    }
    return mergeBreweryStatsWithAllBreweries(breweryStats, breweriesData);
  }, [breweryStats, breweriesData]);

  // Merge brewery stats with location data
  const breweriesWithLocation = useMemo(() => {
    return allBreweryStats.map(brewery => {
      const locationData = breweriesData.get(brewery.name);
      return {
        ...brewery,
        lat: locationData?.lat,
        lng: locationData?.lng,
        address: locationData?.address,
        isClosed: locationData?.status === 'Closed' || brewery.isClosed
      } as BreweryWithLocation;
    });
  }, [allBreweryStats, breweriesData]);

  const displayedBreweries = useMemo(() => {
    // Filter out breweries with zero visits
    let breweriesWithVisits = breweriesWithLocation.filter(b => b.visitCount > 0);
    
    // Filter out closed breweries when in 'breweries' mode (By Last Visit)
    if (viewMode === 'breweries') {
      breweriesWithVisits = breweriesWithVisits.filter(b => !b.isClosed);
    }
    
    const sorted = viewMode === 'breweries'
      ? [...breweriesWithVisits].sort((a, b) => {
          // Handle breweries with no visits (empty lastVisitDate)
          if (!a.lastVisitDate && !b.lastVisitDate) return 0;
          if (!a.lastVisitDate) return 1; // No visits go to end
          if (!b.lastVisitDate) return -1; // No visits go to end
          
          const dateA = new Date(a.lastVisitDate).getTime();
          const dateB = new Date(b.lastVisitDate).getTime();
          return dateA - dateB; // Oldest first
        })
      : viewMode === 'ranked'
      ? [...breweriesWithVisits].sort((a, b) => b.visitCount - a.visitCount)
      : [...breweriesWithVisits].sort((a, b) => b.visitCount - a.visitCount);
    
    return sorted;
  }, [breweriesWithLocation, viewMode]);

  const breweryPhotoCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const visit of visits) {
      if (photoVisitDates.has(visit.date)) {
        counts.set(visit.breweryName, (counts.get(visit.breweryName) ?? 0) + 1);
      }
    }
    return counts;
  }, [visits, photoVisitDates]);
  
  const listTitle = viewMode === 'breweries'
    ? 'By Last Visit'
    : viewMode === 'ranked'
    ? 'By Popularity'
    : 'By Tour Date';

  const findBreweryWithLocation = useCallback(
    (name: string) => breweriesWithLocation.find(b => b.name === name && b.lat != null && b.lng != null),
    [breweriesWithLocation],
  );

  // Calculate map center and zoom based on displayed breweries
  const mapBreweries = useMemo(
    () => (filteredBreweries.length > 0 ? filteredBreweries : displayedBreweries),
    [filteredBreweries, displayedBreweries],
  );

  const mapCenter = useMemo(() => {
    if (selectedBrewery) {
      const brewery = findBreweryWithLocation(selectedBrewery);
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
  }, [displayedBreweries, selectedBrewery, filteredBreweries, findBreweryWithLocation]);


  function openPhotoView(dates: string[], breweryName: string) {
    setPhotoViewDates(dates);
    setPhotoViewBrewery(breweryName);
    if (!user) {
      setShowAdminLogin(true);
    } else {
      setShowPhotoModal(true);
    }
  }

  function handlePhotoClick(date: string, breweryName: string) {
    openPhotoView([date], breweryName);
  }

  function handleBreweryPhotoClick(breweryName: string) {
    const dates = [
      ...new Set(
        visits
          .filter(v => v.breweryName === breweryName && photoVisitDates.has(v.date))
          .map(v => v.date),
      ),
    ].sort();
    if (dates.length > 0) {
      openPhotoView(dates, breweryName);
    }
  }

  function openRegistration() {
    setShowWelcome(false);
    setShowAdminLogin(true);
  }

  function closePhotoView() {
    setShowPhotoModal(false);
    setPhotoViewDates([]);
    setPhotoViewBrewery(null);
  }

  if (loading) {
    return (
      <>
        {showWelcome && (
          <WelcomePopup 
            version={APP_VERSION}
            onClose={() => setShowWelcome(false)}
            onRegisterClick={openRegistration}
          />
        )}
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading brewery data...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {showWelcome && (
        <WelcomePopup
          version={APP_VERSION}
          onClose={() => setShowWelcome(false)}
          onRegisterClick={openRegistration}
        />
      )}
      {showAdminLogin && (
        <AdminLoginModal
          onClose={() => setShowAdminLogin(false)}
          forPhotos={photoViewDates.length > 0}
          onLoginSuccess={(role) => {
            setShowAdminLogin(false);
            if (photoViewDates.length > 0) {
              setShowPhotoModal(true);
            } else if (role === 'admin' || role === 'superadmin') {
              setShowAdminPanel(true);
            } else if (role === 'member') {
              setShowMemberPanel(true);
            }
          }}
        />
      )}
      {showAdminPanel && (
        <AdminPanel
          onClose={() => setShowAdminPanel(false)}
          onDataChange={handleDataChange}
        />
      )}
      {showMemberPanel && (
        <MemberPanel onClose={() => setShowMemberPanel(false)} />
      )}
      {showPhotoModal && photoViewDates.length > 0 && photoViewBrewery && user && (
        <PhotoModal
          dates={photoViewDates}
          breweryName={photoViewBrewery}
          token={user.token}
          refreshKey={photoRefreshKey}
          onClose={closePhotoView}
        />
      )}

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
              className="h-16 w-auto cursor-pointer"
              onClick={() => {
                if (user && (user.role === 'admin' || user.role === 'superadmin')) {
                  setShowAdminPanel(true);
                } else if (user && user.role === 'member') {
                  setShowMemberPanel(true);
                } else if (!user) {
                  setShowAdminLogin(true);
                }
              }}
              title="Admin"
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Next Brewery Card */}
        {(() => {
          // Find the latest visit with a nextBrewery field
          const latestVisitWithNext = visits
            .filter(v => v.nextBrewery)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
          
          return latestVisitWithNext ? (
            <NextBreweryCard
              nextBrewery={latestVisitWithNext.nextBrewery!}
              breweryStats={breweryStats}
              date={latestVisitWithNext.date}
              birthdays={birthdays}
            />
          ) : null;
        })()}

        {loadError && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-900 mb-2">Could not load data</h2>
            <p className="text-sm text-red-800 mb-4">{loadError}</p>
            <button
              type="button"
              onClick={() => { setLoading(true); loadData(); }}
              className="text-sm font-medium text-red-700 hover:text-red-900 underline"
            >
              Retry
            </button>
          </div>
        )}

        {visits.length === 0 && !loadError && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-blue-900 mb-2">Welcome to Thursday Pints Tracker!</h2>
            <p className="text-sm text-blue-800">
              No visits found in the database.
            </p>
          </div>
        )}

        {/* Top/Bottom Toggle */}
        {visits.length > 0 && (
          <>
            <div ref={buttonsContainerRef} className="mb-6 flex items-center justify-between gap-4">
              <div className="flex-1">
                <ToggleButton
                  options={[
                    { label: 'Tour', value: 'tour', icon: Route },
                    { label: 'Ranked', value: 'ranked', icon: Star },
                    { label: 'Breweries', value: 'breweries', icon: Beer }
                  ]}
                  selected={viewMode}
                  onChange={(value) => {
                    hasUserInteracted.current = true;
                    setViewMode(value as ViewMode);
                  }}
                />
              </div>
              <button
                onClick={() => {
                  setShowMap(!showMap);
                  // Update content height after map toggle
                  setTimeout(() => {
                    updateContentHeight();
                  }, 100);
                }}
                className={`flex items-center gap-2 px-4 py-2 text-lg font-medium rounded-lg transition-colors ${
                  showMap
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <MapIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Content with optional map */}
            <div 
              ref={contentContainerRef}
              className={`grid ${showMap ? 'gap-[18px] grid-cols-2' : 'gap-3 grid-cols-1'}`}
            >
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
                    mapHoverEnabled={mapHoverEnabled}
                    onBreweryHover={setHoveredBrewery}
                    breweriesData={(() => {
                      const map = new Map() as Map<string, BreweryWithLocation>;
                      breweriesWithLocation.forEach(b => map.set(b.name, b));
                      return map;
                    })()}
                    setFilteredBreweries={setFilteredBreweries}
                    photoVisitDates={photoVisitDates}
                    onPhotoClick={handlePhotoClick}
                  />
                ) : (
                  <BreweryList
                    breweries={displayedBreweries}
                    title={listTitle}
                    hideBadge={showMap}
                    mapActive={showMap}
                    onBrewerySelect={setSelectedBrewery}
                    selectedBrewery={selectedBrewery}
                    mapHoverEnabled={mapHoverEnabled}
                    onBreweryHover={setHoveredBrewery}
                    setFilteredBreweries={setFilteredBreweries}
                    photoCountByBrewery={breweryPhotoCounts}
                    onPhotoClick={handleBreweryPhotoClick}
                  />
                )}
              </div>

              {/* Map */}
              {showMap && (
                <div className="h-full min-w-0">
                  <BreweryMap
                    breweries={mapBreweries}
                    overviewCenter={mapCenter.center}
                    overviewZoom={mapCenter.zoom}
                    viewMode={viewMode}
                    selectedBrewery={selectedBrewery}
                    hoveredBrewery={hoveredBrewery}
                    mapHoverEnabled={mapHoverEnabled}
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
          <p className="text-center text-xs text-gray-400 mt-2">
            Version {APP_VERSION} • <a href="mailto:feedback@thursdaypints.com" className="text-blue-600 hover:underline">Send Feedback!</a> • <a href="mailto:errors@thursdaypints.com" className="text-blue-600 hover:underline">Report Errors!</a>
            {user && (
              <> • <button onClick={logout} className="text-blue-600 hover:underline">Log out</button></>
            )}
          </p>
        </div>
      </footer>
    </div>
    </>
  );
}

export default App;
