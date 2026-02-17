import { BreweryStats } from '../types';
import { formatDate, getNextThursday } from '../utils';
import { MapPin } from 'lucide-react';

interface NextBreweryCardProps {
  nextBrewery: string;
  breweryStats: BreweryStats[];
  date: string;
}

export default function NextBreweryCard({ nextBrewery, breweryStats, date }: NextBreweryCardProps) {
  // Check if nextBrewery matches a brewery name
  const matchingBrewery = breweryStats.find(
    brewery => brewery.name.toLowerCase() === nextBrewery.toLowerCase().trim()
  );

  const isLimerick = !matchingBrewery;
  
  // Calculate the next Thursday after the visit date
  const nextThursdayDate = getNextThursday(date);

  return (
    <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg p-6 shadow-lg">
      <div className="flex items-start gap-3 mb-4">
        <div className="bg-blue-600 rounded-full p-2 flex-shrink-0">
          <MapPin className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-blue-900 uppercase tracking-wide mb-1">
            Where Next? ({formatDate(nextThursdayDate)})
          </h2>
          <div className="h-1 w-16 bg-blue-600 rounded-full"></div>
        </div>
      </div>

      {isLimerick ? (
        <div className="pl-11">
          <blockquote className="text-xl sm:text-2xl md:text-3xl italic text-gray-800 leading-relaxed whitespace-pre-line">
            "{nextBrewery}"
          </blockquote>
        </div>
      ) : (
        <div className="pl-11">
          <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            {matchingBrewery.name}
          </h3>
          <p className="text-base sm:text-lg text-gray-600 italic">
            Last visited {formatDate(matchingBrewery.lastVisitDate)}
          </p>
        </div>
      )}
    </div>
  );
}
