// components/Playlist.js
import React from 'react';
import { View, FlatList, Text, TouchableOpacity } from 'react-native';

export default function Playlist({ channels, onSelect }) {
  return (
    <View style={{ padding: 10 }}>
      <FlatList
        data={channels}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => onSelect(item.url)}
            style={{ padding: 10, borderBottomWidth: 1 }}
          >
            <Text>{item.name}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

