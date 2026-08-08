import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Colors, Radius, Spacing } from '@constants/Colors';

const MAX_REASON_LENGTH = 500;

type CancelAppointmentModalProps = {
  visible: boolean;
  appointmentTitle?: string;
  loading?: boolean;
  submitLabel?: string;
  onClose: () => void;
  onSubmit: (reason: string) => void | Promise<void>;
};

export default function CancelAppointmentModal({
  visible,
  appointmentTitle,
  loading = false,
  submitLabel = 'Xác nhận hủy',
  onClose,
  onSubmit,
}: CancelAppointmentModalProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!visible) {
      setReason('');
      setError('');
    }
  }, [visible]);

  const submit = () => {
    const normalizedReason = reason.trim();
    if (!normalizedReason) {
      setError('Vui lòng nhập lý do hủy lịch hẹn.');
      return;
    }
    setError('');
    onSubmit(normalizedReason);
  };

  const close = () => {
    if (!loading) onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.overlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.keyboardArea}
          >
            <View style={styles.card}>
              <Text style={styles.title}>Lý do hủy lịch hẹn</Text>
              <Text style={styles.description}>
                {appointmentTitle
                  ? `Hãy cho người còn lại biết vì sao bạn hủy “${appointmentTitle}”.`
                  : 'Hãy cho người còn lại biết vì sao bạn cần hủy lịch hẹn này.'}
              </Text>

              <Text style={styles.label}>Lý do hủy *</Text>
              <TextInput
                value={reason}
                onChangeText={(value) => {
                  setReason(value);
                  if (error && value.trim()) setError('');
                }}
                style={[styles.input, !!error && styles.inputError]}
                placeholder="Ví dụ: Tôi có việc đột xuất và không thể tham gia..."
                placeholderTextColor={Colors.textMuted}
                multiline
                maxLength={MAX_REASON_LENGTH}
                textAlignVertical="top"
                autoFocus
              />
              <View style={styles.helperRow}>
                <Text style={styles.error}>{error}</Text>
                <Text style={styles.counter}>{reason.length}/{MAX_REASON_LENGTH}</Text>
              </View>

              <View style={styles.actions}>
                <TouchableOpacity style={styles.closeButton} onPress={close} disabled={loading}>
                  <Text style={styles.closeButtonText}>Quay lại</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.submitButton, loading && styles.disabledButton]}
                  onPress={submit}
                  disabled={loading}
                >
                  {loading
                    ? <ActivityIndicator color="#FFF" />
                    : <Text style={styles.submitButtonText}>{submitLabel}</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  keyboardArea: { width: '100%' },
  card: {
    backgroundColor: '#FFF',
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 10,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  description: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
    marginBottom: 18,
    textAlign: 'center',
  },
  label: { color: Colors.textPrimary, fontSize: 13, fontWeight: '700', marginBottom: 7 },
  input: {
    minHeight: 110,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    backgroundColor: '#F8FAFC',
    color: Colors.textPrimary,
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  inputError: { borderColor: '#EF4444', backgroundColor: '#FEF2F2' },
  helperRow: {
    minHeight: 22,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 5,
  },
  error: { flex: 1, color: '#DC2626', fontSize: 12, marginRight: 8 },
  counter: { color: Colors.textMuted, fontSize: 11 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 10 },
  closeButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
    backgroundColor: Colors.bgCard,
    paddingVertical: 13,
  },
  closeButtonText: { color: Colors.textPrimary, fontSize: 14, fontWeight: '700' },
  submitButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
    backgroundColor: '#DC2626',
    paddingVertical: 13,
  },
  disabledButton: { opacity: 0.6 },
  submitButtonText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
});
