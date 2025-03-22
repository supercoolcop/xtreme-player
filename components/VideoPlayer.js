// components/VideoPlayer.js
/*import React from 'react';
import { View, Button } from 'react-native';
import Video from 'react-native-video';

export default function VideoPlayer({ url, onBack }) {
  return (
    <View style={{ flex: 1, paddingTop: 40 }}>
      <Video
        source={{ uri: url }}
        controls
        resizeMode="contain"
        style={{ width: '100%', height: 300 }}
      />
      <Button title="Back to Playlist" onPress={onBack} />
    </View>
  );
}*/

import React, { useRef, useState, useEffect } from 'react';
import { View, Button, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Video } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';

export default function VideoPlayer({ url, onBack }) {
  const fallbackUrl = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';
  const [currentUrl, setCurrentUrl] = useState(url || fallbackUrl);
  const [attemptedFallback, setAttemptedFallback] = useState(false);
  const [error, setError] = useState(false);
  const [waiting, setWaiting] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);

  const videoRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setWaiting(false);
    }, 15000); // give the stream time to load

    return () => clearTimeout(timer);
  }, [currentUrl]);

  const handleVideoError = (e) => {
    console.warn('❌ Video error:', e);

    if (!attemptedFallback && !waiting) {
      setCurrentUrl(fallbackUrl);
      setAttemptedFallback(true);
      setWaiting(true);
    } else {
      setError(true);
    }
  };

  const handleRetry = () => {
    setCurrentUrl(url || fallbackUrl);
    setAttemptedFallback(false);
    setError(false);
    setWaiting(true);
    setIsPlaying(true);
  };

  const toggleFullscreen = async () => {
    if (!videoRef.current) return;

    const status = await videoRef.current.getStatusAsync();
    if (status.isLoaded) {
      videoRef.current.presentFullscreenPlayer();
      setIsFullscreen(true);
    }
  };

  const togglePlayback = async () => {
    if (!videoRef.current) return;

    const status = await videoRef.current.getStatusAsync();
    if (status.isLoaded) {
      if (status.isPlaying) {
        await videoRef.current.pauseAsync();
        setIsPlaying(false);
      } else {
        await videoRef.current.playAsync();
        setIsPlaying(true);
      }
    }
  };

  return (
    <View style={{ flex: 1, paddingTop: 40, paddingHorizontal: 20 }}>
      {error ? (
        <View style={{ alignItems: 'center', marginTop: 30 }}>
          <Text style={{ color: 'red', marginBottom: 10, textAlign: 'center' }}>
            🚫 Unable to load video after multiple attempts.
          </Text>
          <Button title="🔄 Try Again" onPress={handleRetry} />
        </View>
      ) : (
        <>
          <TouchableOpacity onPress={togglePlayback} onLongPress={toggleFullscreen}>
            <Video
              ref={videoRef}
              source={{ uri: currentUrl }}
              useNativeControls
              resizeMode="contain"
              shouldPlay
              style={{ width: '100%', height: 300, borderRadius: 10 }}
              onError={handleVideoError}
              onFullscreenUpdate={(event) => {
                if (event.fullscreenUpdate === Video.FULLSCREEN_UPDATE_PLAYER_DID_DISMISS) {
                  setIsFullscreen(false);
                }
              }}
            />
          </TouchableOpacity>

          {waiting && (
            <View style={{ marginTop: 10, alignItems: 'center' }}>
              <ActivityIndicator size="small" color="#007bff" />
              <Text style={{ fontSize: 12, marginTop: 5, color: '#555' }}>
                Waiting for stream to start (15 sec)...
              </Text>
            </View>
          )}

          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 10 }}>
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={28}
              color="#007bff"
              onPress={togglePlayback}
              style={{ marginHorizontal: 15 }}
            />
            <Ionicons
              name='resize'
              size={28}
              color="#007bff"
              onPress={toggleFullscreen}
              style={{ marginHorizontal: 15 }}
            />
          </View>
        </>
      )}

      <View style={{ marginTop: 20 }}>
        <Button title="Back to Playlist" onPress={onBack} />
      </View>
    </View>
  );
}
