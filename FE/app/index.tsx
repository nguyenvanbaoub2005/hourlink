import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Colors, Fonts, Spacing, Radius } from '../src/constants/Colors';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    // Navigate to onboarding after 2 seconds
    const timer = setTimeout(() => {
      router.replace('/(auth)/onboarding');
    }, 2000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <LinearGradient
      colors={[Colors.gradientStart, Colors.gradientEnd]}
      style={styles.container}
    >
      <StatusBar style="light" />
      <View style={styles.logoContainer}>
        <LinearGradient
          colors={['#059669', '#10B981']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.logoIcon}
        >
          <Ionicons name="timer-outline" size={50} color="#FFF" strokeWidth={1.5} />
        </LinearGradient>
        <Text style={styles.title}>HourLink</Text>
        <Text style={styles.subtitle}>Trao đổi thời gian - Kết nối cộng đồng</Text>
      </View>

      <View style={styles.dotsContainer}>
        <View style={[styles.dot, styles.dotActive]} />
        <View style={styles.dot} />
        <View style={styles.dot} />
      </View>
      
      <Text style={styles.bottomText}>Mỗi giờ đều có giá trị</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: -50,
  },
  logoIcon: {
    width: 90,
    height: 90,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  logoLetter: {
    fontSize: 50,
    fontWeight: 'bold',
    color: '#FFF',
    fontFamily: Fonts.bold,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#FFF',
    fontFamily: Fonts.bold,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    fontFamily: Fonts.medium,
  },
  dotsContainer: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 120,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.4)',
    marginHorizontal: 5,
  },
  dotActive: {
    backgroundColor: '#FFF',
  },
  bottomText: {
    position: 'absolute',
    bottom: 40,
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
  }
});
