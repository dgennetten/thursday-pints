import { LucideIcon } from 'lucide-react';

interface ToggleButtonProps {
  options: { label: string; value: string; icon?: LucideIcon }[];
  selected: string;
  onChange: (value: string) => void;
}

export default function ToggleButton({ options, selected, onChange }: ToggleButtonProps) {
  return (
    <div className="inline-flex rounded-lg border border-gray-200 bg-gray-100 p-1">
      {options.map((option) => {
        const Icon = option.icon;
        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${
              selected === option.value
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {Icon && <Icon className="w-4 h-4" />}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
