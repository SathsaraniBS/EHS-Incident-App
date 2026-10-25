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

interface Incident {
  id: number;
  section: string;
  description: string;
  location: string;
  image_url: string | null;
  created_at?: string;
}

export function ReportsScreen() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchIncidentsData = useCallback(async () => {
    try {
      setErrorMsg(null);
      const data = await getIncidents();
      
      const rawList = Array.isArray(data) ? data : (data?.incidents || data?.data || []);
      
      if (Array.isArray(rawList)) {
        setIncidents([...rawList].reverse());
      } else {
        setIncidents([]);
      }
    } catch (error: any) {
      console.error("Fetch incidents error:", error);
      setErrorMsg("Failed to load reports. Pull down to refresh.");
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
      ? (item.image_url.startsWith('http') ? item.image_url : `${API_BASE_URL}${item.image_url}`)
      : null;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardSection}>{item.section || 'General'}</Text>
          <Text style={styles.cardId}>#{item.id}</Text>
        </View>

        <Text style={styles.cardLocation}>📍 Location: {item.location || 'N/A'}</Text>
        <Text style={styles.cardDescription}>{item.description}</Text>

        {imageUrl && (
          <Image
            source={{ uri: imageUrl }}
            style={styles.cardImage}
            resizeMode="cover"
          />
        )}

        {item.created_at && (
          <Text style={styles.cardDate}>
            🕒 {new Date(item.created_at).toLocaleString()}
          </Text>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <Text style={styles.header}>Submitted Reports</Text>
        <Text style={styles.subHeader}>Total Reports: {incidents.length}</Text>

        {errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}

        {loading ? (
          <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={incidents}
            keyExtractor={(item, index) => (item.id ? item.id.toString() : index.toString())}
            renderItem={renderIncidentCard}
            contentContainerStyle={{ paddingBottom: 30 }}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No reports found.</Text>
              </View>
            }
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563eb']} />
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  container: { padding: 16, flex: 1 },
  header: { fontSize: 22, fontWeight: 'bold', color: '#1e293b' },
  subHeader: { fontSize: 13, color: '#64748b', marginBottom: 12 },
  errorText: { color: '#dc2626', fontSize: 13, marginBottom: 10 },
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
  emptyContainer: { alignItems: 'center', marginTop: 50 },
  emptyText: { color: '#64748b', fontSize: 15 },
});