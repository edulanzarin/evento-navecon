/**
 * LocationSection — venue address + an interactive 3D map.
 *
 * The map uses MapLibre GL JS with OpenFreeMap tiles (free, no account / no API
 * key). The "liberty" style ships 3D building extrusions, so a camera pitch
 * gives a real 3D view; a CSS filter darkens it to match the theme. MapLibre is
 * loaded on demand (dynamic import) to keep it out of the initial bundle.
 *
 * If the map cannot initialize (e.g. no WebGL), a fallback with the address and
 * an external-map link is shown, keeping the rest of the section visible.
 *
 * Requirements: 11.1, 11.2, 11.3, 11.4
 */

import { useEffect, useRef, useState } from "react";
import type { StyleSpecification } from "maplibre-gl";
import { eventContent } from "../content/eventContent";
import { PENDING_MESSAGES, resolveText } from "../content/resolvers";

export interface LocationSectionProps {
  /** Full venue address. Defaults to the configured event address. */
  address?: string;
}

/** Venue coordinates from the Navecon Brusque Google Maps place. */
const VENUE = { lng: -48.9153445, lat: -27.1043488 } as const;

/**
 * Custom dark "night" map style on OpenFreeMap vector tiles (no key/account).
 * No symbol layers → no text labels; 3D building extrusions for the 3D look.
 */
const DARK_STYLE = {
  version: 8,
  sources: {
    openmaptiles: {
      type: "vector",
      url: "https://tiles.openfreemap.org/planet",
    },
  },
  layers: [
    { id: "bg", type: "background", paint: { "background-color": "#070a14" } },
    {
      id: "water",
      type: "fill",
      source: "openmaptiles",
      "source-layer": "water",
      paint: { "fill-color": "#0a1330" },
    },
    {
      id: "landcover",
      type: "fill",
      source: "openmaptiles",
      "source-layer": "landcover",
      paint: { "fill-color": "#0c1322", "fill-opacity": 0.6 },
    },
    {
      id: "park",
      type: "fill",
      source: "openmaptiles",
      "source-layer": "park",
      paint: { "fill-color": "#0d1a26", "fill-opacity": 0.6 },
    },
    {
      id: "roads",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      paint: {
        "line-color": "#222f52",
        "line-width": [
          "interpolate",
          ["exponential", 1.4],
          ["zoom"],
          10,
          0.4,
          16,
          4,
          20,
          18,
        ],
      },
    },
    {
      id: "roads_major",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      filter: [
        "match",
        ["get", "class"],
        ["primary", "trunk", "secondary", "motorway"],
        true,
        false,
      ],
      paint: {
        "line-color": "#3a4c80",
        "line-width": [
          "interpolate",
          ["exponential", 1.4],
          ["zoom"],
          8,
          1,
          16,
          6,
          20,
          26,
        ],
      },
    },
    {
      id: "buildings",
      type: "fill-extrusion",
      source: "openmaptiles",
      "source-layer": "building",
      minzoom: 13,
      paint: {
        "fill-extrusion-base": ["get", "render_min_height"],
        "fill-extrusion-height": ["get", "render_height"],
        "fill-extrusion-color": [
          "interpolate",
          ["linear"],
          ["get", "render_height"],
          0,
          "#1b2547",
          40,
          "#2a3a72",
          120,
          "#3b4f9e",
        ],
        "fill-extrusion-opacity": 0.92,
      },
    },
  ],
} as unknown as StyleSpecification;

/** External Google Maps search URL opened in a new tab (Req 11.3). */
function buildExternalUrl(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

const EXTERNAL_LINK_LABEL = "Abrir no mapa";

export function LocationSection({
  address = eventContent.fullAddress,
}: LocationSectionProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapFailed, setMapFailed] = useState(false);
  const externalUrl = buildExternalUrl(address);

  // Same source/pending message as the hero card, so both stay in sync.
  const time = resolveText(eventContent.eventTime, PENDING_MESSAGES.eventTime);
  const timeText = time.status === "finalized" ? time.value : time.message;

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let map: any;

    (async () => {
      try {
        const maplibregl = (await import("maplibre-gl")).default;
        if (cancelled || !mapRef.current) return;

        map = new maplibregl.Map({
          container: mapRef.current,
          style: DARK_STYLE,
          center: [VENUE.lng, VENUE.lat],
          zoom: 16,
          pitch: 60,
          bearing: -18,
          attributionControl: false,
          cooperativeGestures: true,
        });

        new maplibregl.Marker({ color: "#d4af37" })
          .setLngLat([VENUE.lng, VENUE.lat])
          .addTo(map);

        // Ignore non-fatal tile/network errors so the map stays usable.
        map.on("error", () => {});
      } catch {
        if (!cancelled) setMapFailed(true);
      }
    })();

    return () => {
      cancelled = true;
      try {
        map?.remove();
      } catch {
        /* noop */
      }
    };
  }, []);

  const externalLink = (
    <a
      className="btn btn-ghost"
      href={externalUrl}
      target="_blank"
      rel="noopener noreferrer"
      data-testid="location-external-link"
    >
      {EXTERNAL_LINK_LABEL}
    </a>
  );

  return (
    <section id="location" className="section" aria-labelledby="location-heading">
      <div className="section-head">
        <span className="eyebrow">Onde acontece</span>
        <h2 id="location-heading" className="section-title">
          Localização
        </h2>
      </div>

      <div className="location-grid">
        <div className="location-card">
          <p data-testid="location-address">{address}</p>

          <div className="detail-grid">
            <div>
              <p className="detail-label">Dias</p>
              <p className="detail-value">16 e 17 de setembro de 2026</p>
            </div>
            <div>
              <p className="detail-label">Horário</p>
              <p className="detail-value">{timeText}</p>
            </div>
            <div>
              <p className="detail-label">Formato</p>
              <p className="detail-value">Presencial · 2 dias</p>
            </div>
            <div>
              <p className="detail-label">Local</p>
              <p className="detail-value">Brusque · SC</p>
            </div>
          </div>

          {externalLink}
        </div>

        <div className="location-map" data-testid="location-map">
          <div ref={mapRef} className="location-map__canvas" aria-label="Mapa 3D do local" />
          {!mapFailed && (
            <span className="location-map__attrib">© OpenStreetMap</span>
          )}
          {mapFailed && (
            <div
              className="location-map__fallback"
              data-testid="location-fallback"
              role="status"
            >
              <p>{address}</p>
              {externalLink}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default LocationSection;
