import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

import Constants from 'expo-constants';

// Dynamically get the IP address of the Expo dev server
const debuggerHost = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost || Constants.manifest2?.extra?.expoGo?.debuggerHost;
const localIp = debuggerHost ? debuggerHost.split(':')[0] : '10.11.28.41';

const instance = axios.create({
  baseURL: `http://${localIp}:5000/api`,
  headers: {
    'Content-Type': 'application/json'
  }
});

instance.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (err) => Promise.reject(err)
);

export default instance;