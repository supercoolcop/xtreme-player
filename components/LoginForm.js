import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function LoginForm({ onXtreamLogin, onM3ULogin, onDirectUrlPlay, onBack }) {
  const [loginType, setLoginType] = useState('xtream'); // xtream | m3u | direct
  const [host, setHost] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [m3uUrl, setM3uUrl] = useState('');
  const [directUrl, setDirectUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleXtreamSubmit = async () => {
    if (!host) {
      Alert.alert('Error', 'Please enter a host URL');
      return;
    }
    
    if (!username || !password) {
      Alert.alert('Error', 'Please enter both username and password');
      return;
    }
    
    setIsLoading(true);
    try {
      await onXtreamLogin({ host, username, password });
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleM3USubmit = async () => {
    if (!m3uUrl) {
      Alert.alert('Error', 'Please enter an M3U URL');
      return;
    }
    
    setIsLoading(true);
    try {
      await onM3ULogin(m3uUrl);
    } catch (error) {
      console.error('M3U load error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDirectUrlSubmit = () => {
    if (!directUrl) {
      Alert.alert('Error', 'Please enter a direct stream URL');
      return;
    }
    
    onDirectUrlPlay(directUrl);
  };

  const handleTestUrlSubmit = () => {
    const testUrl = 'http://sample.vodobox.net/skate_phantom_flex_4k/skate_phantom_flex_4k.m3u8';
    setDirectUrl(testUrl);
    onDirectUrlPlay(testUrl);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>IPTV Xtream Player</Text>
      
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, loginType === 'xtream' && styles.activeTab]}
          onPress={() => setLoginType('xtream')}
        >
          <Ionicons 
            name="key-outline" 
            size={20} 
            color={loginType === 'xtream' ? "#2196F3" : "#777"} 
          />
          <Text style={[styles.tabText, loginType === 'xtream' && styles.activeTabText]}>
            Xtream Login
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, loginType === 'm3u' && styles.activeTab]}
          onPress={() => setLoginType('m3u')}
        >
          <Ionicons 
            name="list-outline" 
            size={20} 
            color={loginType === 'm3u' ? "#2196F3" : "#777"} 
          />
          <Text style={[styles.tabText, loginType === 'm3u' && styles.activeTabText]}>
            M3U URL
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, loginType === 'direct' && styles.activeTab]}
          onPress={() => setLoginType('direct')}
        >
          <Ionicons 
            name="play-outline" 
            size={20} 
            color={loginType === 'direct' ? "#2196F3" : "#777"} 
          />
          <Text style={[styles.tabText, loginType === 'direct' && styles.activeTabText]}>
            Direct URL
          </Text>
        </TouchableOpacity>
      </View>
      
      {loginType === 'xtream' && (
        <View style={styles.formContainer}>
          <Text style={styles.label}>Host URL</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., iptv-provider.com"
            value={host}
            onChangeText={setHost}
            autoCapitalize="none"
            autoCorrect={false}
          />
          
          <Text style={styles.label}>Username</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter username"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
          />
          
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
          
          <View style={styles.buttonContainer}>
            <Button
              title="Connect"
              onPress={handleXtreamSubmit}
              disabled={isLoading}
            />
          </View>
          
          <Text style={styles.helpText}>
            Enter your Xtream API credentials provided by your IPTV service.
          </Text>
        </View>
      )}
      
      {loginType === 'm3u' && (
        <View style={styles.formContainer}>
          <Text style={styles.label}>M3U Playlist URL</Text>
          <TextInput
            style={styles.input}
            placeholder="http://example.com/playlist.m3u"
            value={m3uUrl}
            onChangeText={setM3uUrl}
            autoCapitalize="none"
            autoCorrect={false}
          />
          
          <View style={styles.buttonContainer}>
            <Button
              title="Load Playlist"
              onPress={handleM3USubmit}
              disabled={isLoading}
            />
          </View>
          
          <Text style={styles.helpText}>
            Enter the URL of an M3U playlist file to load all channels.
          </Text>
        </View>
      )}
      
      {loginType === 'direct' && (
        <View style={styles.formContainer}>
          <Text style={styles.label}>Direct Stream URL</Text>
          <TextInput
            style={styles.input}
            placeholder="http://example.com/stream.m3u8"
            value={directUrl}
            onChangeText={setDirectUrl}
            autoCapitalize="none"
            autoCorrect={false}
          />
          
          <View style={styles.buttonContainer}>
            <Button
              title="Play Stream"
              onPress={handleDirectUrlSubmit}
            />
          </View>
          
          <View style={styles.buttonContainer}>
            <Button
              title="Play Test Stream"
              onPress={handleTestUrlSubmit}
              color="#4CAF50"
            />
          </View>
          
          <Text style={styles.helpText}>
            Enter a direct stream URL (m3u8, mp4, etc.) to play immediately.
            The test stream button will play the sample URL: http://sample.vodobox.net/skate_phantom_flex_4k/skate_phantom_flex_4k.m3u8
          </Text>
        </View>
      )}
      
      {onBack && (
        <View style={styles.backButtonContainer}>
          <Button title="Back" onPress={onBack} color="#777" />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  contentContainer: {
    padding: 20,
    paddingTop: 40
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#2196F3'
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden'
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#fff'
  },
  activeTab: {
    backgroundColor: '#f0f7ff',
    borderBottomWidth: 2,
    borderBottomColor: '#2196F3'
  },
  tabText: {
    marginLeft: 5,
    fontSize: 12,
    color: '#777'
  },
  activeTabText: {
    color: '#2196F3',
    fontWeight: 'bold'
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  label: {
    fontSize: 14,
    marginBottom: 5,
    color: '#555'
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    fontSize: 16
  },
  buttonContainer: {
    marginBottom: 10
  },
  helpText: {
    fontSize: 12,
    color: '#777',
    marginTop: 10,
    fontStyle: 'italic'
  },
  backButtonContainer: {
    marginTop: 20
  }
});
