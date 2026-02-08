import { BreweryStats } from '../types';
import { formatDate } from '../utils';
import { MapPin, Calendar } from 'lucide-react';

interface BreweryListProps {
  breweries: BreweryStats[];
  title: string;
}

export default function BreweryList({ breweries, title }: BreweryListProps) {
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
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
      </div>
      <div className="divide-y divide-gray-200">
        {breweries.map((brewery, index) => (
          <div
            key={`${brewery.name}-${index}`}
            className="p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    {brewery.name}
                  </h3>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>Last visit: {formatDate(brewery.lastVisitDate)}</span>
                </div>
              </div>
              <div className="ml-4">
                <div className="bg-blue-100 text-blue-800 rounded-full px-4 py-2 text-center min-w-[60px]">
                  <div className="text-2xl font-bold">{brewery.visitCount}</div>
                  <div className="text-xs font-medium">
                    {brewery.visitCount === 1 ? 'visit' : 'visits'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
