// utils/storage.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const CHANNELS_KEY = 'cached_channels';
const TIMESTAMP_KEY = 'channels_timestamp';

export const saveChannels = async (channels) => {
  try {
    await AsyncStorage.setItem(CHANNELS_KEY, JSON.stringify(channels));
    await AsyncStorage.setItem(TIMESTAMP_KEY, Date.now().toString());
  } catch (e) {
    console.error('Failed to save playlist', e);
  }
};

export const loadChannels = async () => {
  try {
    const channelsJson = await AsyncStorage.getItem(CHANNELS_KEY);
    const timestamp = await AsyncStorage.getItem(TIMESTAMP_KEY);
    if (channelsJson && timestamp) {
      return {
        channels: JSON.parse(channelsJson),
        timestamp: parseInt(timestamp),
      };
    }
  } catch (e) {
    console.error('Failed to load playlist', e);
  }
  return null;
};

export const clearCachedChannels = async () => {
  await AsyncStorage.removeItem(CHANNELS_KEY);
  await AsyncStorage.removeItem(TIMESTAMP_KEY);
};
