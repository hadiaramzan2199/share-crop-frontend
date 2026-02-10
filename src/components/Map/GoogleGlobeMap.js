/**
 * Google 3D Maps globe: real 3D Earth with day/night terminator, sun and space.
 * Uses Map3DElement (maps3d library), not the flat 2D Map.
 * Requires REACT_APP_GOOGLE_MAPS_API_KEY and Maps JavaScript API with 3D (beta).
 */
import React, { useEffect, useRef, useCallback, useState, forwardRef, useImperativeHandle } from 'react';
import { GLOBAL_VIEW_MAX_ZOOM } from '../../utils/mapConfig';

const SCRIPT_ID = 'google-maps-globe-script';
const GLOBAL_ZOOM_THRESHOLD = 6;

/** Max camera range in meters (Earth radius × 10) = full globe view. */
const MAX_RANGE_M = 63170000;
/** When range is at or above this, we're at "full zoom out" - don't notify parent to avoid event storm and update loops. */
const FULL_ZOOM_OUT_RANGE = MAX_RANGE_M * 0.97;

/** Limit how far the user can zoom out (min zoom level). Higher = less zoom out allowed. */
const MIN_ZOOM_LEVEL = 1.0;
const MAX_ZOOM_OUT_RANGE = MAX_RANGE_M * Math.pow(0.35, Math.max(0, MIN_ZOOM_LEVEL));

/** Fixed date for static day/night terminator (noon UTC = clear half-day / half-night). Never updated so the terminator doesn't move. */
const STATIC_TERMINATOR_DATE = new Date('2020-06-15T12:00:00.000Z');

/**
 * Try to make the 3D globe use a fixed sun position (static terminator).
 * Map3DElement does not document a sun/time API; we try common property names so that if the implementation
 * supports it (e.g. for testing or internal use), we get a static half-day / half-night when rotating the globe.
 */
function trySetStaticTerminator(mapInstance) {
  if (!mapInstance) return;
  const fixedTime = STATIC_TERMINATOR_DATE.getTime();
  const fixedDate = STATIC_TERMINATOR_DATE;
  const props = ['time', 'date', 'sunTime', 'sunDate', 'fixedTime', 'lightTime'];
  for (const p of props) {
    try {
      if (p in mapInstance) {
        const val = p.toLowerCase().includes('time') ? fixedTime : fixedDate;
        mapInstance[p] = val;
        return;
      }
    } catch (_) { /* ignore */ }
  }
  try {
    if (typeof mapInstance.setTime === 'function') {
      mapInstance.setTime(fixedDate);
      return;
    }
    if (typeof mapInstance.setSunPosition === 'function') {
      mapInstance.setSunPosition(0, 0);
      return;
    }
  } catch (_) { /* ignore */ }
  try {
    if (mapInstance.setAttribute) {
      mapInstance.setAttribute('time', String(fixedTime));
      mapInstance.setAttribute('date', fixedDate.toISOString());
    }
  } catch (_) { /* ignore */ }
}

/**
 * Mapbox zoom 0–6 (global view) → camera range in meters for 3D globe.
 * Zoom 0 = whole world, zoom 6 = continent level.
 */
function zoomToRange(mapboxZoom) {
  const z = Number(mapboxZoom);
  if (!Number.isFinite(z)) return 20000000;
  return MAX_RANGE_M * Math.pow(0.35, Math.max(0, Math.min(6, z)));
}

/**
 * Camera range (meters) → Mapbox-style zoom for parent.
 * Do not cap at 6 so that when user zooms in we can exceed threshold and switch to Mapbox.
 */
function rangeToZoom(rangeM) {
  const r = Number(rangeM);
  if (!Number.isFinite(r) || r <= 0) return 2;
  const zoom = Math.log(Math.max(1, r) / MAX_RANGE_M) / Math.log(0.35);
  return Math.max(0, Math.min(15, zoom));
}

/**
 * Load Google Maps 3D via the bootstrap loader so importLibrary is available.
 * The direct script URL does not expose importLibrary; the bootstrap does.
 * Returns the maps3d library { Map3DElement, MapMode }.
 */
function loadGoogleMaps3D(apiKey) {
  if (typeof window === 'undefined' || !apiKey) return Promise.reject(new Error('No API key'));

  if (window.__shareCropMaps3D) return Promise.resolve(window.__shareCropMaps3D);

  const bootstrap = (g) => {
    const p = 'The Google Maps JavaScript API';
    const c = 'google';
    const l = 'importLibrary';
    const q = '__ib__';
    const m = document;
    let b = window;
    b = b[c] || (b[c] = {});
    const d = b.maps || (b.maps = {});
    const r = new Set();
    const e = new URLSearchParams();
    let h;
    const u = () => {
      h = h || new Promise((f, n) => {
        const a = m.createElement('script');
        e.set('libraries', [...r] + '');
        for (const k in g) e.set(k.replace(/[A-Z]/g, (t) => '_' + t[0].toLowerCase()), g[k]);
        e.set('callback', c + '.maps.' + q);
        a.src = `https://maps.${c}apis.com/maps/api/js?` + e;
        d[q] = f;
        a.onerror = () => { h = n(new Error(p + ' could not load.')); };
        a.nonce = m.querySelector('script[nonce]')?.nonce || '';
        m.head.append(a);
      });
      return h;
    };
    d[l] = d[l] || ((f, ...n) => { r.add(f); return u().then(() => d[l](f, ...n)); });
  };

  const ensureBootstrap = () => {
    if (window.google?.maps?.importLibrary) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.id = SCRIPT_ID;
      script.textContent = `(${bootstrap.toString()})({key:"${apiKey.replace(/"/g, '\\"')}",v:"beta"});`;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Google Maps bootstrap failed'));
      document.head.appendChild(script);
    });
  };

  return ensureBootstrap()
    .then(() => {
      if (!window.google?.maps?.importLibrary) return Promise.reject(new Error('Google Maps importLibrary not available'));
      return window.google.maps.importLibrary('maps3d');
    })
    .then((maps3d) => {
      window.__shareCropMaps3D = maps3d;
      return maps3d;
    });
}

export function useGoogleGlobeZoomThreshold() {
  return GLOBAL_ZOOM_THRESHOLD;
}

const GoogleGlobeMap = forwardRef(function GoogleGlobeMap({
  visible,
  latitude,
  longitude,
  zoom,
  onViewChange,
  style = {},
  farms = [],
  onMarkerClick,
  getMarkerSvg,
  isMobile = false,
  iconDataUrlCache = {},
}, ref) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);

  useImperativeHandle(ref, () => ({
    flyTo(lat, lng, zoomLevel = 7) {
      const map = mapRef.current;
      if (!map) return;
      const latNum = Number(lat);
      const lngNum = Number(lng);
      if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) return;
      try {
        const range = (zoomLevel != null && Number.isFinite(zoomLevel)) ? zoomToRange(zoomLevel) : zoomToRange(7);
        if (typeof map.flyCameraTo === 'function') {
          map.flyCameraTo({
            endCamera: { center: { lat: latNum, lng: lngNum, altitude: 0 }, range },
            durationMillis: 1200,
          });
        } else {
          map.center = { lat: latNum, lng: lngNum, altitude: 0 };
          map.range = range;
        }
      } catch (_) { /* ignore */ }
    },
  }), []);
  const onViewChangeRef = useRef(onViewChange);
  const onMarkerClickRef = useRef(onMarkerClick);
  const getMarkerSvgRef = useRef(getMarkerSvg);
  const notifyTimeoutRef = useRef(null);
  const lastNotifiedRef = useRef({ lat: null, lng: null, zoom: null });
  const prevVisibleRef = useRef(false);
  onViewChangeRef.current = onViewChange;
  onMarkerClickRef.current = onMarkerClick;
  getMarkerSvgRef.current = getMarkerSvg;

  const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

  // Debounced and only notify when view changed meaningfully to avoid update loops.
  // When zoom goes above GLOBAL_VIEW_MAX_ZOOM we always notify so parent can switch to Mapbox (markers).
  const notifyView = useCallback(() => {
    const map = mapRef.current;
    if (!map || typeof onViewChangeRef.current !== 'function') return;
    if (notifyTimeoutRef.current) clearTimeout(notifyTimeoutRef.current);
    const center = map.center;
    const range = map.range;
    const z = rangeToZoom(Number(range));
    const aboveThreshold = z > GLOBAL_VIEW_MAX_ZOOM;
    const delay = aboveThreshold ? 80 : 350;
    notifyTimeoutRef.current = setTimeout(() => {
      notifyTimeoutRef.current = null;
      const rangeNow = map.range;
      if (Number(rangeNow) >= FULL_ZOOM_OUT_RANGE) return;
      const c = map.center;
      if (!c || (typeof c.lat !== 'number' && typeof c.lat !== 'function')) return;
      const lat = typeof c.lat === 'function' ? c.lat() : c.lat;
      const lng = typeof c.lng === 'function' ? c.lng() : c.lng;
      const zoomNow = rangeToZoom(Number(rangeNow));
      const last = lastNotifiedRef.current;
      const zoomDiff = last.zoom != null ? Math.abs(zoomNow - last.zoom) : 1;
      const centerDiff = (last.lat != null && last.lng != null)
        ? Math.hypot(lat - last.lat, lng - last.lng)
        : 1;
      const skip = !(zoomNow > GLOBAL_VIEW_MAX_ZOOM) && zoomDiff < 0.15 && centerDiff < 0.02;
      if (skip) return;
      lastNotifiedRef.current = { lat, lng, zoom: zoomNow };
      onViewChangeRef.current({ longitude: lng, latitude: lat, zoom: zoomNow });
    }, delay);
  }, []);

  const [mapReady, setMapReady] = useState(false);

  // Create map once when visible first becomes true; keep it when zooming in (visible=false).
  // Destroy only on unmount so zoom-out-again doesn't re-create (avoids stuck state + extra billable loads).
  useEffect(() => {
    const container = containerRef.current;
    if (!apiKey || !container) return;
    if (!visible && mapRef.current) return; // keep existing map when hidden
    if (mapRef.current) return; // already have a map

    let cancelled = false;
    let mapInstance = null;
    setMapReady(false);

    loadGoogleMaps3D(apiKey)
      .then((lib) => {
        if (cancelled || !container) return;
        const { Map3DElement, MapMode } = lib;
        const MarkerClass = lib.Marker3DInteractiveElement || lib.Marker3DElement;

        mapInstance = new Map3DElement({
          center: { lat: latitude, lng: longitude, altitude: 0 },
          range: Math.min(zoomToRange(zoom), MAX_ZOOM_OUT_RANGE),
          mode: MapMode.HYBRID,
          gestureHandling: 'GREEDY',
          defaultUIHidden: true,
          minAltitude: 0,
          maxAltitude: MAX_ZOOM_OUT_RANGE,
        });

        mapInstance.style.width = '100%';
        mapInstance.style.height = '100%';
        container.innerHTML = '';
        container.appendChild(mapInstance);
        mapRef.current = mapInstance;
        if (MarkerClass) mapRef.current._MarkerClass = MarkerClass;

        trySetStaticTerminator(mapInstance);

        mapInstance.addEventListener('gmp-centerchange', notifyView);
        mapInstance.addEventListener('gmp-rangechange', notifyView);
        setMapReady(true);
      })
      .catch((err) => console.warn('Google 3D Globe failed to load:', err));

    return () => {
      cancelled = true;
      setMapReady(false);
      if (notifyTimeoutRef.current) {
        clearTimeout(notifyTimeoutRef.current);
        notifyTimeoutRef.current = null;
      }
      // Do NOT destroy map when visible becomes false — only clear timeout so zoom-out-again works.
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Create once when visible; unmount cleanup in separate effect.
  }, [apiKey, visible]);

  // Destroy map only on unmount (or apiKey change) so we don't re-create on every zoom-in/out.
  useEffect(() => {
    const container = containerRef.current;
    return () => {
      const map = mapRef.current;
      if (notifyTimeoutRef.current) {
        clearTimeout(notifyTimeoutRef.current);
        notifyTimeoutRef.current = null;
      }
      if (map && container && map.parentNode === container) {
        try {
          map.removeEventListener('gmp-centerchange', notifyView);
          map.removeEventListener('gmp-rangechange', notifyView);
          container.removeChild(map);
        } catch (_) { /* ignore */ }
      }
      mapRef.current = null;
      markersRef.current = [];
    };
  }, [apiKey, notifyView]);

  // Sync markers on the Google globe (same UI as Mapbox).
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !visible || !mapReady || !Array.isArray(farms) || farms.length === 0) {
      return;
    }
    const MarkerClass = map._MarkerClass;
    if (!MarkerClass) return;
    const getSvg = getMarkerSvgRef.current;
    const onClick = onMarkerClickRef.current;
    if (typeof getSvg !== 'function') return;

    const list = markersRef.current;
    list.forEach((m) => {
      try {
        if (m.parentNode === map) m.remove();
      } catch (_) { /* ignore */ }
    });
    list.length = 0;

    const parser = typeof DOMParser !== 'undefined' ? new DOMParser() : null;
    farms.forEach((farm) => {
      let lat;
      let lng;
      if (Array.isArray(farm.coordinates) && farm.coordinates.length >= 2) {
        lng = farm.coordinates[0];
        lat = farm.coordinates[1];
      } else if (farm.coordinates && typeof farm.coordinates === 'object') {
        lat = farm.coordinates.lat ?? farm.coordinates.latitude;
        lng = farm.coordinates.lng ?? farm.coordinates.longitude;
      } else return;
      if (lat == null || lng == null || !Number.isFinite(lat) || !Number.isFinite(lng)) return;

      const svgString = getSvg(farm, isMobile, iconDataUrlCache);
      if (!svgString) return;

      try {
        const marker = new MarkerClass({
          position: { lat, lng },
          sizePreserved: true,
        });
        if (parser) {
          const svgEl = parser.parseFromString(svgString, 'image/svg+xml').documentElement;
          const template = document.createElement('template');
          template.content.appendChild(svgEl);
          marker.appendChild(template);
        }
        if (typeof onClick === 'function' && marker.addEventListener) {
          marker.addEventListener('gmp-click', () => onClick(farm));
        }
        map.appendChild(marker);
        list.push(marker);
      } catch (e) {
        console.warn('Google 3D marker failed:', farm?.id, e);
      }
    });

    return () => {
      list.forEach((m) => {
        try {
          if (m.parentNode === map) m.remove();
        } catch (_) { /* ignore */ }
      });
      list.length = 0;
    };
  }, [visible, mapReady, farms, isMobile, iconDataUrlCache]);

  // Sync from parent only when we first become visible (e.g. user zoomed out from Mapbox).
  // Do NOT sync on every lat/lng/zoom change or we fight the map and cause an infinite loop.
  const justBecameVisible = visible && !prevVisibleRef.current;
  useEffect(() => {
    prevVisibleRef.current = visible;
  }, [visible]);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !visible || !justBecameVisible) return;
    const lat = Number(latitude);
    const lng = Number(longitude);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      map.center = { lat, lng, altitude: 0 };
      map.range = Math.min(zoomToRange(zoom), MAX_ZOOM_OUT_RANGE);
    }
  }, [visible, justBecameVisible, latitude, longitude, zoom]);

  if (!apiKey) return null;

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        inset: 0,
        visibility: visible ? 'visible' : 'hidden',
        pointerEvents: visible ? 'auto' : 'none',
        zIndex: visible ? 2 : 0,
        ...style,
      }}
      aria-hidden={!visible}
    />
  );
});

export default GoogleGlobeMap;
