import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, ActivityIndicator, Alert, FlatList, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import LoginForm from './components/LoginForm';
import Playlist from './components/Playlist';
import VideoPlayer from './components/VideoPlayer';
import axios from 'axios';
import { parseM3U } from './utils/m3uParser';
import { 
  saveChannels, 
  loadChannels, 
  getSavedPlaylistTags, 
  getAllPlaylists, 
  clearCachedChannels,
  DEFAULT_TTL
} from './utils/storage';
import { normalizeStreamUrl, isValidVideoUrl, fixCommonUrlIssues } from './utils/streamUtils';
import { isConnected, subscribeToNetworkChanges } from './utils/networkUtils';
import XtreamApiClient from './utils/XtreamApiClient';

export default function App() {
  const [stage, setStage] = useState('login'); // login | playlist | player
  const [playlist, setPlaylist] = useState([]);
  const [currentUrl, setCurrentUrl] = useState(null);
  const [askSource, setAskSource] = useState(true);
  const [loading, setLoading] = useState(false);
  const [savedPlaylists, setSavedPlaylists] = useState([]);
  const [showPlaylistSelector, setShowPlaylistSelector] = useState(false);
  const [contentType, setContentType] = useState('live'); // live | vod | series
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [apiClient, setApiClient] = useState(null);
  const [credentials, setCredentials] = useState(null);
  const [loadingMessage, setLoadingMessage] = useState('Loading...');

  // Check network connectivity on app start
  useEffect(() => {
    const checkConnectivity = async () => {
      // Delay network check for more stable detection after app fully loads
      setTimeout(async () => {
        const connected = await isConnected();
        
        if (!connected) {
          Alert.alert(
            "No Internet Connection",
            "You're offline. Some features may not work properly. Cached channels will still be available.",
            [{ text: "OK" }]
          );
        }
      }, 3000); // 3 second delay
    };
    
    checkConnectivity();
    
    // Subscribe to network changes
    const unsubscribe = subscribeToNetworkChanges((connected) => {
      if (!connected) {
        Alert.alert(
          "Connection Lost",
          "You're now offline. Some features may not work properly.",
          [{ text: "OK" }]
        );
      }
    });
    
    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const checkCache = async () => {
      const playlists = await getAllPlaylists();
      setSavedPlaylists(playlists);
      
      if (playlists.length > 0) {
        console.log(`Found ${playlists.length} saved playlists`);
        playlists.forEach(playlist => {
          const ageHours = (Date.now() - playlist.timestamp) / (1000 * 60 * 60);
          console.log(`Playlist "${playlist.tag}" is ${ageHours.toFixed(1)} hours old (${playlist.count} channels)`);
        });
      }
    };
    checkCache();
  }, []);

  // Load categories when content type changes
  useEffect(() => {
    if (apiClient && stage === 'playlist') {
      loadCategories();
    }
  }, [contentType, apiClient, stage]);
  
  // All hooks above this point — now safe to return conditionally below!
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>{loadingMessage}</Text>
        <View style={styles.loadingBackButtonContainer}>
          <Button title="Back" onPress={() => {
            setLoading(false);
            setAskSource(true);
          }} />
        </View>
      </View>
    );
  }
  
  if (askSource) {
    if (showPlaylistSelector && savedPlaylists.length > 0) {
      return (
        <View style={styles.sourceContainer}>
          <Text style={styles.sourceTitle}>Select a saved playlist:</Text>
          <FlatList
            data={savedPlaylists}
            keyExtractor={(item) => item.tag}
            renderItem={({ item }) => {
              const ageHours = (Date.now() - item.timestamp) / (1000 * 60 * 60);
              const isExpired = item.isExpired;
              
              return (
                <TouchableOpacity
                  style={[styles.playlistItem, isExpired && styles.playlistItemExpired]}
                  onPress={async () => {
                    if (isExpired) {
                      Alert.alert(
                        'Playlist Expired',
                        `This playlist is ${Math.floor(ageHours)} hours old and may be outdated. Would you like to refresh it?`,
                        [
                          { 
                            text: 'Use Anyway', 
                            onPress: async () => {
                              const data = await loadChannels(item.tag, false);
                              if (data && data.channels) {
                                setPlaylist(data.channels);
                                setStage('playlist');
                              }
                            } 
                          },
                          { 
                            text: 'Refresh', 
                            onPress: () => {
                              setShowPlaylistSelector(false);
                              setAskSource(false);
                              // Will need to re-enter URL
                            } 
                          }
                        ]
                      );
                    } else {
                      const data = await loadChannels(item.tag);
                      if (data && data.channels) {
                        setPlaylist(data.channels);
                        setStage('playlist');
                      }
                    }
                  }}
                >
                  <Text style={styles.playlistName}>
                    {item.tag} ({item.count} channels)
                  </Text>
                  <Text style={styles.playlistAge}>
                    {Math.floor(ageHours)} hours old
                    {isExpired && ' - Refresh recommended'}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
          <View style={styles.buttonContainer}>
            <Button
              title="Back"
              onPress={() => setShowPlaylistSelector(false)}
            />
          </View>
        </View>
      );
    }
    
    return (
      <View style={styles.sourceContainer}>
        <Text style={styles.sourceTitle}>Load channels from:</Text>
        {savedPlaylists.length > 0 && (
          <>
            <Button
              title="📁 Select Saved Playlist"
              onPress={() => setShowPlaylistSelector(true)}
            />
            <View style={{ height: 10 }} />
          </>
        )}
        <Button
          title="📁 Use Last Playlist"
          onPress={async () => {
            const data = await loadChannels();
            if (data && data.channels) {
              if (data.isExpired) {
                Alert.alert(
                  'Playlist Expired',
                  'This playlist is over 48 hours old and may be outdated. Would you like to refresh it?',
                  [
                    { 
                      text: 'Use Anyway', 
                      onPress: () => {
                        setPlaylist(data.channels);
                        setStage('playlist');
                      } 
                    },
                    { 
                      text: 'Refresh', 
                      onPress: () => setAskSource(false) 
                    }
                  ]
                );
              } else {
                setPlaylist(data.channels);
                setStage('playlist');
              }
            } else {
              alert('No saved playlist found.');
            }
          }}
        />
        <View style={{ height: 10 }} />
        <Button
          title="🌐 Fetch New from URL"
          onPress={() => setAskSource(false)}
        />
      </View>
    );
  }
  
  // Load categories based on content type
  const loadCategories = async () => {
    if (!apiClient) return;
    
    try {
      setLoading(true);
      setLoadingMessage(`Loading ${contentType} categories...`);
      
      let categoryData = [];
      
      switch (contentType) {
        case 'live':
          categoryData = await apiClient.getLiveCategories();
          break;
        case 'vod':
          categoryData = await apiClient.getVodCategories();
          break;
        case 'series':
          categoryData = await apiClient.getSeriesCategories();
          break;
      }
      
      setCategories(categoryData || []);
      setSelectedCategory(null);
      
    } catch (error) {
      console.error(`Error loading ${contentType} categories:`, error);
      Alert.alert('Error', `Failed to load categories: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Load content based on selected category and content type
  const loadContent = async (categoryId = null) => {
    if (!apiClient) return;
    
    try {
      setLoading(true);
      setLoadingMessage(`Loading ${contentType} content...`);
      
      let content = [];
      
      switch (contentType) {
        case 'live':
          content = await apiClient.getLiveStreams(categoryId);
          
          // Format live streams
          content = content.map(item => ({
            id: item.stream_id,
            name: item.name,
            url: apiClient.getLiveStreamUrl(item.stream_id),
            category: item.category_id,
            icon: item.stream_icon || null,
            epg: item.epg_channel_id || null
          }));
          break;
          
        case 'vod':
          content = await apiClient.getVodStreams(categoryId);
          
          // Format VOD streams
          content = content.map(item => ({
            id: item.stream_id,
            name: item.name,
            url: apiClient.getVodStreamUrl(item.stream_id),
            category: item.category_id,
            icon: item.stream_icon || null,
            info: {
              year: item.year || null,
              genre: item.genre || null,
              plot: item.plot || null,
              cast: item.cast || null,
              director: item.director || null,
              rating: item.rating || null,
              duration: item.duration || null
            }
          }));
          break;
          
        case 'series':
          content = await apiClient.getSeries(categoryId);
          
          // Format series (will need additional API call for episodes)
          content = content.map(item => ({
            id: item.series_id,
            name: item.name,
            category: item.category_id,
            icon: item.cover || null,
            info: {
              plot: item.plot || null,
              cast: item.cast || null,
              director: item.director || null,
              genre: item.genre || null,
              releaseDate: item.releaseDate || null,
              rating: item.rating || null,
              episodes: [] // Will be populated when series is selected
            }
          }));
          break;
      }
      
      setPlaylist(content || []);
      
      // Save channels with tag for live content
      if (contentType === 'live' && credentials) {
        const { host, username } = credentials;
        const tag = `xtream_${host.replace(/https?:\/\//, '').replace(/\./g, '_')}_${username}_${contentType}`;
        
        const channelsToSave = content.map(item => ({
          name: item.name,
          url: item.url
        }));
        
        const result = await saveChannels(channelsToSave, tag);
        console.log(`Saved ${result.count} ${contentType} channels with tag: ${result.tag}`);
        
        // Refresh the saved playlists list
        const playlists = await getAllPlaylists();
        setSavedPlaylists(playlists);
      }
      
    } catch (error) {
      console.error(`Error loading ${contentType} content:`, error);
      Alert.alert('Error', `Failed to load content: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Load series episodes
  const loadSeriesEpisodes = async (seriesId) => {
    if (!apiClient) return;
    
    try {
      setLoading(true);
      setLoadingMessage('Loading series episodes...');
      
      const seriesInfo = await apiClient.getSeriesInfo(seriesId);
      
      if (!seriesInfo || !seriesInfo.episodes) {
        throw new Error('No episodes found for this series');
      }
      
      // Format episodes by season
      const episodes = [];
      
      // Process each season
      Object.keys(seriesInfo.episodes).forEach(seasonNumber => {
        const season = seriesInfo.episodes[seasonNumber];
        
        // Process each episode in the season
        season.forEach(episode => {
          episodes.push({
            id: episode.id,
            name: `S${seasonNumber} E${episode.episode_num}: ${episode.title || 'Episode ' + episode.episode_num}`,
            season: parseInt(seasonNumber),
            episode: parseInt(episode.episode_num),
            url: apiClient.getSeriesStreamUrl(seriesId, episode.id),
            icon: episode.info?.movie_image || null,
            info: {
              plot: episode.info?.plot || null,
              duration: episode.info?.duration || null,
              releaseDate: episode.info?.releaseDate || null
            }
          });
        });
      });
      
      // Sort episodes by season and episode number
      episodes.sort((a, b) => {
        if (a.season !== b.season) {
          return a.season - b.season;
        }
        return a.episode - b.episode;
      });
      
      setPlaylist(episodes);
      
    } catch (error) {
      console.error('Error loading series episodes:', error);
      Alert.alert('Error', `Failed to load episodes: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleXtreamLogin = async ({ host, username, password }) => {
    try {
      setLoading(true);
      setLoadingMessage('Connecting to Xtream service...');
      
      // Create new API client
      const client = new XtreamApiClient(host, username, password);
      
      // Test connection by getting user info
      const userInfo = await client.getUserInfo();
      
      if (!userInfo || !userInfo.user_info) {
        throw new Error('Invalid response from server');
      }
      
      console.log('Xtream login successful:', userInfo.user_info.username);
      
      // Save credentials and API client
      setApiClient(client);
      setCredentials({ host, username, password });
      
      // Set content type to live by default
      setContentType('live');
      
      // Load live streams
      await loadContent();
      
      // Move to playlist stage
      setStage('playlist');
      
    } catch (e) {
      console.error('Xtream login error:', e);
      
      // More descriptive error messages based on error type
      if (e.code === 'ECONNABORTED') {
        alert('Connection timed out. The server might be slow or unreachable.');
      } else if (e.response && e.response.status) {
        alert(`Server error (${e.response.status}): ${e.message}`);
      } else if (e.message.includes('Network Error')) {
        alert('Network error. Please check your internet connection and try again.');
      } else {
        alert('Error logging in: ' + (e.message || 'Unknown error'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleM3ULogin = async (url) => {
    setLoading(true);
    setLoadingMessage('Loading playlist...');
    
    try {
      // Normalize the URL to ensure it works with our player
      const normalizedUrl = normalizeStreamUrl(url);
      
      // Log both URLs to help with debugging
      console.log('Original URL:', url);
      console.log('Normalized URL:', normalizedUrl);
      
      // Create a tag from the URL (simplified for storage)
      const urlObj = new URL(normalizedUrl);
      const tag = `m3u_${urlObj.hostname.replace(/\./g, '_')}`;
      
      // Fetch the M3U file
      const response = await axios.get(normalizedUrl, {
        timeout: 30000, // 30 seconds timeout
        responseType: 'text'
      });
      
      // Parse the M3U file
      const channels = parseM3U(response.data);
      
      if (!channels || channels.length === 0) {
        throw new Error('No channels found in the M3U file');
      }
      
      console.log(`Found ${channels.length} channels in M3U file`);
      
      // Save channels with tag
      const result = await saveChannels(channels, tag);
      console.log(`Saved ${result.count} channels with tag: ${result.tag}`);
      
      setPlaylist(channels);
      setStage('playlist');
      
      // Refresh the saved playlists list
      const playlists = await getAllPlaylists();
      setSavedPlaylists(playlists);
    } catch (e) {
      console.error('M3U login error:', e);
      
      // More descriptive error messages based on error type
      if (e.code === 'ECONNABORTED') {
        alert('Connection timed out. The server might be slow or unreachable.');
      } else if (e.response && e.response.status) {
        alert(`Server error (${e.response.status}): ${e.message}`);
      } else if (e.message.includes('Network Error')) {
        alert('Network error. Please check your internet connection and try again.');
      } else if (e.message.includes('Invalid M3U')) {
        alert('Invalid M3U format: ' + e.message);
      } else {
        alert('Error loading playlist: ' + (e.message || 'Unknown error'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDirectUrlPlay = (url) => {
    // Check if URL is likely a video URL
    if (isValidVideoUrl(url)) {
      // Fix any common URL issues
      const fixedUrl = fixCommonUrlIssues(url);
      setCurrentUrl(fixedUrl);
      setStage('player');
    } else {
      // Try to load as M3U playlist
      handleM3ULogin(url);
    }
  };

  if (stage === 'login') {
    return (
      <LoginForm 
        onXtreamLogin={handleXtreamLogin} 
        onM3ULogin={handleM3ULogin}
        onDirectUrlPlay={handleDirectUrlPlay}
        onBack={() => setAskSource(true)}
      />
    );
  }

  if (stage === 'player') {
    return (
      <VideoPlayer 
        url={currentUrl}
        onBack={() => {
          setCurrentUrl(null);
          setStage('playlist');
        }}
        onError={(error) => {
          console.error('Video player error:', error);
        }}
      />
    );
  }

  // Playlist stage with enhanced UI for different content types
  return (
    <View style={styles.container}>
      {apiClient && (
        <View style={styles.contentTypeSelector}>
          <TouchableOpacity
            style={[
              styles.contentTypeButton,
              contentType === 'live' && styles.contentTypeButtonActive
            ]}
            onPress={() => setContentType('live')}
          >
            <Ionicons 
              name="tv-outline" 
              size={20} 
              color={contentType === 'live' ? "#fff" : "#2196F3"} 
            />
            <Text style={[
              styles.contentTypeText,
              contentType === 'live' && styles.contentTypeTextActive
            ]}>Live TV</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.contentTypeButton,
              contentType === 'vod' && styles.contentTypeButtonActive
            ]}
            onPress={() => setContentType('vod')}
          >
            <Ionicons 
              name="film-outline" 
              size={20} 
              color={contentType === 'vod' ? "#fff" : "#2196F3"} 
            />
            <Text style={[
              styles.contentTypeText,
              contentType === 'vod' && styles.contentTypeTextActive
            ]}>Movies</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.contentTypeButton,
              contentType === 'series' && styles.contentTypeButtonActive
            ]}
            onPress={() => setContentType('series')}
          >
            <Ionicons 
              name="albums-outline" 
              size={20} 
              color={contentType === 'series' ? "#fff" : "#2196F3"} 
            />
            <Text style={[
              styles.contentTypeText,
              contentType === 'series' && styles.contentTypeTextActive
            ]}>Series</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {categories.length > 0 && (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
        >
          <TouchableOpacity
            style={[
              styles.categoryButton,
              selectedCategory === null && styles.categoryButtonActive
            ]}
            onPress={() => {
              setSelectedCategory(null);
              loadContent();
            }}
          >
            <Text style={[
              styles.categoryText,
              selectedCategory === null && styles.categoryTextActive
            ]}>All</Text>
          </TouchableOpacity>
          
          {categories.map(category => (
            <TouchableOpacity
              key={category.category_id}
              style={[
                styles.categoryButton,
                selectedCategory === category.category_id && styles.categoryButtonActive
              ]}
              onPress={() => {
                setSelectedCategory(category.category_id);
                loadContent(category.category_id);
              }}
            >
              <Text style={[
                styles.categoryText,
                selectedCategory === category.category_id && styles.categoryTextActive
              ]}>{category.category_name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
      
      <Playlist 
        channels={playlist} 
        onSelect={(url, item) => {
          // For series, load episodes instead of playing directly
          if (contentType === 'series' && item && item.id) {
            loadSeriesEpisodes(item.id);
          } else {
            setCurrentUrl(url);
            setStage('player');
          }
        }} 
      />
      
      <View style={styles.footerContainer}>
        <Button 
          title="Back to Login" 
          onPress={() => {
            setStage('login');
            setApiClient(null);
            setCredentials(null);
          }} 
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555'
  },
  loadingBackButtonContainer: {
    marginTop: 20,
    width: '50%'
  },
  sourceContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center'
  },
  sourceTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#2196F3'
  },
  playlistItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  playlistItemExpired: {
    backgroundColor: '#fff9f9',
    borderLeftWidth: 3,
    borderLeftColor: '#ff6b6b'
  },
  playlistName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333'
  },
  playlistAge: {
    fontSize: 12,
    color: '#777',
    marginTop: 5
  },
  buttonContainer: {
    marginTop: 20
  },
  contentTypeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  contentTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20
  },
  contentTypeButtonActive: {
    backgroundColor: '#2196F3'
  },
  contentTypeText: {
    marginLeft: 5,
    fontSize: 14,
    color: '#2196F3'
  },
  contentTypeTextActive: {
    color: '#fff'
  },
  categoriesContainer: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 10,
    paddingHorizontal: 5
  },
  categoryButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginHorizontal: 5,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0'
  },
  categoryButtonActive: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3'
  },
  categoryText: {
    fontSize: 12,
    color: '#555'
  },
  categoryTextActive: {
    color: '#fff'
  },
  footerContainer: {
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#fff'
  }
});
