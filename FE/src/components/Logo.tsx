import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface LogoProps {
  size?: number;
  style?: ViewStyle;
}

export default function Logo({ size = 40, style }: LogoProps) {
  return (
    <LinearGradient
      colors={['#047857', '#10B981']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.container,
        { width: size, height: size, borderRadius: size / 4 },
        style
      ]}
    >
      <Ionicons name="timer-outline" size={size * 0.6} color="#FFF" />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  }
});
