import React, { useRef, useState, useEffect } from 'react';
import { View, Button, Text, ActivityIndicator, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { Video } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { normalizeVideoUrl } from '../utils/streamUtils';

export default function VideoPlayer({ url, onBack, onError }) {
  // Validate input URL
  if (!url) {
    console.error('VideoPlayer: No URL provided');
    onError && onError('No URL provided');
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Error: No URL provided</Text>
          <Button title="Back to Playlist" onPress={onBack} />
        </View>
      </View>
    );
  }
  
  const fallbackUrl = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';
  const [currentUrl, setCurrentUrl] = useState(url || fallbackUrl);
  const [attemptedFallback, setAttemptedFallback] = useState(false);
  const [error, setError] = useState(false);
  const [errorDetails, setErrorDetails] = useState('');
  const [waiting, setWaiting] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [loadAttempts, setLoadAttempts] = useState(0);

  const videoRef = useRef(null);
  const MAX_LOAD_ATTEMPTS = 5;
  const LOADING_TIMEOUT = 300000; // 5 minutes for very slow connections

  // Initialize with the URL and reset state when URL changes
  useEffect(() => {
    if (url) {
      const processedUrl = normalizeVideoUrl(url);
      console.log('Original video URL:', url);
      console.log('Processed video URL:', processedUrl);
      setCurrentUrl(processedUrl);
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
    }, LOADING_TIMEOUT); // give the stream more time to load (45 seconds)

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
    
    // Keep original protocol (both http:// and https:// are supported)
    if (originalUrl.startsWith('http://') || originalUrl.startsWith('https://')) {
      return originalUrl;
    }
    
    // No alternative format available
    return null;
  };

  const handleVideoError = (e) => {
    console.warn('❌ Video error:', e);
    
    // Get detailed error information
    const errorCode = e.error?.code || '';
    const errorMessage = e.error?.message || 'Unknown playback error';
    
    // Interpret common error codes
    let detailedError = errorMessage;
    if (errorCode) {
      switch (errorCode) {
        case -11800:
          detailedError = 'Network connection error. Please check your internet connection.';
          break;
        case -11828:
          detailedError = 'Stream format not supported by this device.';
          break;
        case -11850:
          detailedError = 'Stream not found or access denied. The URL may be invalid.';
          break;
        case -11801:
          detailedError = 'Timeout while loading stream. The server may be down.';
          break;
        // Add specific error for HTTP/HTTPS issues
        case -11803:
          detailedError = 'Protocol error. Make sure both HTTP and HTTPS URLs are allowed in your Info.plist.';
          break;
        case 1:
        case 2:
        case 3:
          detailedError = 'Stream format unsupported or requires additional configuration.';
          break;
        default:
          detailedError = `Error ${errorCode}: ${errorMessage}`;
      }
    }
    
    setErrorDetails(detailedError);
    
    // Add more aggressive retry logic for specific error types
    if (errorCode === -11800 || errorCode === -11801) {
      // Network or timeout errors - retry with shorter timeout
      console.log('Network-related error, attempting quick retry...');
      const newAttempts = loadAttempts + 1;
      setLoadAttempts(newAttempts);
      
      if (newAttempts <= MAX_LOAD_ATTEMPTS) {
        setTimeout(() => {
          console.log(`Quick retry attempt ${newAttempts}/${MAX_LOAD_ATTEMPTS}`);
          // Force a reload of the video with the same URL
          const currentVideoUrl = currentUrl;
          setCurrentUrl('');
          setTimeout(() => setCurrentUrl(currentVideoUrl), 50);
        }, 1000); // Quick 1-second retry for network issues
        return;
      }
    } else {
      // For other errors, follow the standard error handling path
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
        onError && onError(detailedError);
      }
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
    <View style={styles.container}>
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>
            🚫 Unable to load video after multiple attempts.
          </Text>
          {errorDetails ? (
            <Text style={styles.errorDetails}>
              Error: {errorDetails}
            </Text>
          ) : null}
          <Text style={styles.errorHint}>
            The m3u URL may be invalid or the stream might be unavailable.
          </Text>
          <Button title="🔄 Try Again" onPress={handleRetry} />
        </View>
      ) : (
        <>
          <TouchableOpacity 
            onPress={togglePlayback} 
            onLongPress={toggleFullscreen}
            style={styles.videoContainer}
          >
            <Video
              ref={videoRef}
              source={{ uri: currentUrl }}
              useNativeControls
              resizeMode="contain"
              shouldPlay
              style={styles.video}
              onError={(e) => {
                console.warn('❌ Video error:', JSON.stringify(e));
                console.warn('URL causing error:', currentUrl);
                if (currentUrl.startsWith('http://')) {
                  console.warn('HTTP URL detected - check NSAllowsArbitraryLoadsInMedia setting in Info.plist');
                }
                handleVideoError(e);
              }}
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
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#007bff" />
              <Text style={styles.loadingText}>
                Connecting to stream...
              </Text>
              {loadAttempts > 0 && (
                <Text style={styles.loadingText}>
                  Attempt {loadAttempts}/{MAX_LOAD_ATTEMPTS}
                </Text>
              )}
              <View style={styles.loadingBackButton}>
                <Button title="Back to Channels" onPress={onBack} />
              </View>
              <Text style={styles.loadingHint}>
                Note: Some streams may take time to load. If loading takes too long, try another channel.
              </Text>
            </View>
          )}

          <View style={styles.controlsContainer}>
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={28}
              color="#007bff"
              onPress={togglePlayback}
              style={styles.controlIcon}
            />
            <Ionicons
              name='resize'
              size={28}
              color="#007bff"
              onPress={toggleFullscreen}
              style={styles.controlIcon}
            />
          </View>
        </>
      )}

      <View style={styles.backButtonContainer}>
        <Button title="Back to Playlist" onPress={onBack} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, 
    paddingTop: 40, 
    paddingHorizontal: 20
  },
  errorContainer: {
    alignItems: 'center', 
    marginTop: 30
  },
  errorTitle: {
    color: 'red', 
    marginBottom: 10, 
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16
  },
  errorDetails: {
    color: '#555', 
    marginBottom: 10, 
    textAlign: 'center'
  },
  errorHint: {
    color: '#555', 
    marginBottom: 20, 
    textAlign: 'center'
  },
  videoContainer: {
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#000',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4
  },
  video: {
    width: '100%', 
    height: 300, 
    borderRadius: 10
  },
  loadingContainer: {
    marginTop: 10, 
    alignItems: 'center'
  },
  loadingText: {
    fontSize: 12, 
    marginTop: 5, 
    color: '#555'
  },
  loadingHint: {
    fontSize: 11,
    marginTop: 10,
    color: '#777',
    textAlign: 'center',
    fontStyle: 'italic',
    paddingHorizontal: 20
  },
  loadingBackButton: {
    marginTop: 15,
    marginBottom: 5,
    width: '80%'
  },
  controlsContainer: {
    flexDirection: 'row', 
    justifyContent: 'center', 
    marginTop: 15,
    backgroundColor: '#f8f8f8',
    borderRadius: 30,
    padding: 10
  },
  controlIcon: {
    marginHorizontal: 15
  },
  backButtonContainer: {
    marginTop: 20
  }
});
