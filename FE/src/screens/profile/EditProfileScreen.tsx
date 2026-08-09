import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius } from '@constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import UserApi from '@api/user';
import type { UserResponse, ProfileUpdateRequest } from '@types';

export default function EditProfileScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileUpdateRequest>({
    fullName: '',
    bio: '',
    region: '',
    phone: '',
    email: '',
    occupation: '',
    languages: '',
    avatarUrl: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await UserApi.getMyProfile();
      const user = res.data.data;
      setProfile({
        fullName: user.fullName || '',
        bio: user.bio || '',
        region: user.region || '',
        phone: user.phone || '',
        email: user.email || '',
        occupation: user.occupation || '',
        languages: user.languages || '',
        avatarUrl: user.avatarUrl || ''
      });
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể tải thông tin hồ sơ.');
    } finally {
      setLoading(false);
    }
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      const base64Img = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setProfile({ ...profile, avatarUrl: base64Img });
    }
  };

  const handleSave = async () => {
    if (!profile.fullName.trim()) {
      Alert.alert('Lỗi', 'Họ và tên không được để trống.');
      return;
    }

    setSaving(true);
    try {
      await UserApi.updateMyProfile(profile);
      Alert.alert('Thành công', 'Hồ sơ đã được cập nhật!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi cập nhật hồ sơ.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chỉnh sửa hồ sơ</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          <Text style={[styles.saveText, saving && { opacity: 0.5 }]}>
            {saving ? 'Đang lưu...' : 'Lưu'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={handlePickImage} style={styles.avatarWrapper}>
            {profile.avatarUrl ? (
              <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarInitial}>
                  {profile.fullName ? profile.fullName.charAt(0).toUpperCase() : '?'}
                </Text>
              </View>
            )}
            <View style={styles.editIconBadge}>
              <Ionicons name="pencil" size={14} color="#fff" />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Họ và tên</Text>
          <TextInput
            style={styles.input}
            value={profile.fullName}
            onChangeText={(text) => setProfile({ ...profile, fullName: text })}
            placeholder="Nhập họ và tên"
            placeholderTextColor={Colors.textMuted}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Giới thiệu</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={profile.bio}
            onChangeText={(text) => setProfile({ ...profile, bio: text })}
            placeholder="Viết vài dòng giới thiệu về bản thân..."
            placeholderTextColor={Colors.textMuted}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Nghề nghiệp</Text>
          <TextInput
            style={styles.input}
            value={profile.occupation}
            onChangeText={(text) => setProfile({ ...profile, occupation: text })}
            placeholder="Sinh viên, Kỹ sư, Lập trình viên..."
            placeholderTextColor={Colors.textMuted}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Khu vực</Text>
          <TextInput
            style={styles.input}
            value={profile.region}
            onChangeText={(text) => setProfile({ ...profile, region: text })}
            placeholder="Thành phố, Quận..."
            placeholderTextColor={Colors.textMuted}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Ngôn ngữ</Text>
          <TextInput
            style={styles.input}
            value={profile.languages}
            onChangeText={(text) => setProfile({ ...profile, languages: text })}
            placeholder="Tiếng Việt, Tiếng Anh..."
            placeholderTextColor={Colors.textMuted}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Số điện thoại</Text>
          <TextInput
            style={styles.input}
            value={profile.phone}
            onChangeText={(text) => setProfile({ ...profile, phone: text })}
            placeholder="Số điện thoại liên lạc"
            placeholderTextColor={Colors.textMuted}
            keyboardType="phone-pad"
          />
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Email đăng nhập</Text>
          <TextInput
            style={[styles.input, styles.readOnlyInput]}
            value={profile.email}
            placeholder="Địa chỉ email"
            placeholderTextColor={Colors.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={false}
          />
          <Text style={styles.fieldHint}>Email không thể đổi trực tiếp để bảo vệ tài khoản.</Text>
        </View>
        
        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, backgroundColor: Colors.bgScreen, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, backgroundColor: Colors.bgScreen },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: Colors.textPrimary },
  saveText: { color: Colors.primary, fontSize: 16, fontWeight: '600', padding: 4 },
  content: { padding: Spacing.md },
  avatarSection: { alignItems: 'center', marginBottom: Spacing.xl, marginTop: Spacing.sm },
  avatarWrapper: { position: 'relative' },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  avatarPlaceholder: { backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { color: '#fff', fontSize: 40, fontWeight: 'bold' },
  editIconBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.primary,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff'
  },
  formGroup: { marginBottom: Spacing.md },
  label: { fontSize: 14, color: Colors.textSecondary, marginBottom: Spacing.xs, fontWeight: '500' },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
    fontSize: 16,
    color: Colors.textPrimary
  },
  readOnlyInput: { backgroundColor: '#F1F5F9', color: Colors.textSecondary },
  fieldHint: { color: Colors.textMuted, fontSize: 12, marginTop: 6 },
  textArea: { minHeight: 100 }
});
