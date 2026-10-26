import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const themes = {
  dark: {
    background: '#09090b', // Zinc 950
    card: '#18181b',       // Zinc 900
    text: '#fafafa',
    textMuted: '#a1a1aa',
    primary: '#8b5cf6',    // Vibrant Violet
    secondary: '#06b6d4',  // Cyan
    border: '#27272a',
    error: '#f43f5e',
    success: '#10b981'
  },
  light: {
    background: '#f4f4f5', // Zinc 100
    card: '#ffffff',
    text: '#18181b',
    textMuted: '#71717a',
    primary: '#7c3aed',
    secondary: '#0891b2',
    border: '#e4e4e7',
    error: '#e11d48',
    success: '#059669'
  }
};

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem('theme').then(savedTheme => {
      if (savedTheme === 'light') setIsDarkMode(false);
    });
  }, []);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    AsyncStorage.setItem('theme', newMode ? 'dark' : 'light');
  };

  const theme = isDarkMode ? themes.dark : themes.light;

  return (
    <ThemeContext.Provider value={{ theme, isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
