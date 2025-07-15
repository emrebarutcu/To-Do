import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { useChildren, useTasks } from '@/hooks/useFirestore';
import { Bell, CircleCheck as CheckCircle, Clock, Star, Gift, Users, Trash2 } from 'lucide-react-native';

interface Notification {
  id: string;
  type: 'task_completed' | 'task_assigned' | 'reward_redeemed' | 'level_up' | 'reminder';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  childId?: string;
  actionRequired?: boolean;
}

export default function NotificationsScreen() {
  const { user } = useFirebaseAuth();
  const { familyId } = useFirebaseAuth();
  const { children, loading: childrenLoading } = useChildren(familyId);
  const { tasks, loading: tasksLoading } = useTasks(familyId, user?.userid, user?.role === 'parent');
  const isParent = user?.role === 'parent';

  // Generate dynamic notifications based on real data
  const generateNotifications = (): Notification[] => {
    const notifications: Notification[] = [];
    
    // Recently completed tasks
    const recentlyCompleted = tasks.filter(task => 
      task.completed && 
      task.completedAt && 
      new Date(task.completedAt).getTime() > Date.now() - 24 * 60 * 60 * 1000
    );
    
    recentlyCompleted.forEach((task, index) => {
      const child = children.find(c => c.userid === task.assignedTo);
      if (child) {
        notifications.push({
          id: `completed-${task.id}`,
          type: 'task_completed',
          title: 'Task Completed!',
          message: `${child.name} completed "${task.title}" and earned ${task.points} points`,
          timestamp: new Date(task.completedAt!),
          read: index > 2, // First 3 are unread
          childId: child.id,
          actionRequired: false,
        });
      }
    });
    
    // Overdue tasks
    const overdueTasks = tasks.filter(task => 
      !task.completed && 
      new Date(task.dueDate).getTime() < Date.now()
    );
    
    overdueTasks.slice(0, 3).forEach((task, index) => {
      const child = children.find(c => c.userid === task.assignedTo);
      if (child) {
        notifications.push({
          id: `overdue-${task.id}`,
          type: 'reminder',
          title: 'Task Overdue',
          message: isParent 
            ? `${child.name} has an overdue task: "${task.title}"`
            : `Don't forget: "${task.title}" is overdue`,
          timestamp: new Date(task.dueDate),
          read: false,
          childId: child.id,
          actionRequired: true,
        });
      }
    });
    
    // Level ups (children who recently gained levels)
    // Recently assigned tasks
    const recentTasks = tasks.filter(task => 
      !task.completed &&
      new Date(task.dueDate).getTime() > Date.now() - 24 * 60 * 60 * 1000
    );
    
    recentTasks.slice(0, 2).forEach(task => {
      const child = children.find(c => c.userid === task.assignedTo);
      if (child) {
        notifications.push({
          id: `assigned-${task.id}`,
          type: 'task_assigned',
          title: 'New Task Assigned',
          message: isParent 
            ? `You assigned "${task.title}" to ${child.name}`
            : `You have a new task: "${task.title}"`,
          timestamp: new Date(task.dueDate),
          read: true,
          childId: child.id,
        });
      }
    });
    
    return notifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  };

  const [notifications, setNotifications] = useState<Notification[]>([]);

  React.useEffect(() => {
    if (!childrenLoading && !tasksLoading) {
      setNotifications(generateNotifications());
    }
  }, [children, tasks, childrenLoading, tasksLoading, isParent]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'task_completed': return <CheckCircle size={20} color="#10b981" />;
      case 'task_assigned': return <Bell size={20} color="#3b82f6" />;
      case 'reward_redeemed': return <Gift size={20} color="#ec4899" />;
      case 'level_up': return <Star size={20} color="#f59e0b" />;
      case 'reminder': return <Clock size={20} color="#f97316" />;
      default: return <Bell size={20} color="#6b7280" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'task_completed': return '#dcfce7';
      case 'task_assigned': return '#dbeafe';
      case 'reward_redeemed': return '#fce7f3';
      case 'level_up': return '#fef3c7';
      case 'reminder': return '#fed7aa';
      default: return '#f3f4f6';
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    // Check if timestamp is valid before processing
    if (!timestamp || !(timestamp instanceof Date) || isNaN(timestamp.getTime())) {
      return 'Just now';
    }
    
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 24 * 60) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diffInMinutes / (24 * 60));
      return `${days}d ago`;
    }
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const deleteNotification = (notificationId: string) => {
    setNotifications(prev =>
      prev.filter(notification => notification.id !== notificationId)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const getChildById = (childId: string) => {
    return children.find(child => child.id === childId);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (childrenLoading || tasksLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Notifications</Text>
          <Text style={styles.subtitle}>
            {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
          </Text>
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity style={styles.markAllButton} onPress={markAllAsRead}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        {notifications.length > 0 ? (
          <View style={styles.notificationsList}>
            {notifications.map(notification => {
              const child = notification.childId ? getChildById(notification.childId) : null;
              
              return (
                <TouchableOpacity
                  key={notification.id}
                  style={[
                    styles.notificationCard,
                    !notification.read && styles.unreadNotification
                  ]}
                  onPress={() => markAsRead(notification.id)}
                >
                  <View style={styles.notificationContent}>
                    <View style={[
                      styles.iconContainer,
                      { backgroundColor: getNotificationColor(notification.type) }
                    ]}>
                      {getNotificationIcon(notification.type)}
                    </View>

                    <View style={styles.notificationBody}>
                      <View style={styles.notificationHeader}>
                        <Text style={[
                          styles.notificationTitle,
                          !notification.read && styles.unreadTitle
                        ]}>
                          {notification.title}
                        </Text>
                        <Text style={styles.timestamp}>
                          {formatTimestamp(notification.timestamp)}
                        </Text>
                      </View>

                      <Text style={styles.notificationMessage}>
                        {notification.message}
                      </Text>

                      {child && isParent && (
                        <View style={styles.childInfo}>
                          <Image source={{ uri: child.avatar }} style={styles.childAvatar} />
                          <Text style={styles.childName}>{child.name}</Text>
                        </View>
                      )}

                      {notification.actionRequired && (
                        <View style={styles.actionButtons}>
                          <TouchableOpacity style={styles.approveButton}>
                            <Text style={styles.approveButtonText}>Approve</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.viewButton}>
                            <Text style={styles.viewButtonText}>View Details</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>

                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => deleteNotification(notification.id)}
                    >
                      <Trash2 size={16} color="#94a3b8" />
                    </TouchableOpacity>
                  </View>

                  {!notification.read && <View style={styles.unreadIndicator} />}
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Bell size={48} color="#d1d5db" />
            <Text style={styles.emptyStateTitle}>No notifications</Text>
            <Text style={styles.emptyStateText}>
              You're all caught up! New notifications will appear here.
            </Text>
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
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    marginTop: 2,
  },
  markAllButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  markAllText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  notificationsList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  notificationCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
  },
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  notificationContent: {
    flexDirection: 'row',
    padding: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  notificationBody: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#64748b',
    flex: 1,
    marginRight: 8,
  },
  unreadTitle: {
    color: '#1e293b' as string,
  },
  timestamp: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#94a3b8',
  },
  notificationMessage: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 8,
  },
  childInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  childAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 6,
  },
  childName: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#475569',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  approveButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  approveButtonText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
  viewButton: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  viewButtonText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#475569',
  },
  deleteButton: {
    padding: 4,
    marginLeft: 8,
  },
  unreadIndicator: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3b82f6',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
});