import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Image, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { SECTIONS } from '../constants/sections';
import { checkServerHealth, submitIncident } from '../api/incidentApi';

export function FormScreen() {
  const [selectedSection, setSelectedSection] = useState<string>(SECTIONS[0]);
  const [description, setDescription] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [severity, setSeverity] = useState<string>('Medium');
  const [assignedTo, setAssignedTo] = useState<string>(''); // Responsible Person State එක එකතු කිරීම
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [serverStatus, setServerStatus] = useState<string>('Checking...');

  useEffect(() => {
    checkServerHealth()
      .then((res) => setServerStatus(res.message || 'Connected'))
      .catch(() => setServerStatus('Disconnected'));
  }, []);

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Permission Required", "Permission to access camera roll is required!");
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!description || !location) {
      Alert.alert("Error", "Please fill in all required fields!");
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('section', selectedSection);
      formData.append('description', description);
      formData.append('location', location);
      formData.append('severity', severity);
      formData.append('assigned_to', assignedTo); // Responsible Person Backend එකට යැවීම

      if (imageUri) {
        const filename = imageUri.split('/').pop() || 'photo.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;

        formData.append('image', {
          uri: Platform.OS === 'android' ? imageUri : imageUri.replace('file://', ''),
          name: filename,
          type,
        } as any);
      }

      const res = await submitIncident(formData);
      if (res.status === 200 || res.status === 201) {
        Alert.alert("Success", "Audit Report Submitted Successfully!");
        setDescription('');
        setLocation('');
        setSeverity('Medium');
        setAssignedTo('');
        setImageUri(null);
      }
    } catch (error: any) {
      Alert.alert("Error", "Submit failed: " + (error?.response?.data?.detail || error?.message));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.header}>Safety Audit Form</Text>
        <Text style={styles.status}>Status: {serverStatus}</Text>

        <Text style={styles.label}>Select Audit Section:</Text>
        <View style={styles.scrollWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {SECTIONS.map((sec, index) => (
              <TouchableOpacity
                key={index}
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

        {/* Severity Selection UI */}
        <Text style={styles.label}>Severity Level:</Text>
        <View style={styles.severityContainer}>
          {['Low', 'Medium', 'High'].map((level) => (
            <TouchableOpacity
              key={level}
              style={[
                styles.severityChip,
                severity === level && styles.selectedSeverityChip,
                level === 'High' && severity === level && styles.highSeverityChip,
              ]}
              onPress={() => setSeverity(level)}
            >
              <Text style={[styles.severityChipText, severity === level && styles.selectedSeverityChipText]}>
                {level}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Location / Department:</Text>
        <TextInput 
          style={styles.input} 
          placeholder="e.g., Warehouse B" 
          value={location} 
          onChangeText={setLocation} 
        />

        {/* Responsible Person Input UI */}
        <Text style={styles.label}>Responsible Person:</Text>
        <TextInput 
          style={styles.input} 
          placeholder="e.g., John Doe" 
          value={assignedTo} 
          onChangeText={setAssignedTo} 
        />

        <Text style={styles.label}>Finding / Description:</Text>
        <TextInput 
          style={[styles.input, styles.textArea]} 
          multiline 
          numberOfLines={4} 
          value={description} 
          onChangeText={setDescription} 
        />

        <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
          <Text style={styles.imageButtonText}>📷 Attach Photo Evidence</Text>
        </TouchableOpacity>

        {imageUri && (
          <View style={styles.imagePreviewContainer}>
            <Image source={{ uri: imageUri }} style={styles.imagePreview} />
          </View>
        )}

        <TouchableOpacity 
          style={[styles.submitButton, submitting && styles.disabledButton]} 
          onPress={handleSubmit} 
          disabled={submitting}
        >
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Submit Audit Report</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  header: { fontSize: 22, fontWeight: 'bold', color: '#1e293b' },
  status: { fontSize: 12, color: '#16a34a', marginBottom: 15 },
  label: { fontSize: 14, fontWeight: '600', color: '#334155', marginTop: 12 },
  scrollWrapper: { height: 48, marginBottom: 10 },
  sectionChip: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#e2e8f0', borderRadius: 20, marginRight: 8, height: 38, justifyContent: 'center' },
  selectedChip: { backgroundColor: '#2563eb' },
  chipText: { fontSize: 13, color: '#334155' },
  selectedChipText: { color: '#ffffff', fontWeight: 'bold' },
  
  // Severity Styles
  severityContainer: { flexDirection: 'row', gap: 10, marginTop: 4, marginBottom: 10 },
  severityChip: { flex: 1, paddingVertical: 10, backgroundColor: '#e2e8f0', borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#cbd5e1' },
  selectedSeverityChip: { backgroundColor: '#334155', borderColor: '#334155' },
  highSeverityChip: { backgroundColor: '#dc2626', borderColor: '#dc2626' },
  severityChipText: { fontSize: 13, color: '#334155', fontWeight: '600' },
  selectedSeverityChipText: { color: '#ffffff', fontWeight: 'bold' },

  input: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, padding: 12, marginTop: 4 },
  textArea: { height: 90, textAlignVertical: 'top' },
  imageButton: { backgroundColor: '#0284c7', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 15 },
  imageButtonText: { color: '#ffffff', fontWeight: '600' },
  imagePreviewContainer: { marginTop: 10, alignItems: 'center' },
  imagePreview: { width: 150, height: 150, borderRadius: 8 },
  submitButton: { backgroundColor: '#16a34a', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 25 },
  disabledButton: { backgroundColor: '#94a3b8' },
  submitButtonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
});