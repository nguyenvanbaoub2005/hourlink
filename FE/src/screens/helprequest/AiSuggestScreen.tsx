import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@constants/Colors';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AiMatchingApi, { AiRecommendationResponse } from '@api/aimatching';

export default function AiSuggestScreen() {
  const { helpRequestId } = useLocalSearchParams();
  const router = useRouter();
  const [recommendations, setRecommendations] = useState<AiRecommendationResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSuggestions();
  }, [helpRequestId]);

  const fetchSuggestions = async () => {
    if (!helpRequestId) {
        setLoading(false);
        return;
    }
    
    try {
      const res = await AiMatchingApi.getRecommendations(helpRequestId as string);
      if (res.data.data) {
        setRecommendations(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching AI suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: AiRecommendationResponse }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Image 
          source={{ uri: item.helper?.avatarUrl || 'https://ui-avatars.com/api/?name=' + (item.helper?.fullName || 'A') }} 
          style={styles.avatar} 
        />
        <View style={styles.helperInfo}>
          <Text style={styles.helperName}>{item.helper?.fullName || 'Người hỗ trợ ẩn danh'}</Text>
          <Text style={styles.skillName}>Kỹ năng: {item.skill?.name}</Text>
        </View>
        <View style={styles.matchBadge}>
          <Text style={styles.matchText}>{item.matchPercentage}%</Text>
        </View>
      </View>
      
      <View style={styles.reasonsContainer}>
        <Text style={styles.reasonsTitle}>Lý do đề xuất:</Text>
        {item.reasons.map((reason, index) => (
          <Text key={index} style={styles.reasonItem}>• {reason}</Text>
        ))}
      </View>

      <TouchableOpacity 
        style={styles.inviteButton}
        onPress={() => router.push({
          pathname: '/profile/send-invitation',
          params: {
            receiverId: item.helper?.id,
            receiverName: item.helper?.fullName,
            skillId: item.skill?.id,
            skillName: item.skill?.name,
            helpRequestId: helpRequestId as string,
          }
        })}
      >
        <Text style={styles.inviteButtonText}>Gửi lời mời</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>AI Đề Xuất Người Hỗ Trợ</Text>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>AI đang phân tích và tìm kiếm...</Text>
        </View>
      ) : recommendations.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>Chưa tìm thấy người phù hợp cho yêu cầu này.</Text>
        </View>
      ) : (
        <FlatList
          data={recommendations}
          keyExtractor={(item, index) => index.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDark },
  header: { color: Colors.textPrimary, fontSize: 22, fontWeight: 'bold', margin: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: Colors.textSecondary, marginTop: 10 },
  emptyText: { color: Colors.textSecondary, fontSize: 16 },
  list: { paddingHorizontal: 20, paddingBottom: 20 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333'
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  helperInfo: {
    flex: 1,
  },
  helperName: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  skillName: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginTop: 4,
  },
  matchBadge: {
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  matchText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  reasonsContainer: {
    backgroundColor: '#f1f5f9', // Trắng xám nhạt (Slate 100)
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0', // Viền mỏng
  },
  reasonsTitle: {
    color: '#0f172a', // Đen/Xanh đậm dễ nhìn
    fontWeight: 'bold',
    marginBottom: 8,
  },
  reasonItem: {
    color: '#334155', // Màu text dịu mắt
    fontSize: 14,
    marginBottom: 4,
    lineHeight: 20,
  },
  inviteButton: {
    backgroundColor: Colors.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  inviteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  }
});
