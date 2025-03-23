// utils/m3uParser.js
// utils/m3uParser.js
/**
 * Parse M3U playlist content and extract channel information
 * @param {string} data - Raw M3U playlist content
 * @returns {Array} Array of channel objects with name and url properties
 * @throws {Error} If data is invalid or parsing fails
 */
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
        
        // Validate URL format
        if (!url) {
          errors.push(`Missing URL for channel "${name}" at line ${i+1}`);
          continue;
        }
        
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
