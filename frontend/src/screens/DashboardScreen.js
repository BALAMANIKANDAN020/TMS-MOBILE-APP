import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import axios from '../api/axios';
import { useTheme } from '../context/ThemeContext';

const fontRegular = Platform.select({ ios: 'System', android: 'sans-serif' });
const fontMedium = Platform.select({ ios: 'System', android: 'sans-serif-medium' });

const DashboardScreen = ({ navigation }) => {
  const { isDarkMode, toggleTheme } = useTheme();
  const [stats, setStats] = useState({ total: 0, pending: 0, assigned: 0, completed: 0, closed: 0 });
  const [counts, setCounts] = useState({ departments: 5, programmes: 10, blocks: 10, rooms: 30 });
  const [role, setRole] = useState('');
  const [userName, setUserName] = useState('User');
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const userRole = await AsyncStorage.getItem('role');
      const userObjStr = await AsyncStorage.getItem('user');
      if (userObjStr) {
        const userObj = JSON.parse(userObjStr);
        setUserName(userObj.name || 'User');
      }
      setRole(userRole || '');
      
      const res = await axios.get('/complaints/dashboard');
      setStats(res.data);

      if (userRole === 'Superadmin') {
        try {
          const [dRes, pRes, bRes, rRes] = await Promise.all([
            axios.get('/master/departments'),
            axios.get('/master/programmes'),
            axios.get('/master/blocks'),
            axios.get('/master/rooms')
          ]);
          setCounts({
            departments: dRes.data.length,
            programmes: pRes.data.length,
            blocks: bRes.data.length,
            rooms: rRes.data.length
          });
        } catch (mErr) {
          console.log('Error fetching master counts:', mErr);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStats();
    const unsubscribe = navigation.addListener('focus', () => {
      fetchStats();
    });
    return unsubscribe;
  }, [navigation]);

  const onRefresh = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    fetchStats().then(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setRefreshing(false);
    });
  }, []);

  const isSuperadmin = role === 'Superadmin';
  const isUser = role === 'User';
  const isStaff = !isSuperadmin && !isUser;

  return (
    <ScrollView 
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#818cf8" />}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Top Greeting Card (Matching Screenshot) */}
      <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.headerCard}>
        <View style={{ flex: 1, paddingRight: 10 }}>
          <Text style={styles.greetingTitle}>
            <Text style={styles.greetingHello}>Hello, </Text>
            <Text style={styles.greetingName}>{userName.toUpperCase()}</Text>
          </Text>
          <Text style={styles.greetingSub}>Here's an overview of your TMS system today.</Text>
        </View>

        <TouchableOpacity 
          onPress={() => {
            Haptics.selectionAsync();
            toggleTheme();
          }} 
          style={styles.themeToggleBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="sunny" size={22} color="#a855f7" />
        </TouchableOpacity>
      </Animated.View>

      {/* 2. Overview Section Header */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Overview</Text>
      </View>

      {/* 3. The 5 Color Stat Cards (Matching Screenshot) */}
      <Animated.View entering={FadeInDown.delay(200).duration(600)}>
        {/* Row 1: TOTAL COMPLAINTS & PENDING */}
        <View style={styles.gridRow}>
          {/* TOTAL COMPLAINTS (Indigo Card) */}
          <TouchableOpacity 
            activeOpacity={0.85}
            style={[styles.statCardHalf, { backgroundColor: '#1d1b3d' }]}
            onPress={() => {
              Haptics.selectionAsync();
              navigation.navigate('ComplaintsList', { filterStatus: 'All' });
            }}
          >
            <View style={styles.cardTopRow}>
              <View style={[styles.iconBox, { backgroundColor: '#4338ca' }]}>
                <Ionicons name="copy-outline" size={20} color="#ffffff" />
              </View>
              <View style={[styles.arrowCircle, { backgroundColor: '#818cf8' }]}>
                <Ionicons name="arrow-forward" size={13} color="#1d1b3d" />
              </View>
            </View>
            <Text style={styles.cardLargeNumber}>{stats.total || 0}</Text>
            <Text style={[styles.cardTagLabel, { color: '#818cf8' }]}>TOTAL COMPLAINTS</Text>
          </TouchableOpacity>

          {/* PENDING (Dark Amber Card) */}
          <TouchableOpacity 
            activeOpacity={0.85}
            style={[styles.statCardHalf, { backgroundColor: '#3d1d05' }]}
            onPress={() => {
              Haptics.selectionAsync();
              navigation.navigate('ComplaintsList', { filterStatus: 'Pending' });
            }}
          >
            <View style={styles.cardTopRow}>
              <View style={[styles.iconBox, { backgroundColor: '#d97706' }]}>
                <Ionicons name="time-outline" size={20} color="#ffffff" />
              </View>
              <View style={[styles.arrowCircle, { backgroundColor: '#f59e0b' }]}>
                <Ionicons name="arrow-forward" size={13} color="#3d1d05" />
              </View>
            </View>
            <Text style={styles.cardLargeNumber}>{stats.pending || 0}</Text>
            <Text style={[styles.cardTagLabel, { color: '#fbbf24' }]}>PENDING</Text>
          </TouchableOpacity>
        </View>

        {/* Row 2: ASSIGNED & COMPLETED */}
        <View style={styles.gridRow}>
          {/* ASSIGNED (Rust / Burnt Orange Card) */}
          <TouchableOpacity 
            activeOpacity={0.85}
            style={[styles.statCardHalf, { backgroundColor: '#3e1507' }]}
            onPress={() => {
              Haptics.selectionAsync();
              navigation.navigate('ComplaintsList', { filterStatus: 'Assigned' });
            }}
          >
            <View style={styles.cardTopRow}>
              <View style={[styles.iconBox, { backgroundColor: '#ea580c' }]}>
                <Ionicons name="person-outline" size={20} color="#ffffff" />
              </View>
              <View style={[styles.arrowCircle, { backgroundColor: '#f97316' }]}>
                <Ionicons name="arrow-forward" size={13} color="#3e1507" />
              </View>
            </View>
            <Text style={styles.cardLargeNumber}>{stats.assigned || 0}</Text>
            <Text style={[styles.cardTagLabel, { color: '#fb923c' }]}>ASSIGNED</Text>
          </TouchableOpacity>

          {/* COMPLETED (Dark Forest Green Card) */}
          <TouchableOpacity 
            activeOpacity={0.85}
            style={[styles.statCardHalf, { backgroundColor: '#043220' }]}
            onPress={() => {
              Haptics.selectionAsync();
              navigation.navigate('ComplaintsList', { filterStatus: 'Completed' });
            }}
          >
            <View style={styles.cardTopRow}>
              <View style={[styles.iconBox, { backgroundColor: '#10b981' }]}>
                <Ionicons name="checkmark-circle-outline" size={20} color="#ffffff" />
              </View>
              <View style={[styles.arrowCircle, { backgroundColor: '#34d399' }]}>
                <Ionicons name="arrow-forward" size={13} color="#043220" />
              </View>
            </View>
            <Text style={styles.cardLargeNumber}>{stats.completed || 0}</Text>
            <Text style={[styles.cardTagLabel, { color: '#86efac' }]}>COMPLETED</Text>
          </TouchableOpacity>
        </View>

        {/* Row 3: CLOSED COMPLAINTS (Full Width Navy/Slate Card) */}
        <TouchableOpacity 
          activeOpacity={0.85}
          style={[styles.statCardFull, { backgroundColor: '#1e293b' }]}
          onPress={() => {
            Haptics.selectionAsync();
            navigation.navigate('ComplaintsList', { filterStatus: 'Closed' });
          }}
        >
          <View style={styles.cardTopRow}>
            <View style={[styles.iconBox, { backgroundColor: '#475569' }]}>
              <Ionicons name="lock-closed-outline" size={20} color="#ffffff" />
            </View>
            <View style={[styles.arrowCircle, { backgroundColor: '#64748b' }]}>
              <Ionicons name="arrow-forward" size={13} color="#1e293b" />
            </View>
          </View>
          <Text style={styles.cardLargeNumber}>{stats.closed || 0}</Text>
          <Text style={[styles.cardTagLabel, { color: '#94a3b8' }]}>CLOSED COMPLAINTS</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* 4. ROLE-BASED DASHBOARD SECTION (MATCHING NAVBAR) */}

      {/* SUPERADMIN: Quick Management */}
      {isSuperadmin && (
        <Animated.View entering={FadeInDown.delay(300).duration(600)} style={{ marginTop: 24 }}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Quick Management</Text>
          </View>

          <TouchableOpacity 
            style={styles.roleActionCard}
            onPress={() => navigation.navigate('ComplaintsList')}
            activeOpacity={0.8}
          >
            <View style={[styles.roleActionIcon, { backgroundColor: 'rgba(99, 102, 241, 0.2)' }]}>
              <Ionicons name="list" size={24} color="#818cf8" />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={styles.roleActionTitle}>All Complaints List</Text>
              <Text style={styles.roleActionSub}>Assign, track, and manage all campus tickets</Text>
            </View>
            <Ionicons name="arrow-forward-circle" size={24} color="#818cf8" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.roleActionCard}
            onPress={() => navigation.navigate('Reports')}
            activeOpacity={0.8}
          >
            <View style={[styles.roleActionIcon, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
              <Ionicons name="bar-chart" size={24} color="#34d399" />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={styles.roleActionTitle}>Reports & Summary</Text>
              <Text style={styles.roleActionSub}>System-wide ticket resolution reports</Text>
            </View>
            <Ionicons name="arrow-forward-circle" size={24} color="#34d399" />
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* USER: Quick Actions */}
      {isUser && (
        <Animated.View entering={FadeInDown.delay(300).duration(600)} style={{ marginTop: 24 }}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
          </View>

          <TouchableOpacity 
            style={styles.roleActionCard}
            onPress={() => navigation.navigate('RaiseComplaint')}
            activeOpacity={0.8}
          >
            <View style={[styles.roleActionIcon, { backgroundColor: 'rgba(99, 102, 241, 0.2)' }]}>
              <Ionicons name="add-circle" size={24} color="#818cf8" />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={styles.roleActionTitle}>Raise New Complaint</Text>
              <Text style={styles.roleActionSub}>Register hardware, electrical, or plumbing issues</Text>
            </View>
            <Ionicons name="arrow-forward-circle" size={24} color="#818cf8" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.roleActionCard}
            onPress={() => navigation.navigate('ComplaintsList')}
            activeOpacity={0.8}
          >
            <View style={[styles.roleActionIcon, { backgroundColor: 'rgba(168, 85, 247, 0.2)' }]}>
              <Ionicons name="list" size={24} color="#c084fc" />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={styles.roleActionTitle}>My Complaints List</Text>
              <Text style={styles.roleActionSub}>Track status and technician updates</Text>
            </View>
            <Ionicons name="arrow-forward-circle" size={24} color="#c084fc" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.roleActionCard}
            onPress={() => navigation.navigate('Reports')}
            activeOpacity={0.8}
          >
            <View style={[styles.roleActionIcon, { backgroundColor: 'rgba(45, 212, 191, 0.2)' }]}>
              <Ionicons name="bar-chart" size={24} color="#2dd4bf" />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={styles.roleActionTitle}>Reports & Summary</Text>
              <Text style={styles.roleActionSub}>View ticket progress and resolution history</Text>
            </View>
            <Ionicons name="arrow-forward-circle" size={24} color="#2dd4bf" />
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* STAFF: Service Work Queue */}
      {isStaff && (
        <Animated.View entering={FadeInDown.delay(300).duration(600)} style={{ marginTop: 24 }}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Your Service Queue</Text>
          </View>

          <TouchableOpacity 
            style={styles.roleActionCard}
            onPress={() => navigation.navigate('ComplaintsList', { filterStatus: 'Assigned' })}
            activeOpacity={0.8}
          >
            <View style={[styles.roleActionIcon, { backgroundColor: 'rgba(234, 88, 12, 0.2)' }]}>
              <Ionicons name="construct" size={24} color="#fb923c" />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={styles.roleActionTitle}>Assigned Work Queue</Text>
              <Text style={styles.roleActionSub}>Open pending repair and maintenance tickets</Text>
            </View>
            <Ionicons name="arrow-forward-circle" size={24} color="#fb923c" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.roleActionCard}
            onPress={() => navigation.navigate('ComplaintsList', { filterStatus: 'Completed' })}
            activeOpacity={0.8}
          >
            <View style={[styles.roleActionIcon, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
              <Ionicons name="checkmark-done-circle" size={24} color="#34d399" />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={styles.roleActionTitle}>Completed History</Text>
              <Text style={styles.roleActionSub}>Review tasks you have marked completed</Text>
            </View>
            <Ionicons name="arrow-forward-circle" size={24} color="#34d399" />
          </TouchableOpacity>
        </Animated.View>
      )}

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { 
    padding: 16, 
    backgroundColor: '#090a0f', 
    paddingBottom: 40 
  },
  
  // Top Greeting Card
  headerCard: {
    padding: 20,
    backgroundColor: '#121422',
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#1e2438',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4
  },
  greetingTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 6,
    fontFamily: fontMedium,
    letterSpacing: 0.3
  },
  greetingHello: {
    color: '#a855f7',
    fontWeight: 'bold',
    fontFamily: fontMedium
  },
  greetingName: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontFamily: fontMedium
  },
  greetingSub: {
    fontSize: 13,
    color: '#94a3b8',
    fontFamily: fontRegular,
    lineHeight: 18
  },
  themeToggleBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)'
  },

  // Section Header
  sectionHeaderRow: {
    marginBottom: 14
  },
  sectionTitle: {
    fontSize: 18,
    color: '#f8fafc',
    fontWeight: '700',
    letterSpacing: 0.3,
    fontFamily: fontMedium
  },

  // 5 Color Cards Grid
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  statCardHalf: {
    width: '48.2%',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4
  },
  statCardFull: {
    width: '100%',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  arrowCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center'
  },
  cardLargeNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 14,
    marginBottom: 4,
    fontFamily: fontMedium
  },
  cardTagLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    fontFamily: fontMedium
  },

  // Masters Grid (Superadmin)
  mastersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  masterTile: {
    width: '48.2%',
    backgroundColor: '#0f172a',
    padding: 14,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1e293b'
  },
  tileHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  tileIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center'
  },
  tileTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 3,
    fontFamily: fontMedium
  },
  tileSub: {
    fontSize: 11,
    color: '#64748b',
    fontFamily: fontRegular
  },

  // Role Action Cards (User & Staff)
  roleActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1e293b'
  },
  roleActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  roleActionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 3,
    fontFamily: fontMedium
  },
  roleActionSub: {
    fontSize: 12,
    color: '#94a3b8',
    fontFamily: fontRegular
  }
});

export default DashboardScreen;