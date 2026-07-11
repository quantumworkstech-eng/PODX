"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { MapPin, Navigation, Loader2, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { City } from "@/lib/data";
import {
  CITY_LOCATION_DEFAULTS,
  matchUaeRegion,
  UAE_REGION_OPTIONS,
} from "@/lib/city-location-defaults";
import { INDIAN_STATES, matchIndianStateList } from "@/lib/indian-states";
import type { StudioLocation } from "@/types/location";

const AUTOCOMPLETE_DEBOUNCE_MS = 400;
const REVERSE_GEO_DEBOUNCE_MS = 450;
const MIN_INPUT_CHARS = 3;

type Suggestion = { placeId: string; description: string };

type GeocodeResponse = {
  address: string;
  city: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
};

function matchCityFromList(cities: City[], suggested: string): string {
  const s = suggested.trim();
  if (!s) return "";
  const lower = s.toLowerCase();
  const exact = cities.find((c) => c.name.toLowerCase() === lower);
  if (exact) return exact.name;
  const partial = cities.find(
    (c) => lower.includes(c.name.toLowerCase()) || c.name.toLowerCase().includes(lower)
  );
  return partial?.name || s;
}

function loadGoogleMapsScript(apiKey: string): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.google?.maps) return Promise.resolve();
  const existing = document.querySelector('script[data-podx-google-maps="1"]');
  if (existing) {
    return new Promise((resolve, reject) => {
      const t = window.setInterval(() => {
        if (window.google?.maps) {
          window.clearInterval(t);
          resolve();
        }
      }, 40);
      window.setTimeout(() => {
        window.clearInterval(t);
        reject(new Error("Google Maps load timeout"));
      }, 20000);
    });
  }
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}`;
    s.async = true;
    s.defer = true;
    s.setAttribute("data-podx-google-maps", "1");
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(s);
  });
}

export type PartnerStudioLocationPickerProps = {
  cities: City[];
  value: StudioLocation;
  onChange: (patch: Partial<StudioLocation>) => void;
  className?: string;
};

export function PartnerStudioLocationPicker({
  cities,
  value,
  onChange,
  className,
}: PartnerStudioLocationPickerProps) {
  const listId = useId();
  const sessionTokenRef = useRef(crypto.randomUUID());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reverseTimerRef = useRef<number | null>(null);
  const geocodeCacheRef = useRef<Map<string, GeocodeResponse>>(new Map());
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const locationRef = useRef(value);
  locationRef.current = value;

  const [inputFocused, setInputFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [fetchingSuggestions, setFetchingSuggestions] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState("");
  const [mapOpen, setMapOpen] = useState(false);
  const [mapLoadError, setMapLoadError] = useState("");
  const [mapReady, setMapReady] = useState(false);
  const [mapWorking, setMapWorking] = useState(false);
  const [pendingMap, setPendingMap] = useState<GeocodeResponse | null>(null);
  const [latInput, setLatInput] = useState("");
  const [lngInput, setLngInput] = useState("");
  const [manualCoordError, setManualCoordError] = useState("");

  const browserMapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY || "";

  const resetSession = useCallback(() => {
    sessionTokenRef.current = crypto.randomUUID();
  }, []);

  useEffect(() => {
    setLatInput(value.latitude != null ? String(value.latitude) : "");
    setLngInput(value.longitude != null ? String(value.longitude) : "");
  }, [value.latitude, value.longitude]);

  const commitManualCoords = useCallback(() => {
    const tLat = latInput.trim();
    const tLng = lngInput.trim();
    if (!tLat && !tLng) {
      setManualCoordError("");
      onChange({ latitude: undefined, longitude: undefined });
      return;
    }
    if (!tLat || !tLng) {
      setManualCoordError("Enter both latitude and longitude, or clear both fields.");
      setLatInput(value.latitude != null ? String(value.latitude) : "");
      setLngInput(value.longitude != null ? String(value.longitude) : "");
      return;
    }
    const lat = Number(tLat);
    const lng = Number(tLng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      setManualCoordError("Use decimal numbers only (e.g. 19.076, 72.8777).");
      return;
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setManualCoordError("Latitude must be −90–90; longitude −180–180.");
      return;
    }
    setManualCoordError("");
    setGeocodeError("");
    onChange({ latitude: lat, longitude: lng });
  }, [latInput, lngInput, onChange, value.latitude, value.longitude]);

  const applyGeocode = useCallback(
    (g: GeocodeResponse) => {
      const country = g.country || value.country || "India";
      const isIndia = country === "India";
      const state = isIndia
        ? matchIndianStateList(g.state, INDIAN_STATES) || value.state
        : matchUaeRegion(g.state) || value.state;
      const city = matchCityFromList(cities, g.city) || g.city || value.city;
      onChange({
        address: g.address,
        city,
        state,
        country,
        latitude: g.latitude,
        longitude: g.longitude,
      });
    },
    [cities, onChange, value.country, value.state, value.city]
  );

  const fetchAutocomplete = useCallback(
    async (text: string) => {
      if (text.trim().length < MIN_INPUT_CHARS) {
        setSuggestions([]);
        return;
      }
      setFetchingSuggestions(true);
      try {
        const res = await fetch("/api/maps/autocomplete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            input: text,
            sessionToken: sessionTokenRef.current,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setSuggestions([]);
          return;
        }
        setSuggestions((data.suggestions || []).slice(0, 5));
      } catch {
        setSuggestions([]);
      } finally {
        setFetchingSuggestions(false);
      }
    },
    []
  );

  const onAddressChange = (raw: string) => {
    onChange({
      address: raw,
      latitude: undefined,
      longitude: undefined,
    });
    setGeocodeError("");
    setSuggestionsOpen(true);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (raw.trim().length < MIN_INPUT_CHARS) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(() => {
      void fetchAutocomplete(raw);
    }, AUTOCOMPLETE_DEBOUNCE_MS);
  };

  const MAPS_SERVER_MISSING =
    "Google Maps server API is not configured. Add GOOGLE_MAPS_SERVER_KEY (or GOOGLE_MAPS_API_KEY) to your server environment, or enter latitude/longitude manually below.";

  const geocodeByPlaceId = async (placeId: string): Promise<GeocodeResponse | null> => {
    const cached = geocodeCacheRef.current.get(placeId);
    if (cached) return cached;
    const res = await fetch("/api/maps/geocode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ placeId }),
    });
    const data = await res.json();
    if (!res.ok) {
      if (res.status === 503) {
        setGeocodeError(MAPS_SERVER_MISSING);
      }
      return null;
    }
    geocodeCacheRef.current.set(placeId, data as GeocodeResponse);
    return data as GeocodeResponse;
  };

  const onPickSuggestion = async (s: Suggestion) => {
    setSuggestionsOpen(false);
    setSuggestions([]);
    setIsGeocoding(true);
    setGeocodeError("");
    try {
      const g = await geocodeByPlaceId(s.placeId);
      if (g) {
        applyGeocode(g);
        resetSession();
      } else {
        setGeocodeError((prev) =>
          prev && prev.includes("GOOGLE_MAPS_SERVER_KEY")
            ? prev
            : "Could not resolve that place. Try another suggestion, or enter coordinates manually below."
        );
      }
    } finally {
      setIsGeocoding(false);
    }
  };

  const onVerifyClick = async () => {
    if (!value.address?.trim() || !value.city) return;
    setIsGeocoding(true);
    setGeocodeError("");
    try {
      const res = await fetch("/api/maps/geocode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: value.address.trim(),
          city: value.city,
          country: value.country || "India",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setGeocodeError(
          res.status === 503
            ? MAPS_SERVER_MISSING
            : res.status === 404
            ? "Location not found. Try a more specific address."
            : (data.error as string) || "Could not verify address."
        );
        return;
      }
      applyGeocode(data as GeocodeResponse);
      resetSession();
    } catch {
      setGeocodeError("Network error. Try again.");
    } finally {
      setIsGeocoding(false);
    }
  };

  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    setMapWorking(true);
    try {
      const res = await fetch("/api/maps/reverse-geocode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ latitude: lat, longitude: lng }),
      });
      const data = await res.json();
      if (!res.ok) return;
      setPendingMap(data as GeocodeResponse);
    } catch {
      /* ignore */
    } finally {
      setMapWorking(false);
    }
  }, []);

  useLayoutEffect(() => {
    if (!mapOpen) {
      mapInstanceRef.current = null;
      markerRef.current = null;
      setMapReady(false);
      if (reverseTimerRef.current != null) {
        window.clearTimeout(reverseTimerRef.current);
        reverseTimerRef.current = null;
      }
      return;
    }

    if (!browserMapsKey) {
      setMapLoadError("Missing browser Maps key.");
      return;
    }

    let cancelled = false;
    setMapLoadError("");
    setMapReady(false);

    const v = locationRef.current;
    const center =
      v.latitude != null && v.longitude != null
        ? { lat: v.latitude, lng: v.longitude }
        : { lat: 19.076, lng: 72.8777 };

    let waitAttempts = 0;
    const waitForContainer = (): Promise<HTMLDivElement | null> =>
      new Promise((resolve) => {
        const tick = () => {
          if (cancelled) {
            resolve(null);
            return;
          }
          if (mapContainerRef.current) {
            resolve(mapContainerRef.current);
            return;
          }
          if (waitAttempts++ > 40) {
            resolve(null);
            return;
          }
          window.requestAnimationFrame(tick);
        };
        tick();
      });

    void (async () => {
      const el = await waitForContainer();
      if (cancelled || !el) {
        if (!cancelled && !el) {
          setMapLoadError("Map container not ready. Close and try again.");
        }
        return;
      }
      try {
        await loadGoogleMapsScript(browserMapsKey);
      } catch {
        if (!cancelled) {
          setMapLoadError("Could not load Google Maps. Check your browser key and network.");
        }
        return;
      }
      if (cancelled) return;

      const map = new google.maps.Map(el, {
        center,
        zoom: 16,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
      });
      mapInstanceRef.current = map;

      const marker = new google.maps.Marker({
        position: center,
        map,
        draggable: true,
      });
      markerRef.current = marker;

      const runReverse = (lat: number, lng: number) => {
        if (reverseTimerRef.current != null) {
          window.clearTimeout(reverseTimerRef.current);
        }
        reverseTimerRef.current = window.setTimeout(() => {
          void reverseGeocode(lat, lng);
        }, REVERSE_GEO_DEBOUNCE_MS);
      };

      marker.addListener("dragend", () => {
        const p = marker.getPosition();
        if (!p) return;
        runReverse(p.lat(), p.lng());
      });

      setPendingMap({
        address: v.address,
        city: v.city,
        state: v.state,
        country: v.country,
        latitude: center.lat,
        longitude: center.lng,
      });
      void reverseGeocode(center.lat, center.lng);

      if (!cancelled) setMapReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [mapOpen, browserMapsKey, reverseGeocode]);

  const onConfirmMap = () => {
    if (!pendingMap) {
      setMapOpen(false);
      return;
    }
    applyGeocode(pendingMap);
    setMapOpen(false);
  };

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      const el = document.getElementById(`addr-wrap-${listId}`);
      if (el && !el.contains(t)) setSuggestionsOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [listId]);

  const googleMapsLink = useMemo(() => {
    if (value.latitude == null || value.longitude == null) return null;
    return `https://www.google.com/maps?q=${value.latitude},${value.longitude}`;
  }, [value.latitude, value.longitude]);

  const stateSelectOptions = useMemo(() => {
    if (value.country === "United Arab Emirates") {
      const set = new Set<string>(UAE_REGION_OPTIONS);
      if (value.state) set.add(value.state);
      return Array.from(set);
    }
    return [...INDIAN_STATES];
  }, [value.country, value.state]);

  return (
    <div className={cn("space-y-4", className)}>
      <div>
        <label className="text-white/80 text-sm font-medium mb-2 block">City *</label>
        <select
          value={value.city}
          onChange={(e) => {
            setGeocodeError("");
            const city = e.target.value;
            if (!city) {
              onChange({
                city: "",
                state: "",
                country: "India",
                latitude: undefined,
                longitude: undefined,
              });
              return;
            }
            const defaults = CITY_LOCATION_DEFAULTS[city];
            if (defaults) {
              onChange({
                city,
                state: defaults.state,
                country: defaults.country,
                latitude: undefined,
                longitude: undefined,
              });
            } else {
              onChange({
                city,
                latitude: undefined,
                longitude: undefined,
              });
            }
          }}
          className="w-full h-14 bg-white/5 border border-white/10 rounded-xl px-5 text-white focus:border-[#D9FC67] focus:outline-none transition-colors appearance-none cursor-pointer"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 1rem center",
            backgroundSize: "1.5em",
          }}
        >
          <option value="" className="bg-[#141414]">
            Select a city
          </option>
          {cities.map((city) => (
            <option key={city.id} value={city.name} className="bg-[#141414]">
              {city.name}
            </option>
          ))}
        </select>
      </div>

      <div id={`addr-wrap-${listId}`} className="relative">
        <label className="text-white/80 text-sm font-medium mb-2 block">Full Address *</label>
        <div className="relative">
          <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/40 w-5 h-5 pointer-events-none z-[1]" />
          <input
            type="text"
            role="combobox"
            aria-expanded={suggestionsOpen}
            aria-controls={suggestions.length ? listId : undefined}
            aria-autocomplete="list"
            value={value.address}
            onChange={(e) => onAddressChange(e.target.value)}
            onFocus={() => {
              setInputFocused(true);
              if (value.address.trim().length >= MIN_INPUT_CHARS) setSuggestionsOpen(true);
            }}
            onBlur={() => {
              setInputFocused(false);
              window.setTimeout(() => setSuggestionsOpen(false), 200);
            }}
            placeholder="Building name, street, area, landmark"
            className="w-full h-14 bg-white/5 border border-white/10 rounded-xl pl-12 pr-5 text-white placeholder:text-white/30 focus:border-[#D9FC67] focus:outline-none transition-colors"
          />
          {fetchingSuggestions && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-white/40" />
          )}
        </div>
        <p className="text-white/30 text-xs mt-1">
          Enter the complete street address. Suggestions and Verify need Google Maps server keys; you can
          also set coordinates manually below (optional).
        </p>

        {suggestionsOpen && suggestions.length > 0 && inputFocused && (
          <ul
            id={listId}
            role="listbox"
            className="absolute z-[60] left-0 right-0 mt-1 max-h-56 overflow-auto rounded-xl border border-white/10 bg-[#1a1a1a] shadow-xl py-1"
          >
            {suggestions.map((s) => (
              <li key={s.placeId} role="option">
                <button
                  type="button"
                  className="w-full text-left px-4 py-2.5 text-sm text-white/90 hover:bg-white/10 transition-colors"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => void onPickSuggestion(s)}
                >
                  {s.description}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-white/80 text-sm font-medium mb-2 block">State *</label>
          <select
            value={value.state}
            onChange={(e) => onChange({ state: e.target.value })}
            className="w-full h-14 bg-white/5 border border-white/10 rounded-xl px-4 text-white focus:border-[#D9FC67] focus:outline-none transition-colors appearance-none cursor-pointer"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 0.75rem center",
              backgroundSize: "1.25em",
            }}
          >
            <option value="" className="bg-[#141414]">
              Select state
            </option>
            {stateSelectOptions.map((s) => (
              <option key={s} value={s} className="bg-[#141414]">
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-white/80 text-sm font-medium mb-2 block">Country</label>
          <input
            type="text"
            value={value.country}
            readOnly
            className="w-full h-14 bg-white/5 border border-white/10 rounded-xl px-5 text-white/60 cursor-not-allowed"
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mt-2">
        <button
          type="button"
          onClick={() => void onVerifyClick()}
          disabled={isGeocoding || !value.address?.trim() || !value.city}
          className="flex-1 h-12 flex items-center justify-center gap-2 bg-white/5 border border-white/10 rounded-xl text-white hover:border-[#D9FC67] hover:text-[#D9FC67] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isGeocoding ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Verifying…
            </>
          ) : value.latitude != null && value.longitude != null ? (
            <>
              <Navigation className="w-4 h-4 text-[#D9FC67]" />
              <span className="text-[#D9FC67]">Re-verify address</span>
            </>
          ) : (
            <>
              <Navigation className="w-4 h-4" /> Verify & Pin
            </>
          )}
        </button>
        <button
          type="button"
          onClick={() => {
            setMapOpen(true);
            setMapLoadError("");
            setPendingMap(null);
          }}
          disabled={!browserMapsKey}
          title={
            !browserMapsKey
              ? "Set NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY to enable the map picker"
              : undefined
          }
          className="flex-1 h-12 flex items-center justify-center gap-2 bg-[#D9FC67]/10 border border-[#D9FC67]/40 rounded-xl text-[#D9FC67] hover:bg-[#D9FC67]/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <MapPin className="w-4 h-4" /> Select on Map
        </button>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
        <p className="text-white/80 text-sm font-medium">Optional coordinates</p>
        <p className="text-white/40 text-xs leading-relaxed">
          Decimal degrees (WGS84). Use this when Maps APIs are not configured, or to fine-tune a pin. Leave
          blank if you only need the text address.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-white/50 text-xs mb-1 block">Latitude</label>
            <input
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={latInput}
              onChange={(e) => setLatInput(e.target.value)}
              onBlur={() => commitManualCoords()}
              placeholder="e.g. 19.076"
              className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-3 text-white text-sm placeholder:text-white/25 focus:border-[#D9FC67] focus:outline-none"
            />
          </div>
          <div>
            <label className="text-white/50 text-xs mb-1 block">Longitude</label>
            <input
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={lngInput}
              onChange={(e) => setLngInput(e.target.value)}
              onBlur={() => commitManualCoords()}
              placeholder="e.g. 72.8777"
              className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-3 text-white text-sm placeholder:text-white/25 focus:border-[#D9FC67] focus:outline-none"
            />
          </div>
        </div>
        {manualCoordError && <p className="text-amber-400/90 text-xs">{manualCoordError}</p>}
      </div>

      {!browserMapsKey && (
        <p className="text-amber-400/90 text-xs">
          Select on Map is disabled until you add{" "}
          <code className="text-white/70">NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY</code> (Maps JavaScript API,
          HTTP referrer–restricted). Autocomplete and Verify need{" "}
          <code className="text-white/70">GOOGLE_MAPS_SERVER_KEY</code> on the server.
        </p>
      )}
      {geocodeError && (
        <p className="text-red-400 text-xs flex items-center gap-1">
          <AlertCircle className="w-3 h-3 shrink-0" /> {geocodeError}
        </p>
      )}

      <div className="rounded-2xl overflow-hidden border border-white/10">
        {value.latitude != null && value.longitude != null ? (
          <div className="p-4 bg-white/5 space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 min-w-0">
                <MapPin className="w-4 h-4 text-[#D9FC67] shrink-0" />
                <span className="text-white/60 text-xs truncate">
                  {value.address}, {value.city}
                </span>
              </div>
              <span className="text-[#D9FC67] text-xs font-medium shrink-0">Pinned ✓</span>
            </div>
            <p className="text-white/40 text-xs font-mono">
              {value.latitude.toFixed(5)}, {value.longitude.toFixed(5)}
            </p>
            {googleMapsLink && (
              <a
                href={googleMapsLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#D9FC67] text-xs hover:underline inline-block"
              >
                Open in Google Maps (no API cost)
              </a>
            )}
          </div>
        ) : (
          <div className="h-52 bg-white/5 flex flex-col items-center justify-center gap-3 px-4 text-center">
            <MapPin className="w-10 h-10 text-white/20" />
            <p className="text-white/30 text-sm">
              Coordinates are optional. Enter them above, or use Verify / map when Google Maps keys are
              configured.
            </p>
          </div>
        )}
      </div>

      <Dialog open={mapOpen} onOpenChange={setMapOpen}>
        <DialogContent
          showCloseButton
          className="bg-[#141414] border-white/10 text-white sm:max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          <DialogHeader>
            <DialogTitle className="text-white">Adjust pin on map</DialogTitle>
            <p className="text-white/50 text-sm">
              Map loads only in this dialog. Drag the pin; the address updates when you finish moving
              it.
            </p>
          </DialogHeader>
          {mapLoadError && (
            <p className="text-red-400 text-sm flex items-center gap-1">
              <AlertCircle className="w-4 h-4" /> {mapLoadError}
            </p>
          )}
          <div
            ref={mapContainerRef}
            className="w-full h-[min(55vh,420px)] rounded-xl bg-zinc-900 border border-white/10"
          />
          {!mapReady && mapOpen && !mapLoadError && (
            <div className="flex items-center gap-2 text-white/50 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading map…
            </div>
          )}
          {pendingMap && mapReady && (
            <p className="text-white/60 text-xs leading-relaxed line-clamp-3">
              {mapWorking ? "Updating address…" : pendingMap.address}
            </p>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
              onClick={() => setMapOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-[#D9FC67] text-black hover:bg-[#c9ec57]"
              disabled={!mapReady || !pendingMap}
              onClick={onConfirmMap}
            >
              Confirm location
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
