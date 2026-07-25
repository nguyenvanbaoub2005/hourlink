import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Modal, FlatList, Alert, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import SkillApi from '@api/skill';
import HelpRequestApi from '@api/helprequest';

// ─── Types ─────────────────────────────────────────────────
type Category = { id: string; name: string };
type DurOption = { label: string; minutes: number; credit: number };

const DURATION_OPTIONS: DurOption[] = [
  { label: '30 phút',  minutes: 30,  credit: 0.5 },
  { label: '1 giờ',   minutes: 60,  credit: 1   },
  { label: '1,5 giờ', minutes: 90,  credit: 1.5 },
  { label: '2 giờ',   minutes: 120, credit: 2   },
];

const LEVELS = [
  { value: 'BEGINNER',     label: 'Mới bắt đầu' },
  { value: 'INTERMEDIATE', label: 'Trung bình' },
  { value: 'ADVANCED',     label: 'Nâng cao' },
  { value: 'EXPERT',       label: 'Chuyên gia' },
];

const FORMAT_MAP = {
  'Online':    'ONLINE',
  'Trực tiếp': 'OFFLINE',
  'Cả hai':   'BOTH',
};

// ─── Component ─────────────────────────────────────────────
export default function PostScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ editId?: string; editType?: 'needHelp' | 'shareSkill'; initialData?: string }>();
  const { editId, editType, initialData } = params;

  const [activeTab, setActiveTab] = useState<'needHelp' | 'shareSkill'>('needHelp');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // ── Shared ──────────────────────────────────────────────
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [format, setFormat] = useState('Online');
  const [selectedDur, setSelectedDur] = useState<DurOption>(DURATION_OPTIONS[1]);
  const [category, setCategory] = useState<Category | null>(null);
  const [region, setRegion] = useState('');

  // ── Skill-only ─────────────────────────────────────────
  const [level, setLevel] = useState('');
  const [freeTime, setFreeTime] = useState('');   // Thời gian rảnh

  // ── HelpRequest-only ───────────────────────────────────
  const [currentLevel, setCurrentLevel] = useState('');
  const [desiredTime, setDesiredTime] = useState('');  // Thời gian mong muốn

  // ── Modals ─────────────────────────────────────────────
  const [showCatModal, setShowCatModal] = useState(false);
  const [showDurModal, setShowDurModal] = useState(false);
  const [showLevelModal, setShowLevelModal] = useState(false);

  // ── Fetch categories ───────────────────────────────────
  useEffect(() => {
    SkillApi.getCategories()
      .then(res => {
        const list = res.data.data ?? [];
        const order = ['Lập trình', 'Ngôn ngữ', 'Thiết kế', 'Kinh doanh', 'Giáo dục', 'Sức khỏe', 'Nghệ thuật', 'Khác'];
        const sorted = [...list].sort((a, b) => {
          const idxA = order.indexOf(a.name);
          const idxB = order.indexOf(b.name);
          if (idxA !== -1 && idxB !== -1) return idxA - idxB;
          if (a.name === 'Khác') return 1;
          if (b.name === 'Khác') return -1;
          return 0;
        });
        setCategories(sorted);
      })
      .catch(() => setCategories([]))
      .finally(() => setLoadingCats(false));
  }, []);

  useEffect(() => {
    if (editId && initialData) {
      try {
        const data = JSON.parse(initialData);
        if (editType) setActiveTab(editType);
        setTitle(data.name || data.title || '');
        setDescription(data.description || '');
        setFormat(data.format === 'OFFLINE' ? 'Trực tiếp' : 'Online');
        setRegion(data.region || '');
        setLevel(data.level || '');
        setCurrentLevel(data.currentLevel || '');
        setFreeTime(data.freeTime || '');
        setDesiredTime(data.desiredTime || '');
        const durVal = data.duration || (data.timeCreditAmount ? data.timeCreditAmount * 60 : 60);
        const durOpt = DURATION_OPTIONS.find(d => d.minutes === durVal) || DURATION_OPTIONS[1];
        setSelectedDur(durOpt);
      } catch (e) {
        console.error('Error parsing initialData:', e);
      }
    }
  }, [editId, initialData]);

  useEffect(() => {
    if (editId && initialData && categories.length > 0 && !category) {
      try {
        const data = JSON.parse(initialData);
        const cat = categories.find(c => c.id === data.categoryId || c.name === data.categoryName);
        if (cat) setCategory(cat);
      } catch (e) {}
    }
  }, [categories, editId, initialData]);

  // ── Submit ─────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!title.trim()) return Alert.alert('Thiếu thông tin', 'Vui lòng nhập tiêu đề / tên kỹ năng.');
    if (!category)     return Alert.alert('Thiếu thông tin', 'Vui lòng chọn danh mục.');

    setSubmitting(true);
    try {
      if (editId) {
        if (activeTab === 'shareSkill') {
          await SkillApi.updateSkill(editId, {
            name:        title,
            description,
            level,
            format:      FORMAT_MAP[format as keyof typeof FORMAT_MAP],
            duration:    selectedDur.minutes,
            freeTime,
            region,
            categoryId:  category.id,
          });
          Alert.alert('Thành công 🎉', 'Kỹ năng của bạn đã được cập nhật!');
        } else {
          await HelpRequestApi.updateRequest(editId, {
            title,
            description,
            currentLevel,
            format:      FORMAT_MAP[format as keyof typeof FORMAT_MAP],
            desiredTime,
            duration:    selectedDur.minutes,
            region,
            categoryId:  category.id,
          });
          Alert.alert('Thành công 🎉', 'Yêu cầu hỗ trợ đã được cập nhật!');
        }
      } else if (activeTab === 'shareSkill') {
        if (!level) return Alert.alert('Thiếu thông tin', 'Vui lòng chọn trình độ.');
        await SkillApi.createSkill({
          name:        title,
          description,
          level,
          format:      FORMAT_MAP[format as keyof typeof FORMAT_MAP],
          duration:    selectedDur.minutes,
          freeTime,
          region,
          categoryId:  category.id,
        });
        Alert.alert('Thành công 🎉', 'Kỹ năng của bạn đã được đăng!');
      } else {
        await HelpRequestApi.createRequest({
          title,
          description,
          currentLevel,
          format:      FORMAT_MAP[format as keyof typeof FORMAT_MAP],
          desiredTime,
          duration:    selectedDur.minutes,
          region,
          categoryId:  category.id,
        });
        Alert.alert('Thành công 🎉', 'Yêu cầu của bạn đã được đăng. AI sẽ tìm người phù hợp!');
      }

      // Reset
      setTitle(''); setDescription(''); setRegion('');
      setCategory(null); setFreeTime(''); setDesiredTime('');
      setLevel(''); setCurrentLevel('');
      router.back();
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? 'Có lỗi xảy ra, vui lòng thử lại.';
      Alert.alert('Lỗi', msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Reusable dropdown row ──────────────────────────────
  const PickerRow = ({ label, value, onPress }: { label: string; value: string; onPress: () => void }) => (
    <>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={styles.picker} onPress={onPress}>
        <Text style={[styles.pickerText, !value && { color: Colors.textMuted }]}>
          {value || `Chọn ${label.toLowerCase()}`}
        </Text>
        <Ionicons name="chevron-down" size={20} color={Colors.textMuted} />
      </TouchableOpacity>
    </>
  );

  const SelectModal = ({
    visible, title: modalTitle, data, selected, keyExtractor, labelExtractor, onSelect, onClose,
  }: {
    visible: boolean; title: string;
    data: any[]; selected: string;
    keyExtractor: (i: any) => string;
    labelExtractor: (i: any) => string;
    onSelect: (i: any) => void; onClose: () => void;
  }) => (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.sheetHandle} />
        <Text style={styles.sheetTitle}>{modalTitle}</Text>
        <FlatList
          data={data}
          keyExtractor={keyExtractor}
          renderItem={({ item }) => {
            const lbl = labelExtractor(item);
            const isSelected = selected === keyExtractor(item) || selected === lbl;
            return (
              <TouchableOpacity style={[styles.sheetItem, isSelected && styles.sheetItemActive]}
                onPress={() => { onSelect(item); onClose(); }}>
                <Text style={[styles.sheetItemText, isSelected && { color: Colors.primary, fontWeight: 'bold' }]}>{lbl}</Text>
                {isSelected && <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />}
              </TouchableOpacity>
            );
          }}
        />
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { flexDirection: 'row', alignItems: 'center' }]}>
        {editId ? (
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
            <Ionicons name="chevron-back" size={26} color={Colors.textPrimary} />
          </TouchableOpacity>
        ) : null}
        <Text style={styles.headerTitle}>
          {editId ? (activeTab === 'needHelp' ? 'Chỉnh sửa yêu cầu' : 'Chỉnh sửa kỹ năng') : 'Đăng bài'}
        </Text>
      </View>

      {/* Tab Switch */}
      {!editId && (
        <View style={styles.tabBar}>
          {(['needHelp', 'shareSkill'] as const).map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab === 'needHelp' ? '🙋 Cần hỗ trợ' : '🤝 Chia sẻ kỹ năng'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>

        {/* Category */}
        {loadingCats ? (
          <ActivityIndicator color={Colors.primary} style={{ marginVertical: 12 }} />
        ) : (
          <PickerRow label="Danh mục" value={category?.name ?? ''} onPress={() => setShowCatModal(true)} />
        )}

        {/* Title */}
        <Text style={styles.label}>{activeTab === 'needHelp' ? 'Tiêu đề' : 'Tên kỹ năng'}</Text>
        <TextInput
          style={styles.input}
          placeholder={activeTab === 'needHelp' ? 'VD: Hướng dẫn Spring Boot JWT' : 'VD: Dạy tiếng Nhật N3'}
          value={title} onChangeText={setTitle}
        />

        {/* Description */}
        <Text style={styles.label}>Mô tả chi tiết</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder={activeTab === 'needHelp'
            ? 'Mô tả vấn đề bạn đang gặp phải...\nVD: Tôi đã biết Java cơ bản nhưng chưa biết cách làm đăng nhập JWT.'
            : 'Mô tả nội dung, phương pháp dạy...\nVD: Biến & kiểu dữ liệu, OOP cơ bản, vòng lặp...'}
          value={description} onChangeText={setDescription}
          multiline numberOfLines={4}
        />

        {/* Skill-only: Level + FreeTime */}
        {activeTab === 'shareSkill' && (
          <>
            <PickerRow label="Trình độ" value={LEVELS.find(l => l.value === level)?.label ?? ''} onPress={() => setShowLevelModal(true)} />

            <Text style={styles.label}>Thời gian rảnh</Text>
            <TextInput
              style={styles.input}
              placeholder="VD: Tối thứ Bảy, Chủ Nhật sau 18:00"
              value={freeTime} onChangeText={setFreeTime}
            />
          </>
        )}

        {/* HelpRequest-only: CurrentLevel + DesiredTime */}
        {activeTab === 'needHelp' && (
          <>
            <Text style={styles.label}>Mức độ hiện tại của bạn</Text>
            <TextInput
              style={styles.input}
              placeholder="VD: Đã biết Java cơ bản, chưa làm API"
              value={currentLevel} onChangeText={setCurrentLevel}
            />

            <Text style={styles.label}>Thời gian mong muốn</Text>
            <TextInput
              style={styles.input}
              placeholder="VD: Cuối tuần buổi tối, linh động"
              value={desiredTime} onChangeText={setDesiredTime}
            />
          </>
        )}

        {/* Duration + Credit */}
        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.label}>Thời lượng</Text>
            <TouchableOpacity style={styles.picker} onPress={() => setShowDurModal(true)}>
              <Text style={styles.pickerText}>{selectedDur.label}</Text>
              <Ionicons name="chevron-down" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={styles.label}>Time Credit</Text>
            <View style={[styles.picker, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}>
              <Text style={[styles.pickerText, { color: Colors.accent, fontWeight: 'bold' }]}>
                ⏱ {selectedDur.credit} TC
              </Text>
              <Text style={{ fontSize: 11, color: Colors.textMuted }}>tự động</Text>
            </View>
          </View>
        </View>

        {/* Format */}
        <Text style={styles.label}>Hình thức</Text>
        <View style={styles.formatRow}>
          {Object.keys(FORMAT_MAP).map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.formatBtn, format === f && (activeTab === 'needHelp' ? styles.formatBtnActiveHelp : styles.formatBtnActiveSkill)]}
              onPress={() => setFormat(f)}
            >
              <Text style={[styles.formatBtnText, format === f && { color: '#fff', fontWeight: 'bold' }]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Region */}
        <Text style={styles.label}>Khu vực</Text>
        <TextInput
          style={styles.input}
          placeholder="VD: TP.HCM, Hà Nội, Huế, Online toàn quốc"
          value={region} onChangeText={setRegion}
        />

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitBtn,
            activeTab === 'needHelp' ? { backgroundColor: Colors.primary } : { backgroundColor: '#38bdf8' },
            submitting && { opacity: 0.6 }
          ]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.submitBtnText}>
                {editId ? '💾 Lưu thay đổi' : (activeTab === 'needHelp' ? '🤖 Đăng yêu cầu • AI tìm người' : '✨ Đăng kỹ năng')}
              </Text>
          }
        </TouchableOpacity>
      </View>

      {/* ── Modals ── */}
      <SelectModal
        visible={showCatModal} title="Chọn danh mục"
        data={categories} selected={category?.id ?? ''}
        keyExtractor={i => i.id} labelExtractor={i => i.name}
        onSelect={setCategory} onClose={() => setShowCatModal(false)}
      />
      <SelectModal
        visible={showDurModal} title="Chọn thời lượng"
        data={DURATION_OPTIONS} selected={selectedDur.label}
        keyExtractor={i => i.label} labelExtractor={i => i.label}
        onSelect={setSelectedDur} onClose={() => setShowDurModal(false)}
      />
      <SelectModal
        visible={showLevelModal} title="Chọn trình độ"
        data={LEVELS} selected={level}
        keyExtractor={i => i.value} labelExtractor={i => i.label}
        onSelect={i => setLevel(i.value)} onClose={() => setShowLevelModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: '#fff' },
  header:        { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12, backgroundColor: '#fff' },
  headerTitle:   { fontSize: 24, fontWeight: 'bold', color: Colors.textPrimary },

  tabBar:        { flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 12, gap: 8, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: Colors.border },
  tab:           { flex: 1, paddingVertical: 11, alignItems: 'center', borderRadius: 10, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: 'transparent' },
  tabActive:     { backgroundColor: '#fff', borderColor: Colors.border },
  tabText:       { fontSize: 13, fontWeight: '600', color: Colors.textMuted },
  tabTextActive: { color: Colors.primary },

  form:          { flex: 1, paddingHorizontal: 16 },
  label:         { fontSize: 14, fontWeight: '600', color: Colors.textPrimary, marginTop: 16, marginBottom: 6 },

  input:         { backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.border, borderRadius: 10, padding: 12, fontSize: 15, color: Colors.textPrimary },
  textarea:      { height: 110, textAlignVertical: 'top' },

  picker:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.border, borderRadius: 10, padding: 12 },
  pickerText:    { fontSize: 15, color: Colors.textPrimary },

  row:           { flexDirection: 'row', marginTop: 4 },

  formatRow:     { flexDirection: 'row', gap: 8 },
  formatBtn:     { flex: 1, paddingVertical: 11, alignItems: 'center', borderRadius: 10, backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.border },
  formatBtnActiveHelp:  { backgroundColor: Colors.primary, borderColor: Colors.primary },
  formatBtnActiveSkill: { backgroundColor: '#38bdf8', borderColor: '#38bdf8' },
  formatBtnText: { fontSize: 14, fontWeight: '500', color: Colors.textMuted },

  footer:        { padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: Colors.border },
  submitBtn:     { paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  // Modal bottom sheet
  overlay:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet:         { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 16, paddingBottom: 32, maxHeight: '60%' },
  sheetHandle:   { width: 40, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginVertical: 12 },
  sheetTitle:    { fontSize: 18, fontWeight: 'bold', color: Colors.textPrimary, marginBottom: 12, textAlign: 'center' },
  sheetItem:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
  sheetItemActive:{ backgroundColor: '#F0FDF4', borderRadius: 8, paddingHorizontal: 8 },
  sheetItemText: { fontSize: 16, color: Colors.textPrimary },
});
