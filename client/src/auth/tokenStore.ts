import * as SecureStore from 'expo-secure-store';

const KEY = 'ehs_access_token';

export const getToken = () => SecureStore.getItemAsync(KEY);
export const saveToken = (token: string) => SecureStore.setItemAsync(KEY, token);
export const clearToken = () => SecureStore.deleteItemAsync(KEY);