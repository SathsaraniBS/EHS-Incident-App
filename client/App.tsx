import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import { FormScreen } from './src/screens/FormScreen';
import { ReportsScreen } from './src/screens/ReportsScreen';
import LoginScreen from './src/screens/LoginScreen';
import { getToken, clearToken } from './src/auth/tokenStore';
import { setUnauthorizedHandler } from './src/api/incidentApi';

const Tab = createBottomTabNavigator();

function TabNavigator({ onLogout }: { onLogout: () => void }) {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#475569',
        tabBarStyle: {
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          paddingTop: 8,
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#cbd5e1',
          elevation: 10,
        },
        tabBarLabelStyle: { fontSize: 13, fontWeight: '700' },
      }}
    >
      <Tab.Screen
        name="Submit"
        component={FormScreen}
        options={{
          tabBarLabel: 'New Audit',
          tabBarIcon: () => <Text style={{ fontSize: 18 }}>📝</Text>,
        }}
      />
      <Tab.Screen
        name="Reports"
        component={ReportsScreen}
        options={{
          tabBarLabel: 'Reports List',
          tabBarIcon: () => <Text style={{ fontSize: 18 }}>📋</Text>,
        }}
      />
      <Tab.Screen
        name="Logout"
        component={LogoutScreen}
        initialParams={{ onLogout }}
        options={{
          tabBarLabel: 'Sign Out',
          tabBarIcon: () => <Text style={{ fontSize: 18 }}>🚪</Text>,
        }}
      />
    </Tab.Navigator>
  );
}

function LogoutScreen({ route }: any) {
  return (
    <View style={styles.center}>
      <TouchableOpacity style={styles.logoutButton} onPress={route.params.onLogout}>
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function App() {
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    getToken().then((t) => setAuthed(!!t));
    // any 401 from the API sends the user back to the login screen
    setUnauthorizedHandler(() => setAuthed(false));
  }, []);

  const handleLogout = async () => {
    await clearToken();
    setAuthed(false);
  };

  if (authed === null) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      {authed ? (
        <NavigationContainer>
          <TabNavigator onLogout={handleLogout} />
        </NavigationContainer>
      ) : (
        <LoginScreen onLoginSuccess={() => setAuthed(true)} />
      )}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  logoutButton: { backgroundColor: '#dc2626', paddingVertical: 14, paddingHorizontal: 32, borderRadius: 8 },
  logoutText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
});