import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TaskCard from '@/components/TaskCard'; 
import { Bell, Calendar, TrendingUp, Users, User, ChartBar as BarChart3, Settings, Plus } from 'lucide-react-native';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { useChildren, useTasks } from '@/hooks/useFirestore';
import { router } from 'expo-router';

export default function HomeScreen() {
  const { user, familyId } = useFirebaseAuth();
  const { children, loading: childrenLoading } = useChildren(familyId);
  const { tasks, loading: tasksLoading, toggleTaskCompletion } = useTasks(familyId, user?.userid, !user || user.role === 'parent');

  const handleToggleComplete = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    console.log('Handling toggle complete:', { taskId, task });
    if (!task) return;

    try {
      console.log('About to toggle task completion...');
      await toggleTaskCompletion(task.assignedTo, taskId, !task.completed, task.points);
      console.log('Task completion toggled successfully');
    } catch (error) {
      console.error('Error toggling task completion:', error);
      // Show user-friendly error
      alert('Failed to update task. Please try again.');
    }
  };

  const getChildById = (id: string) => children.find(child => child.userid === id || child.id === id);

  const isParent = user?.role === 'parent';
  const currentChild = !isParent && user ? user : null;

  // Filter tasks based on user role
  const filteredTasks = isParent ? tasks : tasks.filter(task => task.assignedTo === user?.userid);

  const todaysTasks = filteredTasks.filter(task => {
    const today = new Date();
    const taskDate = new Date(task.dueDate);
    return taskDate.toDateString() === today.toDateString() && !task.completed;
  });

  const completedToday = filteredTasks.filter(task => {
    if (!task.completedAt) return false;
    const today = new Date();
    const completedDate = new Date(task.completedAt);
    return completedDate.toDateString() === today.toDateString();
  });

  const totalPointsEarned = completedToday.reduce((sum, task) => sum + task.points, 0);

  const getGreeting = () => {
    if (isParent) {
      return {
        title: "Good morning, Parent! 👋",
        subtitle: "Let's see how the family is doing today"
      };
    } else {
      return {
        title: `Hi ${currentChild?.name}! 👋`,
        subtitle: "Ready to complete some tasks and earn points?"
      };
    }
  };

  const greeting = getGreeting();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={[styles.userIndicator, isParent ? styles.parentIndicator : styles.childIndicator]}>
              {isParent ? <Users size={20} color="#ffffff" /> : <User size={20} color="#ffffff" />}
            </View>
            <View style={styles.headerText}>
              <Text style={styles.greeting}>{greeting.title}</Text>
              <Text style={styles.subtitle}>{greeting.subtitle}</Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={() => router.push('/analytics')}
            >
              <BarChart3 size={20} color="#64748b" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/notifications')}
            >
              <Bell size={20} color="#64748b" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/settings')}
            >
              <Settings size={20} color="#64748b" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Calendar size={20} color="#3b82f6" />
            <Text style={styles.statValue}>{todaysTasks.length}</Text>
            <Text style={styles.statLabel}>{isParent ? 'Tasks Today' : 'My Tasks'}</Text>
          </View>
          <View style={styles.statCard}>
            <TrendingUp size={20} color="#10b981" />
            <Text style={styles.statValue}>{completedToday.length}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.pointsIcon}>⭐</Text>
            <Text style={styles.statValue}>{totalPointsEarned}</Text>
            <Text style={styles.statLabel}>Points Earned</Text>
          </View>
        </View>

        {/* Current User Info for Children */}
        {!isParent && currentChild && currentChild.age && (
          <View style={styles.childProfile}>
            <Image source={{ uri: currentChild.avatar }} style={styles.childAvatar} />
            <View style={styles.childInfo}>
              <Text style={styles.childName}>{currentChild.name}</Text>
              <Text style={styles.childStats}>
                {currentChild.points || 0} points
              </Text>
            </View>
          </View>
        )}

        {/* Family Overview - Only for Parents */}
        {isParent && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Family Overview</Text>
            {childrenLoading ? (
              <Text style={styles.loadingText}>Loading children...</Text>
            ) : children.length > 0 ? (
              <View style={styles.childrenGrid}>
                {children.map(child => (
                  <View key={child.id} style={styles.childCard}>
                    <Image source={{ uri: child.avatar }} style={styles.childCardAvatar} />
                    <Text style={styles.childCardName}>{child.name}</Text>
                    <Text style={styles.childCardAge}>{child.age} years old</Text>
                    <View style={styles.childCardStats}>
                      <Text style={styles.childCardPoints}>{child.points || 0} pts</Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyChildrenState}>
                <Text style={styles.emptyChildrenText}>No children added yet</Text>
                <TouchableOpacity 
                  style={styles.addChildrenButton}
                  onPress={() => router.push('/manage-children')}
                >
                  <Text style={styles.addChildrenButtonText}>Add Children</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Today's Tasks */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {isParent ? "Today's Tasks" : "My Tasks Today"}
          </Text>
          {todaysTasks.length > 0 ? (
            todaysTasks.map(task => {
              const child = getChildById(task.assignedTo);
              if (!child) return null;
              return (
                <TaskCard
                  key={task.id}
                  task={task}
                  child={child}
                  onToggleComplete={handleToggleComplete}
                  showChild={isParent}
                />
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>🎉</Text>
              <Text style={styles.emptyStateTitle}>All caught up!</Text>
              <Text style={styles.emptyStateText}>
                {isParent ? 'No tasks due today. Great job!' : 'No tasks for you today. Enjoy your free time!'}
              </Text>
            </View>
          )}
        </View>

        {/* Recent Completions */}
        {completedToday.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {isParent ? 'Completed Today' : 'You Completed Today'}
            </Text>
            {completedToday.map(task => {
              const child = getChildById(task.assignedTo);
              if (!child) return null;
              return (
                <TaskCard
                  key={task.id}
                  task={task}
                  child={child}
                  onToggleComplete={handleToggleComplete}
                  showChild={isParent}
                />
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => router.push('/add-task')}
        activeOpacity={0.8}
      >
        <Plus size={24} color="#ffffff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  parentIndicator: {
    backgroundColor: '#3b82f6',
  },
  childIndicator: {
    backgroundColor: '#10b981',
  },
  headerText: {
    flex: 1,
  },
  greeting: {
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
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
    gap: 8,
  },
  actionButton: {
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
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
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
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#64748b',
    marginTop: 4,
  },
  pointsIcon: {
    fontSize: 20,
  },
  childProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  childAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  childInfo: {
    flex: 1,
  },
  childName: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1e293b',
  },
  childStats: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    marginTop: 2,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1e293b',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  childrenScroll: {
    paddingLeft: 20,
  },
  childrenGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
  },
  childCard: {
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
  childCardAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 8,
  },
  childCardName: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
    marginBottom: 2,
  },
  childCardAge: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    marginBottom: 8,
  },
  childCardStats: {
    flexDirection: 'row',
    gap: 8,
  },
  childCardPoints: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
    color: '#f59e0b',
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    textAlign: 'center',
    paddingVertical: 20,
  },
  emptyChildrenState: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  emptyChildrenText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    marginBottom: 12,
  },
  addChildrenButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  addChildrenButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});