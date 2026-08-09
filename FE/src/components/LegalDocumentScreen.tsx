import { StyleSheet, Text, View } from 'react-native';
import { Colors, Radius, Spacing } from '@constants/Colors';
import { ProfilePage } from './ProfilePage';

export type LegalSection = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
};

type LegalDocumentScreenProps = {
  title: string;
  summary: string;
  sections: LegalSection[];
};

export default function LegalDocumentScreen({
  title,
  summary,
  sections,
}: LegalDocumentScreenProps) {
  return (
    <ProfilePage title={title}>
      <View style={styles.summaryCard}>
        <Text style={styles.updatedAt}>Cập nhật lần cuối: 09/08/2026</Text>
        <Text style={styles.summary}>{summary}</Text>
      </View>

      {sections.map((section, index) => (
        <View key={section.title} style={styles.section}>
          <View style={styles.sectionHeading}>
            <View style={styles.numberBadge}>
              <Text style={styles.number}>{index + 1}</Text>
            </View>
            <Text style={styles.title}>{section.title}</Text>
          </View>
          {section.paragraphs?.map(paragraph => (
            <Text key={paragraph} style={styles.paragraph}>{paragraph}</Text>
          ))}
          {section.bullets?.map(bullet => (
            <View key={bullet} style={styles.bulletRow}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>{bullet}</Text>
            </View>
          ))}
        </View>
      ))}

      <View style={styles.contactCard}>
        <Text style={styles.contactTitle}>Liên hệ</Text>
        <Text style={styles.contactText}>
          Nếu có câu hỏi về tài liệu này, vui lòng liên hệ Nhóm HourLink qua
          {' '}contact@hourlink.vn.
        </Text>
      </View>
    </ProfilePage>
  );
}

const styles = StyleSheet.create({
  summaryCard: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  updatedAt: { color: '#047857', fontSize: 12, fontWeight: '700', marginBottom: 8 },
  summary: { color: Colors.textSecondary, fontSize: 14, lineHeight: 21 },
  section: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  numberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  number: { color: '#047857', fontSize: 13, fontWeight: '800' },
  title: { flex: 1, color: Colors.textPrimary, fontSize: 16, fontWeight: '700' },
  paragraph: { color: Colors.textSecondary, fontSize: 14, lineHeight: 21, marginBottom: 8 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 7 },
  bullet: { color: Colors.primary, fontSize: 17, lineHeight: 21, marginRight: 9 },
  bulletText: { flex: 1, color: Colors.textSecondary, fontSize: 14, lineHeight: 21 },
  contactCard: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  contactTitle: { color: Colors.textPrimary, fontSize: 15, fontWeight: '700', marginBottom: 6 },
  contactText: { color: Colors.textSecondary, fontSize: 14, lineHeight: 21 },
});
