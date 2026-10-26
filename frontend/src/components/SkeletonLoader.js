import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, interpolate, Extrapolate } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

const SkeletonLoader = () => {
  const { isDarkMode, theme } = useTheme();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      progress.value,
      [0, 1],
      [-width, width],
      Extrapolate.CLAMP
    );
    return {
      transform: [{ translateX }],
    };
  });

  const baseColor = isDarkMode ? '#1e293b' : '#e2e8f0';
  const highlightColor = isDarkMode ? '#334155' : '#f8fafc';

  const renderCardSkeleton = (key) => (
    <View key={key} style={[styles.card, { backgroundColor: baseColor, borderColor: theme.border }]}>
      <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
        <LinearGradient
          colors={['transparent', highlightColor, 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      <View style={[styles.header, { backgroundColor: highlightColor }]} />
      <View style={[styles.body1, { backgroundColor: highlightColor }]} />
      <View style={[styles.body2, { backgroundColor: highlightColor }]} />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {[1, 2, 3, 4].map(renderCardSkeleton)}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  card: { height: 160, borderRadius: 16, marginBottom: 15, padding: 20, overflow: 'hidden', borderWidth: 1 },
  header: { height: 24, width: '60%', borderRadius: 8, marginBottom: 20 },
  body1: { height: 16, width: '100%', borderRadius: 8, marginBottom: 10 },
  body2: { height: 16, width: '80%', borderRadius: 8 },
});

export default SkeletonLoader;
