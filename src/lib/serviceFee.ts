// Utility functions for calculating distance-based service fees

export interface ServiceFeeInfo {
  distanceKm: number;
  feePerUnit: number;
  totalFee: number;
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

// Service fee tiers based on distance
const SERVICE_FEE_TIERS = [
  { maxDistance: 5, feePerUnit: 2 },    // 0-5km: 2 MZN per bread
  { maxDistance: 10, feePerUnit: 3 },   // 5-10km: 3 MZN per bread
  { maxDistance: 15, feePerUnit: 4 },   // 10-15km: 4 MZN per bread
  { maxDistance: 20, feePerUnit: 5 },   // 15-20km: 5 MZN per bread
  { maxDistance: Infinity, feePerUnit: 6 } // 20km+: 6 MZN per bread
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
 * Calculate service fee based on distance and quantity
 */
export const calculateServiceFee = (
  userLocation: Location, 
  bakeryLocation: Location = DEFAULT_BAKERY_LOCATION, 
  quantity: number
): ServiceFeeInfo => {
  const distance = calculateDistance(userLocation, bakeryLocation);
  
  // Find appropriate fee tier
  const tier = SERVICE_FEE_TIERS.find(tier => distance <= tier.maxDistance);
  const feePerUnit = tier?.feePerUnit || 6; // Default to highest fee
  
  return {
    distanceKm: Math.round(distance * 10) / 10, // Round to 1 decimal
    feePerUnit,
    totalFee: feePerUnit * quantity
  };
};

/**
 * Get service fee tier description
 */
export const getServiceFeeTier = (distanceKm: number): string => {
  if (distanceKm <= 5) {
    return "0-5km - Taxa de 2 MZN por pão";
  } else if (distanceKm <= 10) {
    return "5-10km - Taxa de 3 MZN por pão";
  } else if (distanceKm <= 15) {
    return "10-15km - Taxa de 4 MZN por pão";
  } else if (distanceKm <= 20) {
    return "15-20km - Taxa de 5 MZN por pão";
  }
  return "20km+ - Taxa de 6 MZN por pão";
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