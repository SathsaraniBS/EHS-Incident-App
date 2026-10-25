import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Incident } from '../types/incident';
import { API_URL } from '../api/incidentApi';

interface Props {
  item: Incident;
}

export const IncidentCard: React.FC<Props> = ({ item }) => {
  const imageUrl = item.image_url ? `${API_URL}${item.image_url}` : null;
  const formattedDate = new Date(item.created_at).toLocaleString();

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardSection}>{item.section}</Text>
        <Text style={styles.cardId}>#{item.id}</Text>
      </View>
      <Text style={styles.cardLocation}>📍 Location: {item.location}</Text>
      <Text style={styles.cardDescription}>{item.description}</Text>
      {imageUrl && (
        <Image source={{ uri: imageUrl }} style={styles.cardImage} resizeMode="cover" />
      )}
      <Text style={styles.cardDate}>🕒 {formattedDate}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  cardSection: { fontSize: 14, fontWeight: 'bold', color: '#1e293b', flex: 1 },
  cardId: { fontSize: 12, fontWeight: '600', color: '#2563eb' },
  cardLocation: { fontSize: 13, color: '#0284c7', fontWeight: '600', marginBottom: 6 },
  cardDescription: { fontSize: 14, color: '#334155', marginBottom: 10 },
  cardImage: { width: '100%', height: 180, borderRadius: 8, marginBottom: 10 },
  cardDate: { fontSize: 11, color: '#94a3b8', textAlign: 'right' },
});