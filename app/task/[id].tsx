import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { useChildren, useTasks } from '@/hooks/useFirestore';
import { ArrowLeft, Clock, Star, Calendar, Repeat, User, CircleCheck as CheckCircle, Circle, CreditCard as Edit3, Trash2 } from 'lucide-react-native';

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams();
  const { user, familyId } = useFirebaseAuth();
  const { children, loading: childrenLoading } = useChildren(familyId);
  const { tasks, loading: tasksLoading, toggleTaskCompletion } = useTasks(familyId, user?.userid, user?.role === 'parent');
  
  const task = tasks.find(t => t.id === id);
  
  if (childrenLoading || tasksLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading task...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  if (!task) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Task not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const child = children.find(c => c.userid === task.assignedTo || c.id === task.assignedTo);
  const isParent = user?.role === 'parent';
  const canEdit = isParent || user?.userid === task.assignedTo;

  const handleToggleComplete = async () => {
    if (!task || !child) return;
    
    try {
      await toggleTaskCompletion(task.assignedTo, task.id, !task.completed, task.points);
      Alert.alert(
        'Success!',
        !task.completed 
          ? `Task completed! ${task.points} points earned.`
          : 'Task marked as incomplete.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error toggling task completion:', error);
      Alert.alert('Error', 'Failed to update task. Please try again.');
    }
  };

  const handleEdit = () => {
    // Navigate to edit screen
    Alert.alert('Edit Task', 'Edit functionality would be implemented here');
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Deleted', 'Task has been deleted');
            router.back();
          }
        }
      ]
    );
  };

  const formatDueDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'chores': return '🧹';
      case 'homework': return '📚';
      case 'personal': return '🎯';
      case 'family': return '👨‍👩‍👧‍👦';
      default: return '📝';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color="#1e293b" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Task Details</Text>
          {isParent && (
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.actionButton} onPress={handleEdit}>
                <Edit3 size={20} color="#64748b" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={handleDelete}>
                <Trash2 size={20} color="#ef4444" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Task Card */}
        <View style={styles.taskCard}>
          {/* Status Badge */}
          <View style={styles.statusContainer}>
            <View style={[
              styles.statusBadge,
              task.completed ? styles.completedBadge : styles.pendingBadge
            ]}>
              <Text style={[
                styles.statusText,
                task.completed ? styles.completedText : styles.pendingText
              ]}>
                {task.completed ? 'Completed' : 'Pending'}
              </Text>
            </View>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryIcon}>{getCategoryIcon(task.category)}</Text>
              <Text style={styles.categoryText}>{task.category}</Text>
            </View>
          </View>

          {/* Task Title */}
          <Text style={[styles.taskTitle, task.completed && styles.completedTitle]}>
            {task.title}
          </Text>

          {/* Task Description */}
          <Text style={[styles.taskDescription, task.completed && styles.completedDescription]}>
            {task.description}
          </Text>

          {/* Task Details */}
          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Star size={16} color="#f59e0b" fill="#f59e0b" />
                <Text style={styles.detailLabel}>Points</Text>
                <Text style={styles.detailValue}>{task.points}</Text>
              </View>
              <View style={styles.detailItem}>
                <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(task.priority) }]} />
                <Text style={styles.detailLabel}>Priority</Text>
                <Text style={[styles.detailValue, { textTransform: 'capitalize' }]}>{task.priority}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Calendar size={16} color="#3b82f6" />
                <Text style={styles.detailLabel}>Due Date</Text>
                <Text style={styles.detailValue}>
                  {child.age} years old
                </Text>
              </View>
              {task.recurring && (
                <View style={styles.detailItem}>
                  <Repeat size={16} color="#8b5cf6" />
                  <Text style={styles.detailLabel}>Recurring</Text>
                  <Text style={[styles.detailValue, { textTransform: 'capitalize' }]}>{task.recurring}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Assigned Child */}
          {child && (
            <View style={styles.assignedSection}>
              <Text style={styles.assignedLabel}>Assigned to:</Text>
              <View style={styles.assignedChild}>
                <Image source={{ uri: child.avatar }} style={styles.childAvatar} />
                <View style={styles.childInfo}>
                  <Text style={styles.childName}>{child.name}</Text>
                  <Text style={styles.childDetails}>
                    {child.age} years old • Level {child.level}
                  </Text>
                </View>
                <View style={styles.childStats}>
                  <Text style={styles.childPoints}>{child.points} pts</Text>
                </View>
              </View>
            </View>
          )}

          {/* Completion Info */}
          {task.completed && task.completedAt && (
            <View style={styles.completionInfo}>
              <CheckCircle size={20} color="#10b981" />
              <Text style={styles.completionText}>
                Completed on {formatDueDate(task.completedAt)}
              </Text>
            </View>
          )}
        </View>

        {/* Action Button */}
        {canEdit && (
          <View style={styles.actionContainer}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                task.completed ? styles.markIncompleteButton : styles.markCompleteButton
              ]}
              onPress={handleToggleComplete}
            >
              {task.completed ? (
                <Circle size={24} color="#ffffff" />
              ) : (
                <CheckCircle size={24} color="#ffffff" />
              )}
              <Text style={styles.toggleButtonText}>
                {task.completed ? 'Mark as Incomplete' : 'Mark as Complete'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Task History */}
        <View style={styles.historySection}>
          <Text style={styles.historyTitle}>Task History</Text>
          <View style={styles.historyList}>
            <View style={styles.historyItem}>
              <View style={styles.historyIcon}>
                <User size={16} color="#3b82f6" />
              </View>
              <View style={styles.historyContent}>
                <Text style={styles.historyText}>Task created and assigned to {child?.name}</Text>
                <Text style={styles.historyTime}>2 days ago</Text>
              </View>
            </View>
            {task.completed && (
              <View style={styles.historyItem}>
                <View style={styles.historyIcon}>
                  <CheckCircle size={16} color="#10b981" />
                </View>
                <View style={styles.historyContent}>
                  <Text style={styles.historyText}>Task completed by {child?.name}</Text>
                  <Text style={styles.historyTime}>
                    {task.completedAt ? formatDueDate(task.completedAt).split(' at ')[1] : 'Recently'}
                  </Text>
                </View>
              </View>
            )}
          </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
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
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
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
  taskCard: {
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
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  completedBadge: {
    backgroundColor: '#dcfce7',
  },
  pendingBadge: {
    backgroundColor: '#fef3c7',
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
  },
  completedText: {
    color: '#166534',
  },
  pendingText: {
    color: '#d97706',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  categoryIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  categoryText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#475569',
    textTransform: 'capitalize',
  },
  taskTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  completedTitle: {
    textDecorationLine: 'line-through',
    color: '#94a3b8',
  },
  taskDescription: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    lineHeight: 24,
    marginBottom: 24,
  },
  completedDescription: {
    textDecorationLine: 'line-through',
    color: '#94a3b8',
  },
  detailsContainer: {
    gap: 16,
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    gap: 24,
  },
  detailItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#64748b',
  },
  detailValue: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
  },
  priorityDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  assignedSection: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 20,
    marginBottom: 20,
  },
  assignedLabel: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
    marginBottom: 12,
  },
  assignedChild: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  childAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 16,
  },
  childInfo: {
    flex: 1,
  },
  childName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
    marginBottom: 2,
  },
  childDetails: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
  },
  childStats: {
    alignItems: 'flex-end',
  },
  childPoints: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#f59e0b',
  },
  completionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  completionText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#166534',
  },
  actionContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  markCompleteButton: {
    backgroundColor: '#10b981',
  },
  markIncompleteButton: {
    backgroundColor: '#64748b',
  },
  toggleButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
  historySection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  historyTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
    marginBottom: 16,
  },
  historyList: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  historyIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  historyContent: {
    flex: 1,
  },
  historyText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#1e293b',
    marginBottom: 2,
  },
  historyTime: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#ef4444',
    marginBottom: 16,
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
  backButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#3b82f6',
  },
});