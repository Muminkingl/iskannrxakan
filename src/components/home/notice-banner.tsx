import { StyleSheet, Text, View } from 'react-native';

export function NoticeBanner() {
  return (
    <View style={styles.noticeCard}>
      <Text style={styles.noticeText}>
        تێبینی : نرخ بەردەوام لە گۆڕاندایە نرخ ناجێگیرە دۆلار مامەڵەی پێوەدەکرێت لەبازاڕەکانی دراودالەنێوان 149,500 دینار بۆ 150,500 دینار بۆ گۆڕانکاری، زیاتر سەیر بکەوە ،
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  noticeCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  noticeText: {
    color: '#334155',
    fontSize: 13,
    lineHeight: 22,
    textAlign: 'right',
    fontWeight: '500',
  },
});
