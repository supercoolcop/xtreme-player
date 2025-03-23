import React, { useRef, useState, useEffect } from 'react';
import { View, Button, Text, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { Video } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';

export default function VideoPlayer({ url, onBack }) {
  // Validate input URL
  if (!url) {
    console.error('VideoPlayer: No URL provided');
  }
  
  const fallbackUrl = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';
  const [currentUrl, setCurrentUrl] = useState(url || fallbackUrl) ;
  const [attemptedFallback, setAttemptedFallback] = useState(false);
  const [error, setError] = useState(false);
  const [errorDetails, setErrorDetails] = useState('');
  const [waiting, setWaiting] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [loadAttempts, setLoadAttempts] = useState(0);

  const videoRef = useRef(null);
  const MAX_LOAD_ATTEMPTS = 3;

  // Reset state when URL changes
  useEffect(() => {
    if (url) {
      setCurrentUrl(url);
      setAttemptedFallback(false);
      setError(false);
      setErrorDetails('');
      setWaiting(true);
      setIsPlaying(true);
      setLoadAttempts(0);
    }
  }, [url]);

  // Set up loading timeout
  useEffect(() => {
    const timer = setTimeout(() => {
      setWaiting(false);
    }, 15000); // give the stream time to load

    return () => clearTimeout(timer);
  }, [currentUrl]);

  // Validate m3u URL format
  const isValidM3uUrl = (testUrl) => {
    if (!testUrl) return false;
    return testUrl.toLowerCase().endsWith('.m3u') || 
           testUrl.toLowerCase().endsWith('.m3u8') || 
           testUrl.includes('.m3u8?') || 
           testUrl.includes('/m3u8/');
  };

  // Try alternative URL formats if the original fails
  const tryAlternativeUrlFormats = (originalUrl) => {
    // If URL doesn't end with m3u8, try adding it
    if (!originalUrl.toLowerCase().endsWith('.m3u8') && 
        !originalUrl.toLowerCase().endsWith('.m3u')) {
      return `${originalUrl}.m3u8`;
    }
    
    // If URL has http://, try https://
    if (originalUrl.startsWith('http://') ) {
      return originalUrl.replace('http://', 'https://') ;
    }
    
    // No alternative format available
    return null;
  };

  const handleVideoError = (e) => {
    console.warn('❌ Video error:', e);
    setErrorDetails(e.error?.message || 'Unknown playback error');
    
    // Increment load attempts
    const newAttempts = loadAttempts + 1;
    setLoadAttempts(newAttempts);
    
    // Try alternative URL format first
    const alternativeUrl = tryAlternativeUrlFormats(currentUrl);
    if (!attemptedFallback && alternativeUrl && newAttempts <= 1) {
      console.log('Trying alternative URL format:', alternativeUrl);
      setCurrentUrl(alternativeUrl);
      setWaiting(true);
      return;
    }
    
    // Then try fallback if we haven't yet
    if (!attemptedFallback && !waiting && newAttempts <= MAX_LOAD_ATTEMPTS) {
      console.log('Trying fallback URL:', fallbackUrl);
      setCurrentUrl(fallbackUrl);
      setAttemptedFallback(true);
      setWaiting(true);
    } else {
      setError(true);
    }
  };

  const handleRetry = () => {
    // Reset to original URL
    setCurrentUrl(url || fallbackUrl);
    setAttemptedFallback(false);
    setError(false);
    setErrorDetails('');
    setWaiting(true);
    setIsPlaying(true);
    setLoadAttempts(0);
  };

  const toggleFullscreen = async () => {
    if (!videoRef.current) return;

    try {
      const status = await videoRef.current.getStatusAsync();
      if (status.isLoaded) {
        videoRef.current.presentFullscreenPlayer();
        setIsFullscreen(true);
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
      Alert.alert('Fullscreen Error', 'Unable to enter fullscreen mode');
    }
  };

  const togglePlayback = async () => {
    if (!videoRef.current) return;

    try {
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
    } catch (err) {
      console.error('Playback toggle error:', err);
    }
  };

  return (
    <View style={{ flex: 1, paddingTop: 40, paddingHorizontal: 20 }}>
      {error ? (
        <View style={{ alignItems: 'center', marginTop: 30 }}>
          <Text style={{ color: 'red', marginBottom: 10, textAlign: 'center' }}>
            🚫 Unable to load video after multiple attempts.
          </Text>
          {errorDetails ? (
            <Text style={{ color: '#555', marginBottom: 10, textAlign: 'center' }}>
              Error: {errorDetails}
            </Text>
          ) : null}
          <Text style={{ color: '#555', marginBottom: 20, textAlign: 'center' }}>
            The m3u URL may be invalid or the stream might be unavailable.
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
              onLoad={() => {
                console.log('Video loaded successfully');
                setWaiting(false);
              }}
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
              {loadAttempts > 0 && (
                <Text style={{ fontSize: 12, marginTop: 5, color: '#555' }}>
                  Attempt {loadAttempts}/{MAX_LOAD_ATTEMPTS}
                </Text>
              )}
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
