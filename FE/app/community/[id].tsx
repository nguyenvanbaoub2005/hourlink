import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '@constants/Colors';
import CommunityApi from '@api/community';
import type { ActivityResponse } from '@types';
import { useAuthStore } from '@store/authStore';
import { openChatWithUser } from '@utils/chatNav';

export default function ActivityDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [activity, setActivity] = useState<ActivityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDetail = async () => {
    try {
      const res = await CommunityApi.getActivityDetail(id as string);
      setActivity(res.data?.data);
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể tải chi tiết hoạt động.');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleRegister = async () => {
    try {
      setActionLoading(true);
      await CommunityApi.register(id as string);
      Alert.alert('Thành công', 'Bạn đã đăng ký tham gia hoạt động này!');
      fetchDetail();
    } catch (e: any) {
      Alert.alert('Lỗi', e.response?.data?.message || 'Không thể đăng ký.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    Alert.alert('Hủy đăng ký', 'Bạn có chắc muốn hủy đăng ký hoạt động này?', [
      { text: 'Không', style: 'cancel' },
      { text: 'Có', onPress: async () => {
        try {
          setActionLoading(true);
          await CommunityApi.cancelRegistration(id as string);
          Alert.alert('Thành công', 'Đã hủy đăng ký!');
          fetchDetail();
        } catch (e: any) {
          Alert.alert('Lỗi', e.response?.data?.message || 'Lỗi khi hủy đăng ký.');
        } finally {
          setActionLoading(false);
        }
      }}
    ]);
  };

  const isOrganizer = user?.id === activity?.organizerId;

  if (loading || !activity) {
    return (
      <SafeAreaView style={styles.center} edges={['top']}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi Tiết Hoạt Động</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{activity.title}</Text>
        
        <TouchableOpacity
          style={styles.orgRow}
          onPress={() => openChatWithUser(router, activity.organizerId, activity.organizerName)}
          disabled={isOrganizer}
          accessibilityRole="button"
          accessibilityLabel={`Nhắn tin với ${activity.organizerName}`}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarLetter}>{activity.organizerName.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.orgText}>
            <Text style={styles.orgName}>{activity.organizerName}</Text>
            {!isOrganizer && <Text style={styles.chatLabel}>Nhấn để nhắn tin với người tổ chức</Text>}
          </View>
          {!isOrganizer && <Ionicons name="chatbubble-ellipses-outline" size={22} color={Colors.primary} />}
        </TouchableOpacity>

        <View style={styles.infoBox}>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={20} color={Colors.primary} style={styles.infoIcon} />
            <View>
              <Text style={styles.infoLabel}>Thời gian</Text>
              <Text style={styles.infoVal}>{new Date(activity.startTime).toLocaleString('vi-VN')}</Text>
            </View>
          </View>
          
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={20} color={Colors.primary} style={styles.infoIcon} />
            <View>
              <Text style={styles.infoLabel}>Địa điểm</Text>
              <Text style={styles.infoVal}>{activity.location || 'Chưa cập nhật'}</Text>
            </View>
          </View>
          
          <View style={styles.infoRow}>
            <Ionicons name="people-outline" size={20} color={Colors.primary} style={styles.infoIcon} />
            <View>
              <Text style={styles.infoLabel}>Số lượng đã đăng ký</Text>
              <Text style={styles.infoVal}>{activity.registeredCount} / {activity.maxParticipants || 'Không giới hạn'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="gift-outline" size={20} color="#D97706" style={styles.infoIcon} />
            <View>
              <Text style={styles.infoLabel}>Credit dự kiến</Text>
              <Text style={[styles.infoVal, { color: '#D97706', fontWeight: 'bold' }]}>{activity.creditReward} TC dự kiến</Text>
              <Text style={styles.creditHelper}>Thực nhận theo quy đổi 1 giờ xác nhận = 1 TC</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Mô tả hoạt động</Text>
        <Text style={styles.desc}>{activity.description}</Text>

        <View style={{ height: 40 }} />
      </ScrollView>

      <View style={styles.bottomBar}>
        {isOrganizer ? (
          <View style={styles.organizerActions}>
            <TouchableOpacity style={[styles.actionBtn, styles.flexBtn]} onPress={() => router.push(`/community/manage/${activity.id}` as any)}>
              <Text style={styles.actionBtnText}>Người tham gia</Text>
            </TouchableOpacity>
            {activity.status === 'OPEN' && <TouchableOpacity style={[styles.editBtn, styles.flexBtn]} onPress={() => router.push({ pathname: '/community/create', params: { editId: activity.id } } as any)}>
              <Text style={styles.editBtnText}>Sửa hoạt động</Text>
            </TouchableOpacity>}
          </View>
        ) : (
          activity.registered ? (
            <TouchableOpacity 
              style={[styles.actionBtn, new Date(activity.endTime) <= new Date() ? styles.evidenceBtn : { backgroundColor: '#EF4444' }]}
              onPress={new Date(activity.endTime) <= new Date()
                ? () => router.push(`/community/evidence/${activity.id}` as any)
                : handleCancel}
              disabled={actionLoading}
            >
              {actionLoading ? <ActivityIndicator color="#fff" /> : (
                <View style={styles.buttonContent}>
                  {new Date(activity.endTime) <= new Date() && <Ionicons name="camera-outline" size={19} color="#FFFFFF" />}
                  <Text style={styles.actionBtnText}>
                    {new Date(activity.endTime) <= new Date() ? 'Gửi / cập nhật minh chứng' : 'Hủy đăng ký'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[styles.actionBtn, activity.status !== 'OPEN' && { opacity: 0.5 }]}
              onPress={handleRegister}
              disabled={actionLoading || activity.status !== 'OPEN'}
            >
              {actionLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionBtnText}>Đăng ký tham gia</Text>}
            </TouchableOpacity>
          )
        )}
        {!isOrganizer && (
          <TouchableOpacity
            style={styles.reportBtn}
            onPress={() => router.push({
              pathname: '/report/create',
              params: { targetId: activity.id, targetType: 'CONTENT' },
            } as any)}
          >
            <Ionicons name="flag-outline" size={18} color={Colors.danger} />
            <Text style={styles.reportBtnText}>Báo cáo nội dung</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.textPrimary },
  
  content: { padding: Spacing.md },
  title: { fontSize: 22, fontWeight: 'bold', color: Colors.textPrimary, marginBottom: 16 },
  
  orgRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  avatarLetter: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  orgText: { flex: 1 },
  orgName: { fontSize: 16, fontWeight: '500', color: Colors.textPrimary },
  chatLabel: { color: Colors.primary, fontSize: 12, marginTop: 3 },
  
  infoBox: { backgroundColor: '#fff', borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, marginBottom: 24 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  infoIcon: { marginRight: 12, width: 24, textAlign: 'center' },
  infoLabel: { fontSize: 12, color: Colors.textMuted, marginBottom: 2 },
  infoVal: { fontSize: 15, fontWeight: '500', color: Colors.textPrimary },
  creditHelper: { color: Colors.textMuted, fontSize: 12, marginTop: 3 },
  
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.textPrimary, marginBottom: 8 },
  desc: { fontSize: 15, color: Colors.textSecondary, lineHeight: 24 },

  bottomBar: { padding: Spacing.md, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: Colors.border },
  actionBtn: { backgroundColor: Colors.primary, padding: 14, borderRadius: Radius.md, alignItems: 'center' },
  actionBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  evidenceBtn: { backgroundColor: '#0D9488' },
  buttonContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  reportBtn: { marginTop: 10, padding: 10, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  reportBtnText: { color: Colors.danger, fontSize: 14, fontWeight: '600' },
  organizerActions: { flexDirection: 'row', gap: 10 },
  flexBtn: { flex: 1 },
  editBtn: { borderWidth: 1, borderColor: Colors.primary, padding: 14, borderRadius: Radius.md, alignItems: 'center' },
  editBtnText: { color: Colors.primary, fontSize: 15, fontWeight: 'bold' }
});
