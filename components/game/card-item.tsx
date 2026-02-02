import { View, Image, StyleSheet } from 'react-native';
import { Card } from '@/lib/game/types';

interface CardItemProps {
  card: Card;
  isSelected?: boolean;
  showStats?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export function CardItem({ card, isSelected = false, size = 'medium' }: CardItemProps) {
  const sizeStyles = {
    small: { width: 90, height: 120 },
    medium: { width: 120, height: 160 },
    large: { width: 160, height: 220 },
  };

  const currentSize = sizeStyles[size];

  return (
    <View
      style={[
        styles.card,
        {
          width: currentSize.width,
          height: currentSize.height,
          borderColor: isSelected ? '#e94560' : 'transparent',
          borderWidth: isSelected ? 3 : 0,
        },
      ]}
    >
      <Image source={card.finalImage} style={styles.image} resizeMode="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
