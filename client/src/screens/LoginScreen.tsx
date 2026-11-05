import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { login } from '../api/incidentApi';

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

const RED = '#e60012';
const RED_DISABLED = '#f08a93';
const INPUT_BG = '#e8f0fe';

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
      onLoginSuccess();
    } catch (e: any) {
      const detail = e?.response?.data?.detail;
      const message = !e?.response
        ? 'Cannot reach the server. Check your Wi-Fi and try again.'
        : typeof detail === 'string'
        ? detail
        : 'Login failed. Please try again.';
      Alert.alert('Login failed', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
            <Text style={styles.title}>Log in</Text>

            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="you@company.com"
              placeholderTextColor="#94a3b8"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="username"
            />

            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="Enter your password"
                placeholderTextColor="#94a3b8"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                textContentType="password"
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity
                style={styles.eye}
                onPress={() => setShowPassword((v) => !v)}
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
              >
                <Text style={styles.eyeText}>{showPassword ? '🙈' : '👁'}</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.hint}>Forgot password? Contact admin.</Text>

            <TouchableOpacity
              style={[styles.button, loading && { backgroundColor: RED_DISABLED }]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.buttonText}>Login</Text>
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.footer}>© 2026 Bondville (Pvt) Ltd. All rights reserved.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: '#fff8f8' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 5,
  },
  logo: { width: 90, height: 90, alignSelf: 'center', marginBottom: 4 },
  title: { fontSize: 26, fontWeight: '800', color: '#111827', textAlign: 'center', marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#1f2937', marginBottom: 6, marginTop: 4 },
  input: {
    backgroundColor: INPUT_BG,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111827',
  },
  passwordRow: { justifyContent: 'center' },
  passwordInput: { paddingRight: 48 },
  eye: { position: 'absolute', right: 12, padding: 6 },
  eyeText: { fontSize: 18 },
  hint: { fontSize: 12, color: '#475569', fontWeight: '600', textAlign: 'right', marginTop: 10, marginBottom: 18 },
  button: {
    backgroundColor: RED,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    shadowColor: RED,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  footer: { textAlign: 'center', color: '#94a3b8', fontSize: 11, marginTop: 24 },
});