import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Colors, Spacing, Radius } from '@constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import CommunityApi from '@api/community';
import type { CreateActivityRequest } from '@types';

export default function CreateActivityScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState<CreateActivityRequest>({
    title: '',
    description: '',
    location: '',
    startTime: new Date(Date.now() + 86400000).toISOString(), // Mặc định ngày mai
    endTime: new Date(Date.now() + 86400000 + 3600000).toISOString(),
    creditReward: 0,
  });

  const [maxParticipantsStr, setMaxParticipantsStr] = useState('');
  const [creditStr, setCreditStr] = useState('');

  const handleCreate = async () => {
    if (!form.title || !form.description) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ tiêu đề và mô tả.');
      return;
    }

    const maxP = parseInt(maxParticipantsStr, 10);
    const cr = parseFloat(creditStr);

    const data: CreateActivityRequest = {
      ...form,
      maxParticipants: isNaN(maxP) ? undefined : maxP,
      creditReward: isNaN(cr) ? 0 : cr,
    };

    try {
      setLoading(true);
      await CommunityApi.createActivity(data);
      Alert.alert('Thành công', 'Đã tạo hoạt động cộng đồng!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (e: any) {
      Alert.alert('Lỗi', e.response?.data?.message || 'Không thể tạo hoạt động.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tạo Hoạt Động</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Tiêu đề hoạt động <Text style={{ color: 'red' }}>*</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="VD: Dọn rác bãi biển..."
            value={form.title}
            onChangeText={(text) => setForm({ ...form, title: text })}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Mô tả chi tiết <Text style={{ color: 'red' }}>*</Text></Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Nội dung công việc, yêu cầu..."
            multiline
            numberOfLines={4}
            value={form.description}
            onChangeText={(text) => setForm({ ...form, description: text })}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Địa điểm</Text>
          <TextInput
            style={styles.input}
            placeholder="VD: Bãi biển Mỹ Khê"
            value={form.location}
            onChangeText={(text) => setForm({ ...form, location: text })}
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Số lượng (Tùy chọn)</Text>
            <TextInput
              style={styles.input}
              placeholder="VD: 20"
              keyboardType="numeric"
              value={maxParticipantsStr}
              onChangeText={setMaxParticipantsStr}
            />
          </View>
          <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.label}>Time Credit thưởng</Text>
            <TextInput
              style={styles.input}
              placeholder="VD: 2.5"
              keyboardType="numeric"
              value={creditStr}
              onChangeText={setCreditStr}
            />
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.submitBtn, loading && { opacity: 0.7 }]} 
          onPress={handleCreate}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>Tạo hoạt động</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.textPrimary },
  
  content: { padding: Spacing.md },
  inputGroup: { marginBottom: Spacing.md },
  label: { fontSize: 14, fontWeight: '500', color: Colors.textPrimary, marginBottom: 6 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, padding: 12, fontSize: 15 },
  textArea: { height: 100, textAlignVertical: 'top' },
  row: { flexDirection: 'row' },
  
  submitBtn: { backgroundColor: Colors.primary, padding: 14, borderRadius: Radius.md, alignItems: 'center', marginTop: Spacing.md },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
