import axios from 'axios';

/**
 * Xtream API client for interacting with Xtream API services
 */
class XtreamApiClient {
  constructor(host, username, password) {
    // Ensure host has proper format
    if (!host.startsWith('http://') && !host.startsWith('https://')) {
      host = 'https://' + host; // Prefer HTTPS by default
    }
    
    // Remove trailing slash if present
    if (host.endsWith('/')) {
      host = host.slice(0, -1);
    }
    
    this.host = host;
    this.username = username;
    this.password = password;
    this.baseUrl = `${host}/player_api.php`;
    this.timeout = 15000; // 15 seconds timeout
  }

  /**
   * Make an API request to the Xtream API
   * @param {Object} params - Query parameters for the request
   * @returns {Promise<Object>} - API response
   */
  async makeRequest(params = {}) {
    try {
      const url = this.baseUrl;
      const queryParams = {
        username: this.username,
        password: this.password,
        ...params
      };
      
      console.log(`Making Xtream API request to ${url} with params:`, queryParams);
      
      const response = await axios.get(url, {
        params: queryParams,
        timeout: this.timeout,
        validateStatus: status => status < 400 // Only treat HTTP errors (400+) as errors
      });
      
      return response.data;
    } catch (error) {
      console.error('Xtream API request failed:', error);
      throw this.formatError(error);
    }
  }

  /**
   * Format error for better user feedback
   * @param {Error} error - Original error
   * @returns {Error} - Formatted error
   */
  formatError(error) {
    if (error.code === 'ECONNABORTED') {
      return new Error('Connection timed out. The server might be slow or unreachable.');
    } else if (error.response && error.response.status) {
      return new Error(`Server error (${error.response.status}): ${error.message}`);
    } else if (error.message.includes('Network Error')) {
      return new Error('Network error. Please check your internet connection and try again.');
    } else {
      return new Error(error.message || 'Unknown error');
    }
  }

  /**
   * Get user account information
   * @returns {Promise<Object>} - User account info
   */
  async getUserInfo() {
    return this.makeRequest();
  }

  /**
   * Get all live stream categories
   * @returns {Promise<Array>} - List of categories
   */
  async getLiveCategories() {
    return this.makeRequest({ action: 'get_live_categories' });
  }

  /**
   * Get all live streams
   * @param {number} category_id - Optional category ID to filter by
   * @returns {Promise<Array>} - List of live streams
   */
  async getLiveStreams(category_id = null) {
    const params = { action: 'get_live_streams' };
    if (category_id) {
      params.category_id = category_id;
    }
    return this.makeRequest(params);
  }

  /**
   * Get all VOD categories
   * @returns {Promise<Array>} - List of VOD categories
   */
  async getVodCategories() {
    return this.makeRequest({ action: 'get_vod_categories' });
  }

  /**
   * Get all VOD streams
   * @param {number} category_id - Optional category ID to filter by
   * @returns {Promise<Array>} - List of VOD streams
   */
  async getVodStreams(category_id = null) {
    const params = { action: 'get_vod_streams' };
    if (category_id) {
      params.category_id = category_id;
    }
    return this.makeRequest(params);
  }

  /**
   * Get all series categories
   * @returns {Promise<Array>} - List of series categories
   */
  async getSeriesCategories() {
    return this.makeRequest({ action: 'get_series_categories' });
  }

  /**
   * Get all series
   * @param {number} category_id - Optional category ID to filter by
   * @returns {Promise<Array>} - List of series
   */
  async getSeries(category_id = null) {
    const params = { action: 'get_series' };
    if (category_id) {
      params.category_id = category_id;
    }
    return this.makeRequest(params);
  }

  /**
   * Get series info
   * @param {number} series_id - Series ID
   * @returns {Promise<Object>} - Series info
   */
  async getSeriesInfo(series_id) {
    return this.makeRequest({ action: 'get_series_info', series_id });
  }

  /**
   * Get EPG for a specific stream
   * @param {number} stream_id - Stream ID
   * @param {string} limit - Optional limit (e.g., "2" for 2 days)
   * @returns {Promise<Array>} - EPG data
   */
  async getEpg(stream_id, limit = null) {
    const params = { action: 'get_short_epg', stream_id };
    if (limit) {
      params.limit = limit;
    }
    return this.makeRequest(params);
  }

  /**
   * Get full EPG for all streams
   * @returns {Promise<Object>} - Full EPG data
   */
  async getFullEpg() {
    return this.makeRequest({ action: 'get_simple_data_table', stream_id: 'epg' });
  }

  /**
   * Generate stream URL for live content
   * @param {number} stream_id - Stream ID
   * @param {string} extension - File extension (default: m3u8)
   * @returns {string} - Stream URL
   */
  getLiveStreamUrl(stream_id, extension = 'm3u8') {
    return `${this.host}/live/${this.username}/${this.password}/${stream_id}.${extension}`;
  }

  /**
   * Generate stream URL for VOD content
   * @param {number} stream_id - Stream ID
   * @param {string} extension - File extension (default: mp4)
   * @returns {string} - Stream URL
   */
  getVodStreamUrl(stream_id, extension = 'mp4') {
    return `${this.host}/movie/${this.username}/${this.password}/${stream_id}.${extension}`;
  }

  /**
   * Generate stream URL for series episode
   * @param {number} series_id - Series ID
   * @param {number} episode_id - Episode ID
   * @param {string} extension - File extension (default: mp4)
   * @returns {string} - Stream URL
   */
  getSeriesStreamUrl(series_id, episode_id, extension = 'mp4') {
    return `${this.host}/series/${this.username}/${this.password}/${series_id}/${episode_id}.${extension}`;
  }
}

export default XtreamApiClient;
