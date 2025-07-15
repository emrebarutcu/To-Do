import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Bell, Shield, CircleHelp as HelpCircle, Star, ChevronRight, Users, Award, Calendar, Smartphone, LogOut, UserPlus } from 'lucide-react-native';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { useChildren, useTasks, useUserSettings } from '@/hooks/useFirestore';
import { router } from 'expo-router';

export default function SettingsScreen() {
  const { user, familyId, logout } = useFirebaseAuth();
  const { children, loading: childrenLoading } = useChildren(familyId);
  const { tasks, loading: tasksLoading } = useTasks(familyId, user?.userid, true);
  const { settings, loading: settingsLoading, updateSettings } = useUserSettings(user?.userid);

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const isParent = user?.role === 'parent';

  // Update local state when settings load
  useEffect(() => {
    if (settings) {
      setNotificationsEnabled(settings.notifications ?? true);
      setSoundEnabled(settings.soundEffects ?? true);
    }
  }, [settings]);

  const handleNotificationToggle = async (value: boolean) => {
    setNotificationsEnabled(value);
    try {
      await updateSettings({ notifications: value });
    } catch (error) {
      console.error('Error updating notification settings:', error);
      setNotificationsEnabled(!value); // Revert on error
      Alert.alert('Error', 'Failed to update notification settings');
    }
  };

  const handleSoundToggle = async (value: boolean) => {
    setSoundEnabled(value);
    try {
      await updateSettings({ soundEffects: value });
    } catch (error) {
      console.error('Error updating sound settings:', error);
      setSoundEnabled(!value); // Revert on error
      Alert.alert('Error', 'Failed to update sound settings');
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              console.error('Error logging out:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          }
        }
      ]
    );
  };

  const settingsSections = [
    {
      title: 'Account',
      items: [
        { icon: User, label: 'Profile', subtitle: 'Update your profile information' },
      ]
    },
    ...(isParent ? [{
      title: 'Family Management',
      items: [
        { icon: Users, label: 'Manage Children', subtitle: 'Add, edit, or remove children', onPress: () => router.push('/manage-children') },
        { icon: Award, label: 'Reward Settings', subtitle: 'Customize available rewards' },
      ]
    }] : []),
    {
      title: 'App Settings',
      items: [
        { 
          icon: Bell, 
          label: 'Notifications', 
          subtitle: 'Task reminders and updates', 
          hasSwitch: true, 
          value: notificationsEnabled, 
          onToggle: handleNotificationToggle 
        },
        { 
          icon: Smartphone, 
          label: 'Sound Effects', 
          subtitle: 'App sounds and feedback', 
          hasSwitch: true, 
          value: soundEnabled, 
          onToggle: handleSoundToggle 
        },
        ...(isParent ? [{ icon: Calendar, label: 'Task Scheduling', subtitle: 'Default due dates and reminders' }] : []),
      ]
    },
    {
      title: 'Support',
      items: [
        { icon: HelpCircle, label: 'Help & FAQ', subtitle: 'Get help using the app' },
        { icon: Star, label: 'Rate the App', subtitle: 'Share your feedback' },
        { icon: Shield, label: 'Privacy Policy', subtitle: 'How we protect your data' },
      ]
    }
  ];

  const getStatsForUser = () => {
    if (isParent) {
      const totalPoints = children.reduce((sum, child) => sum + (child.points || 0), 0);
      const activeTasks = tasks.filter(task => !task.completed).length;
      
      return [
        { value: children.length.toString(), label: 'Children' },
        { value: activeTasks.toString(), label: 'Active Tasks' },
        { value: totalPoints.toString(), label: 'Total Points' },
      ];
    } else {
      const currentChild = children.find(child => child.userid === user?.userid) || user;
      const completedTasks = tasks.filter(task => task.completed && task.assignedTo === user?.userid).length;
      
      return [
        { value: (currentChild?.points || 0).toString(), label: 'Points' },
        { value: completedTasks.toString(), label: 'Tasks Done' },
        { value: streakDays.toString(), label: 'Streak Days' },
      ];
    }
  };

  if (childrenLoading || tasksLoading || settingsLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>
            {isParent ? 'Customize your family task experience' : 'Manage your account and preferences'}
          </Text>
        </View>

        {/* User Info */}
        <View style={styles.userCard}>
          <View style={[styles.userIcon, isParent ? styles.parentIcon : styles.childIcon]}>
            {isParent ? <Users size={24} color="#ffffff" /> : <User size={24} color="#ffffff" />}
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name}</Text>
            <Text style={styles.userRole}>{isParent ? 'Parent Account' : 'Child Account'}</Text>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          {getStatsForUser().map((stat, index) => (
            <View key={index} style={styles.statCard}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Settings Sections */}
        {settingsSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionContent}>
              {section.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={itemIndex}
                  style={[
                    styles.settingItem,
                    itemIndex === section.items.length - 1 && styles.lastItem
                  ]}
                  onPress={item.onPress}
                >
                  <View style={styles.settingIcon}>
                    <item.icon size={20} color="#64748b" />
                  </View>
                  <View style={styles.settingContent}>
                    <Text style={styles.settingLabel}>{item.label}</Text>
                    <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
                  </View>
                  <View style={styles.settingAction}>
                    {item.hasSwitch ? (
                      <Switch
                        value={item.value}
                        onValueChange={item.onToggle}
                        trackColor={{ false: '#e2e8f0', true: isParent ? '#3b82f6' : '#10b981' }}
                        thumbColor={item.value ? '#ffffff' : '#f4f3f4'}
                      />
                    ) : (
                      <ChevronRight size={20} color="#94a3b8" />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Family Members - Only for Parents */}
        {isParent && children.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Family Members</Text>
            <View style={styles.sectionContent}>
              {children.map((child, index) => (
                <TouchableOpacity
                  key={child.id}
                  style={[
                    styles.familyMemberItem,
                    index === children.length - 1 && styles.lastItem
                  ]}
                >
                  <View style={styles.memberIcon}>
                    <User size={20} color="#64748b" />
                  </View>
                  <View style={styles.settingContent}>
                    <Text style={styles.settingLabel}>{child.name}</Text>
                    <Text style={styles.settingSubtitle}>
                      {child.age || 0} years old • Level {child.level || 1} • {child.points || 0} points
                    </Text>
                  </View>
                  <ChevronRight size={20} color="#94a3b8" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Logout Section */}
        <View style={styles.section}>
          <View style={styles.sectionContent}>
            <TouchableOpacity style={styles.logoutItem} onPress={handleLogout}>
              <View style={styles.logoutIcon}>
                <LogOut size={20} color="#ef4444" />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.logoutLabel}>Logout</Text>
                <Text style={styles.settingSubtitle}>Sign out of your account</Text>
              </View>
              <ChevronRight size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appName}>Family Tasks</Text>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
          <Text style={styles.appDescription}>
            Making family chores fun and rewarding for everyone!
          </Text>
        </View>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1e293b',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    marginTop: 4,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  userIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  parentIcon: {
    backgroundColor: '#3b82f6',
  },
  childIcon: {
    backgroundColor: '#10b981',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1e293b',
  },
  userRole: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    marginTop: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 32,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1e293b',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#64748b',
    marginTop: 4,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionContent: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
  },
  settingSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    marginTop: 2,
  },
  settingAction: {
    marginLeft: 16,
  },
  familyMemberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  memberIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#dcfce7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  logoutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  logoutIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fef2f2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  logoutLabel: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#ef4444',
  },
  appInfo: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 32,
  },
  appName: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1e293b',
  },
  appVersion: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#64748b',
    marginTop: 4,
  },
  appDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 20,
  },
});