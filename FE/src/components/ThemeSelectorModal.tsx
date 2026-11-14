import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, type ThemeMode, PressableScale } from '@theme';
import { Spacing, Radius } from '@constants/Colors';

interface ThemeSelectorModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ThemeSelectorModal: React.FC<ThemeSelectorModalProps> = ({ visible, onClose }) => {
  const { colors, themeMode, setThemeMode, isDark } = useTheme();

  const options: { mode: ThemeMode; label: string; desc: string; icon: any }[] = [
    {
      mode: 'system',
      label: 'Tự động theo hệ thống',
      desc: 'Tự động chuyển sáng/tối theo cài đặt thiết bị',
      icon: 'phone-portrait-outline',
    },
    {
      mode: 'light',
      label: 'Giao diện Sáng (Light)',
      desc: 'Tối ưu độ tương phản ban ngày, dịu mắt',
      icon: 'sunny-outline',
    },
    {
      mode: 'dark',
      label: 'Giao diện Tối (Dark)',
      desc: 'Tiết kiệm pin màn hình OLED, bảo vệ mắt ban đêm',
      icon: 'moon-outline',
    },
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[
            styles.modalContainer,
            { backgroundColor: colors.surface, borderColor: colors.outlineVariant },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.headerRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="color-palette-outline" size={24} color={colors.primary} />
              <Text style={[styles.title, { color: colors.onSurface }]}>Giao diện & Dark Mode</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={22} color={colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
            Chọn chế độ hiển thị theo chuẩn Google Material 3
          </Text>

          <View style={styles.optionsWrap}>
            {options.map((opt) => {
              const isSelected = themeMode === opt.mode;
              return (
                <PressableScale
                  key={opt.mode}
                  onPress={async () => {
                    await setThemeMode(opt.mode);
                    onClose();
                  }}
                  style={[
                    styles.optionItem,
                    {
                      backgroundColor: isSelected ? colors.primaryContainer : colors.surfaceVariant,
                      borderColor: isSelected ? colors.primary : colors.outline,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.iconCircle,
                      {
                        backgroundColor: isSelected ? colors.primary : colors.surface,
                      },
                    ]}
                  >
                    <Ionicons
                      name={opt.icon}
                      size={20}
                      color={isSelected ? colors.onPrimary : colors.onSurfaceVariant}
                    />
                  </View>

                  <View style={styles.textWrap}>
                    <Text
                      style={[
                        styles.optionLabel,
                        {
                          color: isSelected ? colors.onPrimaryContainer : colors.onSurface,
                          fontWeight: isSelected ? '700' : '600',
                        },
                      ]}
                    >
                      {opt.label}
                    </Text>
                    <Text
                      style={[
                        styles.optionDesc,
                        { color: isSelected ? colors.onPrimaryContainer : colors.onSurfaceVariant },
                      ]}
                    >
                      {opt.desc}
                    </Text>
                  </View>

                  <Ionicons
                    name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                    size={22}
                    color={isSelected ? colors.primary : colors.outlineVariant}
                  />
                </PressableScale>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 420,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 13,
    marginBottom: Spacing.md,
  },
  optionsWrap: {
    gap: 10,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  textWrap: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  optionLabel: {
    fontSize: 15,
    marginBottom: 2,
  },
  optionDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
});
