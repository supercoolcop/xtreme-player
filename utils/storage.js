// utils/storage.js
import AsyncStorage from '@react-native-async-storage/async-storage';

// Keys for storage
const CHANNELS_PREFIX = 'cached_channels_';
const TIMESTAMP_PREFIX = 'channels_timestamp_';
const PLAYLISTS_LIST_KEY = 'saved_playlists';

// Default TTL for playlists (48 hours in milliseconds)
export const DEFAULT_TTL = 48 * 60 * 60 * 1000;

/**
 * Save a channel list with a tag name
 * @param {Array} channels - List of channel objects
 * @param {string} tag - Tag name for the playlist (e.g. URL or user-provided name)
 * @returns {Promise<void>}
 */
export const saveChannels = async (channels, tag = 'default') => {
  try {
    // Generate a safe key from the tag
    const safeTag = tag.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    
    // Save the channel list
    await AsyncStorage.setItem(`${CHANNELS_PREFIX}${safeTag}`, JSON.stringify(channels));
    
    // Save the timestamp
    const timestamp = Date.now().toString();
    await AsyncStorage.setItem(`${TIMESTAMP_PREFIX}${safeTag}`, timestamp);
    
    // Update the list of saved playlists
    const existingPlaylists = await getSavedPlaylistTags();
    if (!existingPlaylists.includes(safeTag)) {
      existingPlaylists.push(safeTag);
      await AsyncStorage.setItem(PLAYLISTS_LIST_KEY, JSON.stringify(existingPlaylists));
    }
    
    return {
      tag: safeTag,
      count: channels.length,
      timestamp: parseInt(timestamp)
    };
  } catch (e) {
    console.error('Failed to save playlist', e);
    throw e;
  }
};

/**
 * Load channels for a specific tag
 * @param {string} tag - Tag name for the playlist
 * @param {boolean} checkTTL - Whether to check if the playlist is expired
 * @param {number} ttl - Time to live in milliseconds (default 48 hours)
 * @returns {Promise<Object|null>} - Object with channels, timestamp, and isExpired flag
 */
export const loadChannels = async (tag = 'default', checkTTL = true, ttl = DEFAULT_TTL) => {
  try {
    const safeTag = tag.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const channelsJson = await AsyncStorage.getItem(`${CHANNELS_PREFIX}${safeTag}`);
    const timestamp = await AsyncStorage.getItem(`${TIMESTAMP_PREFIX}${safeTag}`);
    
    if (channelsJson && timestamp) {
      const parsedTimestamp = parseInt(timestamp);
      const now = Date.now();
      const isExpired = checkTTL && (now - parsedTimestamp > ttl);
      
      return {
        channels: JSON.parse(channelsJson),
        timestamp: parsedTimestamp,
        isExpired,
        tag: safeTag
      };
    }
  } catch (e) {
    console.error('Failed to load playlist', e);
  }
  return null;
};

/**
 * Get a list of all saved playlist tags
 * @returns {Promise<Array>} - Array of playlist tags
 */
export const getSavedPlaylistTags = async () => {
  try {
    const tagsJson = await AsyncStorage.getItem(PLAYLISTS_LIST_KEY);
    return tagsJson ? JSON.parse(tagsJson) : [];
  } catch (e) {
    console.error('Failed to load playlist tags', e);
    return [];
  }
};

/**
 * Get details about all saved playlists
 * @returns {Promise<Array>} - Array of playlist objects with tag, count, timestamp, and isExpired
 */
export const getAllPlaylists = async () => {
  try {
    const tags = await getSavedPlaylistTags();
    const playlists = [];
    
    for (const tag of tags) {
      const playlist = await loadChannels(tag, true);
      if (playlist) {
        playlists.push({
          tag,
          count: playlist.channels.length,
          timestamp: playlist.timestamp,
          isExpired: playlist.isExpired
        });
      }
    }
    
    return playlists;
  } catch (e) {
    console.error('Failed to get all playlists', e);
    return [];
  }
};

/**
 * Clear a specific cached channel list
 * @param {string} tag - Tag name for the playlist
 * @returns {Promise<void>}
 */
export const clearCachedChannels = async (tag = 'default') => {
  try {
    const safeTag = tag.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    await AsyncStorage.removeItem(`${CHANNELS_PREFIX}${safeTag}`);
    await AsyncStorage.removeItem(`${TIMESTAMP_PREFIX}${safeTag}`);
    
    // Update the list of saved playlists
    const existingPlaylists = await getSavedPlaylistTags();
    const updatedPlaylists = existingPlaylists.filter(t => t !== safeTag);
    await AsyncStorage.setItem(PLAYLISTS_LIST_KEY, JSON.stringify(updatedPlaylists));
  } catch (e) {
    console.error('Failed to clear playlist', e);
  }
};

/**
 * Clear all cached channel lists
 * @returns {Promise<void>}
 */
export const clearAllCachedChannels = async () => {
  try {
    const tags = await getSavedPlaylistTags();
    
    for (const tag of tags) {
      await AsyncStorage.removeItem(`${CHANNELS_PREFIX}${tag}`);
      await AsyncStorage.removeItem(`${TIMESTAMP_PREFIX}${tag}`);
    }
    
    await AsyncStorage.removeItem(PLAYLISTS_LIST_KEY);
  } catch (e) {
    console.error('Failed to clear all playlists', e);
  }
};
