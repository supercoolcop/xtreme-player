// In utils/m3uParser.js, update the parseM3U function:

export const parseM3U = (data) => {
  // Input validation
  if (!data || typeof data !== 'string') {
    throw new Error('Invalid M3U data: Input must be a non-empty string');
  }

  // Check if this is actually an M3U file or a direct video URL
  if (!data.includes('#EXTM3U') && !data.includes('#EXTINF')) {
    // If it's a direct video URL (ending with common video extensions), create a single channel
    if (data.trim().match(/\.(m3u8|mp4|ts|webm|mkv)($|\?)/i)) {
      return [{ name: 'Direct Stream', url: data.trim() }];
    }
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
        
        // Accept any non-empty string as a URL - we'll validate it when we try to fetch
        if (!url || url.trim() === '') {
          errors.push(`Missing URL for channel "${name}" at line ${i+1}`);
          continue;
        }
        
        // Previously required URLs to start with 'http'
        // Now we'll accept any non-empty string and let the fetch handle any errors
        
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
