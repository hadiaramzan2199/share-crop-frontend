/**
 * Zoom level above which Esri night layer is hidden (Mapbox only for smooth experience).
 * Below this = globe view with Earth at Night; above = direct Mapbox.
 */
export const ESRI_NIGHT_MAX_ZOOM = 6;

/**
 * Configure Mapbox globe: reduced glow, sky atmosphere, 3D buildings,
 * Esri Earth at Night only at low zoom (globe level).
 */
export const configureGlobeMap = (map) => {
    if (!map) return;

    try {
        // Enable globe projection
        map.setProjection('globe');

        // Atmosphere: warm “sunlit” glow (globe has no sky layer, only fog)
        map.setFog({
            range: [0.5, 8],
            color: 'rgb(80, 100, 130)',
            'high-color': 'rgb(200, 180, 140)',
            'horizon-blend': 0.15,
            'space-color': 'rgb(15, 15, 35)',
            'star-intensity': 0.4
        });

        // Strong directional “sun” light: [r, azimuth, polar]. Polar 0=above, 90=horizon.
        // This lights terrain and 3D; one side of globe bright, one in shadow.
        map.setLight({
            anchor: 'viewport',
            position: [1.5, 220, 35],
            color: '#fff5e0',
            intensity: 1
        });

        // Esri Earth at Night: only at globe / low zoom (maxzoom = hide above this zoom)
        if (!map.getSource('esri-night-earth')) {
            map.addSource('esri-night-earth', {
                type: 'raster',
                tiles: [
                    'https://tiles.arcgis.com/tiles/P3ePLMYs2RVChkJx/arcgis/rest/services/Earth_at_Night_WM/MapServer/tile/{z}/{y}/{x}'
                ],
                tileSize: 256
            });
            map.addLayer({
                id: 'esri-night-earth-layer',
                type: 'raster',
                source: 'esri-night-earth',
                maxzoom: ESRI_NIGHT_MAX_ZOOM,
                paint: {}
            });
        }

        // Globe does not support the sky layer; sunlight = fog + setLight only.

        // 3D buildings (when composite source exists, e.g. streets/navigation styles)
        if (map.getSource('composite') && !map.getLayer('3d-buildings')) {
            map.addLayer({
                id: '3d-buildings',
                source: 'composite',
                'source-layer': 'building',
                filter: ['==', 'extrude', 'true'],
                type: 'fill-extrusion',
                minzoom: 15,
                paint: {
                    'fill-extrusion-color': '#aaa',
                    'fill-extrusion-height': ['get', 'height'],
                    'fill-extrusion-base': ['get', 'min_height'],
                    'fill-extrusion-opacity': 0.8
                }
            });
        }
    } catch (error) {
        console.error('Error configuring globe map:', error);
    }
};

/**
 * Set “sun” direction on globe (light position). Globe has no sky layer.
 * @param {object} map - Mapbox map instance
 * @param {number} azimuth - 0–360 (viewport: 0=top, clockwise)
 * @param {number} polar - 0=above, 90=horizon
 */
export const setSunPosition = (map, azimuth = 220, polar = 35) => {
    if (!map) return;
    try {
        map.setLight({
            anchor: 'viewport',
            position: [1.5, azimuth, polar],
            color: '#fff5e0',
            intensity: 1
        });
    } catch (e) {
        console.warn('setSunPosition:', e);
    }
};


/* Base styles */
export const DARK_MAP_STYLE = 'mapbox://styles/mapbox/satellite-v9';

