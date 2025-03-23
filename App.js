import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, ActivityIndicator, Alert } from 'react-native';

import LoginForm from './components/LoginForm';
import Playlist from './components/Playlist';
import VideoPlayer from './components/VideoPlayer';
import axios from 'axios';
import { parseM3U } from './utils/m3uParser';
import { saveChannels, loadChannels } from './utils/storage';
import { normalizeStreamUrl } from './utils/streamUtils';
import { isConnected, subscribeToNetworkChanges } from './utils/networkUtils';

export default function App() {
  const [stage, setStage] = useState('login'); // login | playlist | player
  const [playlist, setPlaylist] = useState([]);
  const [currentUrl, setCurrentUrl] = useState(null);
  const [askSource, setAskSource] = useState(true);
  const [loading, setLoading] = useState(false);

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
      const data = await loadChannels();
      if (data) {
        const ageHours = (Date.now() - data.timestamp) / (1000 * 60 * 60);
        console.log(`Cached playlist is ${ageHours.toFixed(1)} hours old`);
      }
    };
    checkCache();
  }, []);
  
  // All hooks above this point — now safe to return conditionally below!
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }
  
  if (askSource) {
    return (
      <View style={styles.sourceContainer}>
        <Text style={styles.sourceTitle}>Load channels from:</Text>
        <Button
          title="📁 Use Saved Playlist"
          onPress={async () => {
            const data = await loadChannels();
            if (data && data.channels) {
              setPlaylist(data.channels);
              setStage('playlist');
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
      
      await saveChannels(channels);
      setPlaylist(channels);
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
    try {
      // Normalize the URL to ensure it works with our player
      const normalizedUrl = normalizeStreamUrl(url);
      
      // Log both URLs to help with debugging
      console.log('Original URL:', url);
      console.log('Normalized URL:', normalizedUrl);
      
      // Check if URL is likely a direct video URL
      if (normalizedUrl.match(/\.(m3u8|mp4|ts|webm|mkv)($|\?)/i)) {
        console.log('Direct video URL detected, creating single channel playlist');
        // Create a single channel playlist directly without fetching
        const channels = [{ name: 'Direct Stream', url: normalizedUrl }];
        await saveChannels(channels);
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
          await saveChannels(channels);
        }
        setPlaylist(channels);
        setStage('playlist');
      }
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
  sourceContainer: {
    padding: 20, 
    marginTop: 40
  },
  sourceTitle: {
    fontSize: 16, 
    marginBottom: 10,
    fontWeight: '500'
  }
});

