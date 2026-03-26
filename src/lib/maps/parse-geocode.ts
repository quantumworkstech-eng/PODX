/** Parsed from Google Geocoding API `results[0]`. */

export type GeocodeAddressParts = {
  formattedAddress: string;
  latitude: number;
  longitude: number;
  city: string;
  state: string;
  country: string;
};

type AddressComponent = {
  long_name: string;
  short_name: string;
  types: string[];
};

function pickComponent(
  components: AddressComponent[],
  type: string
): string | undefined {
  const c = components.find((x) => x.types.includes(type));
  return c?.long_name;
}

export function parseGeocodeResult(result: {
  formatted_address?: string;
  geometry?: { location?: { lat: number; lng: number } };
  address_components?: AddressComponent[];
}): GeocodeAddressParts | null {
  const lat = result.geometry?.location?.lat;
  const lng = result.geometry?.location?.lng;
  if (lat == null || lng == null) return null;

  const components = result.address_components || [];
  const country =
    pickComponent(components, "country") || "";

  const locality =
    pickComponent(components, "locality") ||
    pickComponent(components, "sublocality_level_1") ||
    pickComponent(components, "administrative_area_level_2") ||
    "";

  const state =
    pickComponent(components, "administrative_area_level_1") || "";

  return {
    formattedAddress: result.formatted_address || "",
    latitude: lat,
    longitude: lng,
    city: locality,
    state,
    country,
  };
}
