import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '@constants/Colors';
import CommunityApi from '@api/community';
import type { ParticipantResponse } from '@types';

export default function ManageParticipantsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [participants, setParticipants] = useState<ParticipantResponse[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Trạng thái chọn người để xác nhận
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [actualHours, setActualHours] = useState('2');
  const [confirming, setConfirming] = useState(false);

  const fetchParticipants = async () => {
    try {
      const res = await CommunityApi.getParticipants(id as string, 0, 100);
      setParticipants(res.data?.data?.content || []);
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể tải danh sách người tham gia.');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParticipants();
  }, [id]);

  const toggleSelect = (participantId: string) => {
    const next = new Set(selectedIds);
    if (next.has(participantId)) next.delete(participantId);
    else next.add(participantId);
    setSelectedIds(next);
  };

  const selectAll = () => {
    const registered = participants.filter(p => p.status === 'REGISTERED').map(p => p.id);
    if (selectedIds.size === registered.length) {
      setSelectedIds(new Set()); // Bỏ chọn hết
    } else {
      setSelectedIds(new Set(registered)); // Chọn hết
    }
  };

  const handleConfirm = async () => {
    if (selectedIds.size === 0) {
      Alert.alert('Lỗi', 'Vui lòng chọn ít nhất 1 người để xác nhận.');
      return;
    }
    const hours = parseFloat(actualHours);
    if (isNaN(hours) || hours <= 0) {
      Alert.alert('Lỗi', 'Số giờ đóng góp không hợp lệ.');
      return;
    }

    try {
      setConfirming(true);
      await CommunityApi.confirmParticipants(id as string, {
        participantIds: Array.from(selectedIds),
        actualHours: hours,
        confirmNote: 'Tổ chức xác nhận hoàn thành'
      });
      Alert.alert('Thành công', `Đã xác nhận và cộng Time Credit cho ${selectedIds.size} người.`);
      setSelectedIds(new Set());
      fetchParticipants();
    } catch (e: any) {
      Alert.alert('Lỗi', e.response?.data?.message || 'Không thể xác nhận.');
    } finally {
      setConfirming(false);
    }
  };

  const renderItem = ({ item }: { item: ParticipantResponse }) => {
    const isRegistered = item.status === 'REGISTERED';
    const isSelected = selectedIds.has(item.id);

    return (
      <TouchableOpacity 
        style={[styles.card, isSelected && styles.cardSelected]}
        onPress={() => isRegistered && toggleSelect(item.id)}
        disabled={!isRegistered}
      >
        <View style={styles.cardRow}>
          {isRegistered ? (
            <Ionicons 
              name={isSelected ? "checkmark-circle" : "ellipse-outline"} 
              size={24} 
              color={isSelected ? Colors.primary : Colors.border} 
              style={{ marginRight: 12 }} 
            />
          ) : (
            <Ionicons name="checkmark-done-circle" size={24} color="#059669" style={{ marginRight: 12 }} />
          )}

          <View style={styles.avatar}>
            <Text style={styles.avatarLetter}>{item.userName.charAt(0).toUpperCase()}</Text>
          </View>
          
          <View style={{ flex: 1 }}>
            <Text style={styles.userName}>{item.userName}</Text>
            {item.status === 'CONFIRMED' ? (
              <Text style={styles.statusConfirmed}>Đã xác nhận ({item.actualHours}h)</Text>
            ) : item.status === 'REGISTERED' ? (
              <Text style={styles.statusRegistered}>Chờ xác nhận</Text>
            ) : (
              <Text style={styles.statusCancelled}>Đã hủy</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quản lý người tham gia</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>
      ) : (
        <>
          <View style={styles.topActions}>
            <TouchableOpacity onPress={selectAll}>
              <Text style={styles.selectAllText}>Chọn tất cả chờ xác nhận</Text>
            </TouchableOpacity>
            <Text style={styles.countText}>{selectedIds.size} đang chọn</Text>
          </View>

          <FlatList
            data={participants}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            ListEmptyComponent={<Text style={styles.emptyText}>Chưa có ai đăng ký.</Text>}
          />

          <View style={styles.bottomBar}>
            <View style={styles.hoursInputRow}>
              <Text style={styles.hoursLabel}>Số giờ đóng góp:</Text>
              <TextInput 
                style={styles.hoursInput}
                value={actualHours}
                onChangeText={setActualHours}
                keyboardType="numeric"
              />
            </View>
            <TouchableOpacity 
              style={[styles.confirmBtn, selectedIds.size === 0 && { opacity: 0.5 }]}
              onPress={handleConfirm}
              disabled={selectedIds.size === 0 || confirming}
            >
              {confirming ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmBtnText}>Xác nhận & Tặng Credit</Text>}
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.textPrimary },
  
  topActions: { flexDirection: 'row', justifyContent: 'space-between', padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  selectAllText: { color: Colors.primary, fontWeight: 'bold' },
  countText: { color: Colors.textMuted },
  
  list: { padding: Spacing.md },
  card: { backgroundColor: '#fff', padding: Spacing.md, borderRadius: Radius.md, marginBottom: 8, borderWidth: 1, borderColor: Colors.border },
  cardSelected: { borderColor: Colors.primary, backgroundColor: '#F0FDF4' },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarLetter: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  userName: { fontSize: 16, fontWeight: 'bold', color: Colors.textPrimary, marginBottom: 4 },
  statusRegistered: { color: '#D97706', fontSize: 13 },
  statusConfirmed: { color: '#059669', fontSize: 13, fontWeight: 'bold' },
  statusCancelled: { color: '#EF4444', fontSize: 13 },
  
  emptyText: { textAlign: 'center', color: Colors.textMuted, marginTop: 40 },
  
  bottomBar: { padding: Spacing.md, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: Colors.border },
  hoursInputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  hoursLabel: { fontSize: 15, fontWeight: '500', marginRight: 12 },
  hoursInput: { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: 12, paddingVertical: 8, flex: 1, fontSize: 16 },
  confirmBtn: { backgroundColor: Colors.primary, padding: 14, borderRadius: Radius.md, alignItems: 'center' },
  confirmBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
