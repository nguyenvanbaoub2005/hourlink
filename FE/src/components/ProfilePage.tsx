import type { ComponentProps, ReactNode } from 'react';
import {
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing } from '@constants/Colors';

type IconName = ComponentProps<typeof Ionicons>['name'];

type ProfilePageProps = {
  title: string;
  children: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  scroll?: boolean;
};

export function ProfilePage({
  title,
  children,
  contentStyle,
  scroll = true,
}: ProfilePageProps) {
  const router = useRouter();

  const content = scroll ? (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.content, contentStyle]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, styles.flexContent, contentStyle]}>{children}</View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Quay lại"
        >
          <Ionicons name="chevron-back" size={26} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
        <View style={styles.headerButton} />
      </View>
      {content}
    </SafeAreaView>
  );
}

type SettingsGroupProps = {
  title?: string;
  children: ReactNode;
};

export function SettingsGroup({ title, children }: SettingsGroupProps) {
  return (
    <View style={styles.groupWrap}>
      {title ? <Text style={styles.groupTitle}>{title}</Text> : null}
      <View style={styles.group}>{children}</View>
    </View>
  );
}

type SettingsRowProps = {
  icon: IconName;
  iconColor?: string;
  iconBackground?: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  danger?: boolean;
  showChevron?: boolean;
  trailing?: ReactNode;
};

export function SettingsRow({
  icon,
  iconColor = Colors.secondary,
  iconBackground = '#ECFDF5',
  title,
  subtitle,
  onPress,
  danger = false,
  showChevron = true,
  trailing,
}: SettingsRowProps) {
  const body = (
    <>
      <View style={[styles.rowIcon, { backgroundColor: iconBackground }]}>
        <Ionicons name={icon} size={21} color={danger ? Colors.danger : iconColor} />
      </View>
      <View style={styles.rowBody}>
        <Text style={[styles.rowTitle, danger && styles.dangerText]}>{title}</Text>
        {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
      </View>
      {trailing}
      {showChevron && onPress ? (
        <Ionicons name="chevron-forward" size={19} color={Colors.textMuted} />
      ) : null}
    </>
  );

  if (!onPress) return <View style={styles.row}>{body}</View>;

  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      {body}
    </TouchableOpacity>
  );
}

type InfoCardProps = {
  icon: IconName;
  title: string;
  children: ReactNode;
  tone?: 'green' | 'blue' | 'amber';
};

const INFO_TONES = {
  green: { background: '#ECFDF5', border: '#A7F3D0', icon: '#059669' },
  blue: { background: '#EFF6FF', border: '#BFDBFE', icon: '#2563EB' },
  amber: { background: '#FFFBEB', border: '#FDE68A', icon: '#D97706' },
};

export function InfoCard({ icon, title, children, tone = 'green' }: InfoCardProps) {
  const colors = INFO_TONES[tone];
  return (
    <View style={[styles.infoCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
      <View style={styles.infoHeading}>
        <Ionicons name={icon} size={22} color={colors.icon} />
        <Text style={styles.infoTitle}>{title}</Text>
      </View>
      <Text style={styles.infoText}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgScreen },
  header: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: Spacing.sm,
  },
  headerButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
  },
  scroll: { flex: 1 },
  content: { padding: Spacing.md, paddingBottom: 40 },
  flexContent: { flex: 1 },
  groupWrap: { marginBottom: Spacing.lg },
  groupTitle: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: Spacing.sm,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  group: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  row: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowBody: { flex: 1, paddingRight: Spacing.sm },
  rowTitle: { color: Colors.textPrimary, fontSize: 15, fontWeight: '600' },
  rowSubtitle: { color: Colors.textMuted, fontSize: 12, lineHeight: 17, marginTop: 3 },
  dangerText: { color: Colors.danger },
  infoCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  infoHeading: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm, gap: 8 },
  infoTitle: { color: Colors.textPrimary, fontSize: 16, fontWeight: '700', flex: 1 },
  infoText: { color: Colors.textSecondary, fontSize: 14, lineHeight: 21 },
});
