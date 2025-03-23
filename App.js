import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, ActivityIndicator, Alert, FlatList, TouchableOpacity } from 'react-native';

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
import { normalizeStreamUrl } from './utils/streamUtils';
import { isConnected, subscribeToNetworkChanges } from './utils/networkUtils';

export default function App() {
  const [stage, setStage] = useState('login'); // login | playlist | player
  const [playlist, setPlaylist] = useState([]);
  const [currentUrl, setCurrentUrl] = useState(null);
  const [askSource, setAskSource] = useState(true);
  const [loading, setLoading] = useState(false);
  const [savedPlaylists, setSavedPlaylists] = useState([]);
  const [showPlaylistSelector, setShowPlaylistSelector] = useState(false);

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
  
  // All hooks above this point — now safe to return conditionally below!
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading channel list...</Text>
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
  
  const handleXtreamLogin = async ({ host, username, password }) => {
    try {
      setLoading(true);
      // Ensure host has proper format
      if (!host.startsWith('http://') && !host.startsWith('https://')) {
        host = 'http://' + host;
      }
      
      const url = `${host}/player_api.php?username=${username}&password=${password}`;
      const res = await axios.get(url, {
        timeout: 15000,  // 15 seconds timeout
        validateStatus: status => status < 400 // Only treat HTTP errors (400+) as errors
      });
      
      const liveChannels = res.data?.available_channels || res.data?.live_streams;
      
      if (!liveChannels || liveChannels.length === 0) {
        throw new Error('No channels found in the Xtream API response');
      }
      
      const channels = liveChannels.map((item) => ({
        name: item.name,
        url: `${host}/live/${username}/${password}/${item.stream_id}.m3u8`,
      }));
      
      // Create a tag from the host and username
      const tag = `xtream_${host.replace(/https?:\/\//, '').replace(/\./g, '_')}_${username}`;
      
      // Save channels with tag
      const result = await saveChannels(channels, tag);
      console.log(`Saved ${result.count} channels with tag: ${result.tag}`);
      
      setPlaylist(channels);
      setStage('playlist');
      
      // Refresh the saved playlists list
      const playlists = await getAllPlaylists();
      setSavedPlaylists(playlists);
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
    try {
      // Normalize the URL to ensure it works with our player
      const normalizedUrl = normalizeStreamUrl(url);
      
      // Log both URLs to help with debugging
      console.log('Original URL:', url);
      console.log('Normalized URL:', normalizedUrl);
      
      // Create a tag from the URL (simplified for storage)
      const urlObj = new URL(normalizedUrl);
      const tag = `m3u_${urlObj.hostname.replace(/\./g, '_')}`;
      
      // Check if URL is likely a direct video URL
      if (normalizedUrl.match(/\.(m3u8|mp4|ts|webm|mkv)($|\?)/i)) {
        console.log('Direct video URL detected, creating single channel playlist');
        // Create a single channel playlist directly without fetching
        const channels = [{ name: 'Direct Stream', url: normalizedUrl }];
        
        // Save with tag
        const result = await saveChannels(channels, `direct_${tag}`);
        console.log(`Saved direct stream with tag: ${result.tag}`);
        
        setPlaylist(channels);
        setStage('playlist');
      } else {
        // Set a reasonable timeout for the request
        const res = await axios.get(normalizedUrl, { 
          timeout: 30000,  // 30 seconds timeout for playlist fetch
          validateStatus: status => status < 400 // Only treat HTTP errors (400+) as errors
        });
        
        const channels = parseM3U(res.data);
        if (channels.length > 0) {
          // Save with tag
          const result = await saveChannels(channels, tag);
          console.log(`Saved ${result.count} channels with tag: ${result.tag}`);
        }
        setPlaylist(channels);
        setStage('playlist');
      }
      
      // Refresh the saved playlists list
      const playlists = await getAllPlaylists();
      setSavedPlaylists(playlists);
    } catch (e) {
      console.error('M3U fetch failed:', e);
      
      // More descriptive error messages based on error type
      if (e.code === 'ECONNABORTED') {
        alert('Connection timed out. The server might be slow or unreachable.');
      } else if (e.response && e.response.status) {
        alert(`Server error (${e.response.status}): ${e.message}`);
      } else if (e.message.includes('Network Error')) {
        alert('Network error. Please check your internet connection and try again.');
      } else {
        alert('Error loading M3U playlist: ' + e.message);
      }
    } finally {
      setLoading(false);
    }
  };  
  
  return (
    <View style={styles.container}>
      {stage === 'login' && (
        <LoginForm onM3ULogin={handleM3ULogin} onXtreamLogin={handleXtreamLogin} />
      )}
      {stage === 'playlist' && (
        <Playlist
          channels={playlist}
          onSelect={(url) => {
            setCurrentUrl(url);
            setStage('player');
          }}
        />
      )}
      {stage === 'player' && (
        <VideoPlayer
          url={currentUrl}
          onBack={() => setStage('playlist')}
          onError={(errorDetails) => {
            // Show an alert with the error details
            Alert.alert(
              'Stream Error',
              `Unable to play this stream: ${errorDetails}`,
              [{ text: 'Back to Channels', onPress: () => setStage('playlist') }]
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center'
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
    padding: 20, 
    marginTop: 40
  },
  sourceTitle: {
    fontSize: 18, 
    marginBottom: 15,
    fontWeight: '600'
  },
  playlistItem: {
    backgroundColor: '#f8f8f8',
    padding: 15,
    marginVertical: 5,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007bff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2
  },
  playlistItemExpired: {
    borderLeftColor: '#ff9800',
    backgroundColor: '#fff9e6'
  },
  playlistName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333'
  },
  playlistAge: {
    fontSize: 12,
    color: '#666',
    marginTop: 5
  },
  buttonContainer: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between'
  }
});

