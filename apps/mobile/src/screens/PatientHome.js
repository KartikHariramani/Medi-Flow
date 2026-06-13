import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FadeUp, GlassCard, PrimaryButton } from '../../components/SharedComponents';
import { theme } from '../../theme/theme';
import { supabase } from '../lib/supabase';

const PatientHome = ({ appointmentId = 'b07971b3-4f93-4a11-bba6-02e21bdfc08f' }) => {
  const [token, setToken] = useState(0);
  const [position, setPosition] = useState(0);
  const [waitTime, setWaitTime] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchQueueStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('queue')
          .select(`
            position,
            appointments!inner(token_number, estimated_wait_time)
          `)
          .eq('appointment_id', appointmentId)
          .single();
          
        if (data) {
          setPosition(data.position);
          setToken(data.appointments.token_number);
          setWaitTime(data.appointments.estimated_wait_time || 0);
        }
      } catch (err) {
        console.log("Using mocks structure:", err);
        setToken(42);
        setPosition(3);
        setWaitTime(25);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQueueStatus();

    const channel = supabase
      .channel('mobile-schema-db-changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'queue', filter: `appointment_id=eq.${appointmentId}` },
        (payload) => {
          console.log('Mobile Realtime Queue Update:', payload);
          setPosition(payload.new.position);
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [appointmentId]);

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.accent.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FadeUp delay={0}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Hello, Kamal</Text>
            <Text style={styles.subtitle}>Your upcoming appointment</Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>K</Text>
          </View>
        </View>
      </FadeUp>

      <FadeUp delay={100} style={styles.tokenSection}>
        <GlassCard style={styles.tokenCard}>
          <Text style={styles.tokenLabel}>TOKEN NUMBER</Text>
          <Text style={styles.tokenNumber}>{token.toString().padStart(3, '0')}</Text>
        </GlassCard>
      </FadeUp>

      <FadeUp delay={200} style={styles.statsSection}>
        <GlassCard style={styles.statsCard}>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Queue Position</Text>
              <Text style={styles.statValue}>{position}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Est. Wait</Text>
              <Text style={styles.statValue}>{waitTime}m</Text>
            </View>
          </View>
          
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Wait time</Text>
              <Text style={styles.progressLive}>Updating live</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${(1 - (position / 10)) * 100}%` }]} />
            </View>
          </View>
        </GlassCard>
      </FadeUp>

      <FadeUp delay={300} style={styles.emergencySection}>
        <PrimaryButton 
          title="Tap for Emergency" 
          style={styles.emergencyButton} 
        />
      </FadeUp>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
    padding: theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    marginTop: theme.spacing.lg,
  },
  title: {
    color: theme.colors.text.primary,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    color: theme.colors.text.secondary,
    fontSize: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: theme.colors.accent.primary,
    fontSize: 20,
    fontWeight: 'bold',
  },
  tokenSection: {
    marginBottom: theme.spacing.xl,
  },
  tokenCard: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  tokenLabel: {
    color: theme.colors.text.secondary,
    letterSpacing: 2,
    fontSize: 12,
    marginBottom: theme.spacing.sm,
  },
  tokenNumber: {
    color: theme.colors.text.primary,
    fontSize: 72,
    fontWeight: 'bold',
  },
  statsSection: {
    marginBottom: theme.spacing.xl,
  },
  statsCard: {
    padding: theme.spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
  },
  statBox: {
    flex: 1,
  },
  statLabel: {
    color: theme.colors.text.secondary,
    fontSize: 14,
    marginBottom: theme.spacing.xs,
  },
  statValue: {
    color: theme.colors.text.primary,
    fontSize: 32,
    fontWeight: 'bold',
  },
  progressContainer: {
    marginTop: theme.spacing.sm,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  progressLabel: {
    color: theme.colors.text.secondary,
    fontSize: 12,
  },
  progressLive: {
    color: theme.colors.accent.warning,
    fontSize: 12,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: theme.colors.background.primary,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: theme.colors.accent.primary,
    borderRadius: 4,
  },
  emergencySection: {
    marginTop: 'auto',
    marginBottom: theme.spacing.lg,
  },
  emergencyButton: {
    backgroundColor: theme.colors.accent.emergency,
    shadowColor: theme.colors.accent.emergency,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
  }
});

export default PatientHome;
