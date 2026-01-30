import React from 'react';
import { View, StyleSheet } from 'react-native';

/**
 * مكون الخلفية الفاخرة مع الإطارات الذهبية
 */
export function LuxuryBackground({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.container}>
      {/* الخلفية الرئيسية */}
      <View style={styles.background} />

      {/* الإطار الخارجي */}
      <View style={styles.frameOuter}>
        {/* الزوايا الذهبية */}
        <View style={[styles.corner, styles.topLeft]}>
          <View style={styles.cornerLine} />
          <View style={styles.cornerLine} />
        </View>
        <View style={[styles.corner, styles.topRight]}>
          <View style={styles.cornerLine} />
          <View style={styles.cornerLine} />
        </View>
        <View style={[styles.corner, styles.bottomLeft]}>
          <View style={styles.cornerLine} />
          <View style={styles.cornerLine} />
        </View>
        <View style={[styles.corner, styles.bottomRight]}>
          <View style={styles.cornerLine} />
          <View style={styles.cornerLine} />
        </View>

        {/* المحتوى */}
        <View style={styles.content}>{children}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#2d0a1a',
    backgroundImage:
      'radial-gradient(circle at center, rgba(200, 50, 100, 0.3) 0%, rgba(20, 5, 15, 0.8) 100%)',
  },
  frameOuter: {
    flex: 1,
    margin: 16,
    borderWidth: 2,
    borderColor: '#d4af37',
    borderStyle: 'dashed',
    padding: 12,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: '#d4af37',
  },
  topLeft: {
    top: -2,
    left: -2,
    borderTopWidth: 2,
    borderLeftWidth: 2,
  },
  topRight: {
    top: -2,
    right: -2,
    borderTopWidth: 2,
    borderRightWidth: 2,
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 2,
    borderRightWidth: 2,
  },
  cornerLine: {
    width: 2,
    height: 8,
    backgroundColor: '#d4af37',
    marginTop: 4,
    marginLeft: 4,
  },
  content: {
    flex: 1,
  },
});
