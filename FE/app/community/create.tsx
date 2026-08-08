import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing } from '@constants/Colors';
import DateTimePickerModal from '@components/DateTimePickerModal';
import CommunityApi from '@api/community';
import type { CreateActivityRequest } from '@types';

type PickerField = 'startDate' | 'startTime' | 'endDate' | 'endTime' | null;

const localParts = (iso: string) => {
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return { date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, time: `${pad(d.getHours())}:${pad(d.getMinutes())}` };
};

export default function CreateActivityScreen() {
  const router = useRouter();
  const { editId } = useLocalSearchParams<{ editId?: string }>();
  const tomorrow = useMemo(() => new Date(Date.now() + 86_400_000), []);
  const initialStart = localParts(tomorrow.toISOString());
  const initialEnd = localParts(new Date(tomorrow.getTime() + 3_600_000).toISOString());

  const [loading, setLoading] = useState(Boolean(editId));
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('');
  const [creditReward, setCreditReward] = useState('0.5');
  const [startDate, setStartDate] = useState(initialStart.date);
  const [startTime, setStartTime] = useState(initialStart.time);
  const [endDate, setEndDate] = useState(initialEnd.date);
  const [endTime, setEndTime] = useState(initialEnd.time);
  const [picker, setPicker] = useState<PickerField>(null);

  useEffect(() => {
    if (!editId) return;
    CommunityApi.getActivityDetail(editId)
      .then(({ data }) => {
        const activity = data.data;
        const start = localParts(activity.startTime);
        const end = localParts(activity.endTime);
        setTitle(activity.title);
        setDescription(activity.description || '');
        setLocation(activity.location || '');
        setMaxParticipants(activity.maxParticipants?.toString() || '');
        setCreditReward(activity.creditReward.toString());
        setStartDate(start.date); setStartTime(start.time);
        setEndDate(end.date); setEndTime(end.time);
      })
      .catch(() => { Alert.alert('Lỗi', 'Không thể tải hoạt động cần sửa.'); router.back(); })
      .finally(() => setLoading(false));
  }, [editId]);

  const submit = async () => {
    const max = maxParticipants.trim() ? Number(maxParticipants) : undefined;
    const credit = Number(creditReward);
    const start = new Date(`${startDate}T${startTime}:00`);
    const end = new Date(`${endDate}T${endTime}:00`);
    if (!title.trim() || !description.trim()) return Alert.alert('Thiếu thông tin', 'Vui lòng nhập tiêu đề và mô tả.');
    if (!Number.isFinite(credit) || credit < 0.5) return Alert.alert('Dữ liệu chưa đúng', 'Time Credit tối thiểu là 0.5.');
    if (max !== undefined && (!Number.isInteger(max) || max < 1)) return Alert.alert('Dữ liệu chưa đúng', 'Số người tối đa phải là số nguyên dương.');
    if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || start <= new Date() || end <= start) {
      return Alert.alert('Thời gian chưa đúng', 'Thời gian bắt đầu phải ở tương lai và kết thúc phải sau bắt đầu.');
    }
    const data: CreateActivityRequest = {
      title: title.trim(), description: description.trim(), location: location.trim() || undefined,
      startTime: start.toISOString(), endTime: end.toISOString(), maxParticipants: max, creditReward: credit,
    };
    try {
      setSubmitting(true);
      if (editId) await CommunityApi.updateActivity(editId, data);
      else await CommunityApi.createActivity(data);
      Alert.alert('Thành công', editId ? 'Đã cập nhật hoạt động.' : 'Đã tạo hoạt động cộng đồng.', [
        { text: 'OK', onPress: () => router.replace('/community/mine' as any) },
      ]);
    } catch (e: any) {
      Alert.alert('Lỗi', e?.response?.data?.message || 'Không thể lưu hoạt động.');
    } finally { setSubmitting(false); }
  };

  const pickerValue = picker?.endsWith('Date') ? (picker === 'startDate' ? startDate : endDate) : (picker === 'startTime' ? startTime : endTime);
  const selectPicker = (value: string) => {
    if (picker === 'startDate') setStartDate(value);
    if (picker === 'startTime') setStartTime(value);
    if (picker === 'endDate') setEndDate(value);
    if (picker === 'endTime') setEndTime(value);
  };

  if (loading) return <SafeAreaView style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></SafeAreaView>;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color={Colors.textPrimary} /></TouchableOpacity>
        <Text style={styles.headerTitle}>{editId ? 'Sửa Hoạt Động' : 'Tạo Hoạt Động'}</Text><View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Field label="Tiêu đề *" value={title} onChangeText={setTitle} placeholder="VD: Dọn rác bãi biển" />
        <Field label="Mô tả *" value={description} onChangeText={setDescription} placeholder="Nội dung công việc, yêu cầu..." multiline />
        <Field label="Địa điểm" value={location} onChangeText={setLocation} placeholder="VD: Bãi biển Mỹ Khê" />
        <Text style={styles.label}>Thời gian bắt đầu *</Text>
        <View style={styles.row}><PickerButton text={startDate} onPress={() => setPicker('startDate')} /><PickerButton text={startTime} onPress={() => setPicker('startTime')} /></View>
        <Text style={styles.label}>Thời gian kết thúc *</Text>
        <View style={styles.row}><PickerButton text={endDate} onPress={() => setPicker('endDate')} /><PickerButton text={endTime} onPress={() => setPicker('endTime')} /></View>
        <View style={styles.row}>
          <View style={styles.flex}><Field label="Số người tối đa" value={maxParticipants} onChangeText={setMaxParticipants} placeholder="Không giới hạn" keyboardType="numeric" /></View>
          <View style={styles.flex}><Field label="Time Credit *" value={creditReward} onChangeText={setCreditReward} placeholder="0.5" keyboardType="decimal-pad" /></View>
        </View>
        <TouchableOpacity style={[styles.submit, submitting && styles.disabled]} onPress={submit} disabled={submitting}>
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>{editId ? 'Lưu thay đổi' : 'Tạo hoạt động'}</Text>}
        </TouchableOpacity>
      </ScrollView>
      <DateTimePickerModal visible={picker !== null} mode={picker?.endsWith('Date') ? 'date' : 'time'} initialValue={pickerValue} onClose={() => setPicker(null)} onSelect={selectPicker} />
    </SafeAreaView>
  );
}

function Field(props: React.ComponentProps<typeof TextInput> & { label: string }) {
  const { label, multiline, ...rest } = props;
  return <View style={styles.group}><Text style={styles.label}>{label}</Text><TextInput {...rest} multiline={multiline} style={[styles.input, multiline && styles.area]} placeholderTextColor={Colors.textMuted} /></View>;
}
function PickerButton({ text, onPress }: { text: string; onPress: () => void }) {
  return <TouchableOpacity style={[styles.input, styles.picker]} onPress={onPress}><Ionicons name="calendar-outline" size={17} color={Colors.primary} /><Text>{text}</Text></TouchableOpacity>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' }, center: { flex: 1, justifyContent: 'center', backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.textPrimary }, content: { padding: Spacing.md, paddingBottom: 40 },
  group: { marginBottom: Spacing.md }, label: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary, marginBottom: 6 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, padding: 12, fontSize: 15, color: Colors.textPrimary },
  area: { height: 105, textAlignVertical: 'top' }, row: { flexDirection: 'row', gap: 10, marginBottom: Spacing.md }, flex: { flex: 1 },
  picker: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }, submit: { backgroundColor: Colors.primary, padding: 14, borderRadius: Radius.md, alignItems: 'center' },
  disabled: { opacity: 0.6 }, submitText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
