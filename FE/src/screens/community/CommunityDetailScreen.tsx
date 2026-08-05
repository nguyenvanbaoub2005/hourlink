import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@constants/Colors';
import { communityApi, ActivityResponse, ActivityStatus } from '@api/community';
import { useLocalSearchParams, router } from 'expo-router';
import { Image } from 'expo-image';

export default function CommunityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [activity, setActivity] = useState<ActivityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    if (id) {
      fetchActivity();
    }
  }, [id]);

  const fetchActivity = async () => {
    try {
      setLoading(true);
      const data = await communityApi.getActivityById(id);
      setActivity(data);
    } catch (error) {
      console.error('Error fetching activity details:', error);
      Alert.alert('Lỗi', 'Không thể tải thông tin hoạt động');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    try {
      setRegistering(true);
      await communityApi.registerForActivity(id);
      Alert.alert('Thành công', 'Đăng ký tham gia thành công');
      fetchActivity(); // Tải lại data
    } catch (error: any) {
      console.error('Register error:', error);
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể đăng ký');
    } finally {
      setRegistering(false);
    }
  };

  if (loading || !activity) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  const isFull = activity.maxParticipants > 0 && activity.currentParticipants >= activity.maxParticipants;
  const canRegister = activity.status === ActivityStatus.OPEN && !isFull;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>{'< Trở lại'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết hoạt động</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.title}>{activity.title}</Text>
          <View style={[styles.badge, activity.status === ActivityStatus.OPEN ? styles.badgeOpen : styles.badgeClosed]}>
            <Text style={styles.badgeText}>{activity.status}</Text>
          </View>
        </View>

        <View style={styles.organizerSection}>
          {activity.organizerAvatar ? (
             <Image source={{ uri: activity.organizerAvatar }} style={styles.avatar} />
          ) : (
             <View style={styles.avatarPlaceholder} />
          )}
          <View>
            <Text style={styles.organizerName}>{activity.organizerName}</Text>
            <Text style={styles.organizerLabel}>Ban tổ chức</Text>
          </View>
        </View>

        <View style={styles.detailsBox}>
          <Text style={styles.infoText}>📍 {activity.location}</Text>
          <Text style={styles.infoText}>⏱ Bắt đầu: {new Date(activity.startTime).toLocaleString()}</Text>
          <Text style={styles.infoText}>⏱ Kết thúc: {new Date(activity.endTime).toLocaleString()}</Text>
          <Text style={styles.infoText}>👥 {activity.currentParticipants} / {activity.maxParticipants > 0 ? activity.maxParticipants : 'Không giới hạn'}</Text>
          <Text style={styles.rewardText}>💎 Thưởng: {activity.creditReward} Time Credit</Text>
        </View>

        <Text style={styles.sectionTitle}>Mô tả chi tiết</Text>
        <Text style={styles.description}>{activity.description}</Text>

      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.registerButton, !canRegister && styles.disabledButton]}
          disabled={!canRegister || registering}
          onPress={handleRegister}
        >
          {registering ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.registerButtonText}>
              {!canRegister ? 'Không thể đăng ký' : 'Đăng ký tham gia'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDark },
  centerContainer: { flex: 1, backgroundColor: Colors.bgDark, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.bgDark,
  },
  backButton: { padding: 4 },
  backText: { color: Colors.primary, fontSize: 16 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.textPrimary },
  scrollContent: { padding: 16, paddingBottom: 40 },
  section: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: { fontSize: 24, fontWeight: 'bold', color: Colors.textPrimary, flex: 1, marginRight: 16 },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  badgeOpen: { backgroundColor: 'rgba(16, 185, 129, 0.2)' },
  badgeClosed: { backgroundColor: 'rgba(107, 114, 128, 0.2)' },
  badgeText: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  organizerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: Colors.surface,
    padding: 12,
    borderRadius: 8,
  },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  avatarPlaceholder: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.border, marginRight: 12 },
  organizerName: { fontSize: 16, fontWeight: 'bold', color: Colors.textPrimary },
  organizerLabel: { fontSize: 14, color: Colors.textSecondary },
  detailsBox: {
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    gap: 8,
  },
  infoText: { fontSize: 15, color: Colors.textSecondary, marginBottom: 4 },
  rewardText: { fontSize: 16, fontWeight: 'bold', color: Colors.primary, marginTop: 8 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.textPrimary, marginBottom: 8 },
  description: { fontSize: 15, color: Colors.textSecondary, lineHeight: 22 },
  footer: {
    padding: 16,
    backgroundColor: Colors.bgDark,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  registerButton: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: Colors.border,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  }
});
