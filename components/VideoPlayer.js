import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, Button, Text, ActivityIndicator, TouchableOpacity, Alert, StyleSheet, Dimensions, Platform } from 'react-native';
import { Video, Audio, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { normalizeVideoUrl } from '../utils/streamUtils';
import * as ScreenOrientation from 'expo-screen-orientation';

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
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [volume, setVolume] = useState(1.0);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));
  const [videoFormat, setVideoFormat] = useState('unknown');

  const videoRef = useRef(null);
  const progressInterval = useRef(null);
  const MAX_LOAD_ATTEMPTS = 3;
  const LOADING_TIMEOUT = 30000; // 30 seconds timeout (reduced from 5 minutes)

  // Set up audio session for background playback
  useEffect(() => {
    const setupAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
        console.log('Audio session configured for background playback');
      } catch (error) {
        console.error('Failed to configure audio session:', error);
      }
    };
    
    setupAudio();
    
    return () => {
      // Reset audio mode when component unmounts
      Audio.setAudioModeAsync({
        staysActiveInBackground: false,
      }).catch(err => console.error('Error resetting audio mode:', err));
    };
  }, []);

  // Handle screen dimension changes
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });

    return () => subscription.remove();
  }, []);

  // Initialize with the URL and reset state when URL changes
  useEffect(() => {
    if (url) {
      const processedUrl = normalizeVideoUrl(url);
      console.log('Original video URL:', url);
      console.log('Processed video URL:', processedUrl);
      
      // Detect video format
      const format = detectVideoFormat(processedUrl);
      setVideoFormat(format);
      console.log('Detected video format:', format);
      
      setCurrentUrl(processedUrl);
      setAttemptedFallback(false);
      setError(false);
      setErrorDetails('');
      setWaiting(true);
      setIsPlaying(true);
      setLoadAttempts(0);
      setLoadingProgress(0);
      
      // Start simulated loading progress
      startLoadingProgressSimulation();
    }
  }, [url]);

  // Set up loading timeout
  useEffect(() => {
    const timer = setTimeout(() => {
      if (waiting) {
        console.log('Loading timeout reached');
        setWaiting(false);
        handleVideoError({ 
          error: { 
            code: -11801, 
            message: 'Loading timeout reached' 
          } 
        });
      }
    }, LOADING_TIMEOUT);

    return () => clearTimeout(timer);
  }, [currentUrl, waiting]);

  // Clean up progress interval on unmount
  useEffect(() => {
    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, []);

  // Track playback position
  useEffect(() => {
    if (videoRef.current && !waiting && !error && isPlaying) {
      const interval = setInterval(async () => {
        try {
          const status = await videoRef.current.getStatusAsync();
          if (status.isLoaded) {
            setPosition(status.positionMillis);
            setDuration(status.durationMillis || 0);
            setIsBuffering(status.isBuffering);
          }
        } catch (err) {
          console.error('Error getting video status:', err);
        }
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [waiting, error, isPlaying]);

  // Detect video format from URL
  const detectVideoFormat = (url) => {
    if (!url) return 'unknown';
    
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes('.m3u8') || lowerUrl.includes('/m3u8/')) {
      return 'hls';
    } else if (lowerUrl.includes('.mp4')) {
      return 'mp4';
    } else if (lowerUrl.includes('.ts')) {
      return 'ts';
    } else if (lowerUrl.includes('.webm')) {
      return 'webm';
    } else if (lowerUrl.includes('.mkv')) {
      return 'mkv';
    } else {
      return 'unknown';
    }
  };

  // Simulate loading progress for better UX
  const startLoadingProgressSimulation = () => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }
    
    setLoadingProgress(0);
    let progress = 0;
    
    progressInterval.current = setInterval(() => {
      progress += Math.random() * 0.1;
      if (progress > 0.9) {
        progress = 0.9; // Cap at 90% until actual loading completes
        clearInterval(progressInterval.current);
      }
      setLoadingProgress(progress);
    }, 500);
  };

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
    if (!originalUrl) return null;
    
    // Try HTTPS if HTTP fails (and vice versa)
    if (originalUrl.startsWith('http://')) {
      return originalUrl.replace('http://', 'https://');
    } else if (originalUrl.startsWith('https://')) {
      return originalUrl.replace('https://', 'http://');
    }
    
    // If URL doesn't end with m3u8, try adding it
    if (!originalUrl.toLowerCase().endsWith('.m3u8') && 
        !originalUrl.toLowerCase().endsWith('.m3u')) {
      return `${originalUrl}.m3u8`;
    }
    
    // No alternative format available
    return null;
  };

  const handleVideoError = (e) => {
    console.warn('❌ Video error:', e);
    
    // Stop loading progress simulation
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }
    
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
          detailedError = 'Protocol error. The app may need to be configured to allow HTTP content.';
          
          // Automatically try alternative protocol
          const alternativeProtocolUrl = currentUrl.startsWith('http://') 
            ? currentUrl.replace('http://', 'https://') 
            : currentUrl.replace('https://', 'http://');
          
          console.log('Protocol error, trying alternative protocol:', alternativeProtocolUrl);
          setCurrentUrl(alternativeProtocolUrl);
          setWaiting(true);
          startLoadingProgressSimulation();
          return;
          
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
    
    // Add more intelligent retry logic for specific error types
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
          setTimeout(() => {
            setCurrentUrl(currentVideoUrl);
            startLoadingProgressSimulation();
          }, 50);
        }, 1000); // Quick 1-second retry for network issues
        return;
      }
    } else {
      // For other errors, follow the enhanced error handling path
      const newAttempts = loadAttempts + 1;
      setLoadAttempts(newAttempts);
      
      // Try alternative URL format first
      const alternativeUrl = tryAlternativeUrlFormats(currentUrl);
      if (!attemptedFallback && alternativeUrl && newAttempts <= 1) {
        console.log('Trying alternative URL format:', alternativeUrl);
        setCurrentUrl(alternativeUrl);
        setWaiting(true);
        startLoadingProgressSimulation();
        return;
      }
      
      // Then try fallback if we haven't yet
      if (!attemptedFallback && newAttempts <= MAX_LOAD_ATTEMPTS) {
        console.log('Trying fallback URL:', fallbackUrl);
        setCurrentUrl(fallbackUrl);
        setAttemptedFallback(true);
        setWaiting(true);
        startLoadingProgressSimulation();
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
    setLoadingProgress(0);
    startLoadingProgressSimulation();
  };

  const toggleFullscreen = async () => {
    if (!videoRef.current) return;

    try {
      const status = await videoRef.current.getStatusAsync();
      if (status.isLoaded) {
        if (!isFullscreen) {
          // Enter fullscreen
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
          await videoRef.current.presentFullscreenPlayer();
          setIsFullscreen(true);
        } else {
          // Exit fullscreen
          await videoRef.current.dismissFullscreenPlayer();
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
          setIsFullscreen(false);
        }
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
      Alert.alert('Fullscreen Error', 'Unable to change fullscreen mode');
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

  const handleVolumeChange = async (newVolume) => {
    if (!videoRef.current) return;
    
    try {
      await videoRef.current.setVolumeAsync(newVolume);
      setVolume(newVolume);
    } catch (err) {
      console.error('Volume change error:', err);
    }
  };

  const handleSeek = async (value) => {
    if (!videoRef.current || !duration) return;
    
    try {
      const seekPosition = value * duration;
      await videoRef.current.setPositionAsync(seekPosition);
      setPosition(seekPosition);
    } catch (err) {
      console.error('Seek error:', err);
    }
  };

  // Format time in MM:SS
  const formatTime = (millis) => {
    if (!millis) return '00:00';
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Calculate video height based on screen orientation and dimensions
  const getVideoHeight = () => {
    const { width, height } = dimensions;
    const isLandscape = width > height;
    
    if (isLandscape) {
      return height * 0.8; // 80% of screen height in landscape
    } else {
      return width * 0.56; // 16:9 aspect ratio in portrait
    }
  };

  return (
    <View style={styles.container}>
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>
            🚫 Unable to load video after multiple attempts
          </Text>
          {errorDetails ? (
            <Text style={styles.errorDetails}>
              Error: {errorDetails}
            </Text>
          ) : null}
          <Text style={styles.errorHint}>
            The stream URL may be invalid or the stream might be unavailable.
          </Text>
          <View style={styles.errorButtonsContainer}>
            <Button title="🔄 Try Again" onPress={handleRetry} />
            <View style={{ width: 20 }} />
            <Button title="Back to Playlist" onPress={onBack} />
          </View>
        </View>
      ) : (
        <>
          <TouchableOpacity 
            onPress={togglePlayback} 
            onLongPress={toggleFullscreen}
            style={[styles.videoContainer, { height: getVideoHeight() }]}
          >
            <Video
              ref={videoRef}
              source={{ uri: currentUrl }}
              useNativeControls
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay
              style={[styles.video, { height: getVideoHeight() }]}
              onError={(e) => {
                console.warn('❌ Video error:', JSON.stringify(e));
                console.warn('URL causing error:', currentUrl);
                if (currentUrl.startsWith('http://')) {
                  console.warn('HTTP URL detected - check NSAllowsArbitraryLoadsInMedia setting in Info.plist');
                }
                handleVideoError(e);
              }}
              onLoad={(status) => {
                console.log('Video loaded successfully', status);
                setWaiting(false);
                setLoadingProgress(1);
                if (progressInterval.current) {
                  clearInterval(progressInterval.current);
                  progressInterval.current = null;
                }
                
                // Set initial duration
                if (status.durationMillis) {
                  setDuration(status.durationMillis);
                }
              }}
              onPlaybackStatusUpdate={(status) => {
                if (status.isLoaded) {
                  setIsBuffering(status.isBuffering);
                  if (status.isBuffering) {
                    console.log('Video is buffering...');
                  }
                }
              }}
              onFullscreenUpdate={(event) => {
                if (event.fullscreenUpdate === Video.FULLSCREEN_UPDATE_PLAYER_DID_DISMISS) {
                  setIsFullscreen(false);
                  ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT)
                    .catch(err => console.error('Error locking orientation:', err));
                }
              }}
              volume={volume}
              progressUpdateIntervalMillis={1000}
            />
            
            {isBuffering && !waiting && (
              <View style={styles.bufferingOverlay}>
                <ActivityIndicator size="large" color="#ffffff" />
                <Text style={styles.bufferingText}>Buffering...</Text>
              </View>
            )}
          </TouchableOpacity>

          {waiting ? (
            <View style={styles.loadingContainer}>
              <View style={styles.progressBarContainer}>
                <View 
                  style={[
                    styles.progressBar, 
                    { width: `${loadingProgress * 100}%` }
                  ]} 
                />
              </View>
              <Text style={styles.loadingText}>
                Connecting to stream... {Math.round(loadingProgress * 100)}%
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
          ) : (
            <View style={styles.playbackControlsContainer}>
              {/* Playback progress */}
              <View style={styles.progressContainer}>
                <Text style={styles.timeText}>{formatTime(position)}</Text>
                <View style={styles.progressBarContainer}>
                  <View 
                    style={[
                      styles.progressBar, 
                      { width: duration ? `${(position / duration) * 100}%` : '0%' }
                    ]} 
                  />
                </View>
                <Text style={styles.timeText}>{formatTime(duration)}</Text>
              </View>
              
              {/* Volume control */}
              <View style={styles.volumeContainer}>
                <Ionicons
                  name={volume === 0 ? 'volume-mute' : 'volume-medium'}
                  size={24}
                  color="#007bff"
                />
                <View style={styles.volumeSlider}>
                  <TouchableOpacity 
                    style={styles.volumeSliderTrack}
                    onPress={(e) => {
                      const { locationX, target } = e.nativeEvent;
                      target.measure((x, y, width) => {
                        const newVolume = Math.max(0, Math.min(1, locationX / width));
                        handleVolumeChange(newVolume);
                      });
                    }}
                  >
                    <View 
                      style={[
                        styles.volumeSliderFill, 
                        { width: `${volume * 100}%` }
                      ]} 
                    />
                  </TouchableOpacity>
                </View>
              </View>
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
            <Ionicons
              name={volume === 0 ? 'volume-mute' : 'volume-high'}
              size={28}
              color="#007bff"
              onPress={() => handleVolumeChange(volume === 0 ? 1 : 0)}
              style={styles.controlIcon}
            />
          </View>
          
          {/* Stream info */}
          <View style={styles.streamInfoContainer}>
            <Text style={styles.streamInfoText}>
              Format: {videoFormat.toUpperCase()} • 
              {isBuffering ? ' Buffering' : isPlaying ? ' Playing' : ' Paused'}
            </Text>
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
  errorButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20
  },
  videoContainer: {
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#000',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    position: 'relative'
  },
  video: {
    width: '100%',
    borderRadius: 10
  },
  bufferingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  bufferingText: {
    color: '#ffffff',
    marginTop: 10,
    fontSize: 14
  },
  loadingContainer: {
    marginTop: 10, 
    alignItems: 'center'
  },
  progressBarContainer: {
    width: '100%',
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    overflow: 'hidden',
    marginVertical: 8
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#007bff'
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
  playbackControlsContainer: {
    marginTop: 10
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  timeText: {
    fontSize: 12,
    color: '#555',
    width: 45
  },
  volumeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10
  },
  volumeSlider: {
    flex: 1,
    marginLeft: 10,
    height: 20,
    justifyContent: 'center'
  },
  volumeSliderTrack: {
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    overflow: 'hidden'
  },
  volumeSliderFill: {
    height: '100%',
    backgroundColor: '#007bff'
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
  streamInfoContainer: {
    marginTop: 10,
    alignItems: 'center'
  },
  streamInfoText: {
    fontSize: 12,
    color: '#777'
  },
  backButtonContainer: {
    marginTop: 20
  }
});
