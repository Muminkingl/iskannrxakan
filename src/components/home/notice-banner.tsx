import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useLanguage } from '@/context/language-context';
import { useTheme } from '@/context/theme-context';

export function NoticeBanner() {
  const { colors } = useTheme();
  const { t, language } = useLanguage();
  const isEnglish = language === 'english';

  return (
    <View style={[styles.noticeCard, { backgroundColor: colors.cardBg, borderColor: colors.borderColor }]}>
      <View style={[styles.headerRow, isEnglish && styles.rowLtr]}>
        <Ionicons name="information-circle" size={18} color={colors.primaryAccent} />
        <Text style={[styles.noticeTitle, { color: colors.primaryAccent }]}>
          {t('noticeBannerTitle')}
        </Text>
      </View>
      <Text style={[styles.noticeText, { color: colors.textSecondary }, isEnglish && styles.textLeft]}>
        {t('noticeBannerText')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  noticeCard: {
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    gap: 6,
    boxShadow: '0 2px 8px rgba(50, 50, 90, 0.04)',
  },
  headerRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  rowLtr: {
    flexDirection: 'row',
  },
  noticeTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  noticeText: {
    fontSize: 12,
    lineHeight: 20,
    textAlign: 'right',
    fontWeight: '500',
  },
  textLeft: {
    textAlign: 'left',
  },
});
