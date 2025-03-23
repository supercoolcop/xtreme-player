import React, { useState, useEffect } from 'react';
import { View, Text, Button, TextInput, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';

import LoginForm from './components/LoginForm';
import Playlist from './components/Playlist';
import VideoPlayer from './components/VideoPlayer';
import axios from 'axios';
import { parseM3U } from './utils/m3uParser';
import { saveChannels, loadChannels } from './utils/storage'; // ✅ ✅ ✅

export default function App() {
  const [stage, setStage] = useState('login'); // login | playlist | player
  const [playlist, setPlaylist] = useState([]);
  const [currentUrl, setCurrentUrl] = useState(null);
  const [askSource, setAskSource] = useState(true);
  const [loading, setLoading] = useState(false);



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
  
  // 🧠 All hooks above this point — now safe to return conditionally below!
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={{ marginTop: 10 }}>Loading...</Text>
      </View>
    );
  }
  
  if (askSource) {
    return (
      <View style={{ padding: 20, marginTop: 40 }}>
        <Text style={{ fontSize: 16, marginBottom: 10 }}>Load channels from:</Text>
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
      const url = `${host}/player_api.php?username=${username}&password=${password}`;
      const res = await axios.get(url);
      const liveChannels = res.data?.available_channels || res.data?.live_streams;
      const channels = liveChannels.map((item) => ({
        name: item.name,
        url: `${host}/live/${username}/${password}/${item.stream_id}.m3u8`,
      }));
      setPlaylist(channels);
      setStage('playlist');
    } catch (e) {
      console.error(e);
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
      
      const res = await axios.get(normalizedUrl);
      const channels = parseM3U(res.data);
      if (channels.length > 0) {
        await saveChannels(channels);
      }
      setPlaylist(channels);
      setStage('playlist');
    } catch (e) {
      console.error('M3U fetch failed:', e.message);
      alert('Error loading M3U playlist: ' + e.message);
    }
    setLoading(false);
  };
  
  
  

  return (
    <View style={{ flex: 1 }}>
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

