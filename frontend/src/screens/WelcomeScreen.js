import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

const WelcomeScreen = ({ navigation }) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      
      {/* Top Banner / Logo Area */}
      <View style={styles.topSection}>
        <Animated.View entering={ZoomIn.delay(200).duration(800)} style={[styles.logoContainer, { backgroundColor: theme.card, shadowColor: theme.primary }]}>
          <Ionicons name="apps-outline" size={80} color={theme.primary} />
        </Animated.View>
        <Animated.Text entering={FadeInDown.delay(400).duration(800)} style={[styles.title, { color: theme.text }]}>
          Ticket Management System
        </Animated.Text>
        <Animated.Text entering={FadeInDown.delay(500).duration(800)} style={[styles.subtitle, { color: theme.textMuted }]}>
          A complete solution to raise, track, and manage all your institutional complaints efficiently.
        </Animated.Text>
      </View>

      {/* Bottom Action Area */}
      <Animated.View entering={FadeInDown.delay(700).duration(800)} style={styles.bottomSection}>
        <TouchableOpacity 
          style={[styles.loginBtn, { backgroundColor: theme.primary }]}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.loginText}>Go to Login Page</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" style={{marginLeft: 10}} />
        </TouchableOpacity>
      </Animated.View>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 30,
    justifyContent: 'space-between'
  },
  topSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  logoContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 15,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)'
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 15,
    letterSpacing: 1
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 10
  },
  bottomSection: {
    paddingBottom: 40
  },
  loginBtn: {
    flexDirection: 'row',
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8
  },
  loginText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1
  }
});

export default WelcomeScreen;
