import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';

const HomeScreen = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const [userName, setUserName] = useState('User');
  const [role, setRole] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      const userObjStr = await AsyncStorage.getItem('user');
      const userRole = await AsyncStorage.getItem('role');
      if (userObjStr) {
        const userObj = JSON.parse(userObjStr);
        setUserName(userObj.name || 'User');
      }
      setRole(userRole);
    };
    
    fetchUser();
    const unsubscribe = navigation.addListener('focus', () => {
      fetchUser();
    });
    
    return unsubscribe;
  }, [navigation]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}>
      {/* Welcome Banner */}
      <Animated.View entering={FadeInDown.delay(100).duration(800)}>
        <LinearGradient 
          colors={isDarkMode ? ['#1e1b4b', '#312e81'] : ['#4f46e5', '#6366f1']}
          style={styles.bannerContainer}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.bannerContent}>
            <Text style={styles.greetingText}>{getGreeting()},</Text>
            <Text style={styles.userNameText}>{userName}</Text>
            <Text style={styles.welcomeSubText}>Welcome to Complaint Management System</Text>
          </View>
          <Ionicons name="apps-outline" size={80} color="rgba(255,255,255,0.2)" style={styles.bannerIcon} />
        </LinearGradient>
      </Animated.View>

      <Animated.Text entering={FadeInDown.delay(200).duration(800)} style={[styles.sectionTitle, { color: theme.text }]}>
        Quick Actions
      </Animated.Text>

      <View style={styles.actionsGrid}>
        
        {/* Action 1: Dashboard */}
        <Animated.View entering={ZoomIn.delay(300).duration(600)} style={styles.actionCardWrapper}>
          <TouchableOpacity 
            style={[styles.actionCard, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => {
              Haptics.selectionAsync();
              navigation.navigate('DashboardScreen');
            }}
          >
            <View style={[styles.iconCircle, { backgroundColor: '#3b82f620' }]}>
              <Ionicons name="grid" size={28} color="#3b82f6" />
            </View>
            <Text style={[styles.actionTitle, { color: theme.text }]}>Dashboard</Text>
            <Text style={[styles.actionSub, { color: theme.textMuted }]}>View statistics</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Action 2: Complaints List */}
        <Animated.View entering={ZoomIn.delay(400).duration(600)} style={styles.actionCardWrapper}>
          <TouchableOpacity 
            style={[styles.actionCard, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => {
              Haptics.selectionAsync();
              navigation.navigate('ComplaintsList');
            }}
          >
            <View style={[styles.iconCircle, { backgroundColor: '#10b98120' }]}>
              <Ionicons name="list" size={28} color="#10b981" />
            </View>
            <Text style={[styles.actionTitle, { color: theme.text }]}>Complaints</Text>
            <Text style={[styles.actionSub, { color: theme.textMuted }]}>Manage tickets</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Action 3: Raise Complaint (Only for User/Staff) */}
        {role === 'User' && (
          <Animated.View entering={ZoomIn.delay(500).duration(600)} style={styles.actionCardWrapper}>
            <TouchableOpacity 
              style={[styles.actionCard, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => {
                Haptics.selectionAsync();
                navigation.navigate('RaiseComplaint');
              }}
            >
              <View style={[styles.iconCircle, { backgroundColor: '#f59e0b20' }]}>
                <Ionicons name="add-circle" size={28} color="#f59e0b" />
              </View>
              <Text style={[styles.actionTitle, { color: theme.text }]}>Raise Ticket</Text>
              <Text style={[styles.actionSub, { color: theme.textMuted }]}>New complaint</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Action 4: Profile */}
        <Animated.View entering={ZoomIn.delay(600).duration(600)} style={styles.actionCardWrapper}>
          <TouchableOpacity 
            style={[styles.actionCard, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => {
              Haptics.selectionAsync();
              navigation.navigate('Profile');
            }}
          >
            <View style={[styles.iconCircle, { backgroundColor: '#8b5cf620' }]}>
              <Ionicons name="person" size={28} color="#8b5cf6" />
            </View>
            <Text style={[styles.actionTitle, { color: theme.text }]}>My Profile</Text>
            <Text style={[styles.actionSub, { color: theme.textMuted }]}>View details</Text>
          </TouchableOpacity>
        </Animated.View>

      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20 },
  bannerContainer: {
    padding: 30,
    borderRadius: 24,
    marginBottom: 30,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10
  },
  bannerContent: { zIndex: 1 },
  greetingText: { fontSize: 16, color: 'rgba(255,255,255,0.8)', marginBottom: 5, letterSpacing: 1 },
  userNameText: { fontSize: 28, color: '#fff', fontWeight: 'bold', marginBottom: 10 },
  welcomeSubText: { fontSize: 14, color: 'rgba(255,255,255,0.9)', lineHeight: 20 },
  bannerIcon: { position: 'absolute', right: -10, bottom: -10, zIndex: 0 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, marginLeft: 5 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  actionCardWrapper: { width: '48%', marginBottom: 15 },
  actionCard: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    height: 160,
    justifyContent: 'center'
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15
  },
  actionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
  actionSub: { fontSize: 12, textAlign: 'center' }
});

export default HomeScreen;
