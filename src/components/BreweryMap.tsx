import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { BreweryStats } from '../types';

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

interface BreweryMapProps {
  breweries: BreweryStats[];
}

// Placeholder coordinates - in production, you'd have actual brewery locations
// For now, using a default location (you'll need to add lat/lng to brewery data)
// TODO: Add actual coordinates to brewery data or use geocoding
const getBreweryLocation = (_breweryName: string): [number, number] => {
  // This is a placeholder - you'll need to add actual coordinates to your data
  // For now, returning a default location
  return [37.7749, -122.4194]; // San Francisco area (adjust to your area)
};

export default function BreweryMap({ breweries }: BreweryMapProps) {
  // Calculate center point from all breweries (or use default)
  const defaultCenter: [number, number] = [37.7749, -122.4194]; // Adjust to your area
  const defaultZoom = 11;

  if (breweries.length === 0) {
    return (
      <div className="h-full w-full bg-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">No breweries to display</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full rounded-lg overflow-hidden border border-gray-200">
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {breweries.map((brewery, index) => {
          const [lat, lng] = getBreweryLocation(brewery.name);
          return (
            <Marker key={`${brewery.name}-${index}`} position={[lat, lng]}>
              <Popup>
                <div className="text-sm">
                  <h3 className="font-semibold">{brewery.name}</h3>
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
