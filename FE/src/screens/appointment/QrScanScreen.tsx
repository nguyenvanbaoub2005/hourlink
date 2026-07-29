import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  ActivityIndicator, Alert, TextInput, ScrollView, Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Colors, Radius, Spacing } from '@constants/Colors';
import AppointmentApi from '@api/appointment';
import type { AppointmentVerificationItem } from '@types';

export default function QrScanScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [mode, setMode] = useState<'VIEW' | 'SCAN'>('VIEW');
  const [verification, setVerification] = useState<AppointmentVerificationItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [verifying, setVerifying] = useState<boolean>(false);
  const [manualCode, setManualCode] = useState<string>('');

  // Camera permissions
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState<boolean>(false);

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
      Alert.alert('Lỗi', 'Không thể tạo mã xác nhận QR. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchVerificationCode();
  }, [fetchVerificationCode]);

  const handleVerifyCode = async (codeToVerify: string) => {
    if (!id || !codeToVerify.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập hoặc quét mã hợp lệ.');
      return;
    }

    try {
      setVerifying(true);
      await AppointmentApi.verifyCode(id, { code: codeToVerify.trim() });
      Alert.alert('Thành công', 'Xác thực buổi hỗ trợ thành công! Trạng thái chuyển thành Đang diễn ra.', [
        { text: 'Đồng ý', onPress: () => router.back() }
      ]);
    } catch (err: any) {
      setScanned(false);
      Alert.alert('Xác thực thất bại', err?.response?.data?.message || 'Mã xác thực không đúng hoặc đã hết hạn.');
    } finally {
      setVerifying(false);
    }
  };

  const onBarcodeScanned = ({ data }: { data: string }) => {
    if (scanned || verifying) return;
    setScanned(true);
    handleVerifyCode(data);
  };

  const qrImageUrl = verification?.code
    ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(verification.code)}&color=1E293B&bgcolor=FFFFFF`
    : null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBack}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Xác Thực Buổi Hỗ Trợ (QR)</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Mode Switcher */}
      <View style={styles.modeBar}>
        <TouchableOpacity
          style={[styles.modeBtn, mode === 'VIEW' && styles.modeBtnActive]}
          onPress={() => setMode('VIEW')}
        >
          <Ionicons name="qr-code-outline" size={18} color={mode === 'VIEW' ? Colors.primary : Colors.textSecondary} />
          <Text style={[styles.modeText, mode === 'VIEW' && styles.modeTextActive]}>Mã QR Buổi Hỗ Trợ</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.modeBtn, mode === 'SCAN' && styles.modeBtnActive]}
          onPress={() => {
            setMode('SCAN');
            if (!permission?.granted) requestPermission();
          }}
        >
          <Ionicons name="camera-outline" size={18} color={mode === 'SCAN' ? Colors.primary : Colors.textSecondary} />
          <Text style={[styles.modeText, mode === 'SCAN' && styles.modeTextActive]}>Quét Mã Xác Nhận</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {mode === 'VIEW' ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Mã QR Xác Nhận Bắt Đầu</Text>
            <Text style={styles.cardSub}>
              Đưa mã này cho người kia quét khi hai bên bắt đầu gặp mặt hỗ trợ trực tiếp.
            </Text>

            {loading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Đang tạo mã QR...</Text>
              </View>
            ) : qrImageUrl ? (
              <View style={styles.qrContainer}>
                <Image source={{ uri: qrImageUrl }} style={styles.qrImage} />
                <Text style={styles.expiresText}>
                  <Ionicons name="time-outline" size={12} /> Có hiệu lực trong suốt thời gian diễn ra lịch hẹn.
                </Text>
              </View>
            ) : (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle-outline" size={48} color={Colors.danger} />
                <Text style={styles.errorText}>Không thể hiển thị mã QR.</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={fetchVerificationCode}>
                  <Text style={styles.retryText}>Thử lại</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Quét Mã QR của Đối Tác</Text>
            <Text style={styles.cardSub}>
              Sử dụng camera để quét mã QR từ điện thoại của đối tác nhằm xác thực bắt đầu buổi hỗ trợ.
            </Text>

            {/* Camera View */}
            <View style={styles.cameraBox}>
              {!permission ? (
                <View style={styles.camMsgBox}>
                  <ActivityIndicator size="small" color={Colors.primary} />
                  <Text style={styles.camMsg}>Đang kiểm tra quyền camera...</Text>
                </View>
              ) : !permission.granted ? (
                <View style={styles.camMsgBox}>
                  <Ionicons name="camera-reverse-outline" size={48} color={Colors.textMuted} />
                  <Text style={styles.camMsg}>Cần quyền truy cập camera để quét mã QR</Text>
                  <TouchableOpacity 
                    style={styles.permBtn} 
                    onPress={async () => {
                      if (!permission.canAskAgain) {
                        Alert.alert(
                          'Quyền bị từ chối', 
                          'Bạn đã từ chối quyền truy cập Camera. Vui lòng mở Cài đặt thiết bị để cấp quyền.',
                          [
                            { text: 'Hủy', style: 'cancel' },
                            { text: 'Mở Cài đặt', onPress: () => Linking.openSettings() }
                          ]
                        );
                      } else {
                        await requestPermission();
                      }
                    }}
                  >
                    <Text style={styles.permBtnText}>Cấp quyền Camera</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.cameraWrapper}>
                  <CameraView
                    style={StyleSheet.absoluteFillObject}
                    barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                    onBarcodeScanned={scanned ? undefined : onBarcodeScanned}
                  />
                  <View style={styles.scanOverlay}>
                    <View style={styles.scanFrame} />
                  </View>
                  {scanned && (
                    <TouchableOpacity style={styles.rescanBtn} onPress={() => setScanned(false)}>
                      <Text style={styles.rescanText}>Quét lại</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
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
  cardTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginBottom: 6, textAlign: 'center' },
  cardSub: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', marginBottom: 20, lineHeight: 18, paddingHorizontal: 12 },

  loadingBox: { paddingVertical: 40, alignItems: 'center' },
  loadingText: { marginTop: 12, color: Colors.textSecondary, fontSize: 14 },

  qrContainer: { alignItems: 'center', width: '100%' },
  qrImage: { width: 220, height: 220, marginBottom: 16, borderRadius: Radius.md },
  codeBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgCard,
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: Radius.md, marginBottom: 12,
  },
  codeLabel: { fontSize: 13, color: Colors.textSecondary, marginRight: 6 },
  codeText: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, letterSpacing: 1 },
  expiresText: { fontSize: 12, color: Colors.textMuted },

  errorBox: { paddingVertical: 30, alignItems: 'center' },
  errorText: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary, marginTop: 12, marginBottom: 16 },
  retryBtn: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: Colors.primary, borderRadius: Radius.md },
  retryText: { color: '#FFF', fontWeight: '600' },

  cameraBox: { width: '100%', height: 280, borderRadius: Radius.md, overflow: 'hidden', backgroundColor: '#0F172A', marginBottom: 20 },
  camMsgBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  camMsg: { color: '#FFF', fontSize: 14, textAlign: 'center', marginTop: 12, marginBottom: 16 },
  permBtn: { backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: Radius.md },
  permBtnText: { color: '#FFF', fontWeight: '600' },
  cameraWrapper: { flex: 1 },
  scanOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scanFrame: { width: 180, height: 180, borderWidth: 2, borderColor: '#10B981', borderRadius: Radius.md, backgroundColor: 'transparent' },
  rescanBtn: { position: 'absolute', bottom: 16, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 20, paddingVertical: 8, borderRadius: Radius.full },
  rescanText: { color: '#FFF', fontWeight: '600', fontSize: 13 },

  manualSection: { width: '100%', borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 16 },
  manualTitle: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary, marginBottom: 10 },
  inputRow: { flexDirection: 'row', gap: 10 },
  input: { flex: 1, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: Colors.textPrimary },
  verifyBtn: { backgroundColor: '#0D9488', paddingHorizontal: 20, justifyContent: 'center', alignItems: 'center', borderRadius: Radius.md },
  verifyBtnText: { color: '#FFF', fontWeight: '600', fontSize: 14 },
});
