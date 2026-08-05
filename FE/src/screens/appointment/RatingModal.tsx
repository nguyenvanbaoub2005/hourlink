import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import RatingApi, { RatingRequest } from '@api/rating';

interface Props {
  visible: boolean;
  appointmentId: string;
  toUserId: string;
  toUserName: string;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * RatingModal — Modal đánh giá sao sau khi hoàn thành lịch hẹn (Task 32).
 */
const RatingModal: React.FC<Props> = ({
  visible,
  appointmentId,
  toUserId,
  toUserName,
  onClose,
  onSuccess,
}) => {
  const [score, setScore] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (score === 0) {
      Alert.alert('Thiếu thông tin', 'Vui lòng chọn số sao để đánh giá.');
      return;
    }

    const payload: RatingRequest = {
      appointmentId,
      toUserId,
      score,
      comment: comment.trim() || undefined,
    };

    try {
      setLoading(true);
      await RatingApi.submitRating(payload);
      Alert.alert('Thành công! ⭐', `Bạn đã đánh giá ${toUserName} ${score} sao.`);
      onSuccess();
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Không thể gửi đánh giá. Vui lòng thử lại.';
      Alert.alert('Lỗi', msg);
    } finally {
      setLoading(false);
    }
  };

  const resetState = () => {
    setScore(0);
    setComment('');
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Đánh giá buổi hỗ trợ</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            Bạn cảm thấy thế nào về buổi hỗ trợ với{' '}
            <Text style={styles.userName}>{toUserName}</Text>?
          </Text>

          {/* Stars */}
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setScore(star)}
                style={styles.starBtn}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={star <= score ? 'star' : 'star-outline'}
                  size={42}
                  color={star <= score ? '#FBBF24' : '#CBD5E1'}
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Score label */}
          {score > 0 && (
            <Text style={styles.scoreLabel}>
              {score === 1 && '😞 Rất tệ'}
              {score === 2 && '😕 Tệ'}
              {score === 3 && '😐 Bình thường'}
              {score === 4 && '😊 Tốt'}
              {score === 5 && '🤩 Xuất sắc!'}
            </Text>
          )}

          {/* Comment */}
          <Text style={styles.inputLabel}>Nhận xét (tùy chọn)</Text>
          <TextInput
            style={styles.commentInput}
            placeholder="Chia sẻ trải nghiệm của bạn..."
            placeholderTextColor="#94a3b8"
            multiline
            numberOfLines={3}
            value={comment}
            onChangeText={setComment}
            maxLength={500}
          />

          {/* Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={handleClose}>
              <Text style={styles.cancelText}>Bỏ qua</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitBtn, score === 0 && styles.submitDisabled]}
              onPress={handleSubmit}
              disabled={loading || score === 0}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.submitText}>Gửi đánh giá</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  closeBtn: {
    padding: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 20,
    lineHeight: 20,
  },
  userName: {
    fontWeight: '600',
    color: '#3b82f6',
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  starBtn: {
    padding: 4,
  },
  scoreLabel: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 14,
    color: '#1e293b',
    minHeight: 90,
    textAlignVertical: 'top',
    marginBottom: 20,
    backgroundColor: '#f8fafc',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 15,
    color: '#64748b',
    fontWeight: '600',
  },
  submitBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
  },
  submitDisabled: {
    backgroundColor: '#94a3b8',
  },
  submitText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '700',
  },
});

export default RatingModal;
