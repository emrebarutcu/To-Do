import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRedeemedRewards } from '@/hooks/useFirestore';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { RedeemedReward } from '@/types';
import { Clock, CheckCircle, XCircle } from 'lucide-react-native';

interface RedeemedRewardsListProps {
  childId?: string;
}

export default function RedeemedRewardsList({ childId }: RedeemedRewardsListProps) {
  const { familyId } = useFirebaseAuth();
  const { redeemedRewards, loading, error, markRewardAsUsed } = useRedeemedRewards(familyId, childId);

  const getStatusIcon = (reward: RedeemedReward) => {
    const now = new Date();
    const isExpired = reward.expiresAt < now;
    
    if (reward.status === 'used') {
      return <CheckCircle size={16} color="#10b981" />;
    } else if (isExpired || reward.status === 'expired') {
      return <XCircle size={16} color="#ef4444" />;
    } else {
      return <Clock size={16} color="#f59e0b" />;
    }
  };

  const getStatusText = (reward: RedeemedReward) => {
    const now = new Date();
    const isExpired = reward.expiresAt < now;
    
    if (reward.status === 'used') {
      return 'Used';
    } else if (isExpired || reward.status === 'expired') {
      return 'Expired';
    } else {
      const daysLeft = Math.ceil((reward.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`;
    }
  };

  const getStatusColor = (reward: RedeemedReward) => {
    const now = new Date();
    const isExpired = reward.expiresAt < now;
    
    if (reward.status === 'used') {
      return '#10b981';
    } else if (isExpired || reward.status === 'expired') {
      return '#ef4444';
    } else {
      return '#f59e0b';
    }
  };

  const handleMarkAsUsed = async (redemptionId: string, rewardTitle: string) => {
    Alert.alert(
      'Mark as Used',
      `Are you sure you want to mark "${rewardTitle}" as used?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark as Used',
          onPress: async () => {
            try {
              await markRewardAsUsed(redemptionId);
              Alert.alert('Success', 'Reward marked as used!');
            } catch (error) {
              Alert.alert('Error', 'Failed to mark reward as used. Please try again.');
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading redeemed rewards...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  const activeRewards = redeemedRewards.filter(reward => 
    reward.status === 'active' && reward.expiresAt > new Date()
  );

  const usedRewards = redeemedRewards.filter(reward => reward.status === 'used');
  const expiredRewards = redeemedRewards.filter(reward => 
    reward.status === 'expired' || reward.expiresAt <= new Date()
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Redeemed Rewards</Text>
      
      {/* Active Rewards */}
      {activeRewards.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Rewards</Text>
          {activeRewards.map(reward => (
            <View key={reward.id} style={styles.rewardCard}>
              <View style={styles.rewardHeader}>
                <Text style={styles.rewardTitle}>{reward.rewardTitle}</Text>
                <View style={styles.statusContainer}>
                  {getStatusIcon(reward)}
                  <Text style={[styles.statusText, { color: getStatusColor(reward) }]}>
                    {getStatusText(reward)}
                  </Text>
                </View>
              </View>
              <Text style={styles.rewardDescription}>{reward.rewardDescription}</Text>
              <View style={styles.rewardFooter}>
                <Text style={styles.pointsText}>{reward.pointsCost} points</Text>
                <TouchableOpacity
                  style={styles.useButton}
                  onPress={() => handleMarkAsUsed(reward.id, reward.rewardTitle)}
                >
                  <Text style={styles.useButtonText}>Mark as Used</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Used Rewards */}
      {usedRewards.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Used Rewards</Text>
          {usedRewards.map(reward => (
            <View key={reward.id} style={styles.rewardCard}>
              <View style={styles.rewardHeader}>
                <Text style={styles.rewardTitle}>{reward.rewardTitle}</Text>
                <View style={styles.statusContainer}>
                  {getStatusIcon(reward)}
                  <Text style={[styles.statusText, { color: getStatusColor(reward) }]}>
                    {getStatusText(reward)}
                  </Text>
                </View>
              </View>
              <Text style={styles.rewardDescription}>{reward.rewardDescription}</Text>
              <Text style={styles.pointsText}>{reward.pointsCost} points</Text>
            </View>
          ))}
        </View>
      )}

      {/* Expired Rewards */}
      {expiredRewards.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Expired Rewards</Text>
          {expiredRewards.map(reward => (
            <View key={reward.id} style={styles.rewardCard}>
              <View style={styles.rewardHeader}>
                <Text style={styles.rewardTitle}>{reward.rewardTitle}</Text>
                <View style={styles.statusContainer}>
                  {getStatusIcon(reward)}
                  <Text style={[styles.statusText, { color: getStatusColor(reward) }]}>
                    {getStatusText(reward)}
                  </Text>
                </View>
              </View>
              <Text style={styles.rewardDescription}>{reward.rewardDescription}</Text>
              <Text style={styles.pointsText}>{reward.pointsCost} points</Text>
            </View>
          ))}
        </View>
      )}

      {redeemedRewards.length === 0 && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No redeemed rewards yet</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#1f2937',
  },
  loadingText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#6b7280',
    marginTop: 20,
  },
  errorText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#ef4444',
    marginTop: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#374151',
  },
  rewardCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rewardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  rewardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  rewardDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  rewardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pointsText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#f59e0b',
  },
  useButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  useButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
}); 