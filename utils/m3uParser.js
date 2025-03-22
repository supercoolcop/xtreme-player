// utils/m3uParser.js
export const parseM3U = (data) => {
  const lines = data.split('\n');
  const channels = [];

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('#EXTINF')) {
      const nameMatch = lines[i].match(/,(.+)/);
      const name = nameMatch ? nameMatch[1].trim() : `Channel ${i}`;
      const url = lines[i + 1]?.trim();

      if (url && url.startsWith('http')) {
        channels.push({ name, url });
      }
    }
  }

  return channels;
};

