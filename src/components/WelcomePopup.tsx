import { useState } from 'react';
import { X } from 'lucide-react';

interface WelcomePopupProps {
  version: string;
  onClose: () => void;
}

export default function WelcomePopup({ version, onClose }: WelcomePopupProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem('thursday-pints-welcome-dismissed', 'true');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <h2 className="text-lg font-semibold text-gray-900">Thursday Pints</h2>
          <button
            type="button"
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-4 py-4 text-center">
          <img src="/logo.svg" alt="" className="mx-auto mb-3 h-14 w-auto" />
          <p className="text-sm text-gray-600">
            Use <strong>Breweries</strong>, <strong>Ranked</strong>, or <strong>Tour</strong> tabs. Filter searches names,
            dates, and places. Toggle <strong>Map</strong> to see pins; click a list row or pin to focus.
          </p>
          <p className="mt-3 text-xs text-gray-500">
            v{version} ·{' '}
            <a href="mailto:feedback@thursdaypints.com" className="text-blue-600 hover:underline">
              Feedback
            </a>
          </p>
        </div>

        <div className="flex flex-col gap-3 border-t border-gray-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <label htmlFor="dontShowAgain" className="flex cursor-pointer items-center gap-2 text-xs text-gray-600">
            <input
              id="dontShowAgain"
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Don&apos;t show again
          </label>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
