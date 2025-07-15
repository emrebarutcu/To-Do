import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { User, Users, CreditCard as Edit3, Camera, Star, Trophy, Target, Calendar, Award, Settings, Bell, ChartBar as BarChart3 } from 'lucide-react-native';
import { router } from 'expo-router';
import { useChildren, useTasks } from '@/hooks/useFirestore';
import { userService } from '@/lib/firestore';

export default function ProfileScreen() {
  const { user, familyId } = useFirebaseAuth();
  const { children, loading: childrenLoading } = useChildren(familyId);
  const { tasks, loading: tasksLoading } = useTasks(familyId, user?.userid);
  
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');

  const isParent = user?.role === 'parent';
  const currentChild = !isParent && user ? user : null;

  const handleSave = async () => {
    if (!user?.userid) return;

    try {
      await userService.updateUser(user.userid, {
        name,
        email,
      });
      Alert.alert('Success', 'Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    }
  };

  const getProfileStats = () => {
    if (isParent) {
      const totalTasks = tasks.length;
      const totalPoints = children.reduce((sum, child) => sum + (child.points || 0), 0);
      const activeDays = 45; // This could be calculated from user creation date
      
      return [
        { icon: Users, value: children.length.toString(), label: 'Children', color: '#3b82f6' },
        { icon: Target, value: totalTasks.toString(), label: 'Active Tasks', color: '#10b981' },
        { icon: Award, value: totalPoints.toString(), label: 'Total Points Awarded', color: '#f59e0b' },
      ];
    } else {
      const currentChild = children.find(child => child.userid === user?.userid) || user;
      const completedTasks = tasks.filter(task => task.completed).length;
      const streakDays = 12; // This could be calculated from task completion history
      
      return [
        { icon: Star, value: (currentChild?.points || 0).toString(), label: 'Total Points', color: '#f59e0b' },
        { icon: Target, value: completedTasks.toString(), label: 'Tasks Completed', color: '#10b981' },
        { icon: Calendar, value: streakDays.toString(), label: 'Streak Days', color: '#3b82f6' },
      ];
    }
  };

  const achievements = [
    { id: 1, title: 'First Task', description: 'Complete your first task', earned: true, icon: '🎯' },
    { id: 2, title: 'Week Warrior', description: 'Complete tasks for 7 days straight', earned: true, icon: '🔥' },
    { 
      id: 3, 
      title: 'Point Collector', 
      description: 'Earn 100 points', 
      earned: currentChild ? (currentChild.points || 0) >= 100 : false, 
      icon: '⭐' 
    },
    { 
      id: 4, 
      title: 'Helper Hero', 
      description: 'Complete 20 tasks', 
      earned: tasks.filter(task => task.completed && task.assignedTo === user?.userid).length >= 20, 
      icon: '🦸' 
    },
    { 
      id: 5, 
      title: 'Streak Master', 
      description: 'Complete tasks for 10 days in a row', 
      earned: false, // This would need streak calculation
      icon: '🔥' 
    },
    { 
      id: 6, 
      title: 'Category Champion', 
      description: 'Complete 5 tasks in each category', 
      earned: ['chores', 'homework', 'personal', 'family'].every(category => 
        tasks.filter(task => task.completed && task.assignedTo === user?.userid && task.category === category).length >= 5
      ), 
      icon: '🏆' 
    },
  ];

  if (childrenLoading || tasksLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/analytics')}
            >
              <BarChart3 size={18} color="#64748b" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/notifications')}
            >
              <Bell size={18} color="#64748b" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/settings')}
            >
              <Settings size={18} color="#64748b" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setIsEditing(!isEditing)}
            >
              <Edit3 size={18} color={isParent ? "#3b82f6" : "#10b981"} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
              {isParent ? (
                <View style={[styles.avatarPlaceholder, styles.parentAvatar]}>
                  <Users size={32} color="#ffffff" />
                </View>
              ) : (
                <Image 
                  source={{ uri: user?.avatar || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400' }} 
                  style={styles.avatar} 
                />
              )}
              <TouchableOpacity style={styles.cameraButton}>
                <Camera size={16} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.profileInfo}>
            {isEditing ? (
              <View style={styles.editForm}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Name</Text>
                  <TextInput
                    style={styles.textInput}
                    value={name}
                    onChangeText={setName}
                    placeholder="Enter your name"
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Email</Text>
                  <TextInput
                    style={styles.textInput}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Enter your email"
                    keyboardType="email-address"
                  />
                </View>
                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.profileDetails}>
                <Text style={styles.profileName}>{user?.name}</Text>
                <Text style={styles.profileEmail}>{user?.email}</Text>
                <View style={styles.roleBadge}>
                  <Text style={styles.roleText}>
                    {isParent ? 'Parent Account' : `Child Account${currentChild ? ` • ${currentChild.age} years old` : ''}`}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Statistics</Text>
          <View style={styles.statsGrid}>
            {getProfileStats().map((stat, index) => (
              <View key={index} style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: `${stat.color}20` }]}>
                  <stat.icon size={20} color={stat.color} />
                </View>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Achievements - Only for Children */}
        {!isParent && (
          <View style={styles.achievementsSection}>
            <Text style={styles.sectionTitle}>Achievements</Text>
            <View style={styles.achievementsList}>
              {achievements.map(achievement => (
                <View 
                  key={achievement.id} 
                  style={[
                    styles.achievementCard,
                    achievement.earned && styles.earnedAchievement
                  ]}
                >
                  <Text style={styles.achievementIcon}>{achievement.icon}</Text>
                  <View style={styles.achievementInfo}>
                    <Text style={[
                      styles.achievementTitle,
                      achievement.earned && styles.earnedText
                    ]}>
                      {achievement.title}
                    </Text>
                    <Text style={[
                      styles.achievementDescription,
                      achievement.earned && styles.earnedDescription
                    ]}>
                      {achievement.description}
                    </Text>
                  </View>
                  {achievement.earned && (
                    <View style={styles.earnedBadge}>
                      <Text style={styles.earnedBadgeText}>✓</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Family Members - Only for Parents */}
        {isParent && (
          <View style={styles.familySection}>
            <Text style={styles.sectionTitle}>Family Members</Text>
            {children.map(child => (
              <View key={child.id} style={styles.familyMemberCard}>
                <Image source={{ uri: child.avatar || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400' }} style={styles.memberAvatar} />
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{child.name}</Text>
                  <Text style={styles.memberDetails}>
                    {child.age || 0} years old • {child.points || 0} points
                  </Text>
                </View>
                <TouchableOpacity style={styles.viewButton}>
                  <Text style={styles.viewButtonText}>View</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1e293b',
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 6,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  profileCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#e2e8f0',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  parentAvatar: {
    backgroundColor: '#3b82f6',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  profileInfo: {
    alignItems: 'center',
  },
  profileDetails: {
    alignItems: 'center',
  },
  profileName: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    marginBottom: 12,
  },
  roleBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  roleText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#475569',
  },
  editForm: {
    width: '100%',
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
  },
  textInput: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1e293b',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  saveButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
  statsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1e293b',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
  },
  statCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    width: '47%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#64748b',
    textAlign: 'center',
  },
  achievementsSection: {
    marginBottom: 24,
  },
  achievementsList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  achievementCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    opacity: 0.6,
  },
  earnedAchievement: {
    opacity: 1,
    borderWidth: 2,
    borderColor: '#10b981',
  },
  achievementIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#64748b',
    marginBottom: 2,
  },
  earnedText: {
    color: '#1e293b',
  },
  achievementDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#94a3b8',
  },
  earnedDescription: {
    color: '#64748b',
  },
  earnedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  earnedBadgeText: {
    fontSize: 12,
    color: '#ffffff',
    fontFamily: 'Inter-Bold',
  },
  familySection: {
    marginBottom: 24,
  },
  familyMemberCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 16,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
    marginBottom: 2,
  },
  memberDetails: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
  },
  viewButton: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  viewButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#475569',
  },
});