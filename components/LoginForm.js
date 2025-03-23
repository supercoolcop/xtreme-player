// components/LoginForm.js
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  StyleSheet 
} from 'react-native';
import { normalizeStreamUrl } from '../utils/streamUtils';

export default function LoginForm({ onM3ULogin, onXtreamLogin }) {
  const [m3uUrl, setM3uUrl] = useState('');
  const [host, setHost] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleM3ULogin = async (url) => {
    if (!url) {
      alert('Please enter a valid M3U URL');
      return;
    }
    
    // Basic URL format validation
    try {
      // Normalize URL before validation attempt
      let testUrl = url;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        testUrl = 'http://' + url;
      }
      new URL(testUrl); // Will throw if URL is invalid
    } catch (error) {
      alert('Invalid URL format. Please enter a valid URL.');
      return;
    }
    
    setLoading(true);
    try {
      await onM3ULogin(url);
    } catch (error) {
      console.error('M3U login error:', error);
      alert('Error loading M3U playlist: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleXtreamLogin = async () => {
    if (!host || !username || !password) {
      alert('Please fill in all Xtream Codes fields');
      return;
    }
    
    setLoading(true);
    try {
      await onXtreamLogin({ host, username, password });
    } catch (error) {
      console.error('Xtream login error:', error);
      alert('Error logging in: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>M3U Stream Login</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Enter M3U URL"
          placeholderTextColor="#999"
          value={m3uUrl}
          onChangeText={setM3uUrl}
          autoCapitalize="none"
          autoCorrect={false}
        />
        
        <TouchableOpacity 
          style={styles.button}
          onPress={() => handleM3ULogin(m3uUrl)}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.buttonText}>Login with M3U</Text>
          )}
        </TouchableOpacity>
        
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>
        
        <Text style={styles.subtitle}>Xtream Codes Login</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Host (e.g., http://example.com)"
          placeholderTextColor="#999"
          value={host}
          onChangeText={setHost}
          autoCapitalize="none"
          autoCorrect={false}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Username"
          placeholderTextColor="#999"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        
        <TouchableOpacity 
          style={styles.button}
          onPress={handleXtreamLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.buttonText}>Login with Xtream Codes</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 15,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderRadius: 5,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#2196F3',
    borderRadius: 5,
    padding: 15,
    alignItems: 'center',
    marginTop: 5,
    marginBottom: 15,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  dividerText: {
    marginHorizontal: 10,
    color: '#999',
    fontSize: 14,
  },
});

