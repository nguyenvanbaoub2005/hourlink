import React, { useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useWalletStore } from '@store/walletStore';
import { Colors, Radius, Spacing } from '@constants/Colors';
import type { WalletTransaction, WalletTxType } from '@types';

// ─── Cấu hình hiển thị theo từng loại giao dịch ──────────────

const TX_CONFIG: Record<WalletTxType, {
  label: string;
  icon: any;
  color: string;
  bg: string;
  sign: '+' | '-' | '';
}> = {
  EARN:       { label: 'Nhận được',      icon: 'arrow-down-circle',  color: '#10B981', bg: '#D1FAE5', sign: '+' },
  SPEND:      { label: 'Đã sử dụng',     icon: 'arrow-up-circle',    color: '#EF4444', bg: '#FEE2E2', sign: '-' },
  HOLD:       { label: 'Tạm giữ',        icon: 'pause-circle',       color: '#F59E0B', bg: '#FEF3C7', sign: '' },
  RELEASE:    { label: 'Hoàn trả',       icon: 'refresh-circle',     color: '#6366F1', bg: '#EEF2FF', sign: '+' },
  REFUND:     { label: 'Hoàn tiền',      icon: 'return-up-back',     color: '#06B6D4', bg: '#CFFAFE', sign: '+' },
  BONUS:      { label: 'Thưởng',         icon: 'gift',               color: '#8B5CF6', bg: '#F3E8FF', sign: '+' },
  ADJUSTMENT: { label: 'Điều chỉnh',     icon: 'construct',          color: '#64748B', bg: '#F1F5F9', sign: '+' },
};

const isPositive = (type: WalletTxType, amount: number) =>
  type === 'ADJUSTMENT'
    ? amount >= 0
    : ['EARN', 'RELEASE', 'REFUND', 'BONUS'].includes(type);

// ─── Component giao dịch đơn lẻ ──────────────────────────────

function TransactionItem({ item }: { item: WalletTransaction }) {
  const cfg = TX_CONFIG[item.type] ?? TX_CONFIG.ADJUSTMENT;
  const positive = isPositive(item.type, item.amount);
  const amountText = `${positive ? '+' : item.type === 'HOLD' ? '' : '-'}${Math.abs(item.amount).toFixed(1)} TC`;
  const date = new Date(item.createdAt).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  return (
    <View style={styles.txItem}>
      <View style={[styles.txIconWrap, { backgroundColor: cfg.bg }]}>
        <Ionicons name={cfg.icon} size={22} color={cfg.color} />
      </View>

      <View style={styles.txContent}>
        <Text style={styles.txType}>{cfg.label}</Text>
        {item.relatedAppointmentTitle ? (
          <Text style={styles.txDesc} numberOfLines={1}>
            {item.relatedAppointmentTitle}
          </Text>
        ) : item.description ? (
          <Text style={styles.txDesc} numberOfLines={1}>{item.description}</Text>
        ) : null}
        <Text style={styles.txDate}>{date}</Text>
      </View>

      <View style={styles.txRight}>
        <Text style={[styles.txAmount, { color: positive ? '#10B981' : item.type === 'HOLD' ? '#F59E0B' : '#EF4444' }]}>
          {amountText}
        </Text>
        <Text style={styles.txBalance}>Dư: {item.balanceAfter.toFixed(1)}</Text>
      </View>
    </View>
  );
}

// ─── Màn hình chính ───────────────────────────────────────────

export default function WalletScreen() {
  const {
    wallet, transactions, isLoading, isLoadingMore,
    error, refreshAll, loadMoreTransactions,
  } = useWalletStore();

  // Load khi màn hình được focus
  useFocusEffect(
    useCallback(() => {
      refreshAll();
    }, [])
  );

  const handleRefresh = () => refreshAll();

  if (isLoading && !wallet) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={Colors.primary} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  if (error && !wallet) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorWrap}>
          <Ionicons name="wallet-outline" size={64} color={Colors.textMuted} />
          <Text style={styles.errorTitle}>Không thể tải ví</Text>
          <Text style={styles.errorSub}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={refreshAll}>
            <Text style={styles.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const ListHeader = () => (
    <>
      {/* ── Balance Card ── */}
      <LinearGradient
        colors={['#047857', '#10B981']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.cardHeader}>
          <Ionicons name="wallet" size={24} color="rgba(255,255,255,0.8)" />
          <Text style={styles.cardTitle}>Ví Time Credit</Text>
        </View>

        {/* Số dư chính */}
        <View style={styles.balanceRow}>
          <Text style={styles.balanceNum}>{wallet?.balance?.toFixed(1) ?? '0.0'}</Text>
          <Text style={styles.balanceUnit}>TC</Text>
        </View>
        <Text style={styles.balanceLabel}>Số dư khả dụng</Text>

        {/* Tạm giữ */}
        {(wallet?.heldAmount ?? 0) > 0 && (
          <View style={styles.heldRow}>
            <Ionicons name="pause-circle-outline" size={14} color="rgba(255,255,255,0.75)" />
            <Text style={styles.heldText}>
              {wallet?.heldAmount?.toFixed(1)} TC đang tạm giữ
            </Text>
          </View>
        )}

        {/* Thống kê Earned / Used */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Ionicons name="arrow-down-circle-outline" size={16} color="rgba(255,255,255,0.85)" />
            <Text style={styles.statNum}>{wallet?.totalEarned?.toFixed(1) ?? '0.0'}</Text>
            <Text style={styles.statLabel}>Đã kiếm</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Ionicons name="arrow-up-circle-outline" size={16} color="rgba(255,255,255,0.85)" />
            <Text style={styles.statNum}>{wallet?.totalUsed?.toFixed(1) ?? '0.0'}</Text>
            <Text style={styles.statLabel}>Đã dùng</Text>
          </View>
        </View>
      </LinearGradient>

      {/* ── Giải thích TC ── */}
      <View style={styles.infoBox}>
        <Ionicons name="information-circle-outline" size={16} color={Colors.secondary} />
        <Text style={styles.infoText}>
          1 Time Credit = 1 giờ hỗ trợ. Dùng TC để nhận hỗ trợ, kiếm TC bằng cách giúp người khác.
        </Text>
      </View>

      {/* ── Tiêu đề danh sách giao dịch ── */}
      {transactions.length > 0 && (
        <Text style={styles.sectionTitle}>Lịch sử giao dịch</Text>
      )}
    </>
  );

  const ListEmpty = () => (
    <View style={styles.emptyWrap}>
      <Ionicons name="receipt-outline" size={48} color={Colors.textMuted} />
      <Text style={styles.emptyText}>Chưa có giao dịch nào</Text>
      <Text style={styles.emptySub}>Bắt đầu hỗ trợ hoặc nhận hỗ trợ để có giao dịch đầu tiên!</Text>
    </View>
  );

  const ListFooter = () =>
    isLoadingMore ? (
      <ActivityIndicator size="small" color={Colors.primary} style={{ marginVertical: 16 }} />
    ) : null;

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <TransactionItem item={item} />}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={!isLoading ? ListEmpty : null}
        ListFooterComponent={ListFooter}
        contentContainerStyle={styles.listContent}
        onEndReached={loadMoreTransactions}
        onEndReachedThreshold={0.2}
        refreshControl={
          <RefreshControl
            refreshing={isLoading && !!wallet}
            onRefresh={handleRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgScreen,
  },
  listContent: {
    paddingBottom: 32,
  },

  // Balance card
  card: {
    margin: Spacing.md,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    shadowColor: '#047857',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.md,
  },
  cardTitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  balanceNum: {
    color: '#FFFFFF',
    fontSize: 52,
    fontWeight: '800',
    letterSpacing: -1,
  },
  balanceUnit: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 20,
    fontWeight: '600',
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    marginTop: 2,
    marginBottom: Spacing.sm,
  },
  heldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
    marginBottom: Spacing.md,
  },
  heldText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: Spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: Spacing.sm,
  },
  statNum: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  statLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '500',
  },

  // Info box
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    backgroundColor: '#E0F2F1',
    padding: Spacing.sm,
    borderRadius: Radius.md,
  },
  infoText: {
    flex: 1,
    color: Colors.secondary,
    fontSize: 12,
    lineHeight: 18,
  },

  // Section title
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },

  // Transaction item
  txItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgLight,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  txIconWrap: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  txContent: {
    flex: 1,
    gap: 2,
  },
  txType: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  txDesc: {
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
  },
  txDate: {
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  txRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  txAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
  txBalance: {
    color: Colors.textMuted,
    fontSize: 11,
  },

  // Empty state
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
    marginTop: Spacing.sm,
  },
  emptySub: {
    color: Colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Error state
  errorWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing.lg,
  },
  errorTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginTop: Spacing.sm,
  },
  errorSub: {
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    marginTop: Spacing.md,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
