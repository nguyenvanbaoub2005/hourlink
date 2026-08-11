import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Fonts, Spacing, Radius } from '@constants/Colors';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AuthApi from '@api/auth';
import UserApi from '@api/user';
import { useAuthStore } from '@store/authStore';
import type { UserResponse } from '@types';
import {
  normalizePhone,
  validateConfirmPassword,
  validateEmail,
  validateFullName,
  validatePassword,
  validatePhone,
} from '@utils/validation';

type FormField = 'fullName' | 'email' | 'phone' | 'password' | 'confirmPassword';
type FormErrors = Partial<Record<FormField, string>>;

/** BE trả về ApiResponse.error(errorCode, message) — map một số mã về đúng field */
const ERROR_CODE_FIELD: Record<number, FormField> = {
  1001: 'email',   // EMAIL_ALREADY_EXISTS
  1002: 'phone',   // PHONE_ALREADY_EXISTS
};

export default function RegisterScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore(state => state.setAuth);
  const setUser = useAuthStore(state => state.setUser);

  const clearError = (field: FormField) => {
    setErrors(prev => (prev[field] ? { ...prev, [field]: undefined } : prev));
  };

  const validateForm = (): FormErrors => {
    const next: FormErrors = {
      fullName: validateFullName(fullName) ?? undefined,
      email: validateEmail(email) ?? undefined,
      phone: validatePhone(phone) ?? undefined,
      password: validatePassword(password) ?? undefined,
      confirmPassword: validateConfirmPassword(password, confirmPassword) ?? undefined,
    };
    // Bỏ các field không có lỗi để dễ kiểm tra
    (Object.keys(next) as FormField[]).forEach(key => {
      if (!next[key]) delete next[key];
    });
    return next;
  };

  const handleRegister = async () => {
    if (loading) return;

    if (!agreed) {
      Alert.alert('Điều khoản', 'Vui lòng đồng ý với Điều khoản dịch vụ và Chính sách bảo mật');
      return;
    }

    const formErrors = validateForm();
    setErrors(formErrors);
    if (Object.keys(formErrors).length > 0) return;

    const cleanEmail = email.trim().toLowerCase();
    const cleanFullName = fullName.trim();
    const cleanPhone = normalizePhone(phone);

    try {
      setLoading(true);
      const response = await AuthApi.register({
        fullName: cleanFullName,
        email: cleanEmail,
        password,
        // BE check trùng phone khi khác null → không gửi field nếu bỏ trống
        ...(cleanPhone ? { phone: cleanPhone } : {}),
      });

      const { token, refreshToken } = response.data.data;

      // Lưu token trước để interceptor có Bearer token cho request /users/profile
      const provisionalUser: UserResponse = {
        id: '',
        fullName: cleanFullName,
        email: cleanEmail,
        phone: cleanPhone || undefined,
        userType: 'individual',
        isVerified: false,
        isLocked: false,
        reputationScore: 0,
        completedSessions: 0,
        cancelRate: 0,
        createdAt: new Date().toISOString(),
      };
      await setAuth(provisionalUser, token, refreshToken);

      // Lấy hồ sơ thật từ BE (id, avatar, ví…), lỗi thì vẫn cho vào app với thông tin tạm
      try {
        const profileRes = await UserApi.getMyProfile();
        if (profileRes.data?.data) setUser(profileRes.data.data);
      } catch {
        // Bỏ qua — hồ sơ sẽ được load lại ở màn Home/Profile
      }

      router.replace('/(tabs)/home');
    } catch (error: any) {
      const body = error?.response?.data;
      const field = body?.status ? ERROR_CODE_FIELD[body.status] : undefined;

      if (field && body?.message) {
        setErrors(prev => ({ ...prev, [field]: body.message }));
        return;
      }

      const message =
        body?.message ||
        (error?.message === 'Network Error'
          ? 'Không kết nối được máy chủ. Vui lòng kiểm tra kết nối mạng.'
          : 'Có lỗi xảy ra, vui lòng thử lại');
      Alert.alert('Đăng ký thất bại', message);
    } finally {
      setLoading(false);
    }
  };

  const navigateLogin = () => {
    router.push('/(auth)/login');
  };

  const goBack = () => {
    router.back();
  };

  // Nút vẫn bấm được khi chưa tick điều khoản để hiện thông báo giải thích lý do
  const isSubmitDimmed = !agreed || loading;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          <TouchableOpacity onPress={goBack} style={styles.backButton}>
            <Feather name="chevron-left" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.titleContainer}>
            <Text style={styles.title}>Tạo tài khoản</Text>
            <Text style={styles.subtitle}>Điền thông tin để bắt đầu hành trình của bạn</Text>
          </View>

          <View style={styles.formContainer}>

            {/* Họ và tên */}
            <Text style={styles.label}>Họ và tên</Text>
            <View style={[styles.inputContainer, errors.fullName && styles.inputContainerError]}>
              <Feather name="user" size={20} color={Colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Nguyễn Văn Việt"
                placeholderTextColor={Colors.textMuted}
                value={fullName}
                onChangeText={(text) => { setFullName(text); clearError('fullName'); }}
                autoCapitalize="words"
                returnKeyType="next"
                editable={!loading}
              />
            </View>
            {!!errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}

            {/* Email */}
            <Text style={[styles.label, { marginTop: Spacing.md }]}>Email</Text>
            <View style={[styles.inputContainer, errors.email && styles.inputContainerError]}>
              <Feather name="mail" size={20} color={Colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="example@email.com"
                placeholderTextColor={Colors.textMuted}
                value={email}
                onChangeText={(text) => { setEmail(text); clearError('email'); }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                returnKeyType="next"
                editable={!loading}
              />
            </View>
            {!!errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

            {/* Số điện thoại */}
            <Text style={[styles.label, { marginTop: Spacing.md }]}>
              Số điện thoại <Text style={styles.optionalText}>(không bắt buộc)</Text>
            </Text>
            <View style={[styles.inputContainer, errors.phone && styles.inputContainerError]}>
              <Feather name="phone" size={20} color={Colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="0901234567"
                placeholderTextColor={Colors.textMuted}
                value={phone}
                onChangeText={(text) => { setPhone(text); clearError('phone'); }}
                keyboardType="phone-pad"
                maxLength={15}
                editable={!loading}
              />
            </View>
            {!!errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}

            {/* Mật khẩu */}
            <Text style={[styles.label, { marginTop: Spacing.md }]}>Mật khẩu</Text>
            <View style={[styles.inputContainer, errors.password && styles.inputContainerError]}>
              <Feather name="lock" size={20} color={Colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Ít nhất 6 ký tự"
                placeholderTextColor={Colors.textMuted}
                value={password}
                onChangeText={(text) => { setPassword(text); clearError('password'); clearError('confirmPassword'); }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoComplete="new-password"
                editable={!loading}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                <Feather name={showPassword ? "eye" : "eye-off"} size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
            {!!errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

            {/* Nhập lại mật khẩu */}
            <Text style={[styles.label, { marginTop: Spacing.md }]}>Nhập lại mật khẩu</Text>
            <View style={[styles.inputContainer, errors.confirmPassword && styles.inputContainerError]}>
              <Feather name="lock" size={20} color={Colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Nhập lại mật khẩu"
                placeholderTextColor={Colors.textMuted}
                value={confirmPassword}
                onChangeText={(text) => { setConfirmPassword(text); clearError('confirmPassword'); }}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoComplete="new-password"
                returnKeyType="done"
                onSubmitEditing={handleRegister}
                editable={!loading}
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
                <Feather name={showConfirmPassword ? "eye" : "eye-off"} size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
            {!!errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}

            {/* Điều khoản */}
            <View style={styles.checkboxContainer}>
              <TouchableOpacity
                onPress={() => setAgreed(!agreed)}
                activeOpacity={0.7}
                disabled={loading}
                hitSlop={8}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: agreed, disabled: loading }}
                accessibilityLabel="Đồng ý với điều khoản và chính sách quyền riêng tư"
              >
                <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
                  {agreed && <Feather name="check" size={14} color="#FFF" />}
                </View>
              </TouchableOpacity>
              <Text style={styles.checkboxText}>
                Tôi đồng ý với{' '}
                <Text
                  style={styles.linkText}
                  onPress={() => !loading && router.push('/legal/terms' as any)}
                >
                  Điều khoản dịch vụ
                </Text>
                {' '}và{' '}
                <Text
                  style={styles.linkText}
                  onPress={() => !loading && router.push('/legal/privacy' as any)}
                >
                  Chính sách quyền riêng tư
                </Text>
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.registerButton, isSubmitDimmed && styles.registerButtonDisabled]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.registerButtonText}>Đăng ký</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Đã có tài khoản? </Text>
            <TouchableOpacity onPress={navigateLogin} disabled={loading}>
              <Text style={styles.loginLink}>Đăng nhập</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgLight,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xxl,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  titleContainer: {
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    fontFamily: Fonts.bold,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontFamily: Fonts.regular,
  },
  formContainer: {
    marginBottom: Spacing.xl,
  },
  label: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontFamily: Fonts.medium,
    marginBottom: Spacing.sm,
    fontWeight: '600',
  },
  optionalText: {
    color: Colors.textMuted,
    fontWeight: '400',
    fontSize: 13,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    height: 52,
    backgroundColor: Colors.bgInput,
  },
  inputContainerError: {
    borderColor: Colors.danger,
  },
  errorText: {
    color: Colors.danger,
    fontSize: 13,
    marginTop: Spacing.xs,
    fontFamily: Fonts.regular,
  },
  inputIcon: {
    paddingHorizontal: Spacing.md,
  },
  input: {
    flex: 1,
    height: '100%',
    color: Colors.textPrimary,
    fontFamily: Fonts.regular,
    fontSize: 15,
  },
  eyeIcon: {
    paddingHorizontal: Spacing.md,
    height: '100%',
    justifyContent: 'center',
  },
  checkboxContainer: {
    flexDirection: 'row',
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: Spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
    backgroundColor: Colors.bgInput,
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkboxText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  linkText: {
    color: Colors.secondary,
    fontWeight: '600',
  },
  registerButton: {
    backgroundColor: Colors.primary,
    height: 52,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerButtonDisabled: {
    backgroundColor: '#86EFAC', // Lighter green for disabled state
  },
  registerButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: Fonts.bold,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  loginText: {
    color: Colors.textSecondary,
    fontSize: 15,
  },
  loginLink: {
    color: Colors.secondary,
    fontSize: 15,
    fontWeight: 'bold',
  }
});
