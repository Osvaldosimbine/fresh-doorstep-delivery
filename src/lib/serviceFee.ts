// Utility functions for calculating distance-based service fees

export interface ServiceFeeInfo {
  distanceKm: number;
  totalFee: number;
  zone: string;
}

export interface Location {
  lat: number;
  lng: number;
}

// Default bakery location (Maputo center as example)
export const DEFAULT_BAKERY_LOCATION: Location = {
  lat: -25.9669,
  lng: 32.5732
};

// Service fee tiers based on distance (fixed rates per delivery - Taxa de Mobilidade)
const SERVICE_FEE_TIERS = [
  { maxDistance: 3, fee: 5 },    // 0-3km: 5 MT fixed
  { maxDistance: 7, fee: 10 },    // 3-7km: 10 MT fixed  
  { maxDistance: Infinity, fee: 15 } // 7km+: 15 MT fixed
];

/**
 * Calculate distance between two points using Haversine formula
 */
export const calculateDistance = (point1: Location, point2: Location): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (point2.lat - point1.lat) * Math.PI / 180;
  const dLng = (point2.lng - point1.lng) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

/**
 * Calculate service fee based on distance (fixed rate per delivery)
 */
export const calculateServiceFee = (
  userLocation: Location, 
  bakeryLocation: Location = DEFAULT_BAKERY_LOCATION
): ServiceFeeInfo => {
  const distance = calculateDistance(userLocation, bakeryLocation);
  
  // Find appropriate fee tier
  const tier = SERVICE_FEE_TIERS.find(tier => distance <= tier.maxDistance);
  const totalFee = tier?.fee || 15; // Default to highest fee
  
  let zone = "Zona Longa";
  if (distance <= 3) zone = "Zona Curta";
  else if (distance <= 7) zone = "Zona Média";
  
  return {
    distanceKm: Math.round(distance * 10) / 10, // Round to 1 decimal
    totalFee,
    zone
  };
};

/**
 * Get service fee tier description
 */
export const getServiceFeeTier = (distanceKm: number): string => {
  if (distanceKm <= 3) {
    return "0-3km - Taxa de 5 MT por entrega";
  } else if (distanceKm <= 7) {
    return "3-7km - Taxa de 10 MT por entrega";
  }
  return "7km+ - Taxa de 15 MT por entrega";
};

/**
 * Get estimated location coordinates from location name (simple mapping)
 */
export const getLocationCoordinates = (locationName: string): Location | null => {
  const locationMap: Record<string, Location> = {
    "Polana": { lat: -25.9669, lng: 32.5732 },
    "Sommerschield": { lat: -25.9558, lng: 32.5821 },
    "Baixa": { lat: -25.9692, lng: 32.5731 },
    "Coop": { lat: -25.9445, lng: 32.5886 },
    "Costa do Sol": { lat: -25.8987, lng: 32.6234 },
    "Katembe": { lat: -25.9923, lng: 32.5731 },
    "Matola": { lat: -25.9625, lng: 32.4589 },
    "Machava": { lat: -25.8234, lng: 32.3876 }
  };
  
  return locationMap[locationName] || null;
};