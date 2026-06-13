import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../theme/theme';
import Animated, { FadeInUp } from 'react-native-reanimated';

export const FadeUp = ({ children, delay = 0, style }) => (
  <Animated.View entering={FadeInUp.delay(delay).duration(500)} style={style}>
    {children}
  </Animated.View>
);

export const GlassCard = ({ children, style }) => (
  <View style={[styles.glassCard, style]}>
    {children}
  </View>
);

export const PrimaryButton = ({ title, onPress, style }) => (
  <TouchableOpacity style={[styles.primaryButton, style]} onPress={onPress}>
    <Text style={styles.primaryButtonText}>{title}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  glassCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    // Add shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  primaryButton: {
    backgroundColor: theme.colors.accent.primary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: theme.colors.background.primary,
    fontWeight: 'bold',
    fontSize: 16,
  }
});
