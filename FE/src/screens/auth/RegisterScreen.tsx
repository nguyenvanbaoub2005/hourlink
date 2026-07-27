import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Fonts, Spacing, Radius } from '@constants/Colors';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AuthApi from '@api/auth';
import { useAuthStore } from '@store/authStore';
import { Alert } from 'react-native';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// SĐT Việt Nam: 10 số, bắt đầu bằng 0
const PHONE_REGEX = /^0\d{9}$/;

type FieldErrors = {
  fullName?: string;
  email?: string;
  phone?: string;
  password?: string;
};

export default function RegisterScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const setAuth = useAuthStore(state => state.setAuth);

  const validate = (): boolean => {
    const next: FieldErrors = {};

    if (!fullName.trim()) {
      next.fullName = 'Vui lòng nhập họ và tên';
    }

    if (!email.trim()) {
      next.email = 'Vui lòng nhập email';
    } else if (!EMAIL_REGEX.test(email.trim())) {
      next.email = 'Email không đúng định dạng';
    }

    // Phone không bắt buộc (BE cho phép null), nhưng nếu nhập thì phải hợp lệ
    const cleanPhone = phone.replace(/\s/g, '');
    if (cleanPhone && !PHONE_REGEX.test(cleanPhone)) {
      next.phone = 'Số điện thoại phải gồm 10 số, bắt đầu bằng 0';
    }

    if (!password) {
      next.password = 'Vui lòng nhập mật khẩu';
    } else if (password.length < 6) {
      next.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleRegister = async () => {
    if (!agreed || loading) return;
    if (!validate()) return;

    try {
      setLoading(true);
      const cleanPhone = phone.replace(/\s/g, '');
      const response = await AuthApi.register({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: cleanPhone || undefined,
        password,
      });

      const { token, refreshToken } = response.data.data;

      // Lưu token + fetch hồ sơ thật từ BE (không mock user nữa)
      await setAuth(token, refreshToken);

      router.replace('/(tabs)/home');
    } catch (error: any) {
      // BE trả message tiếng Việt theo ErrorCode (email/SĐT đã tồn tại...)
      Alert.alert(
        'Đăng ký thất bại',
        error.response?.data?.message || 'Không thể kết nối máy chủ, vui lòng thử lại'
      );
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

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <TouchableOpacity onPress={goBack} style={styles.backButton}>
            <Feather name="chevron-left" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.titleContainer}>
            <Text style={styles.subtitle}>Điền thông tin để bắt đầu hành trình của bạn</Text>
          </View>

          <View style={styles.formContainer}>
            
            {/* Họ và tên */}
            <Text style={styles.label}>Họ và tên</Text>
            <View style={[styles.inputContainer, !!errors.fullName && styles.inputError]}>
              <Feather name="user" size={20} color={Colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Nguyễn Văn Việt"
                placeholderTextColor={Colors.textMuted}
                value={fullName}
                onChangeText={(text) => { setFullName(text); if (errors.fullName) setErrors(e => ({ ...e, fullName: undefined })); }}
                autoCapitalize="words"
              />
            </View>
            {!!errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}

            {/* Email */}
            <Text style={[styles.label, { marginTop: Spacing.md }]}>Email</Text>
            <View style={[styles.inputContainer, !!errors.email && styles.inputError]}>
              <Feather name="mail" size={20} color={Colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="example@email.com"
                placeholderTextColor={Colors.textMuted}
                value={email}
                onChangeText={(text) => { setEmail(text); if (errors.email) setErrors(e => ({ ...e, email: undefined })); }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            {!!errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

            {/* Số điện thoại */}
            <Text style={[styles.label, { marginTop: Spacing.md }]}>Số điện thoại (không bắt buộc)</Text>
            <View style={[styles.inputContainer, !!errors.phone && styles.inputError]}>
              <Feather name="phone" size={20} color={Colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="0901 234 567"
                placeholderTextColor={Colors.textMuted}
                value={phone}
                onChangeText={(text) => { setPhone(text); if (errors.phone) setErrors(e => ({ ...e, phone: undefined })); }}
                keyboardType="phone-pad"
                maxLength={12}
              />
            </View>
            {!!errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}

            {/* Mật khẩu */}
            <Text style={[styles.label, { marginTop: Spacing.md }]}>Mật khẩu</Text>
            <View style={[styles.inputContainer, !!errors.password && styles.inputError]}>
              <Feather name="lock" size={20} color={Colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Ít nhất 6 ký tự"
                placeholderTextColor={Colors.textMuted}
                value={password}
                onChangeText={(text) => { setPassword(text); if (errors.password) setErrors(e => ({ ...e, password: undefined })); }}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                <Feather name={showPassword ? "eye" : "eye-off"} size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
            {!!errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

            {/* Điều khoản */}
            <TouchableOpacity 
              style={styles.checkboxContainer} 
              onPress={() => setAgreed(!agreed)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
                {agreed && <Feather name="check" size={14} color="#FFF" />}
              </View>
              <Text style={styles.checkboxText}>
                Tôi đồng ý với <Text style={styles.linkText}>Điều khoản dịch vụ</Text> và <Text style={styles.linkText}>Chính sách bảo mật</Text>
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.registerButton, (!agreed || loading) && styles.registerButtonDisabled]} 
              onPress={handleRegister}
              disabled={!agreed || loading}
            >
              <Text style={styles.registerButtonText}>{loading ? 'Đang xử lý...' : 'Đăng ký'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Đã có tài khoản? </Text>
            <TouchableOpacity onPress={navigateLogin}>
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    height: 52,
    backgroundColor: Colors.bgInput,
  },
  inputError: {
    borderColor: Colors.danger,
  },
  errorText: {
    color: Colors.danger,
    fontSize: 13,
    marginTop: Spacing.xs,
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
