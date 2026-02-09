import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface WelcomePopupProps {
  version: string;
  onClose: () => void;
}

export default function WelcomePopup({ version, onClose }: WelcomePopupProps) {
  const [instructions, setInstructions] = useState<string>('');
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    // Load instructions from markdown file with cache-busting
    const timestamp = new Date().getTime();
    fetch(`/instructions.md?v=${timestamp}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
      .then(res => res.text())
      .then(text => setInstructions(text))
      .catch(err => {
        console.error('Error loading instructions:', err);
        setInstructions('# Welcome to Thursday Pints!\n\nInstructions could not be loaded.');
      });
  }, []);

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem('thursday-pints-welcome-dismissed', 'true');
    }
    onClose();
  };

  // Convert markdown to HTML (simple conversion)
  const markdownToHtml = (md: string): string => {
    if (!md) return '';
    
    let html = md;
    
    // Headers
    html = html.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mb-4">$1</h1>');
    html = html.replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mt-4 mb-2">$1</h2>');
    html = html.replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-3 mb-2">$1</h3>');
    
    // Bold and italic
    html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>');
    
    // Lists - handle bullet points
    const lines = html.split('\n');
    let inList = false;
    let result: string[] = [];
    
    lines.forEach((line) => {
      const isListItem = /^\- (.*)$/.test(line.trim());
      
      if (isListItem) {
        if (!inList) {
          result.push('<ul class="list-disc ml-6 mb-2">');
          inList = true;
        }
        const content = line.replace(/^\- (.*)$/, '$1');
        result.push(`<li class="mb-1">${content}</li>`);
      } else {
        if (inList) {
          result.push('</ul>');
          inList = false; } if (line.trim() && !line.match(/^<[h]/)) { result.push(`<p class="mb-2">${line}</p>`); } else if (line.trim()) { result.push(line); } } }); if (inList) { result.push('</ul>'); } return result.join('\n'); }; return ( <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"> <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Welcome to the Tour Tracker!</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="px-6 py-4">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <img 
              src="/logo.svg" 
              alt="Thursday Pints Logo" 
              className="h-24 w-auto"
            />
          </div>

          {/* Instructions Content */}
          <div 
            className="prose prose-sm max-w-none text-gray-700"
            dangerouslySetInnerHTML={{ __html: markdownToHtml(instructions) }}
          />

          {/* Don't Show Again Checkbox */}
          <div className="mt-6 flex items-center">
            <input
              type="checkbox"
              id="dontShowAgain"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="dontShowAgain" className="ml-2 text-sm text-gray-600">
              Don't show this again
            </label>
          </div>

          {/* Version and Feedback */}
          <div className="mt-6 pt-4 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-500">
              Version {version} • <a href="mailto:feedback@thursdaypints.com" className="text-blue-600 hover:underline">Send Feedback!</a> • <a href="mailto:errors@thursdaypints.com" className="text-blue-600 hover:underline">Report Errors!</a>
            </p>
          </div>
        </div>

        {/* Close Button */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
          <button
            onClick={handleClose}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
}
