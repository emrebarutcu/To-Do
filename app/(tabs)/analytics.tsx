import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { useChildren, useTasks } from '@/hooks/useFirestore';
import { TrendingUp, Calendar, Target, Star, Users, Award, ChartBar as BarChart3, ChartPie as PieChart } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function AnalyticsScreen() {
  const { user } = useFirebaseAuth();
  const { familyId } = useFirebaseAuth();
  const { children, loading: childrenLoading } = useChildren(familyId);
  const { tasks, loading: tasksLoading } = useTasks(familyId, user?.userid, user?.role === 'parent');
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('week');
  
  const isParent = user?.role === 'parent';
  const currentChild = user?.userid ? children.find(child => child.userid === user.userid) : null;

  const periods = [
    { key: 'week', label: 'This Week' },
    { key: 'month', label: 'This Month' },
    { key: 'year', label: 'This Year' },
  ];

  // Mock analytics data
  const getAnalyticsData = () => {
    const completedTasks = tasks.filter(task => task.completed);
    const totalPoints = isParent 
      ? children.reduce((sum, child) => sum + (child.points || 0), 0)
      : (currentChild?.points || 0);
    
    if (isParent) {
      return {
        totalTasks: tasks.length,
        completedTasks: completedTasks.length,
        totalPoints,
        averageCompletion: tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0,
        childrenData: children.map(child => {
          const childTasks = tasks.filter(task => task.assignedTo === child.userid);
          const childCompletedTasks = childTasks.filter(task => task.completed);
          return {
            ...child,
            weeklyTasks: childTasks.length,
            weeklyPoints: child.points || 0,
            completionRate: childTasks.length > 0 ? Math.round((childCompletedTasks.length / childTasks.length) * 100) : 0,
          };
        }),
        categoryData: [
          { 
            category: 'Chores', 
            completed: completedTasks.filter(task => task.category === 'chores').length, 
            total: tasks.filter(task => task.category === 'chores').length, 
            color: '#3b82f6' 
          },
          { 
            category: 'Homework', 
            completed: completedTasks.filter(task => task.category === 'homework').length, 
            total: tasks.filter(task => task.category === 'homework').length, 
            color: '#10b981' 
          },
          { 
            category: 'Personal', 
            completed: completedTasks.filter(task => task.category === 'personal').length, 
            total: tasks.filter(task => task.category === 'personal').length, 
            color: '#f59e0b' 
          },
          { 
            category: 'Family', 
            completed: completedTasks.filter(task => task.category === 'family').length, 
            total: tasks.filter(task => task.category === 'family').length, 
            color: '#8b5cf6' 
          },
        ],
        weeklyProgress: generateWeeklyProgress(tasks),
      };
    } else {
      const userTasks = tasks.filter(task => task.assignedTo === user?.userid);
      const userCompletedTasks = userTasks.filter(task => task.completed);
      
      return {
        totalTasks: userTasks.length,
        completedTasks: userCompletedTasks.length,
        totalPoints: currentChild?.points || 0,
        averageCompletion: userTasks.length > 0 ? Math.round((userCompletedTasks.length / userTasks.length) * 100) : 0,
        weeklyProgress: generateWeeklyProgress(userTasks),
        categoryData: [
          { 
            category: 'Chores', 
            completed: userCompletedTasks.filter(task => task.category === 'chores').length, 
            total: userTasks.filter(task => task.category === 'chores').length, 
            color: '#3b82f6' 
          },
          { 
            category: 'Homework', 
            completed: userCompletedTasks.filter(task => task.category === 'homework').length, 
            total: userTasks.filter(task => task.category === 'homework').length, 
            color: '#10b981' 
          },
          { 
            category: 'Personal', 
            completed: userCompletedTasks.filter(task => task.category === 'personal').length, 
            total: userTasks.filter(task => task.category === 'personal').length, 
            color: '#f59e0b' 
          },
          { 
            category: 'Family', 
            completed: userCompletedTasks.filter(task => task.category === 'family').length, 
            total: userTasks.filter(task => task.category === 'family').length, 
            color: '#8b5cf6' 
          },
        ],
      };
    }
  };

  const generateWeeklyProgress = (taskList: any[]) => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const today = new Date();
    
    return days.map((day, index) => {
      const dayDate = new Date(today);
      dayDate.setDate(today.getDate() - (today.getDay() - 1) + index);
      
      const dayTasks = taskList.filter(task => {
        if (!task.completedAt) return false;
        const completedDate = new Date(task.completedAt);
        return completedDate.toDateString() === dayDate.toDateString();
      });
      
      const dayPoints = dayTasks.reduce((sum, task) => sum + (task.points || 0), 0);
      
      return {
        day,
        tasks: dayTasks.length,
        points: dayPoints,
      };
    });
  };

  const data = getAnalyticsData();

  if (childrenLoading || tasksLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading analytics...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const ProgressBar = ({ value, maxValue, color, height = 8 }: { value: number; maxValue: number; color: string; height?: number }) => (
    <View style={[styles.progressBarContainer, { height }]}>
      <View 
        style={[
          styles.progressBarFill, 
          { 
            width: `${(value / maxValue) * 100}%`, 
            backgroundColor: color,
            height 
          }
        ]} 
      />
    </View>
  );

  const BarChart = ({ data: chartData }: { data: any[] }) => {
    const maxValue = Math.max(...chartData.map(item => Math.max(item.tasks, item.points / 10)));
    
    return (
      <View style={styles.barChart}>
        <View style={styles.chartContainer}>
          {chartData.map((item, index) => (
            <View key={index} style={styles.barGroup}>
              <View style={styles.bars}>
                <View 
                  style={[
                    styles.bar,
                    styles.tasksBar,
                    { height: (item.tasks / maxValue) * 100 }
                  ]} 
                />
                <View 
                  style={[
                    styles.bar,
                    styles.pointsBar,
                    { height: ((item.points / 10) / maxValue) * 100 }
                  ]} 
                />
              </View>
              <Text style={styles.barLabel}>{item.day}</Text>
            </View>
          ))}
        </View>
        <View style={styles.chartLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#3b82f6' }]} />
            <Text style={styles.legendText}>Tasks</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#10b981' }]} />
            <Text style={styles.legendText}>Points (÷10)</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Analytics</Text>
            <Text style={styles.subtitle}>
              {isParent ? 'Family performance insights' : 'Your progress overview'}
            </Text>
          </View>
          <TouchableOpacity style={styles.exportButton}>
            <BarChart3 size={20} color="#64748b" />
          </TouchableOpacity>
        </View>

        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {periods.map(period => (
            <TouchableOpacity
              key={period.key}
              style={[
                styles.periodButton,
                selectedPeriod === period.key && styles.selectedPeriod
              ]}
              onPress={() => setSelectedPeriod(period.key as any)}
            >
              <Text style={[
                styles.periodText,
                selectedPeriod === period.key && styles.selectedPeriodText
              ]}>
                {period.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Key Metrics */}
        <View style={styles.metricsContainer}>
          <View style={styles.metricCard}>
            <View style={styles.metricIcon}>
              <Target size={20} color="#3b82f6" />
            </View>
            <Text style={styles.metricValue}>{data.completedTasks}/{data.totalTasks}</Text>
            <Text style={styles.metricLabel}>Tasks Completed</Text>
          </View>
          <View style={styles.metricCard}>
            <View style={styles.metricIcon}>
              <Star size={20} color="#f59e0b" />
            </View>
            <Text style={styles.metricValue}>{data.totalPoints}</Text>
            <Text style={styles.metricLabel}>Points Earned</Text>
          </View>
          <View style={styles.metricCard}>
            <View style={styles.metricIcon}>
              <TrendingUp size={20} color="#10b981" />
            </View>
            <Text style={styles.metricValue}>{data.averageCompletion}%</Text>
            <Text style={styles.metricLabel}>Completion Rate</Text>
          </View>
        </View>

        {/* Weekly Progress Chart */}
        <View style={styles.chartSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Weekly Progress</Text>
            <PieChart size={20} color="#64748b" />
          </View>
          <View style={styles.chartCard}>
            <BarChart data={data.weeklyProgress} />
          </View>
        </View>

        {/* Category Breakdown */}
        <View style={styles.categorySection}>
          <Text style={styles.sectionTitle}>Category Performance</Text>
          <View style={styles.categoryList}>
            {data.categoryData.map((category, index) => (
              <View key={index} style={styles.categoryItem}>
                <View style={styles.categoryHeader}>
                  <View style={styles.categoryInfo}>
                    <View style={[styles.categoryDot, { backgroundColor: category.color }]} />
                    <Text style={styles.categoryName}>{category.category}</Text>
                  </View>
                  <Text style={styles.categoryStats}>
                    {category.completed}/{category.total}
                  </Text>
                </View>
                <ProgressBar 
                  value={category.completed} 
                  maxValue={category.total} 
                  color={category.color}
                />
                <Text style={styles.categoryPercentage}>
                  {Math.round((category.completed / category.total) * 100)}% complete
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Children Performance - Only for Parents */}
        {isParent && 'childrenData' in data && (
          <View style={styles.childrenSection}>
            <Text style={styles.sectionTitle}>Children Performance</Text>
            <View style={styles.childrenList}>
              {data.childrenData.map(child => (
                <View key={child.id} style={styles.childPerformanceCard}>
                  <View style={styles.childHeader}>
                    <Text style={styles.childName}>{child.name}</Text>
                    <View style={styles.childLevel}>
                      <Award size={14} color="#f59e0b" />
                      <Text style={styles.childLevelText}>Lv.{child.level}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.childMetrics}>
                    <View style={styles.childMetric}>
                      <Text style={styles.childMetricValue}>{child.weeklyTasks}</Text>
                      <Text style={styles.childMetricLabel}>Tasks</Text>
                    </View>
                    <View style={styles.childMetric}>
                      <Text style={styles.childMetricValue}>{child.weeklyPoints}</Text>
                      <Text style={styles.childMetricLabel}>Points</Text>
                    </View>
                    <View style={styles.childMetric}>
                      <Text style={styles.childMetricValue}>{child.completionRate}%</Text>
                      <Text style={styles.childMetricLabel}>Rate</Text>
                    </View>
                  </View>

                  <View style={styles.childProgress}>
                    <Text style={styles.childProgressLabel}>Completion Rate</Text>
                    <ProgressBar 
                      value={child.completionRate} 
                      maxValue={100} 
                      color="#10b981"
                      height={6}
                    />
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Insights */}
        <View style={styles.insightsSection}>
          <Text style={styles.sectionTitle}>Insights</Text>
          <View style={styles.insightsList}>
            <View style={styles.insightCard}>
              <View style={styles.insightIcon}>
                <TrendingUp size={16} color="#10b981" />
              </View>
              <Text style={styles.insightText}>
                {isParent 
                  ? 'Family task completion is up 15% this week!'
                  : 'Your completion rate improved by 20% this week!'
                }
              </Text>
            </View>
            <View style={styles.insightCard}>
              <View style={styles.insightIcon}>
                <Star size={16} color="#f59e0b" />
              </View>
              <Text style={styles.insightText}>
                {isParent
                  ? 'Emma is your top performer with 85% completion rate'
                  : 'You earned the most points on Wednesday!'
                }
              </Text>
            </View>
            <View style={styles.insightCard}>
              <View style={styles.insightIcon}>
                <Calendar size={16} color="#3b82f6" />
              </View>
              <Text style={styles.insightText}>
                {isParent
                  ? 'Weekends show 30% lower task completion'
                  : 'You complete most tasks on weekdays'
                }
              </Text>
            </View>
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
  exportButton: {
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
  periodSelector: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 8,
  },
  periodButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  selectedPeriod: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  periodText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#64748b',
  },
  selectedPeriodText: {
    color: '#ffffff',
  },
  metricsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  metricCard: {
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
  metricIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#64748b',
    textAlign: 'center',
  },
  chartSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
  },
  chartCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  barChart: {
    height: 200,
  },
  chartContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  barGroup: {
    alignItems: 'center',
    flex: 1,
  },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 120,
    gap: 2,
  },
  bar: {
    width: 8,
    borderRadius: 4,
  },
  tasksBar: {
    backgroundColor: '#3b82f6',
  },
  pointsBar: {
    backgroundColor: '#10b981',
  },
  barLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#64748b',
    marginTop: 8,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#64748b',
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryList: {
    paddingHorizontal: 20,
    gap: 16,
  },
  categoryItem: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  categoryName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
  },
  categoryStats: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#64748b',
  },
  progressBarContainer: {
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    borderRadius: 4,
  },
  categoryPercentage: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#64748b',
  },
  childrenSection: {
    marginBottom: 24,
  },
  childrenList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  childPerformanceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  childHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  childName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
  },
  childLevel: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  childLevelText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#d97706',
    marginLeft: 4,
  },
  childMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  childMetric: {
    alignItems: 'center',
  },
  childMetricValue: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#1e293b',
  },
  childMetricLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#64748b',
    marginTop: 2,
  },
  childProgress: {
    gap: 6,
  },
  childProgressLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#64748b',
  },
  insightsSection: {
    marginBottom: 24,
  },
  insightsList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  insightCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  insightIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    lineHeight: 20,
  },
});