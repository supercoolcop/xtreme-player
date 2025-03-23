// In utils/m3uParser.js, update the parseM3U function:

export const parseM3U = (data) => {
  // Input validation
  if (!data || typeof data !== 'string') {
    throw new Error('Invalid M3U data: Input must be a non-empty string');
  }

  // Check if this is actually an M3U file
  if (!data.includes('#EXTM3U') && !data.includes('#EXTINF')) {
    throw new Error('Invalid M3U format: Missing required M3U headers');
  }

  const lines = data.split('\n');
  const channels = [];
  let errors = [];

  // Assert we have content to parse
  if (lines.length < 2) {
    throw new Error('Invalid M3U content: Insufficient data');
  }

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('#EXTINF')) {
      try {
        const nameMatch = lines[i].match(/,(.+)/);
        // Assert we found a channel name
        const name = nameMatch ? nameMatch[1].trim() : `Channel ${i}`;
        
        // Get the URL from the next line
        const url = lines[i + 1]?.trim();
        
        // Validate URL format - MODIFIED to be more permissive
        if (!url) {
          errors.push(`Missing URL for channel "${name}" at line ${i+1}`);
          continue;
        }
        
        // Accept any URL that starts with http or https
        if (!url.startsWith('http') ) {
          errors.push(`Invalid URL format for channel "${name}": ${url}`);
          continue;
        }
        
        // Add valid channel to the list
        channels.push({ name, url });
      } catch (err) {
        errors.push(`Failed to parse channel at line ${i}: ${err.message}`);
      }
    }
  }

  // Log parsing errors but don't fail completely if we found some valid channels
  if (errors.length > 0) {
    console.warn('M3U parsing warnings:', errors);
  }
  
  // Assert we found at least one channel
  if (channels.length === 0) {
    throw new Error('No valid channels found in M3U content');
  }

  return channels;
};

// In utils/m3uParser.js, add this helper function:

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
    
    // Ensure type=m3u parameter exists
    if (!normalizedUrl.includes('type=')) {
      normalizedUrl += '&type=m3u';
    }
    
    return normalizedUrl;
  }
  
  return url;
};
