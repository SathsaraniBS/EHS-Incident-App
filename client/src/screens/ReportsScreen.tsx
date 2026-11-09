import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { getIncidents, API_BASE_URL } from '../api/incidentApi';
import { theme, severityColor } from '../theme';
import { IncidentCard } from '../components/IncidentCard';
import { Incident } from '../types/incident';



export function ReportsScreen() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchIncidentsData = useCallback(async () => {
    try {
      setErrorMsg(null);
      const data = await getIncidents();
      const rawList = Array.isArray(data) ? data : data?.incidents || data?.data || [];
      // the server already returns newest first, so no reverse() here
      setIncidents(Array.isArray(rawList) ? rawList : []);
    } catch (error: any) {
      console.error('Fetch incidents error:', error);
      setErrorMsg('Failed to load reports. Pull down to refresh.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchIncidentsData();
    }, [fetchIncidentsData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchIncidentsData();
  };

  const renderIncidentCard = ({ item }: { item: Incident }) => {
    const imageUrl = item.image_url
      ? item.image_url.startsWith('http')
        ? item.image_url
        : `${API_BASE_URL}${item.image_url}`
      : null;

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

        {item.created_at && (
          <Text style={styles.cardDate}>🕒 {new Date(item.created_at).toLocaleString()}</Text>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <Text style={styles.header}>Submitted Reports</Text>
        <Text style={styles.subHeader}>Total reports: {incidents.length}</Text>

        {errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}

        {loading ? (
          <ActivityIndicator size="large" color={theme.red} style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={incidents}
            keyExtractor={(item, index) => (item.id ? item.id.toString() : index.toString())}
            renderItem={({ item }) => <IncidentCard item={item} />}
            contentContainerStyle={{ paddingBottom: 30 }}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No reports found.</Text>
              </View>
            }
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[theme.red]}
                tintColor={theme.red}
              />
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.bg },
  container: { padding: 16, flex: 1 },
  header: { fontSize: 24, fontWeight: '800', color: theme.text },
  subHeader: { fontSize: 13, color: theme.textMuted, marginTop: 2, marginBottom: 12 },
  errorText: { color: theme.high, fontSize: 13, marginBottom: 10 },

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

  emptyContainer: { alignItems: 'center', marginTop: 50 },
  emptyText: { color: theme.textMuted, fontSize: 15 },
});