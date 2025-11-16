import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const EmptyState: React.FC = () => (
  <View style={styles.emptyState}>
    <Text style={styles.emptyIcon}>📷</Text>
    <Text style={styles.emptyTitle}>No Photos Yet</Text>
    <Text style={styles.emptyText}>
      Tap the Import button to add photos{'\n'}and start organizing them
    </Text>
  </View>
);

const styles = StyleSheet.create({
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#6C757D',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default EmptyState;
