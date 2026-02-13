import { useState, useMemo, useEffect } from 'react';
    <title>Thursday Pints - Brewery Tour Tracker</title>
import { Visit, BreweryWithLocation } from '../types';
import { formatDate } from '../utils';
import { MapPin, Search, X, Calendar, ChevronsUpDown } from 'lucide-react';

interface VisitListProps {
  visits: Visit[];
  title: string;
  hideBadge?: boolean;
  mapActive?: boolean;
  onBrewerySelect?: (name: string | null) => void;
  selectedBrewery?: string | null;
  breweriesData?: Map<string, BreweryWithLocation>;
  setFilteredBreweries?: (breweries: BreweryWithLocation[]) => void;
}

export default function VisitList({ 
  visits, 
  title, 
  hideBadge = false, 
  mapActive = false,
  onBrewerySelect,
  selectedBrewery,
  breweriesData,
  setFilteredBreweries
}: VisitListProps) {
  const [filterText, setFilterText] = useState('');
  const [isReversed, setIsReversed] = useState(false);
  if (visits.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-4">{title}</h2>
        <p className="text-gray-500">No visits found.</p>
      </div>
    );
  }

  // Calculate visit counts for each brewery
  const breweryVisitCounts = new Map<string, number>();
  visits.forEach(visit => {
    const count = breweryVisitCounts.get(visit.breweryName) || 0;
    breweryVisitCounts.set(visit.breweryName, count + 1);
  });

  // Sort visits by date (newest first)
  const sortedVisits = [...visits].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return dateB - dateA;
  });

  // Filter visits based on filter text (searches names, dates, and notes)
  const filteredVisits = useMemo(() => {
    let result = sortedVisits;
    
    if (filterText.trim()) {
      const searchTerm = filterText.toLowerCase().trim();
      result = sortedVisits.filter(visit => {
        // Search in brewery name
        const nameMatch = visit.breweryName.toLowerCase().includes(searchTerm);
        
        // Search in formatted date
        const formattedDate = formatDate(visit.date).toLowerCase();
        const dateMatch = formattedDate.includes(searchTerm) || visit.date.includes(searchTerm);
        
        // Search in notes
        const notesMatch = visit.notes?.toLowerCase().includes(searchTerm) || false;
        
        return nameMatch || dateMatch || notesMatch;
      });
    }
    
    // Reverse the list if isReversed is true
    return isReversed ? [...result].reverse() : result;
  }, [sortedVisits, filterText, isReversed]);

  // Convert filtered visits to breweries for map
  useEffect(() => {
    if (setFilteredBreweries && breweriesData) {
      const uniqueBreweries = new Map<string, BreweryWithLocation>();
      filteredVisits.forEach(visit => {
        const brewery = breweriesData.get(visit.breweryName);
        if (brewery) {
          uniqueBreweries.set(visit.breweryName, brewery);
        }
      });
      setFilteredBreweries(Array.from(uniqueBreweries.values()));
    }
  }, [filteredVisits, breweriesData, setFilteredBreweries]);

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <div className={mapActive ? "flex flex-col gap-3 mb-2" : "flex items-center justify-between mb-2"}>
          <div className="flex items-center">
            <button
              onClick={() => setIsReversed(!isReversed)}
              className="py-1 hover:bg-gray-100 rounded transition-colors -ml-1"
              aria-label="Reverse list order"
            >
              <ChevronsUpDown className="w-6 h-6 text-gray-600" />
            </button>
            <div className="ml-2">
              <h2 className="text-xl font-bold text-gray-900">{title}</h2>
              <p className="text-sm text-gray-500 mt-1">
                {filteredVisits.length} {filteredVisits.length === 1 ? 'visit' : 'visits'}
                {filterText && ` of ${visits.length} total`}
                {!filterText && ` total`}
              </p>
            </div>
          </div>
          <div className={`relative ${mapActive ? 'w-full' : 'w-64'}`}>
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <Search className="w-4 h-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Filter"
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700 placeholder-gray-400"
            />
            {filterText && (
              <button
                onClick={() => setFilterText('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label="Clear filter"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
        {filteredVisits.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">No visits match your filter.</p>
          </div>
        ) : (
          filteredVisits.map((visit, index) => (
          <div
            key={`${visit.date}-${visit.breweryName}-${index}`}
            className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
              selectedBrewery === visit.breweryName ? 'bg-blue-50 border-l-4 border-blue-600' : ''
            }`}
            onClick={() => {
              if (onBrewerySelect) {
                onBrewerySelect(selectedBrewery === visit.breweryName ? null : visit.breweryName);
              }
            }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      {visit.breweryName}
                    </h3>
                    {visit.isClosed && (
                      <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
                        Closed
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(visit.date)}</span>
                  </div>
                  {hideBadge && (
                    <div className="text-sm text-gray-600 mt-1">
                      visits: {breweryVisitCounts.get(visit.breweryName) || 1}
                    </div>
                  )}
                  {visit.notes && (
                    <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded-lg p-2">
                      <p className="text-sm text-gray-700">{visit.notes}</p>
                    </div>
                  )}
              </div>
              {!hideBadge && (
                <div className="ml-4">
                  <div className="bg-blue-100 text-blue-800 rounded-full px-4 py-2 text-center min-w-[60px]">
                    <div className="text-2xl font-bold">
                      {breweryVisitCounts.get(visit.breweryName) || 1}
                    </div>
                    <div className="text-xs font-medium">
                      {breweryVisitCounts.get(visit.breweryName) === 1 ? 'visit' : 'visits'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          ))
        )}
      </div>
    </div>
  );
}
