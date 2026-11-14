import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Animated,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { create } from 'zustand';
import { useTheme } from '../theme/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export type AlertType = 'offline' | 'success' | 'warning' | 'error' | 'info';

export interface AlertOptions {
  type?: AlertType;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface AlertStoreState {
  isOpen: boolean;
  options: AlertOptions;
  showAlert: (options: AlertOptions) => void;
  hideAlert: () => void;
}

export const useAlertStore = create<AlertStoreState>((set) => ({
  isOpen: false,
  options: {
    title: '',
    message: '',
    confirmText: 'Đã hiểu',
  },
  showAlert: (options: AlertOptions) => set({ isOpen: true, options }),
  hideAlert: () => set({ isOpen: false }),
}));

/**
 * Hàm toàn cục tiện lợi để gọi popup đẹp ở bất kỳ đâu trong app
 */
export const showAppAlert = (options: AlertOptions) => {
  useAlertStore.getState().showAlert(options);
};

const TYPE_CONFIG: Record<
  AlertType,
  { icon: React.ComponentProps<typeof Ionicons>['name']; color: string; bg: string; btnColor: string }
> = {
  offline: {
    icon: 'cloud-offline',
    color: '#D97706',
    bg: '#FEF3C7',
    btnColor: '#D97706',
  },
  warning: {
    icon: 'alert-circle',
    color: '#EA580C',
    bg: '#FFEDD5',
    btnColor: '#EA580C',
  },
  success: {
    icon: 'checkmark-circle',
    color: '#16A34A',
    bg: '#DCFCE7',
    btnColor: '#16A34A',
  },
  error: {
    icon: 'close-circle',
    color: '#DC2626',
    bg: '#FEE2E2',
    btnColor: '#DC2626',
  },
  info: {
    icon: 'information-circle',
    color: '#4F46E5',
    bg: '#EEF2FF',
    btnColor: '#4F46E5',
  },
};

export const AppAlertModal: React.FC = () => {
  const { isOpen, options, hideAlert } = useAlertStore();
  const { colors, isDark } = useTheme();

  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const type = options.type || 'info';
  const cfg = TYPE_CONFIG[type] ?? TYPE_CONFIG.info;

  useEffect(() => {
    if (isOpen) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 60,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.85);
      opacityAnim.setValue(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    hideAlert();
    options.onConfirm?.();
  };

  const handleCancel = () => {
    hideAlert();
    options.onCancel?.();
  };

  return (
    <Modal
      transparent
      visible={isOpen}
      animationType="none"
      statusBarTranslucent
      onRequestClose={hideAlert}
    >
      <View style={styles.backdrop}>
        <Animated.View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
              borderColor: isDark ? '#334155' : 'rgba(0,0,0,0.06)',
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          {/* Vòng tròn biểu tượng tinh tế */}
          <View style={[styles.iconCircle, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : cfg.bg }]}>
            <Ionicons name={cfg.icon} size={34} color={cfg.color} />
          </View>

          {/* Tiêu đề & Nội dung */}
          <Text style={[styles.title, { color: colors.textPrimary }]}>{options.title}</Text>
          <Text style={[styles.message, { color: isDark ? '#94A3B8' : '#64748B' }]}>{options.message}</Text>

          {/* Nút hành động */}
          <View style={styles.actionRow}>
            {options.cancelText && (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleCancel}
                style={[styles.cancelBtn, { borderColor: isDark ? '#334155' : '#E2E8F0' }]}
              >
                <Text style={[styles.cancelBtnText, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                  {options.cancelText}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleConfirm}
              style={[
                styles.confirmBtn,
                { backgroundColor: cfg.btnColor },
                !options.cancelText && styles.confirmBtnFull,
              ]}
            >
              <Text style={styles.confirmBtnText}>{options.confirmText || 'Đã hiểu'}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: Math.min(SCREEN_WIDTH - 48, 330),
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 22,
    paddingHorizontal: 6,
  },
  actionRow: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'center',
    gap: 10,
  },
  confirmBtn: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  confirmBtnFull: {
    width: '100%',
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  cancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
