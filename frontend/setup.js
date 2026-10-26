const fs = require('fs');
const path = require('path');

const dirs = [
    'src', 'src/api', 'src/screens', 'src/navigation', 'src/components'
];

dirs.forEach(dir => fs.mkdirSync(path.join(__dirname, dir), { recursive: true }));

const files = {
    'package.json': `{
  "name": "frontend",
  "version": "1.0.0",
  "main": "node_modules/expo/AppEntry.js",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web"
  },
  "dependencies": {
    "expo": "~51.0.28",
    "expo-status-bar": "~1.12.1",
    "react": "18.2.0",
    "react-native": "0.74.5",
    "@react-navigation/native": "^6.1.9",
    "@react-navigation/native-stack": "^6.9.17",
    "react-native-safe-area-context": "4.10.5",
    "react-native-screens": "3.31.1",
    "axios": "^1.6.2",
    "@react-native-async-storage/async-storage": "1.23.1"
  },
  "devDependencies": {
    "@babel/core": "^7.20.0"
  },
  "private": true
}`,
    'app.json': `{
  "expo": {
    "name": "frontend",
    "slug": "frontend",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "supportsTablet": true
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      }
    },
    "web": {
      "favicon": "./assets/favicon.png"
    }
  }
}`,
    'App.js': `import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import ComplaintRaiseScreen from './src/screens/ComplaintRaiseScreen';
import ComplaintListScreen from './src/screens/ComplaintListScreen';
import ReportScreen from './src/screens/ReportScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="RaiseComplaint" component={ComplaintRaiseScreen} options={{ title: 'Raise Complaint' }} />
        <Stack.Screen name="ComplaintsList" component={ComplaintListScreen} options={{ title: 'Complaints List' }} />
        <Stack.Screen name="Reports" component={ReportScreen} options={{ title: 'Reports' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}`,
    'src/api/axios.js': `import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const instance = axios.create({
  baseURL: 'http://10.0.2.2:5000/api' // Use your local IP or 10.0.2.2 for Android Emulator
});

instance.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = \`Bearer \${token}\`;
    }
    return config;
  },
  (err) => Promise.reject(err)
);

export default instance;`,
    'src/screens/LoginScreen.js': `import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from '../api/axios';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      const res = await axios.post('/auth/login', { email, password });
      await AsyncStorage.setItem('token', res.data.token);
      await AsyncStorage.setItem('role', res.data.role);
      await AsyncStorage.setItem('user', JSON.stringify(res.data.user));
      navigation.replace('Dashboard');
    } catch (err) {
      Alert.alert('Error', 'Invalid Credentials');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>CMS Login</Text>
      <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
      <Button title="Login" onPress={handleLogin} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 15, borderRadius: 5 }
});

export default LoginScreen;`,
    'src/screens/DashboardScreen.js': `import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Button, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from '../api/axios';

const DashboardScreen = ({ navigation }) => {
  const [stats, setStats] = useState({ total: 0, pending: 0, assigned: 0, closed: 0 });
  const [role, setRole] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const userRole = await AsyncStorage.getItem('role');
        setRole(userRole);
        const res = await axios.get('/complaints/dashboard');
        setStats(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchStats();
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.clear();
    navigation.replace('Login');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Dashboard</Text>
      
      <View style={styles.card}><Text>Total Complaints: {stats.total}</Text></View>
      <View style={styles.card}><Text>Pending: {stats.pending}</Text></View>
      <View style={styles.card}><Text>Assigned: {stats.assigned}</Text></View>
      <View style={styles.card}><Text>Closed: {stats.closed}</Text></View>

      <View style={styles.btnContainer}>
        <Button title="View Complaints" onPress={() => navigation.navigate('ComplaintsList')} />
      </View>
      
      {(role === 'Superadmin' || role === 'User') && (
        <View style={styles.btnContainer}>
          <Button title="Raise Complaint" onPress={() => navigation.navigate('RaiseComplaint')} color="green" />
        </View>
      )}

      {role === 'Superadmin' && (
        <View style={styles.btnContainer}>
          <Button title="Reports" onPress={() => navigation.navigate('Reports')} color="purple" />
        </View>
      )}

      <View style={styles.btnContainer}>
        <Button title="Logout" onPress={handleLogout} color="red" />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  card: { padding: 15, backgroundColor: '#f0f0f0', marginBottom: 10, borderRadius: 5 },
  btnContainer: { marginVertical: 10 }
});

export default DashboardScreen;`,
    'src/screens/ComplaintRaiseScreen.js': `import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ScrollView, Alert } from 'react-native';
import axios from '../api/axios';

const ComplaintRaiseScreen = ({ navigation }) => {
  const [blocks, setBlocks] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [selectedBlock, setSelectedBlock] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');
  const [type, setType] = useState('');
  const [remarks, setRemarks] = useState('');

  useEffect(() => {
    // Fetch blocks
    axios.get('/master/blocks').then(res => setBlocks(res.data)).catch(err => console.log(err));
    // Fetch rooms
    axios.get('/master/rooms').then(res => setRooms(res.data)).catch(err => console.log(err));
  }, []);

  const handleSubmit = async () => {
    if (!selectedBlock || !selectedRoom || !type || !remarks) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    try {
      await axios.post('/complaints', { block: selectedBlock, room: selectedRoom, type, remarks });
      Alert.alert('Success', 'Complaint raised successfully');
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', 'Could not raise complaint');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.label}>Block</Text>
      <TextInput style={styles.input} placeholder="Block ID (demo)" value={selectedBlock} onChangeText={setSelectedBlock} />
      
      <Text style={styles.label}>Room</Text>
      <TextInput style={styles.input} placeholder="Room ID (demo)" value={selectedRoom} onChangeText={setSelectedRoom} />

      <Text style={styles.label}>Complaint Type</Text>
      <TextInput style={styles.input} placeholder="e.g., PC Hardware, Network..." value={type} onChangeText={setType} />

      <Text style={styles.label}>Remarks</Text>
      <TextInput style={styles.input} placeholder="Description" value={remarks} onChangeText={setRemarks} multiline />

      <Button title="Submit Complaint" onPress={handleSubmit} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20 },
  label: { fontWeight: 'bold', marginTop: 10 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginVertical: 5, borderRadius: 5 }
});

export default ComplaintRaiseScreen;`,
    'src/screens/ComplaintListScreen.js': `import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Button } from 'react-native';
import axios from '../api/axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ComplaintListScreen = () => {
  const [complaints, setComplaints] = useState([]);
  const [role, setRole] = useState('');

  useEffect(() => {
    fetchComplaints();
    AsyncStorage.getItem('role').then(setRole);
  }, []);

  const fetchComplaints = async () => {
    try {
      const res = await axios.get('/complaints');
      setComplaints(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      await axios.put(\`/complaints/\${id}\`, { status: newStatus });
      fetchComplaints();
    } catch (err) {
      console.log(err);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.title}>{item.type}</Text>
      <Text>Status: {item.status}</Text>
      <Text>Remarks: {item.remarks}</Text>
      {item.status === 'Assigned' && role !== 'User' && role !== 'Superadmin' && (
        <Button title="Mark Completed" onPress={() => updateStatus(item._id, 'Completed')} />
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList data={complaints} keyExtractor={item => item._id} renderItem={renderItem} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10 },
  card: { padding: 15, backgroundColor: '#fff', marginBottom: 10, borderRadius: 5, elevation: 2 },
  title: { fontWeight: 'bold', fontSize: 16, marginBottom: 5 }
});

export default ComplaintListScreen;`,
    'src/screens/ReportScreen.js': `import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, FlatList } from 'react-native';
import axios from '../api/axios';

const ReportScreen = () => {
  const [reports, setReports] = useState([]);

  const fetchReports = async () => {
    try {
      const res = await axios.get('/reports');
      setReports(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Text>Type: {item.type}</Text>
      <Text>Status: {item.status}</Text>
      <Text>Remarks: {item.remarks}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Button title="Generate Complaint Details Report" onPress={fetchReports} />
      <FlatList 
        data={reports} 
        keyExtractor={item => item._id} 
        renderItem={renderItem} 
        contentContainerStyle={{ marginTop: 10 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  card: { padding: 10, borderBottomWidth: 1, borderColor: '#ccc' }
});

export default ReportScreen;`
};

for (const [filename, content] of Object.entries(files)) {
    fs.writeFileSync(path.join(__dirname, filename), content);
}
console.log('Frontend files generated.');
