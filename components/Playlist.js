// components/Playlist.js
import React from 'react';
import { View, FlatList, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function Playlist({ channels, onSelect }) {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Available Channels</Text>
      {channels.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No channels available</Text>
        </View>
      ) : (
        <FlatList
          data={channels}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => onSelect(item.url)}
              style={styles.channelItem}
            >
              <Ionicons name="tv-outline" size={24} color="#2196F3" style={styles.channelIcon} />
              <Text style={styles.channelName}>{item.name}</Text>
              <Ionicons name="play-circle-outline" size={24} color="#2196F3" style={styles.playIcon} />
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5'
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#2196F3',
    textAlign: 'center'
  },
  channelItem: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  channelIcon: {
    marginRight: 12
  },
  channelName: {
    flex: 1,
    fontSize: 16,
    color: '#333'
  },
  playIcon: {
    marginLeft: 8
  },
  separator: {
    height: 8
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center'
  }
});

