import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Fonts, Spacing, Radius } from '@constants/Colors';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AuthApi from '@api/auth';
import { useAuthStore } from '@store/authStore';
import { Alert } from 'react-native';

export default function RegisterScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore(state => state.setAuth);

  const handleRegister = async () => {
    if (!agreed) return;
    
    if (!fullName || !email || !password) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ họ tên, email và mật khẩu');
      return;
    }

    try {
      setLoading(true);
      const response = await AuthApi.register({ fullName, email, phone, password });
      
      const { token, refreshToken } = response.data.data;
      
      await setAuth({ id: '1', email, fullName } as any, token, refreshToken);
      
      router.replace('/(tabs)/home');
    } catch (error: any) {
      Alert.alert('Đăng ký thất bại', error.response?.data?.message || 'Có lỗi xảy ra');
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
            <View style={styles.inputContainer}>
              <Feather name="user" size={20} color={Colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Nguyễn Văn Việt"
                placeholderTextColor={Colors.textMuted}
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
              />
            </View>

            {/* Email */}
            <Text style={[styles.label, { marginTop: Spacing.md }]}>Email</Text>
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

            {/* Số điện thoại */}
            <Text style={[styles.label, { marginTop: Spacing.md }]}>Số điện thoại</Text>
            <View style={styles.inputContainer}>
              <Feather name="phone" size={20} color={Colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="0901 234 567"
                placeholderTextColor={Colors.textMuted}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>

            {/* Mật khẩu */}
            <Text style={[styles.label, { marginTop: Spacing.md }]}>Mật khẩu</Text>
            <View style={styles.inputContainer}>
              <Feather name="lock" size={20} color={Colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Ít nhất 8 ký tự"
                placeholderTextColor={Colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                <Feather name={showPassword ? "eye" : "eye-off"} size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

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
