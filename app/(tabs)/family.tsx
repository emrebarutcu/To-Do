import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TaskCard from '@/components/TaskCard';
import { Plus, Filter, Star, Trophy, Target } from 'lucide-react-native';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { useChildren, useTasks } from '@/hooks/useFirestore';

export default function FamilyScreen() {
  const [selectedChild, setSelectedChild] = useState<string | null>(null);
  const { user, familyId } = useFirebaseAuth();
  const { children, loading: childrenLoading } = useChildren(familyId);
  const { tasks: firestoreTasks, loading: tasksLoading, toggleTaskCompletion } = useTasks(familyId, selectedChild, !selectedChild);

  const handleToggleComplete = async (taskId: string) => {
    const task = firestoreTasks.find(t => t.id === taskId);
    console.log('Handling toggle complete in family screen:', { taskId, task });
    if (!task) return;

    try {
      console.log('About to toggle task completion in family screen...');
      await toggleTaskCompletion(task.assignedTo, taskId, !task.completed, task.points);
      console.log('Task completion toggled successfully in family screen');
    } catch (error) {
      console.error('Error toggling task completion:', error);
      // Show user-friendly error
      alert('Failed to update task. Please try again.');
    }
  };

  const getChildById = (id: string) => children.find(child => child.userid === id || child.id === id);

  const isParent = user?.role === 'parent';
  const currentChild = !isParent && user ? user : null;

  // Use real Firestore tasks instead of mock data
  let filteredTasks = firestoreTasks;
  if (isParent) {
    filteredTasks = selectedChild ? firestoreTasks.filter(task => task.assignedTo === selectedChild) : firestoreTasks;
  } else {
    filteredTasks = firestoreTasks.filter(task => task.assignedTo === user?.userid);
  }

  const selectedChildData = selectedChild ? getChildById(selectedChild) : (isParent ? null : currentChild);

  const getScreenTitle = () => {
    if (isParent) {
      return 'Family Dashboard';
    } else {
      return 'My Tasks';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{getScreenTitle()}</Text>
          {isParent && (
            <TouchableOpacity style={styles.filterButton}>
              <Filter size={20} color="#64748b" />
            </TouchableOpacity>
          )}
        </View>

        {/* Children Selection - Only for Parents */}
        {isParent && (
          <View style={styles.childrenContainer}>
            {childrenLoading ? (
              <Text style={styles.loadingText}>Loading children...</Text>
            ) : children.length > 0 ? (
              <>
                <TouchableOpacity
                  style={[styles.childChip, !selectedChild && styles.selectedChip]}
                  onPress={() => setSelectedChild(null)}
                  onPress={() => setSelectedChild(child.id)}
                >
                  <Text style={[styles.chipText, !selectedChild && styles.selectedChipText]}>
                    All Children
                  </Text>
                </TouchableOpacity>
                {children.map(child => (
                  <TouchableOpacity
                    key={child.id}
                    style={[styles.childChip, selectedChild === child.id && styles.selectedChip]}
                  >
                    <Image source={{ uri: child.avatar }} style={styles.chipAvatar} />
                    <Text style={[styles.chipText, selectedChild === child.id && styles.selectedChipText]}>
                      {child.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </>
            ) : (
              <Text style={styles.noChildrenText}>No children added yet</Text>
            )}
          </View>
        )}

        {/* Selected Child Stats */}
        {selectedChildData && selectedChildData.age && (
          <View style={styles.childStatsContainer}>
            <View style={styles.childHeader}>
              <Image source={{ uri: selectedChildData.avatar }} style={styles.childAvatar} />
              <View style={styles.childInfo}>
                <Text style={styles.childName}>{selectedChildData.name}</Text>
                <Text style={styles.childAge}>{selectedChildData.age} years old</Text>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Star size={20} color="#f59e0b" fill="#f59e0b" />
                <Text style={styles.statValue}>{selectedChildData.points || 0}</Text>
                <Text style={styles.statLabel}>Total Points</Text>
              </View>
              <View style={styles.statItem}>
                <Target size={20} color="#10b981" />
                <Text style={styles.statValue}>{selectedChildData.completedTasks || 0}</Text>
                <Text style={styles.statLabel}>Completed Tasks</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.taskIcon}>📋</Text>
                <Text style={styles.statValue}>
                  {filteredTasks.filter(t => !t.completed).length}
                </Text>
                <Text style={styles.statLabel}>Pending Tasks</Text>
              </View>
            </View>
          </View>
        )}

        {/* Tasks Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {selectedChildData ? `${selectedChildData.name}'s Tasks` : (isParent ? 'All Tasks' : 'My Tasks')}
            </Text>
            {isParent && (
              <TouchableOpacity style={styles.addButton}>
                <Plus size={20} color="#3b82f6" />
              </TouchableOpacity>
            )}
          </View>

          {/* Pending Tasks */}
          <View style={styles.taskGroup}>
            <Text style={styles.taskGroupTitle}>Pending Tasks</Text>
            {filteredTasks.filter(task => !task.completed).map(task => {
              const child = getChildById(task.assignedTo);
              if (!child) return null;
              return (
                <TaskCard
                  key={task.id}
                  task={task}
                  child={child}
                  onToggleComplete={handleToggleComplete}
                  showChild={isParent && !selectedChild}
                />
              );
            })}
          </View>

          {/* Completed Tasks */}
          <View style={styles.taskGroup}>
            <Text style={styles.taskGroupTitle}>Completed Tasks</Text>
            {filteredTasks.filter(task => task.completed).map(task => {
              const child = getChildById(task.assignedTo);
              if (!child) return null;
              return (
                <TaskCard
                  key={task.id}
                  task={task}
                  child={child}
                  onToggleComplete={handleToggleComplete}
                  showChild={isParent && !selectedChild}
                />
              );
            })}
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
  filterButton: {
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
  childrenContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
  },
  noChildrenText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
  },
  childChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  selectedChip: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  chipAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 6,
  },
  chipText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#64748b',
  },
  selectedChipText: {
    color: '#ffffff',
  },
  childStatsContainer: {
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
  childHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
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
  childAge: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
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
    textAlign: 'center',
  },
  taskIcon: {
    fontSize: 20,
  },
  section: {
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1e293b',
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskGroup: {
    marginBottom: 24,
  },
  taskGroupTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#475569',
    marginBottom: 12,
  },
});