import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
}

export default function StatsCard({ title, value, icon: Icon }: StatsCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-3 sm:p-6 border border-gray-200">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0 pr-2">
          <p className="text-[10px] sm:text-sm font-medium text-gray-600 uppercase tracking-wide leading-tight">
            {title}
          </p>
          <p className="text-xl sm:text-3xl font-bold text-gray-900 mt-1 sm:mt-2">
            {value}
          </p>
        </div>
        <div className="bg-blue-100 rounded-full p-1.5 sm:p-3 flex-shrink-0">
          <Icon className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600" />
        </div>
      </div>
    </div>
  );
}
