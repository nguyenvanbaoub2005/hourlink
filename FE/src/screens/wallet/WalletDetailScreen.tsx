import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors, Radius, Spacing } from '@constants/Colors';
import { useWalletStore } from '@store/walletStore';
import type { WalletTxType } from '@types';

const TX_CONFIG: Record<WalletTxType, { label: string; icon: any; color: string; bg: string }> = {
  EARN:       { label: 'Nhận được',   icon: 'arrow-down-circle',  color: '#10B981', bg: '#D1FAE5' },
  SPEND:      { label: 'Đã sử dụng',  icon: 'arrow-up-circle',    color: '#EF4444', bg: '#FEE2E2' },
  HOLD:       { label: 'Tạm giữ',     icon: 'pause-circle',       color: '#F59E0B', bg: '#FEF3C7' },
  RELEASE:    { label: 'Hoàn trả',    icon: 'refresh-circle',     color: '#6366F1', bg: '#EEF2FF' },
  REFUND:     { label: 'Hoàn tiền',   icon: 'return-up-back',     color: '#06B6D4', bg: '#CFFAFE' },
  BONUS:      { label: 'Thưởng',      icon: 'gift',               color: '#8B5CF6', bg: '#F3E8FF' },
  ADJUSTMENT: { label: 'Điều chỉnh',  icon: 'construct',          color: '#64748B', bg: '#F1F5F9' },
};

const isPositive = (type: WalletTxType) =>
  ['EARN', 'RELEASE', 'REFUND', 'BONUS', 'ADJUSTMENT'].includes(type);

/**
 * WalletDetailScreen — Chi tiết một giao dịch Time Credit.
 * Route: /wallet/[txId]
 */
export default function WalletDetailScreen() {
  const router = useRouter();
  const { txId } = useLocalSearchParams<{ txId: string }>();
  const { transactions } = useWalletStore();

  const tx = transactions.find((t) => t.id === txId);

  if (!tx) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chi tiết giao dịch</Text>
        </View>
        <View style={styles.emptyWrap}>
          <Ionicons name="document-text-outline" size={64} color={Colors.textMuted} />
          <Text style={styles.emptyText}>Không tìm thấy giao dịch</Text>
        </View>
      </SafeAreaView>
    );
  }

  const cfg = TX_CONFIG[tx.type] ?? TX_CONFIG.ADJUSTMENT;
  const positive = isPositive(tx.type);
  const amountText = `${positive ? '+' : tx.type === 'HOLD' ? '⏸' : '-'}${tx.amount.toFixed(1)} TC`;
  const date = new Date(tx.createdAt).toLocaleDateString('vi-VN', {
    weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết giao dịch</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Icon + amount */}
        <View style={styles.topCard}>
          <View style={[styles.bigIcon, { backgroundColor: cfg.bg }]}>
            <Ionicons name={cfg.icon} size={48} color={cfg.color} />
          </View>
          <Text style={[styles.bigAmount, {
            color: positive ? '#10B981' : tx.type === 'HOLD' ? '#F59E0B' : '#EF4444',
          }]}>
            {amountText}
          </Text>
          <Text style={styles.txTypeLabel}>{cfg.label}</Text>
        </View>

        {/* Chi tiết */}
        <View style={styles.detailCard}>
          <DetailRow label="Loại giao dịch" value={cfg.label} />
          <DetailRow label="Số dư sau giao dịch" value={`${tx.balanceAfter.toFixed(1)} TC`} />
          {tx.description && <DetailRow label="Mô tả" value={tx.description} />}
          {tx.relatedAppointmentTitle && (
            <DetailRow label="Lịch hẹn liên quan" value={tx.relatedAppointmentTitle} />
          )}
          <DetailRow label="Thời gian" value={date} />
          <DetailRow label="Mã giao dịch" value={tx.id} mono />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, mono && styles.detailMono]} selectable>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgScreen },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.bgLight,
  },
  backBtn: { padding: 4, marginRight: Spacing.sm },
  headerTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  content: { padding: Spacing.md, gap: Spacing.md },

  topCard: {
    backgroundColor: Colors.bgLight,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  bigIcon: {
    width: 88,
    height: 88,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  bigAmount: { fontSize: 40, fontWeight: '800', letterSpacing: -1 },
  txTypeLabel: { fontSize: 15, color: Colors.textSecondary, fontWeight: '500' },

  detailCard: {
    backgroundColor: Colors.bgLight,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  detailRow: {
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
    gap: 4,
  },
  detailLabel: { fontSize: 12, color: Colors.textMuted, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 },
  detailValue: { fontSize: 15, color: Colors.textPrimary, fontWeight: '500' },
  detailMono: { fontFamily: 'monospace', fontSize: 12, color: Colors.textSecondary },

  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  emptyText: { color: Colors.textSecondary, fontSize: 16, fontWeight: '600' },
});
