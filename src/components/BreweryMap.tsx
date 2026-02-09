import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';
import { BreweryWithLocation } from '../types';

// Fix for default marker icons in React-Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Create colored marker icon
function createColoredIcon(color: string): L.Icon {
  return L.icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" width="25" height="41" viewBox="0 0 25 41">
        <path fill="${color}" stroke="#fff" stroke-width="2" d="M12.5 0C5.6 0 0 5.6 0 12.5c0 8.2 12.5 28.5 12.5 28.5S25 20.7 25 12.5C25 5.6 19.4 0 12.5 0z"/>
        <circle fill="#fff" cx="12.5" cy="12.5" r="5"/>
      </svg>
    `)}`,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
}

// Component to handle map updates
function MapUpdater({ center, zoom, selectedBrewery, breweries }: { center: [number, number]; zoom: number; selectedBrewery: string | null; breweries: BreweryWithLocation[] }) {
  const map = useMap();
  
  useEffect(() => {
    // Close any open popups before panning
    map.closePopup();
    
    // If a brewery is selected, just zoom to it
    if (selectedBrewery) {
      map.setView(center, zoom);
    } else {
      // Otherwise, use fitBounds to properly fit all breweries in the viewport
      const withLocation = breweries.filter(b => b.lat != null && b.lng != null);
      if (withLocation.length > 0) {
        const bounds = withLocation.map(b => [b.lat!, b.lng!] as [number, number]);
        // Use fitBounds which accounts for the actual viewport size
        map.fitBounds(bounds, { padding: [20, 20] });
      } else {
        map.setView(center, zoom);
      }
    }
  }, [map, center, zoom, selectedBrewery, breweries]);
  
  return null;
}

interface BreweryMapProps {
  breweries: BreweryWithLocation[];
  center: [number, number];
  zoom: number;
  viewMode: 'breweries' | 'ranked' | 'tour';
  selectedBrewery: string | null;
}

export default function BreweryMap({ breweries, center, zoom, viewMode, selectedBrewery }: BreweryMapProps) {
  // Filter breweries that have location data
  const breweriesWithLocation = breweries.filter(b => b.lat != null && b.lng != null);
  
  // Calculate max visits for color scaling (only for ranked view)
  const maxVisits = viewMode === 'ranked' && breweriesWithLocation.length > 0
    ? Math.max(...breweriesWithLocation.map(b => b.visitCount))
    : 1;

  // Get color based on visit count (red = most, gray = least)
  // Gradient from red (#dc2626) to gray (#6b7280)
  const getMarkerColor = (visitCount: number): string => {
    if (viewMode !== 'ranked' || maxVisits === 0) return '#3388ff'; // Default blue
    
    const ratio = visitCount / maxVisits;
    
    // Interpolate between red and gray
    // Red: #dc2626 (rgb(220, 38, 38))
    // Gray: #6b7280 (rgb(107, 114, 128))
    const redR = 220;
    const redG = 38;
    const redB = 38;
    const grayR = 107;
    const grayG = 114;
    const grayB = 128;
    
    // Inverse ratio so red is at 1.0 and gray is at 0.0
    const r = Math.round(redR + (grayR - redR) * (1 - ratio));
    const g = Math.round(redG + (grayG - redG) * (1 - ratio));
    const b = Math.round(redB + (grayB - redB) * (1 - ratio));
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };

  if (breweriesWithLocation.length === 0) {
    return (
      <div className="h-full w-full bg-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">No breweries with location data to display</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full rounded-lg overflow-hidden border border-gray-200">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapUpdater center={center} zoom={zoom} selectedBrewery={selectedBrewery} breweries={breweriesWithLocation} />
        {breweriesWithLocation.map((brewery, index) => {
          if (!brewery.lat || !brewery.lng) return null;
          
          const color = getMarkerColor(brewery.visitCount);
          const markerIcon = viewMode === 'ranked' 
            ? createColoredIcon(color)
            : selectedBrewery === brewery.name
            ? createColoredIcon('#3b82f6') // Blue for selected
            : DefaultIcon;
          
          return (
            <Marker 
              key={`${brewery.name}-${index}`} 
              position={[brewery.lat, brewery.lng]}
              icon={markerIcon}
            >
              <Popup>
                <div className="text-sm">
                  <h3 className="font-semibold">{brewery.name}</h3>
                  {brewery.address && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(brewery.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline text-xs block mt-1"
                    >
                      {brewery.address}
                    </a>
                  )}
                  <p className="text-gray-600">
                    {brewery.visitCount} {brewery.visitCount === 1 ? 'visit' : 'visits'}
                  </p>
                  {brewery.isClosed && (
                    <p className="text-red-600 text-xs">Closed</p>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
