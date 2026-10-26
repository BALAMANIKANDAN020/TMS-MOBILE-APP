import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, { FadeIn, ZoomIn, useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, FadeOut } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

const SplashScreen = ({ navigation }) => {
  const { theme } = useTheme();
  
  // Spinner animation
  const rotation = useSharedValue(0);
  
  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 1500, easing: Easing.linear }),
      -1,
      false
    );

    const loadApp = async () => {
      // Clear token to enforce the flow requested by user (Load -> Home -> Login)
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('role');
      await AsyncStorage.removeItem('user');
      
      setTimeout(() => {
        navigation.replace('Welcome');
      }, 2500); // 2.5 seconds splash
    };

    loadApp();
  }, []);

  const spinnerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotateZ: `${rotation.value}deg` }]
    };
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Background Decorators */}
      <Animated.View entering={FadeIn.delay(200).duration(1000)} exiting={FadeOut} style={[styles.circle1, { backgroundColor: theme.primary + '10' }]} />
      <Animated.View entering={FadeIn.delay(400).duration(1000)} exiting={FadeOut} style={[styles.circle2, { backgroundColor: theme.secondary + '10' }]} />

      <Animated.View entering={ZoomIn.duration(1000).springify()} exiting={FadeOut.duration(500)} style={styles.content}>
        <View style={[styles.logoBox, { backgroundColor: theme.card, borderColor: theme.primary, shadowColor: theme.primary }]}>
          <Ionicons name="apps" size={60} color={theme.primary} />
        </View>
        <Text style={[styles.title, { color: theme.text }]}>TMS Panel</Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>Ticket Management System</Text>
        
        <Animated.View style={[styles.spinner, spinnerStyle, { borderTopColor: theme.primary }]} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden'
  },
  content: {
    alignItems: 'center',
    zIndex: 10
  },
  logoBox: {
    width: 110,
    height: 110,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    marginBottom: 20,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 5
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 40
  },
  spinner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 4,
    borderColor: 'transparent',
  },
  circle1: {
    position: 'absolute',
    width: width * 1.5,
    height: width * 1.5,
    borderRadius: width,
    top: -width * 0.5,
    left: -width * 0.2,
    zIndex: 1
  },
  circle2: {
    position: 'absolute',
    width: width * 1.2,
    height: width * 1.2,
    borderRadius: width,
    bottom: -width * 0.4,
    right: -width * 0.3,
    zIndex: 1
  }
});

export default SplashScreen;
