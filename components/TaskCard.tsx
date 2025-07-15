import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Task, User } from '@/types';
import { Clock, Star, CircleCheck as CheckCircle, Circle } from 'lucide-react-native';

interface TaskCardProps {
  task: Task;
  child: User;
  onToggleComplete: (taskId: string) => void;
  showChild?: boolean;
}

export default function TaskCard({ task, child, onToggleComplete, showChild = true }: TaskCardProps) {
  const formatDueDate = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 0) return 'Overdue';
    if (diffInHours < 24) return `${diffInHours}h left`;
    const diffInDays = Math.ceil(diffInHours / 24);
    return `${diffInDays}d left`;
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
    <View style={[styles.container, task.completed && styles.completedContainer]}>
      <View style={styles.header}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryIcon}>{getCategoryIcon(task.category)}</Text>
          <Text style={styles.categoryText}>{task.category}</Text>
        </View>
        <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(task.priority) }]} />
      </View>

      <View style={styles.content}>
        <Text style={[styles.title, task.completed && styles.completedText]}>{task.title}</Text>
        <Text style={[styles.description, task.completed && styles.completedText]}>
          {task.description}
        </Text>

        {showChild && (
          <View style={styles.assignedTo}>
            <Image source={{ uri: child.avatar || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400' }} style={styles.childAvatar} />
            <Text style={styles.childName}>{child.name}</Text>
          </View>
        )}

        <View style={styles.footer}>
          <View style={styles.leftFooter}>
            <View style={styles.pointsBadge}>
              <Star size={14} color="#f59e0b" fill="#f59e0b" />
              <Text style={styles.pointsText}>{task.points} pts</Text>
            </View>
            <View style={styles.timeContainer}>
              <Clock size={14} color="#6b7280" />
              <Text style={[styles.timeText, task.completed && styles.completedText]}>
                {task.completed ? 'Completed' : formatDueDate(task.dueDate)}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.checkButton}
            onPress={() => onToggleComplete(task.id)}
          >
            {task.completed ? (
              <CheckCircle size={24} color="#10b981" fill="#10b981" />
            ) : (
              <Circle size={24} color="#d1d5db" />
            )}
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
  },
  completedContainer: {
    backgroundColor: '#f8fafc',
    opacity: 0.8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  categoryText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#475569',
    textTransform: 'capitalize',
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
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
  completedText: {
    textDecorationLine: 'line-through',
    color: '#94a3b8',
  },
  assignedTo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  childAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  childName: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#475569',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pointsText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#d97706',
    marginLeft: 4,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6b7280',
    marginLeft: 4,
  },
  checkButton: {
    padding: 4,
  },
});