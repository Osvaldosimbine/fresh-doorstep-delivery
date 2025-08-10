import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MAPUTO_LOCATIONS } from "@/constants/locations";

interface LocationFilterProps {
  selectedLocation: string;
  onLocationChange: (location: string) => void;
}

const LocationFilter = ({ selectedLocation, onLocationChange }: LocationFilterProps) => {
  return (
    <div className="mb-6">
      <Select value={selectedLocation} onValueChange={onLocationChange}>
        <SelectTrigger className="w-64 border-border focus:ring-bread-golden">
          <SelectValue placeholder="Filtrar por localização" />
        </SelectTrigger>
        <SelectContent className="bg-popover border-border">
          <SelectItem value="all" className="focus:bg-accent focus:text-accent-foreground">
            Todas as localizações
          </SelectItem>
          {MAPUTO_LOCATIONS.map((location) => (
            <SelectItem 
              key={location.value} 
              value={location.value}
              className="focus:bg-accent focus:text-accent-foreground"
            >
              {location.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default LocationFilter;