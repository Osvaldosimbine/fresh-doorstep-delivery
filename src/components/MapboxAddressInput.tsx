import { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

const MAPBOX_TOKEN = 'pk.eyJ1Ijoic2ltYmlub3N2YWxkbyIsImEiOiJjbW5mMHQyMXowNDVtMnBzNmNicHU0cm40In0.ggiZKYgRsKR1jasppHwVdA';

export interface AddressResult {
  address: string;
  coordinates: { lat: number; lng: number };
}

interface MapboxAddressInputProps {
  value?: string;
  onChange: (result: AddressResult) => void;
  placeholder?: string;
  className?: string;
  label?: string;
}

interface GeocodingFeature {
  place_name: string;
  center: [number, number]; // [lng, lat]
}

const MapboxAddressInput = ({
  value = "",
  onChange,
  placeholder = "Digite o endereço ou use GPS",
  className,
}: MapboxAddressInputProps) => {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<GeocodingFeature[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync external value
  useEffect(() => {
    if (value && value !== query) {
      setQuery(value);
    }
  }, [value]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const searchAddress = useCallback(async (text: string) => {
    if (text.length < 3) {
      setSuggestions([]);
      return;
    }
    setIsSearching(true);
    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(text)}.json?` +
        `access_token=${MAPBOX_TOKEN}&country=mz&limit=5&language=pt&types=address,poi,place,locality,neighborhood`
      );
      const data = await res.json();
      setSuggestions(data.features || []);
      setShowSuggestions(true);
    } catch (err) {
      console.error("Geocoding error:", err);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleInputChange = (text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchAddress(text), 400);
  };

  const handleSelectSuggestion = (feature: GeocodingFeature) => {
    const result: AddressResult = {
      address: feature.place_name,
      coordinates: { lat: feature.center[1], lng: feature.center[0] },
    };
    setQuery(feature.place_name);
    setSuggestions([]);
    setShowSuggestions(false);
    onChange(result);
  };

  const handleReverseGeocode = async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?` +
        `access_token=${MAPBOX_TOKEN}&language=pt&limit=1`
      );
      const data = await res.json();
      if (data.features?.length > 0) {
        const feature = data.features[0];
        const result: AddressResult = {
          address: feature.place_name,
          coordinates: { lat, lng },
        };
        setQuery(feature.place_name);
        onChange(result);
      } else {
        // Fallback: use raw coordinates
        const address = `Localização GPS (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
        setQuery(address);
        onChange({ address, coordinates: { lat, lng } });
      }
    } catch {
      const address = `Localização GPS (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
      setQuery(address);
      onChange({ address, coordinates: { lat, lng } });
    }
  };

  const handleGPS = () => {
    if (!navigator.geolocation) return;
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        handleReverseGeocode(pos.coords.latitude, pos.coords.longitude);
        setGpsLoading(false);
      },
      () => {
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const handleClear = () => {
    setQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder={placeholder}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            className="pr-8"
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          {isSearching && (
            <Loader2 className="absolute right-8 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleGPS}
          disabled={gpsLoading}
          title="Usar GPS"
        >
          {gpsLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Navigation className="h-4 w-4" />
          )}
        </Button>
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((feature, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectSuggestion(feature)}
              className="w-full text-left px-3 py-2.5 text-sm hover:bg-accent hover:text-accent-foreground flex items-start gap-2 border-b border-border last:border-0"
            >
              <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
              <span>{feature.place_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default MapboxAddressInput;
