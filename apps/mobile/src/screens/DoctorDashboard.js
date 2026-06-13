import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FadeUp, GlassCard, PrimaryButton } from '../../components/SharedComponents';
import { theme } from '../../theme/theme';
import { supabase } from '../lib/supabase';

const mockHistory = {
  diabetes: false,
  allergies: 'Penicillin',
};

const DoctorDashboard = ({ doctorId = '123e4567-e89b-12d3-a456-426614174000' }) => {
  const [queue, setQueue] = useState([]);
  const [currentPatient, setCurrentPatient] = useState(null);

  useEffect(() => {
    const fetchLiveQueue = async () => {
      try {
        const { data, error } = await supabase
          .from('queue')
          .select(`
            id,
            position,
            appointments!inner(id, token_number, priority, estimated_wait_time, patients(id, has_diabetes, other_conditions, users(name)))
          `)
          .eq('doctor_id', doctorId)
          .order('position', { ascending: true });

        if (data && data.length > 0) {
          const formattedQueue = data.map(q => ({
            id: q.id,
            name: q.appointments.patients.users.name || 'Unknown Patient',
            token: q.appointments.token_number,
            condition: q.appointments.patients.other_conditions?.[0] || 'Checkup',
            isUrgent: q.appointments.priority === 'emergency',
            wait: `${q.appointments.estimated_wait_time || 0}m`
          }));
          setQueue(formattedQueue);
          setCurrentPatient(formattedQueue[0]);
        } else {
          setQueue([
            { id: 1, name: 'John Doe', token: 40, condition: 'Fever', isUrgent: false, wait: '0m' },
            { id: 2, name: 'Sarah Smith', token: 41, condition: 'Severe Pain', isUrgent: true, wait: '15m' },
          ]);
          setCurrentPatient({ id: 1, name: 'John Doe', token: 40, condition: 'Fever', isUrgent: false, wait: '0m' });
        }
      } catch (err) {
        console.log(err);
      }
    };

    fetchLiveQueue();

    const channel = supabase
      .channel('mobile-doctor-queue')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'queue', filter: `doctor_id=eq.${doctorId}` },
        () => fetchLiveQueue()
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [doctorId]);

  if (!currentPatient) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.accent.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <FadeUp delay={0}>
          <View style={styles.header}>
            <Text style={styles.title}>Welcome, Dr. Smith</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{queue.length} Waiting</Text>
            </View>
          </View>
        </FadeUp>

        <FadeUp delay={100} style={styles.section}>
          <Text style={styles.sectionTitle}>In Consultation</Text>
          <GlassCard style={styles.currentCard}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.patientName}>{currentPatient.name}</Text>
                <Text style={styles.tokenText}>Token #{currentPatient.token}</Text>
              </View>
              {currentPatient.isUrgent && (
                <View style={styles.emergencyBadge}>
                  <Text style={styles.emergencyText}>EMERGENCY</Text>
                </View>
              )}
            </View>
            
            <View style={styles.detailsBox}>
              <Text style={styles.detailsLabel}>Reported Issue</Text>
              <Text style={styles.detailsValue}>{currentPatient.condition}</Text>
            </View>

            <View style={styles.flagsBox}>
              <Text style={styles.flagsTitle}>Pre-Consultation Flags</Text>
              <Text style={styles.flagText}>Diabetes: No</Text>
              <Text style={[styles.flagText, { color: theme.colors.accent.emergency }]}>
                Allergies: {mockHistory.allergies}
              </Text>
            </View>

            <PrimaryButton title="Complete Consultation" style={styles.completeBtn} />
          </GlassCard>
        </FadeUp>

        <FadeUp delay={200} style={styles.section}>
          <Text style={styles.sectionTitle}>Up Next in Queue</Text>
          {queue.slice(1).map((patient, i) => (
            <TouchableOpacity key={patient.id} activeOpacity={0.7}>
              <GlassCard style={[styles.queueCard, patient.isUrgent && styles.queueEmergency]}>
                <View style={styles.queueHeader}>
                  <Text style={styles.queueToken}>#{patient.token}</Text>
                  <Text style={styles.queueWait}>{patient.wait}</Text>
                </View>
                <Text style={styles.queueName}>{patient.name}</Text>
                <Text style={styles.queueCondition}>{patient.condition}</Text>
              </GlassCard>
            </TouchableOpacity>
          ))}
        </FadeUp>
      </ScrollView>
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
    marginTop: theme.spacing.md,
  },
  title: {
    color: theme.colors.text.primary,
    fontSize: 22,
    fontWeight: 'bold',
  },
  badge: {
    backgroundColor: `${theme.colors.accent.primary}20`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeText: {
    color: theme.colors.accent.primary,
    fontWeight: 'bold',
    fontSize: 12,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    color: theme.colors.text.secondary,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: theme.spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  currentCard: {
    padding: theme.spacing.lg,
    borderColor: theme.colors.accent.primary,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.lg,
  },
  patientName: {
    color: theme.colors.text.primary,
    fontSize: 28,
    fontWeight: 'bold',
  },
  tokenText: {
    color: theme.colors.text.secondary,
    fontSize: 16,
    marginTop: 4,
  },
  emergencyBadge: {
    backgroundColor: `${theme.colors.accent.emergency}20`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  emergencyText: {
    color: theme.colors.accent.emergency,
    fontSize: 10,
    fontWeight: 'bold',
  },
  detailsBox: {
    backgroundColor: theme.colors.background.secondary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
  },
  detailsLabel: {
    color: theme.colors.text.secondary,
    fontSize: 12,
    marginBottom: 4,
  },
  detailsValue: {
    color: theme.colors.text.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  flagsBox: {
    backgroundColor: theme.colors.background.secondary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.lg,
  },
  flagsTitle: {
    color: theme.colors.accent.primary,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  flagText: {
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  completeBtn: {
    backgroundColor: theme.colors.success,
  },
  queueCard: {
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  queueEmergency: {
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.accent.emergency,
  },
  queueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  queueToken: {
    color: theme.colors.text.primary,
    fontWeight: 'bold',
    fontSize: 16,
  },
  queueWait: {
    color: theme.colors.text.secondary,
    fontSize: 14,
  },
  queueName: {
    color: theme.colors.text.primary,
    fontSize: 18,
    marginBottom: 4,
  },
  queueCondition: {
    color: theme.colors.text.secondary,
    fontSize: 14,
  }
});

export default DoctorDashboard;
