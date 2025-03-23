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
  
  // Ensure URL has a protocol
  let normalizedUrl = url;
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    normalizedUrl = 'http://' + url;
  }
  
  // Already in m3u/m3u8 format with no parameters
  if (normalizedUrl.toLowerCase().endsWith('.m3u') || 
      normalizedUrl.toLowerCase().endsWith('.m3u8') ||
      normalizedUrl.includes('/m3u8/') ||
      normalizedUrl.includes('.m3u8?')) {
    return normalizedUrl;
  }
  
  // Handle IPTV service URLs with parameters
  if (normalizedUrl.includes('get.php') || normalizedUrl.includes('player_api.php')) {
    // Check if URL has output parameter
    if (normalizedUrl.includes('output=')) {
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
      // Don't convert m3u_plus to m3u anymore as it may be required by some servers
      // Previously: normalizedUrl = normalizedUrl.replace('type=m3u_plus', 'type=m3u');
    }
  }
  
  return normalizedUrl;
};

/**
 * Normalize video stream URLs for the player
 * @param {string} url - Original stream URL
 * @returns {string} - Normalized URL for the player
 */
export const normalizeVideoUrl = (url) => {
  if (!url) return url;
  
  // Ensure URL has a protocol
  let normalizedUrl = url;
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    normalizedUrl = 'http://' + url;
  }
  
  // For direct TS streams, we might need to handle them differently
  if (normalizedUrl.includes('output=ts')) {
    // Some players might need special handling for TS streams
    console.log('TS stream detected, using special handling');
    // You might need to adjust this based on your player's capabilities
    return normalizedUrl;  // Keep original format, don't convert to m3u8
  }
  
  // Check for other common stream patterns
  if (normalizedUrl.includes('/play/') || 
      normalizedUrl.includes('stream=') || 
      normalizedUrl.includes('/live/')) {
    console.log('Stream URL detected, ensuring format compatibility');
    return normalizedUrl;
  }
  
  // Handle direct video URLs
  if (normalizedUrl.match(/\.(m3u8|mp4|ts|webm|mkv)($|\?)/i)) {
    console.log('Direct video URL detected');
    return normalizedUrl;
  }
  
  return normalizedUrl;
};
