import NetInfo from '@react-native-community/netinfo';

/**
 * Check if the device is currently connected to the internet
 * @returns {Promise<boolean>} - Promise that resolves to true if connected, false otherwise
 */
export const isConnected = async () => {
  const state = await NetInfo.fetch();
  // Less strict check - consider connected if either basic connectivity exists or internet is reachable
  return state.isConnected || state.isInternetReachable;
};

/**
 * Subscribe to network state changes
 * @param {Function} callback - Function to call when network state changes
 * @returns {Function} - Unsubscribe function
 */
export const subscribeToNetworkChanges = (callback) => {
  return NetInfo.addEventListener(state => {
    const isConnected = state.isConnected || state.isInternetReachable;
    callback(isConnected);
  });
};

/**
 * Get detailed network information
 * @returns {Promise<Object>} - Promise that resolves to network state object
 */
export const getNetworkDetails = async () => {
  return await NetInfo.fetch();
};
