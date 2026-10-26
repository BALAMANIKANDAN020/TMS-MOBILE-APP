import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  TextInput, 
  Alert, 
  Platform 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import axios from '../api/axios';
import { useTheme } from '../context/ThemeContext';

const fontRegular = Platform.select({ ios: 'System', android: 'sans-serif' });
const fontMedium = Platform.select({ ios: 'System', android: 'sans-serif-medium' });

const ProfileScreen = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const [user, setUser] = useState({});
  const [role, setRole] = useState('');
  
  const [modalVisible, setModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');

  const fetchProfile = async () => {
    const userStr = await AsyncStorage.getItem('user');
    const userRole = await AsyncStorage.getItem('role');
    if (userStr) {
      const u = JSON.parse(userStr);
      setUser(u);
      setEditName(u.name || '');
      setEditPhone(u.phone || '');
    }
    if (userRole) setRole(userRole);
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdate = async () => {
    try {
      const res = await axios.put('/auth/update-profile', { name: editName, phone: editPhone });
      const updatedUser = res.data.user;
      
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      setModalVisible(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (err) {
      console.log(err);
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      
      {/* 1. Header Card (Compact & Centered) */}
      <Animated.View 
        entering={FadeInDown.delay(80).duration(500)} 
        style={[styles.headerCard, { backgroundColor: theme.card, borderColor: theme.border }]}
      >
        <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
          <Text style={styles.avatarText}>{user.name ? user.name.charAt(0).toUpperCase() : 'U'}</Text>
        </View>
        <Text style={[styles.name, { color: theme.text }]}>{user.name || 'User Name'}</Text>
        <View style={[styles.roleBadge, { backgroundColor: theme.primary + '18', borderColor: theme.primary + '35' }]}>
          <Text style={[styles.roleText, { color: theme.primary }]}>{(role || 'ROLE').toUpperCase()}</Text>
        </View>
      </Animated.View>

      {/* 2. Grouped Account Details (Fits on Single Page) */}
      <Animated.View 
        entering={FadeInDown.delay(160).duration(500)} 
        style={[styles.groupedCard, { backgroundColor: theme.card, borderColor: theme.border }]}
      >
        {/* Name Row */}
        <View style={styles.infoRow}>
          <View style={[styles.iconBox, { backgroundColor: theme.primary + '15' }]}>
            <Ionicons name="person" size={17} color={theme.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.infoLabel, { color: theme.textMuted }]}>FULL NAME</Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>{user.name || 'Not provided'}</Text>
          </View>
        </View>

        <View style={[styles.rowDivider, { backgroundColor: theme.border }]} />

        {/* Email Row */}
        <View style={styles.infoRow}>
          <View style={[styles.iconBox, { backgroundColor: theme.secondary + '15' }]}>
            <Ionicons name="mail" size={17} color={theme.secondary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.infoLabel, { color: theme.textMuted }]}>EMAIL ADDRESS</Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>{user.email || 'Not provided'}</Text>
          </View>
        </View>

        <View style={[styles.rowDivider, { backgroundColor: theme.border }]} />

        {/* Phone Row */}
        <View style={styles.infoRow}>
          <View style={[styles.iconBox, { backgroundColor: '#10b98115' }]}>
            <Ionicons name="call" size={17} color="#10b981" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.infoLabel, { color: theme.textMuted }]}>PHONE NUMBER</Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>{user.phone || 'Not provided'}</Text>
          </View>
        </View>

        <View style={[styles.rowDivider, { backgroundColor: theme.border }]} />

        {/* Role Row */}
        <View style={styles.infoRow}>
          <View style={[styles.iconBox, { backgroundColor: '#f59e0b15' }]}>
            <Ionicons name="shield-checkmark" size={17} color="#f59e0b" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.infoLabel, { color: theme.textMuted }]}>SYSTEM ROLE</Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>{role || 'Role'}</Text>
          </View>
        </View>
      </Animated.View>

      {/* 3. Action Buttons (Edit Profile & Sign Out) */}
      <Animated.View entering={FadeInDown.delay(240).duration(500)} style={styles.actionsBox}>
        <TouchableOpacity 
          style={[styles.primaryBtn, { backgroundColor: theme.primary }]} 
          onPress={() => setModalVisible(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="create-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.primaryBtnText}>Edit Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.signOutBtn, { borderColor: theme.error, backgroundColor: theme.error + '12' }]} 
          onPress={async () => {
            await AsyncStorage.clear();
            navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={18} color={theme.error} style={{ marginRight: 8 }} />
          <Text style={[styles.signOutBtnText, { color: theme.error }]}>Sign Out</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Edit Profile Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Edit Profile</Text>
            
            <Text style={[styles.inputLabel, { color: theme.textMuted }]}>Full Name</Text>
            <TextInput
              style={[styles.input, { backgroundColor: isDarkMode ? '#27272a' : '#f4f4f5', color: theme.text, borderColor: theme.border }]}
              value={editName}
              onChangeText={setEditName}
            />

            <Text style={[styles.inputLabel, { color: theme.textMuted }]}>Phone Number</Text>
            <TextInput
              style={[styles.input, { backgroundColor: isDarkMode ? '#27272a' : '#f4f4f5', color: theme.text, borderColor: theme.border }]}
              value={editPhone}
              onChangeText={setEditPhone}
              keyboardType="phone-pad"
            />

            <View style={styles.actionRow}>
              <TouchableOpacity 
                style={[styles.modalBtn, { backgroundColor: isDarkMode ? '#27272a' : '#e4e4e7' }]} 
                onPress={() => setModalVisible(false)}
              >
                <Text style={{ color: theme.text, fontWeight: 'bold' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalBtn, { backgroundColor: theme.primary }]} 
                onPress={handleUpdate}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 16, 
    justifyContent: 'space-between'
  },
  headerCard: {
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 18,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  avatar: {
    width: 62,
    height: 62,
    borderRadius: 31,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 4,
  },
  avatarText: { fontSize: 26, color: '#fff', fontWeight: 'bold', fontFamily: fontMedium },
  name: { fontSize: 20, fontWeight: 'bold', fontFamily: fontMedium, marginBottom: 4 },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
  },
  roleText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8, fontFamily: fontMedium },
  
  // Grouped Card (Single Page layout)
  groupedCard: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
    marginVertical: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 2,
    fontFamily: fontMedium,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: fontRegular,
  },
  rowDivider: {
    height: 1,
    width: '100%',
    opacity: 0.6,
  },

  // Actions
  actionsBox: {
    marginTop: 4,
    marginBottom: 10,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: 'bold', fontFamily: fontMedium },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    marginTop: 10,
  },
  signOutBtnText: { fontSize: 15, fontWeight: 'bold', fontFamily: fontMedium },

  // Modal
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', padding: 20 },
  modalCard: { padding: 22, borderRadius: 18, borderWidth: 1 },
  modalTitle: { fontSize: 19, fontWeight: 'bold', marginBottom: 16, fontFamily: fontMedium },
  inputLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 5, textTransform: 'uppercase', fontFamily: fontMedium },
  input: { padding: 13, borderRadius: 10, marginBottom: 14, borderWidth: 1, fontSize: 14, fontFamily: fontRegular },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  modalBtn: { flex: 1, padding: 13, borderRadius: 10, alignItems: 'center', marginHorizontal: 4 }
});

export default ProfileScreen;
