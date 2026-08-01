import { Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { IskanLogo } from '@/components/common/iskan-logo';

interface AboutAppModalProps {
  visible: boolean;
  onClose: () => void;
}

export function AboutAppModal({ visible, onClose }: AboutAppModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.modalCard}>
          {/* Close Button */}
          <Pressable
            hitSlop={12}
            onPress={onClose}
            style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}
          >
            <Ionicons name="close" size={22} color="#64748B" />
          </Pressable>

          {/* App Branding Header */}
          <View style={styles.brandingBlock}>
            <View style={styles.logoCircle}>
              <IskanLogo size={46} />
            </View>

            <Text style={styles.appName}>Iskan Nrxakan</Text>
            <Text style={styles.appNameKurdish}>ئیسکان نرخەکان</Text>

            <View style={styles.versionBadge}>
              <Text style={styles.versionBadgeText}>وەشانی (v1.0.0)</Text>
            </View>
          </View>

          {/* App Description */}
          <Text style={styles.descriptionText}>
            پێشکەوتووترین بەرنامەی ڕاستەوخۆی بۆرسە و بازاڕی دراو و زێڕ لە کوردستان. بەراوردکاری نرخەکان بە داتای ڕاستەوخۆ (Realtime) بەبێ دواکەوتن.
          </Text>

          {/* Features Highlights */}
          <View style={styles.featuresStack}>
            <View style={styles.featureRow}>
              <Ionicons name="flash-outline" size={16} color="#3B50C8" />
              <Text style={styles.featureText}>نوێبوونەوەی ڕاستەوخۆ و بەردەوام</Text>
            </View>
            <View style={styles.featureRow}>
              <Ionicons name="analytics-outline" size={16} color="#3B50C8" />
              <Text style={styles.featureText}>هێڵکاری بەراوردکاری دراو و زێڕ</Text>
            </View>
            <View style={styles.featureRow}>
              <Ionicons name="calculator-outline" size={16} color="#3B50C8" />
              <Text style={styles.featureText}>حاسیبە و بژارەی گۆڕینەوەی فرە-دراو</Text>
            </View>
          </View>

          {/* Developer Credit Footer Card */}
          <View style={styles.devCard}>
            <Image
              source={require('../../../assets/images/trx.jpg')}
              style={styles.devLogoImage}
            />
            <View style={styles.devMeta}>
              <Text style={styles.devLabel}>گەشەپێدراوە لەلایەن</Text>
              <Text style={styles.devBrand}>Trx Studio</Text>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    gap: 16,
    boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
  },
  closeBtn: {
    position: 'absolute',
    left: 16,
    top: 16,
    padding: 4,
  },
  brandingBlock: {
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 4,
  },
  appName: {
    color: '#0F172A',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  appNameKurdish: {
    color: '#3B50C8',
    fontSize: 15,
    fontWeight: '800',
  },
  versionBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    marginTop: 4,
  },
  versionBadgeText: {
    color: '#3B50C8',
    fontSize: 11,
    fontWeight: '800',
  },
  descriptionText: {
    color: '#475569',
    fontSize: 12.5,
    lineHeight: 20,
    textAlign: 'center',
    fontWeight: '500',
  },
  featuresStack: {
    width: '100%',
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  featureRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    color: '#1E293B',
    fontSize: 12,
    fontWeight: '700',
  },
  devCard: {
    width: '100%',
    backgroundColor: '#FEF3C7',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  devLogoImage: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  devMeta: {
    alignItems: 'flex-end',
  },
  devLabel: {
    color: '#B45309',
    fontSize: 10,
    fontWeight: '700',
  },
  devBrand: {
    color: '#D97706',
    fontSize: 14,
    fontWeight: '900',
  },
  pressed: {
    opacity: 0.75,
  },
});
