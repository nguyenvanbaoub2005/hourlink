import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import UserApi from '@api/user';
import { InfoCard, ProfilePage } from '@components/ProfilePage';
import { Colors, Radius, Spacing } from '@constants/Colors';
import { useAuthStore } from '@store/authStore';
import { validateConfirmPassword, validatePassword } from '@utils/validation';

type PasswordFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  error?: string;
};

function PasswordField({ label, value, onChangeText, placeholder, error }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrap, error && styles.inputError]}>
        <Ionicons name="lock-closed-outline" size={20} color={Colors.textMuted} />
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.textMuted}
          secureTextEntry={!visible}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity
          style={styles.eyeButton}
          onPress={() => setVisible(current => !current)}
          accessibilityRole="button"
          accessibilityLabel={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
        >
          <Ionicons name={visible ? 'eye-outline' : 'eye-off-outline'} size={21} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

export default function SecurityScreen() {
  const logout = useAuthStore(state => state.logout);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const updateField = (
    setter: (value: string) => void,
    field: 'currentPassword' | 'newPassword' | 'confirmPassword'
  ) => (value: string) => {
    setter(value);
    setErrors(current => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const submit = async () => {
    if (submitting) return;

    const nextErrors: Record<string, string> = {};
    if (!currentPassword) nextErrors.currentPassword = 'Vui lòng nhập mật khẩu hiện tại';
    const newPasswordError = validatePassword(newPassword);
    if (newPasswordError) nextErrors.newPassword = newPasswordError;
    if (currentPassword && currentPassword === newPassword) {
      nextErrors.newPassword = 'Mật khẩu mới phải khác mật khẩu hiện tại';
    }
    const confirmationError = validateConfirmPassword(newPassword, confirmPassword);
    if (confirmationError) nextErrors.confirmPassword = confirmationError;

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    try {
      setSubmitting(true);
      await UserApi.changePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert(
        'Đổi mật khẩu thành công',
        'Vui lòng đăng nhập lại bằng mật khẩu mới để tiếp tục.',
        [{ text: 'Đăng nhập lại', onPress: () => void logout() }],
        { cancelable: false }
      );
    } catch (requestError: any) {
      const message = requestError?.response?.data?.message ?? 'Không thể đổi mật khẩu. Vui lòng thử lại.';
      if (requestError?.response?.data?.status === 1004) {
        setErrors({ currentPassword: message });
      } else {
        Alert.alert('Không thể đổi mật khẩu', message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ProfilePage title="Bảo mật">
      <InfoCard icon="lock-closed-outline" title="Đổi mật khẩu" tone="blue">
        Chọn mật khẩu riêng cho HourLink, có ít nhất 6 ký tự và không chia sẻ mật khẩu hoặc mã OTP
        trong tin nhắn.
      </InfoCard>

      <View style={styles.formCard}>
        <PasswordField
          label="Mật khẩu hiện tại"
          value={currentPassword}
          onChangeText={updateField(setCurrentPassword, 'currentPassword')}
          placeholder="Nhập mật khẩu đang dùng"
          error={errors.currentPassword}
        />
        <PasswordField
          label="Mật khẩu mới"
          value={newPassword}
          onChangeText={updateField(setNewPassword, 'newPassword')}
          placeholder="Tối thiểu 6 ký tự"
          error={errors.newPassword}
        />
        <PasswordField
          label="Nhập lại mật khẩu mới"
          value={confirmPassword}
          onChangeText={updateField(setConfirmPassword, 'confirmPassword')}
          placeholder="Nhập lại để xác nhận"
          error={errors.confirmPassword}
        />

        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitDisabled]}
          onPress={() => void submit()}
          disabled={submitting}
          activeOpacity={0.8}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitText}>Cập nhật mật khẩu</Text>
          )}
        </TouchableOpacity>
      </View>

      <Text style={styles.note}>
        Đổi mật khẩu sẽ đăng xuất phiên hiện tại. Phiên đăng nhập trên thiết bị khác không tự động bị
        đăng xuất.
      </Text>
    </ProfilePage>
  );
}

const styles = StyleSheet.create({
  formCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  field: { marginBottom: Spacing.md },
  label: { color: Colors.textPrimary, fontSize: 14, fontWeight: '600', marginBottom: 7 },
  inputWrap: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgScreen,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingLeft: 13,
  },
  inputError: { borderColor: Colors.danger, backgroundColor: '#FEF2F2' },
  input: { flex: 1, color: Colors.textPrimary, fontSize: 15, paddingHorizontal: 10, paddingVertical: 12 },
  eyeButton: { width: 46, minHeight: 50, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: Colors.danger, fontSize: 12, marginTop: 5 },
  submitButton: {
    minHeight: 52,
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  submitDisabled: { opacity: 0.65 },
  submitText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  note: { color: Colors.textMuted, fontSize: 12, lineHeight: 18, marginTop: 12, paddingHorizontal: 4 },
});
