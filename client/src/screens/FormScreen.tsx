import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Alert,
  ActivityIndicator, Image, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { SECTIONS } from '../constants/sections';
import { checkServerHealth, submitIncident } from '../api/incidentApi';
import { theme, severityColor } from '../theme';

export function FormScreen() {
  const [selectedSection, setSelectedSection] = useState<string>(SECTIONS[0]);
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [severity, setSeverity] = useState('Medium');
  const [assignedTo, setAssignedTo] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [serverStatus, setServerStatus] = useState('Checking...');

  useEffect(() => {
    checkServerHealth()
      .then((res) => setServerStatus(res.message || 'Connected'))
      .catch(() => setServerStatus('Disconnected'));
  }, []);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Required', 'Permission to access your photos is required.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled && result.assets?.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!description.trim() || !location.trim()) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('section', selectedSection);
      formData.append('description', description.trim());
      formData.append('location', location.trim());
      formData.append('severity', severity);
      formData.append('assigned_to', assignedTo.trim());

      if (imageUri) {
        const filename = imageUri.split('/').pop() || 'photo.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        formData.append('image', {
          uri: Platform.OS === 'android' ? imageUri : imageUri.replace('file://', ''),
          name: filename,
          type,
        } as any);
      }

      const res = await submitIncident(formData);
      if (res.status === 200 || res.status === 201) {
        Alert.alert('Success', 'Audit report submitted successfully.');
        setDescription('');
        setLocation('');
        setSeverity('Medium');
        setAssignedTo('');
        setImageUri(null);
      }
    } catch (error: any) {
      const detail = error?.response?.data?.detail;
      Alert.alert('Error', 'Submit failed: ' + (typeof detail === 'string' ? detail : error?.message));
    } finally {
      setSubmitting(false);
    }
  };

  const connected = serverStatus !== 'Disconnected';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.header}>Safety Audit Form</Text>
        <View style={styles.statusRow}>
          <View style={[styles.dot, { backgroundColor: connected ? theme.low : theme.high }]} />
          <Text style={styles.status}>{serverStatus}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Audit Section</Text>
          <View style={styles.scrollWrapper}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {SECTIONS.map((sec) => (
                <TouchableOpacity
                  key={sec}
                  style={[styles.sectionChip, selectedSection === sec && styles.selectedChip]}
                  onPress={() => setSelectedSection(sec)}
                >
                  <Text style={[styles.chipText, selectedSection === sec && styles.selectedChipText]}>
                    {sec}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <Text style={styles.label}>Severity Level</Text>
          <View style={styles.severityContainer}>
            {['Low', 'Medium', 'High'].map((level) => {
              const active = severity === level;
              return (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.severityChip,
                    active && { backgroundColor: severityColor(level), borderColor: severityColor(level) },
                  ]}
                  onPress={() => setSeverity(level)}
                >
                  <Text style={[styles.severityChipText, active && styles.selectedSeverityChipText]}>
                    {level}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.label}>Location / Department</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Warehouse B"
            placeholderTextColor={theme.textFaint}
            value={location}
            onChangeText={setLocation}
          />

          <Text style={styles.label}>Responsible Person</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., John Doe"
            placeholderTextColor={theme.textFaint}
            value={assignedTo}
            onChangeText={setAssignedTo}
          />

          <Text style={styles.label}>Issue Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe the issue..."
            placeholderTextColor={theme.textFaint}
            multiline
            numberOfLines={4}
            value={description}
            onChangeText={setDescription}
          />

          <TouchableOpacity style={styles.imageButton} onPress={pickImage} activeOpacity={0.85}>
            <Text style={styles.imageButtonText}>📷  Attach Photo Evidence</Text>
          </TouchableOpacity>

          {imageUri && (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: imageUri }} style={styles.imagePreview} />
              <TouchableOpacity onPress={() => setImageUri(null)}>
                <Text style={styles.removeText}>Remove photo</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            style={[styles.submitButton, submitting && { backgroundColor: theme.redDisabled }]}
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.85}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Submit Audit Report</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.bg },
  scrollContent: { padding: 16, paddingBottom: 40 },
  header: { fontSize: 24, fontWeight: '800', color: theme.text },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, marginBottom: 14 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  status: { fontSize: 12, color: theme.textMuted },

  card: {
    backgroundColor: theme.card,
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 4,
  },
  label: { fontSize: 13, fontWeight: '700', color: theme.text, marginTop: 14, marginBottom: 6 },

  scrollWrapper: { height: 46 },
  sectionChip: {
    paddingHorizontal: 16, backgroundColor: theme.chipBg, borderRadius: 20,
    marginRight: 8, height: 38, justifyContent: 'center',
  },
  selectedChip: { backgroundColor: theme.red },
  chipText: { fontSize: 13, color: theme.textMuted },
  selectedChipText: { color: '#ffffff', fontWeight: '700' },

  severityContainer: { flexDirection: 'row', gap: 10 },
  severityChip: {
    flex: 1, paddingVertical: 11, backgroundColor: theme.chipBg, borderRadius: 12,
    alignItems: 'center', borderWidth: 1, borderColor: theme.border,
  },
  severityChipText: { fontSize: 13, color: theme.textMuted, fontWeight: '600' },
  selectedSeverityChipText: { color: '#ffffff', fontWeight: '700' },

  input: {
    backgroundColor: theme.inputBg, borderRadius: 12, paddingHorizontal: 14,
    paddingVertical: 13, fontSize: 15, color: theme.text,
  },
  textArea: { height: 100, textAlignVertical: 'top' },

  imageButton: {
    backgroundColor: theme.text, paddingVertical: 13, borderRadius: 12,
    alignItems: 'center', marginTop: 20,
  },
  imageButtonText: { color: '#ffffff', fontWeight: '600' },
  imagePreviewContainer: { marginTop: 12, alignItems: 'center' },
  imagePreview: { width: 160, height: 160, borderRadius: 12 },
  removeText: { color: theme.red, fontSize: 12, fontWeight: '600', marginTop: 6 },

  submitButton: {
    backgroundColor: theme.red, paddingVertical: 15, borderRadius: 12, alignItems: 'center',
    marginTop: 22, shadowColor: theme.red, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25, shadowRadius: 10, elevation: 4,
  },
  submitButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
});