export const MAPUTO_LOCATIONS = [
  { value: "Central", label: "Maputo Central", coordinates: { lat: -25.9692, lng: 32.5731 } },
  { value: "Polana", label: "Polana", coordinates: { lat: -25.9665, lng: 32.5830 } },
  { value: "Coop", label: "Coop", coordinates: { lat: -25.9532, lng: 32.5890 } },
  { value: "Sommerschield", label: "Sommerschield", coordinates: { lat: -25.9610, lng: 32.5892 } },
  { value: "Matola", label: "Matola", coordinates: { lat: -25.9625, lng: 32.4608 } },
  { value: "Cidade de Maputo", label: "Cidade de Maputo", coordinates: { lat: -25.9686, lng: 32.5728 } },
] as const;

export type LocationValue = typeof MAPUTO_LOCATIONS[number]["value"];