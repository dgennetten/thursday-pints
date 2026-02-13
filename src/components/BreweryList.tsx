import { useState, useMemo, useEffect } from 'react';
import { BreweryWithLocation } from '../types';
import { formatDate } from '../utils';
import { MapPin, Calendar, Search, X, ChevronsUpDown } from 'lucide-react';

interface BreweryListProps {
  breweries: BreweryWithLocation[];
  title: string;
  hideBadge?: boolean;
  mapActive?: boolean;
  onBrewerySelect?: (name: string | null) => void;
  selectedBrewery?: string | null;
  setFilteredBreweries?: (breweries: BreweryWithLocation[]) => void;
}

export default function BreweryList({ 
  breweries, 
  title, 
  hideBadge = false, 
  mapActive = false,
  onBrewerySelect,
  selectedBrewery,
  setFilteredBreweries
}: BreweryListProps) {
  const [filterText, setFilterText] = useState('');
  const [isReversed, setIsReversed] = useState(false);

  // Filter breweries based on filter text (searches names and dates)
  const filteredBreweries = useMemo(() => {
    let result = breweries;
    
    if (filterText.trim()) {
      const searchTerm = filterText.toLowerCase().trim();
      result = breweries.filter(brewery => {
        // Search in brewery name
        const nameMatch = brewery.name.toLowerCase().includes(searchTerm);
        
        // Search in formatted date
        const formattedDate = formatDate(brewery.lastVisitDate).toLowerCase();
        const dateMatch = formattedDate.includes(searchTerm) || brewery.lastVisitDate.includes(searchTerm);
        
        // Search in visit count
        const countMatch = brewery.visitCount.toString().includes(searchTerm);
        
        return nameMatch || dateMatch || countMatch;
      });
    }
    
    // Reverse the list if isReversed is true
    return isReversed ? [...result].reverse() : result;
  }, [breweries, filterText, isReversed]);

  // Update filtered breweries in parent when filter changes
  useEffect(() => {
    if (setFilteredBreweries) {
      setFilteredBreweries(filteredBreweries);
    }
  }, [filteredBreweries, setFilteredBreweries]);

  if (breweries.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-4">{title}</h2>
        <p className="text-gray-500">No breweries found.</p>
      </div>
    );
  }

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
                {filteredBreweries.length} {filteredBreweries.length === 1 ? 'brewery' : 'breweries'}
                {filterText && ` of ${breweries.length} total`}
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
        {filteredBreweries.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">No breweries match your filter.</p>
          </div>
        ) : (
          filteredBreweries.map((brewery, index) => (
          <div
            key={`${brewery.name}-${index}`}
            className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
              selectedBrewery === brewery.name ? 'bg-blue-50 border-l-4 border-blue-600' : ''
            }`}
            onClick={() => {
              if (onBrewerySelect) {
                onBrewerySelect(selectedBrewery === brewery.name ? null : brewery.name);
              }
            }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    {brewery.name}
                  </h3>
                  {brewery.isClosed && (
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
                      Closed
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>Last visit: {formatDate(brewery.lastVisitDate)}</span>
                </div>
                {hideBadge && (
                  <div className="text-sm text-gray-600 mt-1">
                    visits: {brewery.visitCount}
                  </div>
                )}
              </div>
              {!hideBadge && (
                <div className="ml-4">
                  <div className="bg-blue-100 text-blue-800 rounded-full px-4 py-2 text-center min-w-[60px]">
                    <div className="text-2xl font-bold">{brewery.visitCount}</div>
                    <div className="text-xs font-medium">
                      {brewery.visitCount === 1 ? 'visit' : 'visits'}
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
