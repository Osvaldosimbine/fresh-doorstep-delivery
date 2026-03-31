import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = 'pk.eyJ1Ijoic2ltYmlub3N2YWxkbyIsImEiOiJjbW5mMHQyMXowNDVtMnBzNmNicHU0cm40In0.ggiZKYgRsKR1jasppHwVdA';

// Maputo, Mozambique center
const DEFAULT_CENTER: [number, number] = [32.5732, -25.9692];
const DEFAULT_ZOOM = 13;

export interface MapMarker {
  id: string;
  lng: number;
  lat: number;
  type: 'bakery' | 'delivery' | 'customer' | 'stop';
  label?: string;
  popup?: string;
}

export interface RouteInfo {
  duration: number; // seconds
  distance: number; // meters
  geometry: GeoJSON.Geometry;
}

interface MapboxMapProps {
  markers?: MapMarker[];
  route?: RouteInfo | null;
  center?: [number, number];
  zoom?: number;
  className?: string;
  showUserLocation?: boolean;
  onMapLoad?: (map: mapboxgl.Map) => void;
}

const MARKER_COLORS: Record<MapMarker['type'], string> = {
  bakery: '#F59E0B',
  delivery: '#3B82F6',
  customer: '#10B981',
  stop: '#8B5CF6',
};

const MARKER_ICONS: Record<MapMarker['type'], string> = {
  bakery: '🏪',
  delivery: '🚚',
  customer: '📍',
  stop: '⏹',
};

export function MapboxMap({
  markers = [],
  route = null,
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  className = '',
  showUserLocation = false,
  onMapLoad,
}: MapboxMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center,
      zoom,
      attributionControl: false,
      // Performance: optimize for 3G
      fadeDuration: 0,
      trackResize: true,
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-left');

    if (showUserLocation) {
      map.addControl(
        new mapboxgl.GeolocateControl({
          positionOptions: { enableHighAccuracy: true },
          trackUserLocation: true,
          showUserHeading: true,
        }),
        'top-right'
      );
    }

    map.on('load', () => {
      setMapLoaded(true);
      onMapLoad?.(map);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      setMapLoaded(false);
    };
  }, []);

  // Update markers
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    // Remove old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    markers.forEach((marker) => {
      const el = document.createElement('div');
      el.className = 'mapbox-custom-marker';
      el.style.cssText = `
        width: 36px; height: 36px; border-radius: 50%;
        background: ${MARKER_COLORS[marker.type]};
        display: flex; align-items: center; justify-content: center;
        font-size: 18px; box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        border: 2px solid white; cursor: pointer;
      `;
      el.textContent = MARKER_ICONS[marker.type];

      const m = new mapboxgl.Marker({ element: el })
        .setLngLat([marker.lng, marker.lat])
        .addTo(mapRef.current!);

      if (marker.popup || marker.label) {
        m.setPopup(
          new mapboxgl.Popup({ offset: 25, closeButton: false }).setHTML(
            `<div style="padding:4px 8px;font-size:13px;font-weight:500">${marker.popup || marker.label}</div>`
          )
        );
      }

      markersRef.current.push(m);
    });

    // Fit bounds if multiple markers
    if (markers.length > 1) {
      const bounds = new mapboxgl.LngLatBounds();
      markers.forEach((m) => bounds.extend([m.lng, m.lat]));
      mapRef.current.fitBounds(bounds, { padding: 60, maxZoom: 15, duration: 500 });
    } else if (markers.length === 1) {
      mapRef.current.flyTo({ center: [markers[0].lng, markers[0].lat], zoom: 14, duration: 500 });
    }
  }, [markers, mapLoaded]);

  // Draw route
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const map = mapRef.current;

    if (map.getSource('route')) {
      (map.getSource('route') as mapboxgl.GeoJSONSource).setData({
        type: 'Feature',
        properties: {},
        geometry: route?.geometry || { type: 'LineString', coordinates: [] },
      });
    } else if (route?.geometry) {
      map.addSource('route', {
        type: 'geojson',
        data: { type: 'Feature', properties: {}, geometry: route.geometry },
      });
      map.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#3B82F6', 'line-width': 4, 'line-opacity': 0.8 },
      });
    }
  }, [route, mapLoaded]);

  return (
    <div
      ref={mapContainer}
      className={`w-full min-h-[300px] rounded-lg overflow-hidden ${className}`}
      style={{ height: '100%' }}
    />
  );
}

// Utility: fetch directions from Mapbox
export async function fetchMapboxDirections(
  origin: [number, number],
  destination: [number, number],
  waypoints?: [number, number][]
): Promise<RouteInfo | null> {
  const coords = [origin, ...(waypoints || []), destination]
    .map((c) => c.join(','))
    .join(';');

  try {
    const res = await fetch(
      `https://api.mapbox.com/directions/v5/mapbox/driving/${coords}?geometries=geojson&overview=full&access_token=${MAPBOX_TOKEN}`
    );
    const data = await res.json();
    if (!data.routes?.[0]) return null;

    const r = data.routes[0];
    return {
      duration: r.duration,
      distance: r.distance,
      geometry: r.geometry,
    };
  } catch (err) {
    console.error('Mapbox directions error:', err);
    return null;
  }
}

export function formatETA(seconds: number): string {
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return `${hrs}h ${rem}min`;
}
