/**
 * Configure Mapbox globe with cinematic night styling
 * NASA-like atmosphere, stars, and soft solar lighting
 */
/**
 * Realistic sunlight globe configuration (NASA-style lighting)
 * Focused sun illumination from top-right
 */
export const configureGlobeMap = (map) => {
    if (!map) return;

    try {
        // Enable globe projection
        map.setProjection('globe');

        // Minimal, neutral atmosphere (NO blue glow)
        map.setFog({
            range: [0.7, 9],
            color: '#0b0c10',          // Neutral dark atmosphere
            'high-color': '#fde807ff',   // Slight lift near horizon
            'horizon-blend': 0.08,     // Sharper terminator edge
            'space-color': '#020205',  // Deep space
            'star-intensity': 0.7     // Stars fade against sunlight
        });

        // Directional sunlight from TOP-RIGHT
        map.setLight({
            anchor: 'viewport',
            position: [1.5, 45, 85],   // Azimuth (right) + high altitude
            color: '#fff8e1',          // Slight warm sunlight
            intensity: 0.45            // Stronger light for realism
        });

    } catch (error) {
        console.error('Error configuring realistic sunlight globe:', error);
    }
};


/* Base styles */
export const DARK_MAP_STYLE = 'mapbox://styles/mapbox/satellite-v9';

