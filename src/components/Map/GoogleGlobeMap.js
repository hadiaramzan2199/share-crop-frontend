/**
 * Google 3D Maps globe: real 3D Earth with day/night terminator, sun and space.
 * Uses Map3DElement (maps3d library), not the flat 2D Map.
 * Requires REACT_APP_GOOGLE_MAPS_API_KEY and Maps JavaScript API with 3D (beta).
 */
import React, { useEffect, useRef, useCallback, useState, forwardRef, useImperativeHandle } from 'react';
import { GLOBAL_VIEW_MAX_ZOOM } from '../../utils/mapConfig';

const SCRIPT_ID = 'google-maps-globe-script';
const GLOBAL_ZOOM_THRESHOLD = 6;

// Debug logging helper - logs to both console (for production) and debug endpoint (for local)
const DEBUG_LOG = (location, message, data = {}) => {
  const logData = { location, message, data, timestamp: Date.now() };
  // Always log to console for production debugging
  console.log(`[GoogleMaps Debug] ${location}: ${message}`, data);
  // Also try to send to debug endpoint (only works locally)
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    fetch('http://127.0.0.1:7243/ingest/6b2fc03d-78d6-4a3f-ab92-f6736631c098', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logData)
    }).catch(() => {});
  }
};

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
  // #region agent log
  DEBUG_LOG('GoogleGlobeMap.js:87', 'loadGoogleMaps3D called', { 
    hasWindow: typeof window !== 'undefined', 
    hasApiKey: !!apiKey,
    cached: !!window.__shareCropMaps3D,
    hasGoogleMaps: !!window.google?.maps,
    hasImportLibrary: !!window.google?.maps?.importLibrary
  });
  // #endregion
  
  if (typeof window === 'undefined' || !apiKey) return Promise.reject(new Error('No API key'));

  if (window.__shareCropMaps3D) {
    // #region agent log
    DEBUG_LOG('GoogleGlobeMap.js:90', 'Returning cached maps3d', {});
    // #endregion
    return Promise.resolve(window.__shareCropMaps3D);
  }

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
    
    // Set up callback handler BEFORE creating script
    const callbackName = c + '.maps.' + q;
    window.google = window.google || {};
    window.google.maps = window.google.maps || {};
    window.google.maps[q] = function() {
      DEBUG_LOG('GoogleGlobeMap.js:bootstrap', 'Callback __ib__ fired', {
        hasGoogleMaps: !!window.google?.maps,
        hasImportLibrary: !!window.google?.maps?.importLibrary
      });
      // Callback will resolve the promise
    };
    
    const u = () => {
      h = h || new Promise((f, n) => {
        const a = m.createElement('script');
        e.set('libraries', [...r] + '');
        for (const k in g) e.set(k.replace(/[A-Z]/g, (t) => '_' + t[0].toLowerCase()), g[k]);
        e.set('callback', callbackName);
        a.src = `https://maps.${c}apis.com/maps/api/js?` + e;
        
        // #region agent log
        DEBUG_LOG('GoogleGlobeMap.js:bootstrap:external', 'Creating external Google Maps script', {
          scriptSrc: a.src.substring(0, 100) + '...',
          callbackName
        });
        // #endregion
        
        d[q] = (result) => {
          DEBUG_LOG('GoogleGlobeMap.js:bootstrap:external', 'External script callback fired', {
            hasResult: !!result,
            hasError: result instanceof Error,
            hasImportLibrary: !!d[l]
          });
          f(result);
        };
        
        a.onload = () => {
          DEBUG_LOG('GoogleGlobeMap.js:bootstrap:external', 'External script onload fired', {
            hasGoogleMaps: !!window.google?.maps,
            hasCallback: !!window.google?.maps?.[q]
          });
        };
        
        a.onerror = (err) => {
          DEBUG_LOG('GoogleGlobeMap.js:bootstrap:external', 'External script onerror fired', {
            error: err?.message || 'Unknown'
          });
          h = n(new Error(p + ' could not load.'));
        };
        
        a.nonce = m.querySelector('script[nonce]')?.nonce || '';
        
        DEBUG_LOG('GoogleGlobeMap.js:bootstrap:external', 'Appending external script', {
          hasNonce: !!a.nonce,
          scriptSrc: a.src.substring(0, 80) + '...'
        });
        
        m.head.append(a);
        
        // Check if script was actually appended
        setTimeout(() => {
          DEBUG_LOG('GoogleGlobeMap.js:bootstrap:external', 'Post-append check', {
            scriptInDOM: document.head.contains(a),
            hasGoogleMaps: !!window.google?.maps
          });
        }, 500);
      });
      return h;
    };
    d[l] = d[l] || ((f, ...n) => { r.add(f); return u().then(() => d[l](f, ...n)); });
  };

  const ensureBootstrap = () => {
    if (window.google?.maps?.importLibrary) {
      // #region agent log
      DEBUG_LOG('GoogleGlobeMap.js:122', 'importLibrary already available', {});
      // #endregion
      return Promise.resolve();
    }
    
    // Check if script already exists (from previous attempt)
    const existingScript = document.getElementById(SCRIPT_ID);
    if (existingScript) {
      // #region agent log
      DEBUG_LOG('GoogleGlobeMap.js:123', 'Bootstrap script already exists, waiting for callback', { 
        scriptId: SCRIPT_ID
      });
      // #endregion
      
      // Wait for the callback to fire (Google Maps uses callback pattern)
      return new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 50; // 5 seconds max wait
        const checkInterval = setInterval(() => {
          attempts++;
          if (window.google?.maps?.importLibrary) {
            clearInterval(checkInterval);
            // #region agent log
            DEBUG_LOG('GoogleGlobeMap.js:127', 'importLibrary became available after waiting', { attempts });
            // #endregion
            resolve();
          } else if (attempts >= maxAttempts) {
            clearInterval(checkInterval);
            // #region agent log
            DEBUG_LOG('GoogleGlobeMap.js:128', 'Timeout waiting for importLibrary', { attempts });
            // #endregion
            reject(new Error('Google Maps importLibrary timeout'));
          }
        }, 100);
      });
    }
    
    // #region agent log
    DEBUG_LOG('GoogleGlobeMap.js:123', 'Creating bootstrap script', { 
      scriptId: SCRIPT_ID,
      apiKeyLength: apiKey?.length || 0,
      apiKeyPrefix: apiKey?.substring(0, 10) || 'none'
    });
    // #endregion
    
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.id = SCRIPT_ID;
      
      // Wrap bootstrap in try-catch for better error handling
      const bootstrapCode = `try {
        (${bootstrap.toString()})({key:"${apiKey.replace(/"/g, '\\"')}",v:"beta"});
      } catch(e) {
        console.error('[Google Maps Bootstrap Error]', e);
        if (window.google && window.google.maps && window.google.maps.__ib__) {
          window.google.maps.__ib__(e);
        }
      }`;
      
      script.textContent = bootstrapCode;
      
      // Monitor for callback execution
      const originalCallback = window.google?.maps?.__ib__;
      let callbackFired = false;
      
      // Override callback to detect when it fires
      if (!window.google) window.google = {};
      if (!window.google.maps) window.google.maps = {};
      const callbackWrapper = function(...args) {
        callbackFired = true;
        DEBUG_LOG('GoogleGlobeMap.js:callback', 'Callback wrapper invoked', {
          argsLength: args.length,
          hasError: args[0] instanceof Error,
          hasImportLibrary: !!window.google?.maps?.importLibrary
        });
        if (originalCallback) {
          return originalCallback.apply(this, args);
        }
      };
      window.google.maps.__ib__ = callbackWrapper;
      
      // Check for CSP violations
      const checkCSP = () => {
        const cspReport = window.performance?.getEntriesByType?.('navigation')?.[0];
        const hasCSPError = document.querySelector('script[nonce]') === null && 
                           !document.querySelector('meta[http-equiv="Content-Security-Policy"]');
        DEBUG_LOG('GoogleGlobeMap.js:CSP', 'CSP check', {
          hasNonce: !!document.querySelector('script[nonce]'),
          hasCSPMeta: !!document.querySelector('meta[http-equiv="Content-Security-Policy"]'),
          scriptExecuted: script.textContent.length > 0
        });
      };
      
      script.onload = () => {
        checkCSP();
        // #region agent log
        DEBUG_LOG('GoogleGlobeMap.js:127', 'Bootstrap script onload fired', { 
          hasGoogleMaps: !!window.google?.maps,
          hasImportLibrary: !!window.google?.maps?.importLibrary,
          hasCallback: !!window.google?.maps?.__ib__,
          callbackFired,
          scriptExecuted: true
        });
        // #endregion
        
        // Script loaded, wait for callback to fire
        let attempts = 0;
        const maxAttempts = 100; // 10 seconds max wait
        const checkCallback = () => {
          attempts++;
          
          if (window.google?.maps?.importLibrary) {
            // #region agent log
            DEBUG_LOG('GoogleGlobeMap.js:127', 'importLibrary available after callback', { attempts });
            // #endregion
            resolve();
          } else if (callbackFired) {
            // Callback fired but importLibrary not ready yet - wait a bit more
            if (attempts < maxAttempts) {
              setTimeout(checkCallback, 100);
            } else {
              // #region agent log
              DEBUG_LOG('GoogleGlobeMap.js:128', 'Callback fired but importLibrary timeout', { attempts });
              // #endregion
              reject(new Error('Google Maps callback fired but importLibrary not available'));
            }
          } else if (attempts >= maxAttempts) {
            // #region agent log
            DEBUG_LOG('GoogleGlobeMap.js:128', 'Timeout waiting for callback - trying fallback', { attempts, hasGoogleMaps: !!window.google?.maps });
            // #endregion
            
            // Log detailed error info
            console.error('[Google Maps] Bootstrap timeout - script may be blocked by CSP or failed to execute');
            console.error('[Google Maps] Debug info:', {
              scriptInDOM: !!document.getElementById(SCRIPT_ID),
              hasGoogleMaps: !!window.google?.maps,
              scriptOnloadFired: false,
              callbackFired: callbackFired
            });
            
            DEBUG_LOG('GoogleGlobeMap.js:fallback', 'Bootstrap timeout - final state', {
              scriptInDOM: !!document.getElementById(SCRIPT_ID),
              hasGoogleMaps: !!window.google?.maps,
              callbackFired,
              scriptExecuted: false
            });
            
            // Provide helpful error message
            const errorMsg = 'Google Maps bootstrap timeout. ' +
              'The inline bootstrap script executed but the external Google Maps script may have failed to load. ' +
              'Check: 1) Browser console for CSP violations, 2) Network tab for failed requests to maps.googleapis.com, ' +
              '3) API key validity. Script in DOM: ' + !!document.getElementById(SCRIPT_ID);
            console.error('[Google Maps Error]', errorMsg);
            reject(new Error(errorMsg));
          } else {
            setTimeout(checkCallback, 100);
          }
        };
        
        // Start checking after a short delay
        setTimeout(checkCallback, 200);
      };
      
      script.onerror = (err) => {
        // #region agent log
        DEBUG_LOG('GoogleGlobeMap.js:128', 'Bootstrap script onerror fired', {
          error: err?.message || 'Unknown error',
          errorType: err?.type
        });
        // #endregion
        reject(new Error('Google Maps bootstrap script failed to load - check CSP headers'));
      };
      
      // #region agent log
      DEBUG_LOG('GoogleGlobeMap.js:129', 'Appending bootstrap script', { 
        scriptLength: script.textContent.length,
        scriptPreview: script.textContent.substring(0, 100) + '...',
        hasNonce: !!script.nonce,
        scriptType: script.type || 'text/javascript'
      });
      // #endregion
      
      // Try to get nonce from existing script if CSP requires it
      const existingScriptWithNonce = document.querySelector('script[nonce]');
      if (existingScriptWithNonce?.nonce) {
        script.nonce = existingScriptWithNonce.nonce;
        DEBUG_LOG('GoogleGlobeMap.js:nonce', 'Using nonce from existing script', {
          hasNonce: !!script.nonce
        });
      }
      
      // Monitor script execution
      let scriptExecuted = false;
      const originalAppendChild = document.head.appendChild.bind(document.head);
      const checkExecution = setInterval(() => {
        // Check if bootstrap function executed by looking for google.maps
        if (window.google?.maps) {
          scriptExecuted = true;
          clearInterval(checkExecution);
          DEBUG_LOG('GoogleGlobeMap.js:execution', 'Bootstrap function executed', {
            hasGoogleMaps: !!window.google?.maps,
            hasImportLibrary: !!window.google?.maps?.importLibrary
          });
        }
      }, 100);
      
      // Clear check after 5 seconds
      setTimeout(() => {
        clearInterval(checkExecution);
        if (!scriptExecuted) {
          DEBUG_LOG('GoogleGlobeMap.js:execution', 'Bootstrap function did not execute (possible CSP block)', {
            scriptInDOM: !!document.getElementById(SCRIPT_ID)
          });
        }
      }, 5000);
      
      try {
        document.head.appendChild(script);
      } catch (err) {
        DEBUG_LOG('GoogleGlobeMap.js:error', 'Failed to append script', {
          error: err.message,
          errorName: err.name
        });
        reject(err);
        return;
      }
      
      // #region agent log
      DEBUG_LOG('GoogleGlobeMap.js:129', 'Bootstrap script appended to head', { 
        scriptInHead: !!document.head.querySelector(`#${SCRIPT_ID}`),
        headChildren: document.head.children.length,
        scriptExists: !!document.getElementById(SCRIPT_ID),
        scriptHasNonce: !!script.nonce
      });
      // #endregion
      
      // Also check immediately after append
      setTimeout(() => {
        DEBUG_LOG('GoogleGlobeMap.js:129', 'Post-append check', {
          scriptInDOM: !!document.getElementById(SCRIPT_ID),
          hasGoogleMaps: !!window.google?.maps,
          scriptExecuted
        });
      }, 500);
    });
  };

  return ensureBootstrap()
    .then(() => {
      // #region agent log
      DEBUG_LOG('GoogleGlobeMap.js:134', 'After ensureBootstrap', { 
        hasGoogleMaps: !!window.google?.maps,
        hasImportLibrary: !!window.google?.maps?.importLibrary
      });
      // #endregion
      
      if (!window.google?.maps?.importLibrary) {
        // #region agent log
        DEBUG_LOG('GoogleGlobeMap.js:135', 'importLibrary not available after bootstrap', {});
        // #endregion
        return Promise.reject(new Error('Google Maps importLibrary not available'));
      }
      
      // #region agent log
      DEBUG_LOG('GoogleGlobeMap.js:136', 'Calling importLibrary(maps3d)', {});
      // #endregion
      
      return window.google.maps.importLibrary('maps3d');
    })
    .then((maps3d) => {
      // #region agent log
      DEBUG_LOG('GoogleGlobeMap.js:138', 'importLibrary(maps3d) succeeded', { 
        hasMap3DElement: !!maps3d?.Map3DElement,
        hasMapMode: !!maps3d?.MapMode
      });
      // #endregion
      window.__shareCropMaps3D = maps3d;
      return maps3d;
    })
    .catch((err) => {
      // #region agent log
      DEBUG_LOG('GoogleGlobeMap.js:141', 'loadGoogleMaps3D error', { 
        error: err.message,
        stack: err.stack
      });
      // #endregion
      throw err;
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

  // #region agent log
  useEffect(() => {
    DEBUG_LOG('GoogleGlobeMap.js:196', 'Component mounted/updated', { 
      hasApiKey: !!apiKey,
      apiKeyValue: apiKey ? `${apiKey.substring(0, 10)}...` : 'MISSING',
      visible,
      containerRefReady: !!containerRef.current,
      containerWidth: containerRef.current?.offsetWidth || 0,
      containerHeight: containerRef.current?.offsetHeight || 0,
      isProduction: window.location.hostname !== 'localhost',
      envVars: {
        REACT_APP_GOOGLE_MAPS_API_KEY: process.env.REACT_APP_GOOGLE_MAPS_API_KEY ? 'SET' : 'MISSING',
        NODE_ENV: process.env.NODE_ENV
      }
    });
  }, [apiKey, visible]);
  // #endregion

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
    
    // #region agent log
    DEBUG_LOG('GoogleGlobeMap.js:234', 'Map initialization useEffect', { 
      hasApiKey: !!apiKey,
      apiKeyValue: apiKey ? `${apiKey.substring(0, 10)}...` : 'MISSING',
      hasContainer: !!container,
      visible,
      hasExistingMap: !!mapRef.current,
      containerWidth: container?.offsetWidth || 0,
      containerHeight: container?.offsetHeight || 0,
      containerInDOM: container ? document.contains(container) : false,
      documentReady: document.readyState,
      isProduction: window.location.hostname !== 'localhost'
    });
    // #endregion
    
    if (!apiKey) {
      // #region agent log
      DEBUG_LOG('GoogleGlobeMap.js:236', 'CRITICAL: API key missing', { 
        envVarExists: typeof process.env.REACT_APP_GOOGLE_MAPS_API_KEY !== 'undefined',
        envVarValue: process.env.REACT_APP_GOOGLE_MAPS_API_KEY ? 'SET' : 'MISSING'
      });
      // #endregion
      console.error('[Google Maps] REACT_APP_GOOGLE_MAPS_API_KEY is missing! Set it in your production environment variables.');
      return;
    }
    
    if (!container) {
      // #region agent log
      DEBUG_LOG('GoogleGlobeMap.js:236', 'Container ref not ready, will retry', { 
        documentReady: document.readyState,
        willRetry: true
      });
      // #endregion
      // Retry after container is ready - use requestAnimationFrame for DOM readiness
      let retryCount = 0;
      const maxRetries = 50; // 5 seconds max
      const checkContainer = () => {
        retryCount++;
        const currentContainer = containerRef.current;
        if (currentContainer && currentContainer.offsetWidth > 0 && currentContainer.offsetHeight > 0) {
          // #region agent log
          DEBUG_LOG('GoogleGlobeMap.js:236', 'Container ready after retry', { retryCount });
          // #endregion
          // Force re-run effect by updating a state
          setMapReady(false);
        } else if (retryCount < maxRetries) {
          requestAnimationFrame(checkContainer);
        } else {
          // #region agent log
          DEBUG_LOG('GoogleGlobeMap.js:236', 'Container retry timeout', { retryCount });
          // #endregion
        }
      };
      requestAnimationFrame(checkContainer);
      return;
    }
    
    // Ensure container has dimensions before proceeding
    if (container.offsetWidth === 0 || container.offsetHeight === 0) {
      // #region agent log
      DEBUG_LOG('GoogleGlobeMap.js:236', 'Container has zero dimensions, waiting', { 
        width: container.offsetWidth,
        height: container.offsetHeight
      });
      // #endregion
      // Wait for container to get dimensions
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
            resizeObserver.disconnect();
            // #region agent log
            DEBUG_LOG('GoogleGlobeMap.js:236', 'Container got dimensions via ResizeObserver', {
              width: entry.contentRect.width,
              height: entry.contentRect.height
            });
            // #endregion
            // Force re-run
            setMapReady(false);
            break;
          }
        }
      });
      resizeObserver.observe(container);
      return () => resizeObserver.disconnect();
    }
    
    if (!visible && mapRef.current) return; // keep existing map when hidden
    if (mapRef.current) return; // already have a map

    let cancelled = false;
    let mapInstance = null;
    setMapReady(false);

    // #region agent log
    DEBUG_LOG('GoogleGlobeMap.js:244', 'Starting loadGoogleMaps3D', {
      containerReady: !!container,
      containerDimensions: { w: container.offsetWidth, h: container.offsetHeight }
    });
    // #endregion
    
    loadGoogleMaps3D(apiKey)
      .then((lib) => {
        // #region agent log
        DEBUG_LOG('GoogleGlobeMap.js:245', 'loadGoogleMaps3D promise resolved', { 
          cancelled,
          hasContainer: !!container,
          hasLib: !!lib,
          hasMap3DElement: !!lib?.Map3DElement,
          hasMapMode: !!lib?.MapMode
        });
        // #endregion
        
        if (cancelled || !container) {
          // #region agent log
          DEBUG_LOG('GoogleGlobeMap.js:246', 'Early return - cancelled or no container', { cancelled, hasContainer: !!container });
          // #endregion
          return;
        }
        const { Map3DElement, MapMode } = lib;
        const MarkerClass = lib.Marker3DInteractiveElement || lib.Marker3DElement;

        // #region agent log
        DEBUG_LOG('GoogleGlobeMap.js:250', 'Creating Map3DElement', { 
          latitude,
          longitude,
          zoom,
          containerWidth: container.offsetWidth,
          containerHeight: container.offsetHeight
        });
        // #endregion

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
        
        // #region agent log
        DEBUG_LOG('GoogleGlobeMap.js:271', 'Map created successfully', { 
          mapInstanceExists: !!mapInstance,
          mapInContainer: container.contains(mapInstance)
        });
        // #endregion
      })
      .catch((err) => {
        // #region agent log
        DEBUG_LOG('GoogleGlobeMap.js:273', 'Map creation failed', { 
          error: err.message,
          stack: err.stack,
          cancelled
        });
        // #endregion
        console.warn('Google 3D Globe failed to load:', err);
      });

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
