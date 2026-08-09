import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Fonts, Spacing, Radius } from '@constants/Colors';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AuthApi from '@api/auth';
import { useAuthStore } from '@store/authStore';
import { Alert } from 'react-native';
import UserApi from '@api/user';
import * as SecureStore from 'expo-secure-store';
import { TOKEN_KEY, REFRESH_KEY } from '@api/axiosInstance';
export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore(state => state.setAuth);

  const handleLogin = async () => {
    if (loading) return;

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      Alert.alert('Lỗi', 'Vui lòng nhập email và mật khẩu');
      return;
    }
    // BE hiện chỉ hỗ trợ đăng nhập bằng email (LoginRequest validate @Email)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      Alert.alert('Lỗi', 'Email không đúng định dạng');
      return;
    }

    try {
      setLoading(true);
      const response = await AuthApi.login({ email: cleanEmail, password });

      const { token, refreshToken } = response.data.data;

      // Lưu tạm token vào SecureStore để axiosInstance lấy ra dùng cho request getMyProfile
      await SecureStore.setItemAsync(TOKEN_KEY, token);
      await SecureStore.setItemAsync(REFRESH_KEY, refreshToken);

      // Fetch hồ sơ thật từ BE
      const userRes = await UserApi.getMyProfile();

      // Lưu đầy đủ state (user, token) vào store
      await setAuth(userRes.data.data, token, refreshToken);

      router.replace('/(tabs)/home');
    } catch (error: any) {
      Alert.alert(
        'Đăng nhập thất bại',
        error.response?.data?.message || 'Không thể kết nối máy chủ, vui lòng thử lại'
      );
    } finally {
      setLoading(false);
    }
  };

  const navigateRegister = () => {
    router.push('/(auth)/register');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <View style={styles.header}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoText}>H</Text>
            </View>
            <Text style={styles.brandName}>HourLink</Text>
          </View>

          <View style={styles.titleContainer}>
            <Text style={styles.title}>Chào mừng trở lại</Text>
            <Text style={styles.subtitle}>Đăng nhập để tiếp tục kết nối cộng đồng</Text>
          </View>

          <View style={styles.formContainer}>
            {/* BE chưa hỗ trợ đăng nhập bằng SĐT — chỉ hiện Email */}
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputContainer}>
              <Feather name="mail" size={20} color={Colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="example@email.com"
                placeholderTextColor={Colors.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <Text style={[styles.label, { marginTop: Spacing.md }]}>Mật khẩu</Text>
            <View style={styles.inputContainer}>
              <Feather name="lock" size={20} color={Colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Nhập mật khẩu"
                placeholderTextColor={Colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                <Feather name={showPassword ? "eye" : "eye-off"} size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.loginButton, loading && { opacity: 0.7 }]} 
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={styles.loginButtonText}>{loading ? 'Đang xử lý...' : 'Đăng nhập'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>hoặc</Text>
            <View style={styles.divider} />
          </View>

          <View style={styles.socialContainer}>
            <TouchableOpacity style={styles.socialButton}>
              <Feather name="globe" size={20} color={Colors.primary} />
              <Text style={styles.socialButtonText}>Tiếp tục với Google</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.socialButton}>
              <Feather name="phone" size={20} color={Colors.textSecondary} />
              <Text style={styles.socialButtonText}>Tiếp tục với số điện thoại</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Chưa có tài khoản? </Text>
            <TouchableOpacity onPress={navigateRegister}>
              <Text style={styles.registerLink}>Đăng ký ngay</Text>
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
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logoBadge: {
    width: 36,
    height: 36,
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  logoText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: Fonts.bold,
  },
  brandName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    fontFamily: Fonts.bold,
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    height: 52,
    backgroundColor: Colors.bgInput,
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  forgotPasswordText: {
    color: Colors.secondary,
    fontSize: 14,
    fontFamily: Fonts.medium,
  },
  loginButton: {
    backgroundColor: Colors.primary,
    height: 52,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: Fonts.bold,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    marginHorizontal: Spacing.md,
    color: Colors.textMuted,
    fontSize: 14,
  },
  socialContainer: {
    marginBottom: Spacing.xl,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
    backgroundColor: Colors.bgInput,
  },
  socialButtonText: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontFamily: Fonts.medium,
    marginLeft: Spacing.md,
    fontWeight: '600',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    color: Colors.textSecondary,
    fontSize: 15,
  },
  registerLink: {
    color: Colors.primary,
    fontSize: 15,
    fontWeight: 'bold',
  }
});
