import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Incident } from '../types/incident';
import { API_BASE_URL } from '../api/incidentApi';
import { theme, severityColor } from '../theme';

interface Props {
  item: Incident;
}

export const IncidentCard: React.FC<Props> = ({ item }) => {
  const imageUrl = item.image_url
    ? item.image_url.startsWith('http')
      ? item.image_url
      : `${API_BASE_URL}${item.image_url}`
    : null;
  const formattedDate = item.created_at ? new Date(item.created_at).toLocaleString() : null;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardSection} numberOfLines={2}>
          {item.section || 'General'}
        </Text>
        <Text style={styles.cardId}>#{item.id}</Text>
      </View>

      <View style={styles.badgeRow}>
        {item.severity ? (
          <View style={[styles.badge, { backgroundColor: severityColor(item.severity) }]}>
            <Text style={styles.badgeText}>{item.severity}</Text>
          </View>
        ) : null}
        {item.status ? (
          <View style={[styles.badge, styles.statusBadge]}>
            <Text style={[styles.badgeText, { color: theme.textMuted }]}>{item.status}</Text>
          </View>
        ) : null}
      </View>

      <Text style={styles.cardLocation}>📍 {item.location || 'N/A'}</Text>
      {item.assigned_to ? <Text style={styles.cardMeta}>👤 {item.assigned_to}</Text> : null}
      <Text style={styles.cardDescription}>{item.description}</Text>

      {imageUrl && (
        <Image source={{ uri: imageUrl }} style={styles.cardImage} resizeMode="cover" />
      )}

      {formattedDate && <Text style={styles.cardDate}>🕒 {formattedDate}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.card,
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  cardSection: { fontSize: 15, fontWeight: '700', color: theme.text, flex: 1, paddingRight: 8 },
  cardId: { fontSize: 12, fontWeight: '700', color: theme.red },

  badgeRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  statusBadge: { backgroundColor: theme.chipBg },
  badgeText: { fontSize: 11, fontWeight: '700', color: '#ffffff' },

  cardLocation: { fontSize: 13, color: theme.textMuted, fontWeight: '600', marginBottom: 2 },
  cardMeta: { fontSize: 13, color: theme.textMuted, marginBottom: 2 },
  cardDescription: { fontSize: 14, color: theme.text, marginTop: 6, marginBottom: 10 },
  cardImage: { width: '100%', height: 180, borderRadius: 12, marginBottom: 10 },
  cardDate: { fontSize: 11, color: theme.textFaint, textAlign: 'right' },
});