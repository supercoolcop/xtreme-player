// components/LoginForm.js
import React, { useState } from 'react';
import { View, Text, TextInput, Button } from 'react-native';

export default function LoginForm({ onM3ULogin, onXtreamLogin }) {
  const [m3uUrl, setM3uUrl] = useState('');
  const [host, setHost] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontWeight: 'bold' }}>M3U URL Login</Text>
      <TextInput
        placeholder="Enter M3U URL"
        value={m3uUrl}
        onChangeText={setM3uUrl}
        style={{ borderWidth: 1, marginBottom: 10, padding: 8 }}
      />
      <Button title="Login with M3U" onPress={() => onM3ULogin(m3uUrl)} />

      <View style={{ marginVertical: 20 }} />

      <Text style={{ fontWeight: 'bold' }}>Xtream Codes Login</Text>
      <TextInput
        placeholder="Host (e.g., http://example.com)"
        value={host}
        onChangeText={setHost}
        style={{ borderWidth: 1, marginBottom: 10, padding: 8 }}
      />
      <TextInput
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        style={{ borderWidth: 1, marginBottom: 10, padding: 8 }}
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{ borderWidth: 1, marginBottom: 10, padding: 8 }}
      />
      <Button
        title="Login with Xtream Codes"
        onPress={() => onXtreamLogin({ host, username, password })}
      />
    </View>
  );
}

