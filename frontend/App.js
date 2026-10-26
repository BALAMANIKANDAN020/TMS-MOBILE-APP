import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LogBox, Text, TextInput, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Set project-wide clean modern typography (overriding cursive phone system themes on Android)
const fontDefault = Platform.select({ ios: 'System', android: 'sans-serif' });
if (Text.defaultProps == null) Text.defaultProps = {};
Text.defaultProps.style = { fontFamily: fontDefault };
if (TextInput.defaultProps == null) TextInput.defaultProps = {};
TextInput.defaultProps.style = { fontFamily: fontDefault };

import LoginScreen from './src/screens/LoginScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';
import MainDrawer from './src/navigation/MainDrawer';
import SplashScreen from './src/screens/SplashScreen';
import { ThemeProvider } from './src/context/ThemeContext';

LogBox.ignoreAllLogs();

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <ThemeProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <NavigationContainer>
          <Stack.Navigator initialRouteName="Splash">
            <Stack.Screen name="Splash" component={SplashScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false, animation: 'fade' }} />
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false, animation: 'slide_from_right' }} />
            <Stack.Screen name="Dashboard" component={MainDrawer} options={{ headerShown: false, animation: 'fade_from_bottom' }} />
          </Stack.Navigator>
        </NavigationContainer>
      </GestureHandlerRootView>
    </ThemeProvider>
  );
}