import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import axios from '../api/axios';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);

  useEffect(() => {
    (async () => {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (compatible && enrolled) {
        setIsBiometricSupported(true);
      }
    })();
  }, []);

  const handleBiometricAuth = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Login with Biometrics',
      fallbackLabel: 'Use Passcode',
    });

    if (result.success) {
      // Biometric scan ALWAYS logs in as Superadmin
      setLoading(true);
      try {
        const res = await axios.post('/auth/biometric-login');
        await AsyncStorage.setItem('token', res.data.token);
        await AsyncStorage.setItem('role', res.data.role);
        await AsyncStorage.setItem('user', JSON.stringify(res.data.user));
        
        await AsyncStorage.setItem('savedEmail', res.data.user.email);
        await AsyncStorage.setItem('savedPassword', 'password123');
        
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        navigation.replace('Dashboard');
      } catch (err) {
        performLogin('krixxeey@example.com', 'password123');
      } finally {
        setLoading(false);
      }
    }
  };

  const performLogin = async (loginEmail = email, loginPassword = password) => {
    if (!loginEmail || !loginPassword) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Please enter email and password');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post('/auth/login', { email: loginEmail, password: loginPassword });
      await AsyncStorage.setItem('token', res.data.token);
      await AsyncStorage.setItem('role', res.data.role);
      await AsyncStorage.setItem('user', JSON.stringify(res.data.user));
      
      await AsyncStorage.setItem('savedEmail', loginEmail);
      await AsyncStorage.setItem('savedPassword', loginPassword);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.replace('Dashboard');
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', err.response?.data?.msg || err.message || 'Login Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient 
      colors={isDarkMode ? ['#020617', '#1e1b4b', '#020617'] : ['#f4f4f5', '#e0e7ff', '#f4f4f5']} 
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{flex: 1}}>
        <View style={styles.content}>
          <BlurView intensity={isDarkMode ? 30 : 60} tint={isDarkMode ? 'dark' : 'light'} style={styles.glassCard}>
            
            {/* Header Section */}
            <Animated.View entering={FadeInDown.delay(100).duration(800)} style={styles.header}>
              <Animated.View entering={ZoomIn.delay(300).springify()} style={[styles.logoContainer, { backgroundColor: theme.primary + '20', borderColor: theme.primary + '50' }]}>
                <Ionicons name="shield-checkmark" size={48} color={theme.primary} />
              </Animated.View>
              <Text style={[styles.title, { color: theme.text }]}>Welcome Back</Text>
              <Text style={[styles.subtitle, { color: theme.textMuted }]}>Sign in to your TMS Panel</Text>
            </Animated.View>

            {/* Input Section */}
            <Animated.View entering={FadeInDown.delay(300).duration(800)} style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Email Address</Text>
              <View style={[styles.inputContainer, { backgroundColor: theme.card + 'aa', borderColor: theme.border }]}>
                <Ionicons name="mail-outline" size={20} color={theme.textMuted} style={styles.icon} />
                <TextInput 
                  style={[styles.input, { color: theme.text }]} 
                  placeholder="krixxeey@example.com"
                  placeholderTextColor={theme.textMuted}
                  value={email} 
                  onChangeText={setEmail} 
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(500).duration(800)} style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Password</Text>
              <View style={[styles.inputContainer, { backgroundColor: theme.card + 'aa', borderColor: theme.border }]}>
                <Ionicons name="lock-closed-outline" size={20} color={theme.textMuted} style={styles.icon} />
                <TextInput 
                  style={[styles.input, { color: theme.text }]} 
                  placeholder="••••••••" 
                  placeholderTextColor={theme.textMuted}
                  value={password} 
                  onChangeText={setPassword} 
                  secureTextEntry={!isPasswordVisible} 
                />
                <TouchableOpacity onPress={() => {
                  Haptics.selectionAsync();
                  setPasswordVisible(!isPasswordVisible);
                }} style={styles.eyeIcon}>
                  <Ionicons name={isPasswordVisible ? "eye-outline" : "eye-off-outline"} size={20} color={theme.textMuted} />
                </TouchableOpacity>
              </View>
            </Animated.View>

            {/* Submit Button */}
            <Animated.View entering={FadeInDown.delay(700).duration(800)}>
              <TouchableOpacity 
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  performLogin();
                }} 
                disabled={loading}
              >
                <LinearGradient 
                  colors={isDarkMode ? ['#8b5cf6', '#6d28d9'] : ['#7c3aed', '#5b21b6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.loginButton}
                >
                  <Text style={styles.loginButtonText}>{loading ? 'Authenticating...' : 'Sign In'}</Text>
                  {!loading && <Ionicons name="arrow-forward" size={20} color="#fff" style={{marginLeft: 10}} />}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            {/* Biometric Button */}
            {isBiometricSupported && (
              <Animated.View entering={FadeInDown.delay(900).duration(800)} style={{ marginTop: 25, alignItems: 'center' }}>
                <TouchableOpacity 
                  style={[styles.biometricBtn, { borderColor: theme.border, backgroundColor: theme.card + 'cc' }]} 
                  onPress={handleBiometricAuth}
                >
                  <Ionicons name="finger-print" size={28} color={theme.primary} />
                  <Text style={[styles.biometricText, { color: theme.text }]}>Login with Biometrics</Text>
                </TouchableOpacity>
              </Animated.View>
            )}

          </BlurView>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 20 },
  glassCard: { padding: 25, borderRadius: 30, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  header: { alignItems: 'center', marginBottom: 35 },
  logoContainer: { width: 80, height: 80, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderWidth: 1 },
  title: { fontSize: 26, fontWeight: '900', marginBottom: 6, letterSpacing: 0.5 },
  subtitle: { fontSize: 14, fontWeight: '500' },
  inputGroup: { marginBottom: 18 },
  label: { fontSize: 13, fontWeight: '700', marginBottom: 8, marginLeft: 6, letterSpacing: 0.5 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 16, height: 55, paddingHorizontal: 15 },
  icon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16 },
  eyeIcon: { padding: 5 },
  loginButton: { height: 55, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  loginButtonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold', letterSpacing: 0.5 },
  biometricBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 16, borderWidth: 1 },
  biometricText: { fontSize: 15, fontWeight: 'bold', marginLeft: 12 }
});

export default LoginScreen;