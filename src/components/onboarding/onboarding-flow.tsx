import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, {
  SlideInRight,
  SlideOutLeft,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

import { IskanLogo } from '@/components/common/iskan-logo';

const illustrations = [
  require('@/assets/images/onboarding_1.png'),
  require('@/assets/images/onboarding_2.png'),
  require('@/assets/images/onboarding_3.png'),
];

export interface OnboardingSlide {
  id: string;
  title: string;
  description: string;
  accentColor: string;
}

const SLIDES: OnboardingSlide[] = [
  {
    id: 'slide1',
    title: 'The rate you need,\nwithout the noise.',
    description: 'Follow the local Erbil Borsa with clear live buy and sell prices — updated daily by the Iskan Nrxakan team.',
    accentColor: '#3B50C8',
  },
  {
    id: 'slide2',
    title: 'One trusted place\nfor every exchange.',
    description: 'Compare prices for USD, EUR, GBP, TRY & Gold without switching between calls, chats, and screenshots.',
    accentColor: '#10B981',
  },
  {
    id: 'slide3',
    title: 'Make your next move\nwith confidence.',
    description: 'Your personal activation keeps the latest local market rates ready whenever you need them.',
    accentColor: '#F59E0B',
  },
];

interface OnboardingFlowProps {
  onComplete: () => void;
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [currentStep, setCurrentStep] = useState(0);

  const slide = SLIDES[currentStep];
  const isLastSlide = currentStep === SLIDES.length - 1;

  const handleContinue = () => {
    if (isLastSlide) {
      onComplete();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  return (
    <View
      style={[
        styles.root,
        {
          paddingTop: Math.max(insets.top, 12),
          paddingBottom: Math.max(insets.bottom + 16, 24),
        },
      ]}
    >
      {/* Top Progress Line */}
      <View style={styles.progressTrack}>
        <Animated.View
          style={[
            styles.progressFill,
            { width: `${((currentStep + 1) / SLIDES.length) * 100}%`, backgroundColor: slide.accentColor },
          ]}
        />
      </View>

      {/* Header Bar */}
      <View style={styles.headerBar}>
        <View style={styles.brandRow}>
          <IskanLogo size={26} />
          <Text style={[styles.brandTitle, { color: slide.accentColor }]}>Iskan Nrxakan</Text>
        </View>

        <Pressable hitSlop={12} onPress={onComplete} style={({ pressed }) => pressed && styles.pressed}>
          <Text style={[styles.skipText, { color: slide.accentColor }]}>Skip</Text>
        </Pressable>
      </View>

      {/* Slide Content */}
      <View style={[styles.slideWrapper, width >= 640 && styles.desktopWidth]}>
        <Animated.View
          key={slide.id}
          entering={SlideInRight.duration(340).springify()}
          exiting={SlideOutLeft.duration(260)}
          style={styles.slideCard}
        >
          {/* Hero Illustration */}
          <View style={styles.illustrationWrapper}>
            <Image
              source={illustrations[currentStep]}
              contentFit="cover"
              transition={200}
              style={styles.illustration}
            />
          </View>

          {/* Text Block */}
          <View style={styles.copyBlock}>
            <Text style={styles.slideTitle}>{slide.title}</Text>
            <Text style={styles.slideDescription}>{slide.description}</Text>
          </View>
        </Animated.View>
      </View>

      {/* Bottom Controls */}
      <View style={[styles.bottomControls, width >= 640 && styles.desktopWidth]}>
        <View style={styles.dotsRow}>
          {SLIDES.map((_, index) => (
            <DotItem
              key={index}
              isActive={index === currentStep}
              accentColor={slide.accentColor}
            />
          ))}
        </View>

        <Pressable
          onPress={handleContinue}
          style={({ pressed }) => [
            styles.continueBtn,
            { backgroundColor: slide.accentColor },
            pressed && styles.btnPressed,
          ]}
        >
          <Text style={styles.continueText}>
            {isLastSlide ? 'Get started' : 'Continue'}
          </Text>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
        </Pressable>
      </View>
    </View>
  );
}

interface DotItemProps {
  isActive: boolean;
  accentColor: string;
}

function DotItem({ isActive, accentColor }: DotItemProps) {
  const widthVal = useSharedValue(isActive ? 24 : 8);
  const opacityVal = useSharedValue(isActive ? 1 : 0.4);

  useEffect(() => {
    widthVal.value = withSpring(isActive ? 24 : 8, { damping: 15, stiffness: 180 });
    opacityVal.value = withTiming(isActive ? 1 : 0.4, { duration: 180 });
  }, [isActive, opacityVal, widthVal]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: widthVal.value,
    opacity: opacityVal.value,
  }));

  return (
    <Animated.View
      style={[
        styles.dot,
        animatedStyle,
        { backgroundColor: isActive ? accentColor : '#CBD5E1' },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  progressTrack: {
    height: 3,
    backgroundColor: '#F1F5F9',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandMark: {
    width: 32,
    height: 32,
  },
  brandTitle: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.7,
  },

  /* Slide */
  slideWrapper: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 12,
  },
  desktopWidth: {
    maxWidth: 480,
    alignSelf: 'center',
    width: '100%',
  },
  slideCard: {
    gap: 28,
    alignItems: 'center',
  },

  /* Illustration */
  illustrationWrapper: {
    width: '100%',
    height: 220,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    position: 'relative',
  },
  illustration: {
    width: '100%',
    height: '100%',
  },


  /* Copy */
  copyBlock: {
    alignItems: 'center',
    gap: 12,
  },
  slideTitle: {
    color: '#0F172A',
    fontSize: 26,
    lineHeight: 34,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  slideDescription: {
    color: '#64748B',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 320,
    fontWeight: '500',
  },

  /* Bottom Controls */
  bottomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  continueBtn: {
    height: 50,
    paddingHorizontal: 22,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    boxShadow: '0 4px 14px rgba(59, 80, 200, 0.28)',
  },
  continueText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  btnPressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.9,
  },
});
