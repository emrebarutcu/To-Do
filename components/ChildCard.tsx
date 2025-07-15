import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { User } from '@/types';
import { Star, Trophy, Target } from 'lucide-react-native';

interface ChildCardProps {
  child: User;
  onPress: () => void;
}

export default function ChildCard({ child, onPress }: ChildCardProps) {
  const getLevelProgress = (level: number) => {
    const basePoints = 100;
    const currentLevelPoints = basePoints * (level - 1);
    const nextLevelPoints = basePoints * level;
    const progress = (((child.points || 0) - currentLevelPoints) / (nextLevelPoints - currentLevelPoints)) * 100;
    return Math.max(0, Math.min(100, progress));
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.header}>
        <Image source={{ uri: child.avatar || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400' }} style={styles.avatar} />
      </View>

      <Text style={styles.name}>{child.name}</Text>
      <Text style={styles.age}>{child.age || 0} years old</Text>

      <View style={styles.statsContainer}>
        <View style={styles.stat}>
          <Star size={16} color="#f59e0b" fill="#f59e0b" />
          <Text style={styles.statValue}>{child.points || 0}</Text>
          <Text style={styles.statLabel}>Points</Text>
        </View>
        <View style={styles.stat}>
          <Target size={16} color="#10b981" />
          <Text style={styles.statValue}>{child.completedTasks || 0}</Text>
          <Text style={styles.statLabel}>Tasks</Text>
        </View>
      </View>

    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginRight: 16,
    width: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: '#e2e8f0',
  },
  name: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  age: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  stat: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1e293b',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#64748b',
    marginTop: 2,
  },
});