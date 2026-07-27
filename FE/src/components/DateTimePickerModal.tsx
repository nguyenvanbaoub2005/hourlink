import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface DateTimePickerModalProps {
  visible: boolean;
  mode: 'date' | 'time';
  initialValue?: string; // YYYY-MM-DD cho date, HH:MM cho time
  onClose: () => void;
  onSelect: (value: string) => void;
  title?: string;
}

const MONTH_NAMES = [
  'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
  'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
];

const DAY_NAMES = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

export default function DateTimePickerModal({
  visible,
  mode,
  initialValue,
  onClose,
  onSelect,
  title,
}: DateTimePickerModalProps) {
  // --- Date State ---
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(today.toISOString().slice(0, 10));

  // --- Time State ---
  const [selectedHour, setSelectedHour] = useState('09');
  const [selectedMinute, setSelectedMinute] = useState('00');

  useEffect(() => {
    if (visible) {
      if (mode === 'date' && initialValue && /^\d{4}-\d{2}-\d{2}$/.test(initialValue)) {
        setSelectedDate(initialValue);
        const parts = initialValue.split('-');
        setCurrentYear(parseInt(parts[0], 10));
        setCurrentMonth(parseInt(parts[1], 10) - 1);
      } else if (mode === 'time' && initialValue && /^\d{2}:\d{2}$/.test(initialValue)) {
        const parts = initialValue.split(':');
        setSelectedHour(parts[0]);
        setSelectedMinute(parts[1]);
      }
    }
  }, [visible, mode, initialValue]);

  // --- Date Grid Logic ---
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(y => y - 1);
    } else {
      setCurrentMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(y => y + 1);
    } else {
      setCurrentMonth(m => m + 1);
    }
  };

  const handleConfirm = () => {
    if (mode === 'date') {
      onSelect(selectedDate);
    } else {
      onSelect(`${selectedHour}:${selectedMinute}`);
    }
    onClose();
  };

  const renderCalendar = () => {
    const gridCells = [];
    // Blank cells before first day
    for (let i = 0; i < firstDayOfWeek; i++) {
      gridCells.push(<View key={`empty-${i}`} style={styles.dayCell} />);
    }
    // Days in month
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
      const isSelected = selectedDate === dateStr;
      const isToday = today.toISOString().slice(0, 10) === dateStr;

      gridCells.push(
        <TouchableOpacity
          key={`day-${d}`}
          style={[
            styles.dayCell,
            isToday && !isSelected && styles.todayCell,
            isSelected && styles.selectedDayCell,
          ]}
          onPress={() => setSelectedDate(dateStr)}
        >
          <Text
            style={[
              styles.dayText,
              isToday && !isSelected && styles.todayText,
              isSelected && styles.selectedDayText,
            ]}
          >
            {d}
          </Text>
        </TouchableOpacity>
      );
    }

    return (
      <View style={styles.calendarContainer}>
        {/* Month Navigation Header */}
        <View style={styles.monthHeader}>
          <TouchableOpacity onPress={handlePrevMonth} style={styles.navBtn}>
            <Ionicons name="chevron-back" size={20} color="#0D9488" />
          </TouchableOpacity>
          <Text style={styles.monthTitle}>
            {MONTH_NAMES[currentMonth]}, {currentYear}
          </Text>
          <TouchableOpacity onPress={handleNextMonth} style={styles.navBtn}>
            <Ionicons name="chevron-forward" size={20} color="#0D9488" />
          </TouchableOpacity>
        </View>

        {/* Day Names Row */}
        <View style={styles.dayNamesRow}>
          {DAY_NAMES.map((name, idx) => (
            <Text key={name} style={[styles.dayNameText, idx === 0 && { color: '#EF4444' }]}>
              {name}
            </Text>
          ))}
        </View>

        {/* Days Grid */}
        <View style={styles.daysGrid}>{gridCells}</View>

        {/* Selected Date Preview */}
        <View style={styles.previewBox}>
          <Ionicons name="calendar" size={16} color="#0D9488" style={{ marginRight: 8 }} />
          <Text style={styles.previewText}>
            Ngày đã chọn: <Text style={{ fontWeight: 'bold', color: '#0D9488' }}>{selectedDate}</Text>
          </Text>
        </View>
      </View>
    );
  };

  const renderTimePicker = () => {
    return (
      <View style={styles.timeContainer}>
        {/* Big Preview */}
        <View style={styles.timePreviewBox}>
          <Text style={styles.timePreviewText}>
            {selectedHour} : {selectedMinute}
          </Text>
          <Text style={styles.timePreviewSubText}>Khung giờ bắt đầu đã chọn</Text>
        </View>

        {/* Hours Selector */}
        <Text style={styles.sectionTitle}>Chọn Giờ (00 - 23)</Text>
        <ScrollView style={{ maxHeight: 150 }} nestedScrollEnabled>
          <View style={styles.timeGrid}>
            {HOURS.map(h => {
              const active = selectedHour === h;
              return (
                <TouchableOpacity
                  key={`hour-${h}`}
                  style={[styles.timePill, active && styles.timePillActive]}
                  onPress={() => setSelectedHour(h)}
                >
                  <Text style={[styles.timePillText, active && styles.timePillTextActive]}>{h}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* Minutes Selector */}
        <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Chọn Phút</Text>
        <View style={styles.timeGrid}>
          {MINUTES.map(m => {
            const active = selectedMinute === m;
            return (
              <TouchableOpacity
                key={`min-${m}`}
                style={[styles.timePill, active && styles.timePillActive]}
                onPress={() => setSelectedMinute(m)}
              >
                <Text style={[styles.timePillText, active && styles.timePillTextActive]}>{m}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  if (!visible) return null;

  return (
    <View style={[StyleSheet.absoluteFillObject, styles.overlay, { zIndex: 99999, elevation: 99999 }]}>
      <View style={styles.modalCard}>
        {/* Header */}
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>
            {title || (mode === 'date' ? 'Chọn Ngày Hẹn' : 'Chọn Giờ Bắt Đầu')}
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeIconBtn}>
            <Ionicons name="close" size={22} color="#64748B" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView style={{ maxHeight: Dimensions.get('window').height * 0.65 }}>
          {mode === 'date' ? renderCalendar() : renderTimePicker()}
        </ScrollView>

        {/* Footer Actions */}
        <View style={styles.modalFooter}>
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelBtnText}>Hủy</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
            <Ionicons name="checkmark-circle-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
            <Text style={styles.confirmBtnText}>Xác nhận</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  closeIconBtn: {
    padding: 4,
  },
  calendarContainer: {
    width: '100%',
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  navBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  dayNamesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  dayNameText: {
    width: '14%',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 2,
    borderRadius: 10,
  },
  todayCell: {
    borderWidth: 1.5,
    borderColor: '#0D9488',
  },
  selectedDayCell: {
    backgroundColor: '#0D9488',
  },
  dayText: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '500',
  },
  todayText: {
    color: '#0D9488',
    fontWeight: 'bold',
  },
  selectedDayText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  previewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDFA',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CCFBF1',
    marginTop: 16,
  },
  previewText: {
    fontSize: 13,
    color: '#334155',
  },
  timeContainer: {
    width: '100%',
  },
  timePreviewBox: {
    alignItems: 'center',
    backgroundColor: '#F0FDFA',
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#CCFBF1',
    marginBottom: 16,
  },
  timePreviewText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0D9488',
    letterSpacing: 2,
  },
  timePreviewSubText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timePill: {
    width: '22%',
    paddingVertical: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  timePillActive: {
    backgroundColor: '#0D9488',
    borderColor: '#0D9488',
  },
  timePillText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  timePillTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#0D9488',
  },
  confirmBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
});
