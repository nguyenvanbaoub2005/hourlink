import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, TextInput, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors, Radius, Spacing } from '@constants/Colors';
import AppointmentApi from '@api/appointment';
import type { AppointmentVerificationItem } from '@types';

export default function OtpInputScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [mode, setMode] = useState<'INPUT' | 'VIEW'>('INPUT');
  const [verification, setVerification] = useState<AppointmentVerificationItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [verifying, setVerifying] = useState<boolean>(false);
  const [otpCode, setOtpCode] = useState<string>('');

  const fetchVerificationCode = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await AppointmentApi.generateVerification(id);
      if (res.data?.data) {
        setVerification(res.data.data);
      }
    } catch (err: any) {
      console.error('Error generating verification code:', err);
      Alert.alert('Lỗi', 'Không thể tạo mã OTP. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchVerificationCode();
  }, [fetchVerificationCode]);

  const handleVerifyOtp = async () => {
    if (!id || !otpCode.trim() || otpCode.trim().length < 4) {
      Alert.alert('Lỗi', 'Vui lòng nhập đủ mã OTP (thường gồm 6 chữ số).');
      return;
    }

    try {
      setVerifying(true);
      await AppointmentApi.verifyCode(id, { code: otpCode.trim() });
      Alert.alert('Thành công', 'Xác thực OTP thành công! Buổi hỗ trợ chính thức bắt đầu.', [
        { text: 'Đồng ý', onPress: () => router.back() }
      ]);
    } catch (err: any) {
      Alert.alert('Xác thực thất bại', err?.response?.data?.message || 'Mã OTP không đúng hoặc đã hết hạn.');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBack}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Xác Thực Buổi Hỗ Trợ (OTP)</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Mode Switcher */}
      <View style={styles.modeBar}>
        <TouchableOpacity
          style={[styles.modeBtn, mode === 'INPUT' && styles.modeBtnActive]}
          onPress={() => setMode('INPUT')}
        >
          <Ionicons name="keypad-outline" size={18} color={mode === 'INPUT' ? Colors.primary : Colors.textSecondary} />
          <Text style={[styles.modeText, mode === 'INPUT' && styles.modeTextActive]}>Nhập Mã OTP</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.modeBtn, mode === 'VIEW' && styles.modeBtnActive]}
          onPress={() => setMode('VIEW')}
        >
          <Ionicons name="eye-outline" size={18} color={mode === 'VIEW' ? Colors.primary : Colors.textSecondary} />
          <Text style={[styles.modeText, mode === 'VIEW' && styles.modeTextActive]}>Xem Mã OTP Buổi Học</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {mode === 'INPUT' ? (
          <View style={styles.card}>
            <View style={styles.iconCircle}>
              <Ionicons name="shield-checkmark-outline" size={32} color="#0D9488" />
            </View>
            <Text style={styles.cardTitle}>Nhập Mã OTP Xác Thực</Text>
            <Text style={styles.cardSub}>
              Khi hai bên tham gia phòng gọi Online, hãy hỏi hoặc nhận mã OTP 6 chữ số từ đối tác và nhập vào dưới đây để bắt đầu.
            </Text>

            <View style={styles.inputBox}>
              <TextInput
                style={styles.otpInput}
                placeholder="--- ---"
                placeholderTextColor={Colors.textMuted}
                value={otpCode}
                onChangeText={setOtpCode}
                keyboardType="numeric"
                maxLength={8}
                textAlign="center"
              />
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, (!otpCode.trim() || verifying) && { opacity: 0.6 }]}
              disabled={!otpCode.trim() || verifying}
              onPress={handleVerifyOtp}
            >
              {verifying ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitBtnText}>Xác Nhận Bắt Đầu</Text>}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.card}>
            <View style={[styles.iconCircle, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="key-outline" size={32} color="#D97706" />
            </View>
            <Text style={styles.cardTitle}>Mã OTP của Buổi Hỗ Trợ</Text>
            <Text style={styles.cardSub}>
              Cung cấp mã 6 chữ số này cho đối tác trong cuộc trò chuyện hoặc phòng gọi Online để họ xác nhận.
            </Text>

            {loading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Đang lấy mã OTP...</Text>
              </View>
            ) : verification?.code ? (
              <View style={styles.codeContainer}>
                <View style={styles.codeBox}>
                  <Text style={styles.otpDisplay}>{verification.code}</Text>
                </View>
                <Text style={styles.expiresText}>
                  <Ionicons name="time-outline" size={12} /> Có hiệu lực trong 2 giờ kể từ khi tạo.
                </Text>
              </View>
            ) : (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle-outline" size={48} color={Colors.danger} />
                <Text style={styles.errorText}>Không thể hiển thị mã OTP.</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={fetchVerificationCode}>
                  <Text style={styles.retryText}>Thử lại</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgScreen },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: 12, backgroundColor: '#FFF',
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerBack: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },

  modeBar: {
    flexDirection: 'row', backgroundColor: '#FFF',
    paddingHorizontal: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  modeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent', gap: 6,
  },
  modeBtnActive: { borderBottomColor: Colors.primary },
  modeText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  modeTextActive: { color: Colors.primary },

  content: { padding: Spacing.md, paddingBottom: 40 },
  card: {
    backgroundColor: '#FFF', borderRadius: Radius.lg, padding: Spacing.lg,
    borderWidth: 1, borderColor: Colors.border, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  iconCircle: {
    width: 64, height: 64, borderRadius: Radius.full, backgroundColor: '#CCFBF1',
    justifyContent: 'center', alignItems: 'center', marginBottom: 14,
  },
  cardTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginBottom: 6, textAlign: 'center' },
  cardSub: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', marginBottom: 24, lineHeight: 18, paddingHorizontal: 8 },

  inputBox: { width: '100%', marginBottom: 24 },
  otpInput: {
    borderWidth: 2, borderColor: '#0D9488', borderRadius: Radius.md,
    paddingVertical: 16, fontSize: 28, fontWeight: '700', color: Colors.textPrimary,
    letterSpacing: 8, backgroundColor: '#F0FDFA',
  },
  submitBtn: {
    width: '100%', backgroundColor: '#0D9488', paddingVertical: 14,
    borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center',
  },
  submitBtnText: { color: '#FFF', fontWeight: '700', fontSize: 15 },

  loadingBox: { paddingVertical: 40, alignItems: 'center' },
  loadingText: { marginTop: 12, color: Colors.textSecondary, fontSize: 14 },

  codeContainer: { alignItems: 'center', width: '100%' },
  codeBox: {
    backgroundColor: '#FEF3C7', paddingHorizontal: 32, paddingVertical: 18,
    borderRadius: Radius.lg, borderWidth: 1, borderColor: '#FDE68A', marginBottom: 14,
  },
  otpDisplay: { fontSize: 32, fontWeight: '700', color: '#B45309', letterSpacing: 6 },
  expiresText: { fontSize: 12, color: Colors.textMuted },

  errorBox: { paddingVertical: 30, alignItems: 'center' },
  errorText: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary, marginTop: 12, marginBottom: 16 },
  retryBtn: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: Colors.primary, borderRadius: Radius.md },
  retryText: { color: '#FFF', fontWeight: '600' },
});
