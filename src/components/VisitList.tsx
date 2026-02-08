import { Visit } from '../types';
import { formatDate } from '../utils';
import { Calendar, MapPin } from 'lucide-react';

interface VisitListProps {
  visits: Visit[];
  title: string;
}

export default function VisitList({ visits, title }: VisitListProps) {
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

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-500 mt-1">
          {visits.length} {visits.length === 1 ? 'visit' : 'visits'} total
        </p>
      </div>
      <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
        {sortedVisits.map((visit, index) => (
          <div
            key={`${visit.date}-${visit.breweryName}-${index}`}
            className="p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <div className="bg-blue-100 rounded-full p-2 mt-0.5">
                  <Calendar className="w-4 h-4 text-blue-600" />
                </div>
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
                  <p className="text-sm text-gray-600">
                    {formatDate(visit.date)}
                  </p>
                </div>
              </div>
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
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
