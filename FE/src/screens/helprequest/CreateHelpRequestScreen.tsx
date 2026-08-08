import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@constants/Colors';
import { useRouter } from 'expo-router';
import AiMatchingApi from '@api/aimatching';

export default function CreateHelpRequestScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categoryName, setCategoryName] = useState('');
  
  const [isAiLoading, setIsAiLoading] = useState(false);

  const handleAutoCategorize = async () => {
    if (!description.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập mô tả trước khi phân loại.');
      return;
    }
    
    setIsAiLoading(true);
    try {
      const res = await AiMatchingApi.predictCategory({ description });
      const data = res.data.data;
      if (data) {
        setCategoryId(String(data.category_id));
        setCategoryName(data.category_name);
        Alert.alert('AI Phân loại', `Đã tự động chọn danh mục: ${data.category_name} (Độ tin cậy: ${(data.confidence * 100).toFixed(1)}%)`);
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể gọi AI phân loại. Vui lòng thử lại sau.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSubmit = () => {
    // Gọi API lưu HelpRequest
    Alert.alert('Thành công', 'Đã tạo yêu cầu hỗ trợ thành công (UI giả lập).');
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.header}>Tạo Yêu Cầu Hỗ Trợ</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Tiêu đề</Text>
          <TextInput
            style={styles.input}
            placeholder="VD: Cần người hướng dẫn Java Spring Boot"
            placeholderTextColor="#888"
            value={title}
            onChangeText={setTitle}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Mô tả chi tiết</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Mô tả kỹ năng bạn cần học..."
            placeholderTextColor="#888"
            multiline
            numberOfLines={4}
            value={description}
            onChangeText={setDescription}
          />
          <TouchableOpacity 
            style={styles.aiButton} 
            onPress={handleAutoCategorize}
            disabled={isAiLoading}
          >
            {isAiLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.aiButtonText}>✨ AI Tự động Phân loại Danh mục</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Danh mục (Phân loại tự động)</Text>
          <View style={styles.categoryBox}>
            <Text style={categoryName ? styles.categoryText : styles.categoryPlaceholder}>
              {categoryName ? categoryName : 'Chưa phân loại'}
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Đăng Yêu Cầu</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDark },
  scroll: { padding: 20 },
  header: { color: Colors.textPrimary, fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  inputGroup: { marginBottom: 20 },
  label: { color: Colors.textSecondary, fontSize: 14, marginBottom: 8 },
  input: {
    backgroundColor: Colors.surface,
    color: Colors.textPrimary,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333'
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  aiButton: {
    backgroundColor: '#6b21a8', // purple 800
    marginTop: 10,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  aiButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  categoryBox: {
    backgroundColor: Colors.surface,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333'
  },
  categoryText: { color: Colors.primary, fontWeight: 'bold' },
  categoryPlaceholder: { color: '#888' },
  submitButton: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16
  }
});
