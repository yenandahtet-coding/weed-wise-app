/**
 * LiveMap — shows the user's real GPS location on an OpenStreetMap tile layer
 * using react-leaflet (free, no API key needed).
 *
 * Props:
 *  pins   – optional array of { lat, lng, label } to plot (e.g. scan history)
 *  height – CSS height string, default "100%"
 */
import { useEffect, useState, useRef } from "react";
import { MapPin, Loader2, LocateFixed } from "lucide-react";

// ── Leaflet CSS (must be imported before map renders) ──────────────────────
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix the missing marker icon that Vite/webpack breaks by default
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// @ts-expect-error – patching leaflet's default icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

export interface MapPin {
  lat: number;
  lng: number;
  label?: string;
}

interface Props {
  pins?: MapPin[];
  height?: string;
}

export function LiveMap({ pins = [], height = "100%" }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const userMarker = useRef<L.CircleMarker | null>(null);
  const pinMarkers = useRef<L.Marker[]>([]);

  const [status, setStatus] = useState<"loading" | "ok" | "denied" | "unavailable">("loading");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  // ── Get GPS position ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!navigator.geolocation) {
      setStatus("unavailable");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setStatus("ok");
      },
      () => setStatus("denied"),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // ── Initialise / update Leaflet map ───────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || status !== "ok" || !coords) return;

    // Create map only once
    if (!leafletMap.current) {
      leafletMap.current = L.map(mapRef.current, {
        zoomControl: true,
        attributionControl: true,
      }).setView([coords.lat, coords.lng], 14);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(leafletMap.current);
    } else {
      leafletMap.current.setView([coords.lat, coords.lng], 14);
    }

    const map = leafletMap.current;

    // ── Current-position marker (pulsing blue dot) ─────────────────────────
    if (userMarker.current) userMarker.current.remove();
    userMarker.current = L.circleMarker([coords.lat, coords.lng], {
      radius: 10,
      color: "#2563eb",
      fillColor: "#3b82f6",
      fillOpacity: 0.9,
      weight: 3,
    })
      .addTo(map)
      .bindPopup("<b>📍 Your location</b>")
      .openPopup();

    // ── History pins (green markers) ──────────────────────────────────────
    pinMarkers.current.forEach((m) => m.remove());
    pinMarkers.current = [];

    const greenIcon = L.divIcon({
      html: `<div style="
        width:28px;height:28px;border-radius:50% 50% 50% 0;
        background:#16a34a;transform:rotate(-45deg);
        border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35);
      "></div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 28],
      className: "",
    });

    pins.forEach(({ lat, lng, label }) => {
      const m = L.marker([lat, lng], { icon: greenIcon })
        .addTo(map)
        .bindPopup(label ? `<b>🌿 ${label}</b>` : "🌿 Weed scan");
      pinMarkers.current.push(m);
    });

    // Fit bounds to show all markers when there are history pins
    if (pins.length > 0) {
      const all: L.LatLngExpression[] = [
        [coords.lat, coords.lng],
        ...pins.map(({ lat, lng }) => [lat, lng] as L.LatLngExpression),
      ];
      map.fitBounds(L.latLngBounds(all), { padding: [32, 32], maxZoom: 15 });
    }

    // Cleanup on unmount
    return () => {};
  }, [status, coords, pins]);

  // Destroy map on unmount
  useEffect(() => {
    return () => {
      leafletMap.current?.remove();
      leafletMap.current = null;
    };
  }, []);

  // ── Recenter button ───────────────────────────────────────────────────────
  const recenter = () => {
    if (coords && leafletMap.current) {
      leafletMap.current.setView([coords.lat, coords.lng], 15, { animate: true });
    }
  };

  // ── Fallback states ───────────────────────────────────────────────────────
  if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground" style={{ height }}>
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm">Getting your location…</p>
      </div>
    );
  }

  if (status === "denied") {
    return (
      <div className="flex flex-col items-center justify-center gap-3 p-6 text-center text-muted-foreground" style={{ height }}>
        <MapPin className="h-10 w-10 text-destructive/60" />
        <p className="text-sm font-medium">Location access denied</p>
        <p className="text-xs">Please allow location permission in your browser settings to see the map.</p>
      </div>
    );
  }

  if (status === "unavailable") {
    return (
      <div className="flex flex-col items-center justify-center gap-3 p-6 text-center text-muted-foreground" style={{ height }}>
        <MapPin className="h-10 w-10 text-muted-foreground/50" />
        <p className="text-sm">Geolocation not supported by your browser.</p>
      </div>
    );
  }

  return (
    <div className="relative" style={{ height }}>
      {/* Leaflet container */}
      <div ref={mapRef} className="h-full w-full" />

      {/* Recenter FAB */}
      <button
        onClick={recenter}
        title="Re-center map"
        className="absolute bottom-3 right-3 z-[1000] flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-md transition hover:bg-primary hover:text-white dark:bg-zinc-800 dark:hover:bg-primary"
      >
        <LocateFixed className="h-4 w-4" />
      </button>
    </div>
  );
}
