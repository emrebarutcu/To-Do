import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Reward } from '@/types';
import { Star, Gift, Clock, Zap, DollarSign, Crown } from 'lucide-react-native';

interface RewardCardProps {
  reward: Reward;
  onRedeem: (rewardId: string) => void;
  canAfford: boolean;
}

export default function RewardCard({ reward, onRedeem, canAfford }: RewardCardProps) {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'screen-time': return <Clock size={20} color="#3b82f6" />;
      case 'treats': return <Gift size={20} color="#ec4899" />;
      case 'activities': return <Zap size={20} color="#8b5cf6" />;
      case 'money': return <DollarSign size={20} color="#10b981" />;
      case 'privileges': return <Crown size={20} color="#f59e0b" />;
      default: return <Gift size={20} color="#6b7280" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'screen-time': return '#dbeafe';
      case 'treats': return '#fce7f3';
      case 'activities': return '#ede9fe';
      case 'money': return '#d1fae5';
      case 'privileges': return '#fef3c7';
      default: return '#f3f4f6';
    }
  };

  return (
    <View style={[styles.container, !canAfford && styles.disabledContainer]}>
      <View style={[styles.iconContainer, { backgroundColor: getCategoryColor(reward.category) }]}>
        {getCategoryIcon(reward.category)}
      </View>

      <View style={styles.content}>
        <Text style={[styles.title, !canAfford && styles.disabledText]}>{reward.title}</Text>
        <Text style={[styles.description, !canAfford && styles.disabledText]}>
          {reward.description}
        </Text>

        <View style={styles.footer}>
          <View style={styles.pointsContainer}>
            <Star size={16} color="#f59e0b" fill="#f59e0b" />
            <Text style={styles.pointsText}>{reward.pointsCost} pts</Text>
          </View>

          <TouchableOpacity
            style={[
              styles.redeemButton,
              !canAfford && styles.disabledButton,
            ]}
            onPress={() => onRedeem(reward.id)}
            disabled={!canAfford}
          >
            <Text style={[
              styles.redeemButtonText,
              !canAfford && styles.disabledButtonText,
            ]}>
              {canAfford ? 'Redeem' : 'Need more points'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    flexDirection: 'row',
  },
  disabledContainer: {
    opacity: 0.6,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    marginBottom: 12,
    lineHeight: 20,
  },
  disabledText: {
    color: '#94a3b8',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pointsText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#d97706',
    marginLeft: 4,
  },
  redeemButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  disabledButton: {
    backgroundColor: '#e2e8f0',
  },
  redeemButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
  disabledButtonText: {
    color: '#94a3b8',
  },
});