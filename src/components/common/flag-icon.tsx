import { Image, Platform, StyleSheet, View } from 'react-native';
import { SvgUri } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';

interface FlagIconProps {
  code: string;
  size?: number;
}

// Official crisp 4x3 flag icons
const LIPIS_FLAGS: Record<string, string> = {
  eu: 'https://flagicons.lipis.dev/flags/4x3/eu.svg',
  sa: 'https://flagicons.lipis.dev/flags/4x3/sa.svg',
  ch: 'https://flagicons.lipis.dev/flags/4x3/ch.svg',
};

export function FlagIcon({ code, size = 20 }: FlagIconProps) {
  const codeLower = (code || '').toLowerCase().trim();

  const width = Math.round(size * 1.45);
  const height = Math.round(size);

  if (codeLower === 'gold') {
    return (
      <View style={[styles.goldFrame, { width, height }]}>
        <Ionicons name="diamond" size={size * 0.75} color="#D97706" />
      </View>
    );
  }

  // Get flag URL (SVG or PNG for web fallback)
  const lipisUrl = LIPIS_FLAGS[codeLower];
  const svgUrl = lipisUrl || `https://flagcdn.com/${codeLower}.svg`;
  const pngUrl = `https://flagcdn.com/w80/${codeLower}.png`;

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.flagFrame, { width, height }]}>
        <Image
          source={{ uri: pngUrl }}
          style={{ width, height, borderRadius: 3 }}
          resizeMode="cover"
        />
      </View>
    );
  }

  return (
    <View style={[styles.flagFrame, { width, height }]}>
      <SvgUri
        uri={svgUrl}
        width={width}
        height={height}
        preserveAspectRatio="xMidYMid slice"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flagFrame: {
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.12)',
    backgroundColor: '#F1F5F9',
  },
  goldFrame: {
    borderRadius: 6,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
