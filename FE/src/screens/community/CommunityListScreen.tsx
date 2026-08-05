import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@constants/Colors';
import { communityApi, ActivityResponse, ActivityStatus } from '@api/community';
import { router } from 'expo-router';

export default function CommunityListScreen() {
  const [activities, setActivities] = useState<ActivityResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const data = await communityApi.getAllActivities();
      setActivities(data);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: ActivityResponse }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/community/${item.id}`)}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
        <View style={[styles.badge, item.status === ActivityStatus.OPEN ? styles.badgeOpen : styles.badgeClosed]}>
          <Text style={styles.badgeText}>{item.status}</Text>
        </View>
      </View>
      
      <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
      
      <View style={styles.infoRow}>
        <Text style={styles.infoText}>📍 {item.location}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoText}>⏱ {new Date(item.startTime).toLocaleString()} - {new Date(item.endTime).toLocaleString()}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoText}>👥 {item.currentParticipants} / {item.maxParticipants > 0 ? item.maxParticipants : '∞'}</Text>
        <Text style={styles.rewardText}>💎 +{item.creditReward} TC</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Hoạt động cộng đồng</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 20 }} size="large" color={Colors.primary} />
      ) : (
        <FlatList
          data={activities}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={<Text style={styles.emptyText}>Chưa có hoạt động nào</Text>}
          refreshing={loading}
          onRefresh={fetchActivities}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgDark,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  listContainer: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeOpen: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  badgeClosed: {
    backgroundColor: 'rgba(107, 114, 128, 0.2)',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  description: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  rewardText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  emptyText: {
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  }
});
