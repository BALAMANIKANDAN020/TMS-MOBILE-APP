import React, { useEffect, useState } from 'react';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const fontRegular = Platform.select({ ios: 'System', android: 'sans-serif' });
const fontMedium = Platform.select({ ios: 'System', android: 'sans-serif-medium' });

import ProfileScreen from '../screens/ProfileScreen';
import DashboardScreen from '../screens/DashboardScreen';
import ComplaintRaiseScreen from '../screens/ComplaintRaiseScreen';
import ComplaintListScreen from '../screens/ComplaintListScreen';
import ReportScreen from '../screens/ReportScreen';
import MasterScreen from '../screens/MasterScreen';
import { useTheme } from '../context/ThemeContext';

const Drawer = createDrawerNavigator();

const CustomDrawerContent = (props) => {
  const { theme } = useTheme();
  const [role, setRole] = useState('');
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      const userRole = await AsyncStorage.getItem('role');
      const userStr = await AsyncStorage.getItem('user');
      setRole(userRole);
      if(userStr) {
        const u = JSON.parse(userStr);
        setUserName(u.name);
        setUserEmail(u.email);
      }
    };
    fetchUser();
  }, [props.state]);

  const handleLogout = async () => {
    await AsyncStorage.clear();
    props.navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  const NavItem = ({ label, routeName, icon }) => {
    const isActive = props.state && props.state.routeNames ? props.state.routeNames[props.state.index] === routeName : false;
    return (
      <DrawerItem
        label={label}
        icon={({ focused }) => <Ionicons name={icon} size={22} color={isActive ? theme.primary : theme.textMuted} />}
        labelStyle={{ color: isActive ? theme.primary : theme.text, fontSize: 16, fontWeight: isActive ? 'bold' : '600', fontFamily: fontMedium }}
        style={{
          backgroundColor: isActive ? theme.primary + '15' : 'transparent',
          borderRadius: 12,
          marginHorizontal: 15,
          marginVertical: 4
        }}
        onPress={() => props.navigation.navigate(routeName)}
      />
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <DrawerContentScrollView {...props} contentContainerStyle={{paddingTop: 0}}>
        
        {/* Profile Header */}
        <TouchableOpacity 
          style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}
          onPress={() => props.navigation.navigate('Profile')}
        >
          <View style={[styles.avatar, { backgroundColor: theme.primary, shadowColor: theme.primary }]}>
            <Text style={styles.avatarText}>{userName ? userName.charAt(0).toUpperCase() : 'U'}</Text>
          </View>
          <View>
            <Text style={[styles.headerTitle, { color: theme.text }]}>{userName || 'User'}</Text>
            <Text style={[styles.headerSubtitle, { color: theme.textMuted }]}>{role || 'Role'}</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionHeaderText, { color: theme.textMuted }]}>MAIN MENU</Text>
        </View>

        <NavItem label="Dashboard" routeName="DashboardScreen" icon="grid-outline" />
        <NavItem label="Complaints List" routeName="ComplaintsList" icon="list-outline" />

        {role === 'User' && (
          <NavItem label="Raise Complaint" routeName="RaiseComplaint" icon="add-circle-outline" />
        )}

        {(role === 'Superadmin' || role === 'User') && (
          <NavItem label="Reports" routeName="Reports" icon="bar-chart-outline" />
        )}

        {role === 'Superadmin' && (
          <>
            <View style={[styles.sectionHeader, { marginTop: 20 }]}>
              <Text style={[styles.sectionHeaderText, { color: theme.textMuted }]}>MASTERS (ADMIN)</Text>
            </View>
            <NavItem label="Departments" routeName="MasterDepartments" icon="business-outline" />
            <NavItem label="Programmes" routeName="MasterProgrammes" icon="school-outline" />
            <NavItem label="Blocks" routeName="MasterBlocks" icon="cube-outline" />
            <NavItem label="Rooms" routeName="MasterRooms" icon="home-outline" />
            <NavItem label="Roles" routeName="MasterRoles" icon="shield-checkmark-outline" />
            <NavItem label="Users" routeName="MasterUsers" icon="people-outline" />
          </>
        )}
      </DrawerContentScrollView>

      <View style={[styles.footer, { borderTopColor: theme.border }]}>
        <DrawerItem 
          label="Sign Out" 
          icon={() => <Ionicons name="log-out-outline" size={24} color={theme.error} />}
          labelStyle={{ color: theme.error, fontSize: 16, fontWeight: 'bold' }} 
          onPress={handleLogout} 
        />
      </View>
    </View>
  );
};

const MainDrawer = () => {
  const { theme } = useTheme();

  return (
    <Drawer.Navigator 
      drawerContent={CustomDrawerContent}
      screenOptions={{
        headerStyle: { 
          backgroundColor: theme.background, 
          borderBottomWidth: 1, 
          borderBottomColor: theme.border,
          elevation: 0,
          shadowOpacity: 0
        },
        headerTintColor: theme.text,
        headerTitleStyle: { fontWeight: 'bold' },
        drawerStyle: { backgroundColor: theme.background, width: 280 },
        sceneContainerStyle: { backgroundColor: theme.background }
      }}
    >
      <Drawer.Screen name="DashboardScreen" component={DashboardScreen} options={{ title: 'Overview' }} />
      <Drawer.Screen name="ComplaintsList" component={ComplaintListScreen} options={{ title: 'Complaints' }} />
      <Drawer.Screen name="RaiseComplaint" component={ComplaintRaiseScreen} options={{ title: 'Raise Complaint' }} />
      <Drawer.Screen name="Reports" component={ReportScreen} options={{ title: 'Reports & Analytics' }} />
      <Drawer.Screen name="Profile" component={ProfileScreen} options={{ title: 'My Profile' }} />
      
      {/* Dynamic Master Screens */}
      <Drawer.Screen name="MasterDepartments" component={MasterScreen} initialParams={{ title: 'Departments', endpoint: '/master/departments' }} options={{ title: 'Manage Departments' }} />
      <Drawer.Screen name="MasterProgrammes" component={MasterScreen} initialParams={{ title: 'Programmes', endpoint: '/master/programmes' }} options={{ title: 'Manage Programmes' }} />
      <Drawer.Screen name="MasterBlocks" component={MasterScreen} initialParams={{ title: 'Blocks', endpoint: '/master/blocks' }} options={{ title: 'Manage Blocks' }} />
      <Drawer.Screen name="MasterRooms" component={MasterScreen} initialParams={{ title: 'Rooms', endpoint: '/master/rooms' }} options={{ title: 'Manage Rooms' }} />
      <Drawer.Screen name="MasterRoles" component={MasterScreen} initialParams={{ title: 'Roles', endpoint: '/master/roles' }} options={{ title: 'Manage Roles' }} />
      <Drawer.Screen name="MasterUsers" component={MasterScreen} initialParams={{ title: 'Users', endpoint: '/master/users' }} options={{ title: 'Manage Users' }} />
    </Drawer.Navigator>
  );
};

const styles = StyleSheet.create({
  header: { 
    padding: 25, 
    paddingTop: 50,
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#0f172a',
    borderBottomWidth: 1, 
    borderBottomColor: '#1e293b', 
    marginBottom: 15 
  },
  avatar: { 
    width: 50, 
    height: 50, 
    borderRadius: 15, 
    backgroundColor: '#3b82f6', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 15,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5
  },
  avatarText: { color: '#ffffff', fontSize: 24, fontWeight: 'bold', fontFamily: fontMedium },
  headerTitle: { color: '#f8fafc', fontSize: 18, fontWeight: 'bold', fontFamily: fontMedium },
  headerSubtitle: { color: '#94a3b8', fontSize: 13, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: fontRegular },
  sectionHeader: { paddingHorizontal: 25, marginBottom: 5, marginTop: 10 },
  sectionHeaderText: { color: '#64748b', fontSize: 12, fontWeight: 'bold', letterSpacing: 1, fontFamily: fontMedium },
  footer: { padding: 15, borderTopWidth: 1, borderTopColor: '#1e293b', paddingBottom: 30 }
});

export default MainDrawer;
