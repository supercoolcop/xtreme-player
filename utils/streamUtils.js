/**
 * Utility functions for handling streaming URLs
 */

/**
 * Normalize IPTV service URLs to ensure they work with our player
 * @param {string} url - Original URL from user or playlist
 * @returns {string} - Normalized URL that will work with our player
 */
export const normalizeStreamUrl = (url) => {
    if (!url || typeof url !== 'string') return url;
    
    // Already in m3u/m3u8 format with no parameters
    if (url.toLowerCase().endsWith('.m3u') || url.toLowerCase().endsWith('.m3u8')) {
      return url;
    }
    
    // Handle IPTV service URLs with parameters
    if (url.includes('get.php') || url.includes('player_api.php')) {
      let normalizedUrl = url;
      
      // Check if URL has output parameter
      if (url.includes('output=')) {
        // Replace output=ts or other formats with output=m3u8
        normalizedUrl = normalizedUrl.replace(/output=[^&]+/g, 'output=m3u8');
      } else {
        // Add output parameter if not present
        normalizedUrl += (normalizedUrl.includes('?') ? '&' : '?') + 'output=m3u8';
      }
      
      // Ensure type parameter exists
      if (!normalizedUrl.includes('type=')) {
        normalizedUrl += '&type=m3u';
      } else if (normalizedUrl.includes('type=m3u_plus')) {
        // Handle m3u_plus format
        normalizedUrl = normalizedUrl.replace('type=m3u_plus', 'type=m3u');
      }
      
      return normalizedUrl;
    }
    
    return url;
  };
  
  /**
   * Normalize video stream URLs for the player
   * @param {string} url - Original stream URL
   * @returns {string} - Normalized URL for the player
   */
  export const normalizeVideoUrl = (url) => {
    if (!url) return url;
    
    // For direct TS streams, we might need to handle them differently
    if (url.includes('output=ts')) {
      // Some players might need special handling for TS streams
      console.log('TS stream detected, using special handling');
      // You might need to adjust this based on your player's capabilities
      return url.replace('output=ts', 'output=m3u8');
    }
    
    return url;
  };
  