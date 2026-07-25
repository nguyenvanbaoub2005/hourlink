import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Switch, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import SkillApi from '@api/skill';

export default function SkillsScreen() {
  const router = useRouter();
  const [skills, setSkills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSkills = async () => {
    try {
      const res = await SkillApi.getMySkills();
      if (res.data?.data) {
        setSkills(res.data.data);
      }
    } catch (error) {
      console.error('Lỗi khi tải kỹ năng:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSkills();
  }, []);

  const toggleVisibility = async (id: string, currentStatus: string) => {
    try {
      // Optimistic update
      setSkills(prev => prev.map(s => s.id === id ? { ...s, status: currentStatus === 'VISIBLE' ? 'HIDDEN' : 'VISIBLE' } : s));
      await SkillApi.toggleVisibility(id);
    } catch (error) {
      console.error('Lỗi khi cập nhật trạng thái:', error);
      // Revert if failed
      fetchSkills();
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'Xác nhận xóa',
      'Bạn có chắc chắn muốn xóa kỹ năng này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await SkillApi.deleteSkill(id);
              setSkills(prev => prev.filter(s => s.id !== id));
              Alert.alert('Thành công', 'Đã xóa kỹ năng');
            } catch (error) {
              Alert.alert('Lỗi', 'Không thể xóa kỹ năng này');
            }
          },
        },
      ]
    );
  };

  const handleEdit = (item: any) => {
    router.push({
      pathname: '/(tabs)/post' as any,
      params: {
        editId: item.id,
        editType: 'shareSkill',
        initialData: JSON.stringify(item),
      },
    });
  };

  const renderItem = ({ item }: { item: any }) => {
    const isVisible = item.status === 'VISIBLE';
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.skillTitle}>{item.name}</Text>
            <Text style={styles.skillSubtitle}>{item.categoryName || 'Khác'} · {item.level}</Text>
          </View>
          <Switch
            value={isVisible}
            onValueChange={() => toggleVisibility(item.id, item.status)}
            trackColor={{ false: '#cbd5e1', true: '#38bdf8' }}
            thumbColor={'#fff'}
          />
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoText}>{item.completedSessions || 0} buổi đã dạy</Text>
          <View style={[styles.badge, isVisible ? styles.badgeVisible : styles.badgeHidden]}>
            <Text style={[styles.badgeText, isVisible ? styles.badgeTextVisible : styles.badgeTextHidden]}>
              {isVisible ? 'Đang hiện' : 'Đã ẩn'}
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton} onPress={() => handleEdit(item)}>
            <Ionicons name="pencil-outline" size={16} color={Colors.textMuted} />
            <Text style={styles.actionText}>Chỉnh sửa</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#fef2f2' }]}
            onPress={() => handleDelete(item.id)}
          >
            <Ionicons name="trash-outline" size={16} color="#ef4444" />
            <Text style={[styles.actionText, { color: '#ef4444' }]}>Xóa</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kỹ năng chia sẻ</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={skills}
          keyExtractor={item => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListFooterComponent={
            <TouchableOpacity style={styles.addButton} onPress={() => router.push('/(tabs)/post')}>
              <Ionicons name="add" size={20} color={Colors.primary} />
              <Text style={styles.addButtonText}>Thêm kỹ năng mới</Text>
            </TouchableOpacity>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.text },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  skillTitle: { fontSize: 16, fontWeight: 'bold', color: Colors.text, marginBottom: 4 },
  skillSubtitle: { fontSize: 14, color: Colors.textMuted },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  infoText: { fontSize: 14, color: Colors.textMuted, marginRight: 12 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  badgeVisible: { backgroundColor: '#ccfbf1' },
  badgeHidden: { backgroundColor: '#f1f5f9' },
  badgeText: { fontSize: 12, fontWeight: '600' },
  badgeTextVisible: { color: Colors.primary },
  badgeTextHidden: { color: Colors.textMuted },
  actions: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 12 },
  actionButton: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 10, borderRadius: 8, backgroundColor: '#f8fafc', marginHorizontal: 4 },
  actionText: { fontSize: 14, fontWeight: '600', color: Colors.textMuted, marginLeft: 4 },
  addButton: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 16, borderRadius: 12, borderStyle: 'dashed', borderWidth: 1, borderColor: Colors.primary, marginTop: 8 },
  addButtonText: { fontSize: 16, fontWeight: '600', color: Colors.primary, marginLeft: 8 },
});
