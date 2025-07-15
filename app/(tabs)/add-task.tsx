import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Platform, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TaskCategory, TaskPriority, RecurringType, CustomRecurringConfig } from '@/types';
import { Calendar, Clock, Star, Repeat, User, Sparkles, ChevronDown, X, Settings } from 'lucide-react-native';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { useChildren, useTasks } from '@/hooks/useFirestore';
import { router } from 'expo-router';
import { useEffect } from 'react';

export default function AddTaskScreen() {
  const { familyId } = useFirebaseAuth();
  const { children, loading: childrenLoading } = useChildren(familyId);
  const { createTask } = useTasks(familyId);
  
  // Helper functions for time conversion
  const get12HourFormat = (hour: number) => {
    return hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  };
  
  const get24HourFormat = (hour: number, isPM: boolean) => {
    if (hour === 12) {
      return isPM ? 12 : 0;
    }
    return isPM ? hour + 12 : hour;
  };
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [points, setPoints] = useState('10');
  const [category, setCategory] = useState<TaskCategory>('chores');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [recurring, setRecurring] = useState<RecurringType | undefined>(undefined);
  const [dueDate, setDueDate] = useState(new Date());
  const [showDateModal, setShowDateModal] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [showCustomRecurringModal, setShowCustomRecurringModal] = useState(false);
  const [showInlineEndDatePicker, setShowInlineEndDatePicker] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState<'dueDate' | 'endDate'>('dueDate');
  const [customPeriod, setCustomPeriod] = useState<{
    type: 'today' | 'tomorrow' | 'this_week' | 'next_week' | 'custom';
    value?: number;
  }>({ type: 'today' });

  // Custom recurring configuration
  const [customRecurring, setCustomRecurring] = useState<CustomRecurringConfig>({
    type: 'days',
    interval: 1,
  });
  const [customRecurringEndDate, setCustomRecurringEndDate] = useState<Date | undefined>(undefined);
  const [customRecurringMaxOccurrences, setCustomRecurringMaxOccurrences] = useState<number | undefined>(undefined);

  // Debug useEffect
  useEffect(() => {
    // Removed console log for cleaner code
  }, [showInlineEndDatePicker]);

  // Date picker state
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [selectedHour, setSelectedHour] = useState(get12HourFormat(new Date().getHours()));
  const [selectedMinute, setSelectedMinute] = useState(new Date().getMinutes());
  const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>(new Date().getHours() >= 12 ? 'PM' : 'AM');

  const categories: { value: TaskCategory; label: string; icon: string }[] = [
    { value: 'chores', label: 'Chores', icon: '🧹' },
    { value: 'homework', label: 'Homework', icon: '📚' },
    { value: 'personal', label: 'Personal', icon: '🎯' },
    { value: 'family', label: 'Family', icon: '👨‍👩‍👧‍👦' },
    { value: 'other', label: 'Other', icon: '📝' },
  ];

  const priorities: { value: TaskPriority; label: string; color: string }[] = [
    { value: 'low', label: 'Low', color: '#10b981' },
    { value: 'medium', label: 'Medium', color: '#f59e0b' },
    { value: 'high', label: 'High', color: '#ef4444' },
  ];

  const recurringOptions: { value: RecurringType | undefined; label: string; icon?: string }[] = [
    { value: undefined, label: 'One-time', icon: '⏰' },
    { value: 'daily', label: 'Daily', icon: '📅' },
    { value: 'weekly', label: 'Weekly', icon: '📊' },
    { value: 'monthly', label: 'Monthly', icon: '📈' },
    { value: 'custom', label: 'Custom', icon: '⚙️' },
  ];

  // Helper function to format custom recurring
  const formatCustomRecurring = (config: CustomRecurringConfig) => {
    const intervalText = config.interval === 1 ? '' : ` every ${config.interval}`;
    const typeText = config.type === 'days' ? 'day' : config.type === 'weeks' ? 'week' : 'month';
    return `Every${intervalText} ${typeText}${config.interval === 1 ? '' : 's'}`;
  };

  // Helper function to get recurring display text
  const getRecurringDisplayText = () => {
    if (!recurring) return 'One-time';
    if (recurring === 'custom') {
      return formatCustomRecurring(customRecurring);
    }
    return recurringOptions.find(option => option.value === recurring)?.label || 'Custom';
  };

  const periodOptions = [
    { type: 'today' as const, label: 'Today', icon: '📅' },
    { type: 'tomorrow' as const, label: 'Tomorrow', icon: '📆' },
    { type: 'this_week' as const, label: 'This Week', icon: '📊' },
    { type: 'next_week' as const, label: 'Next Week', icon: '📈' },
    { type: 'custom' as const, label: 'Custom Date', icon: '🎯' },
  ];

  // Generate months array
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Generate years array (current year + 5 years)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => currentYear + i);

  // Generate days array for selected month
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Generate hours array (12-hour format)
  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  
  // Generate minutes array
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  const handlePeriodSelect = (period: typeof periodOptions[0]) => {
    setCustomPeriod({ type: period.type });
    
    const now = new Date();
    let newDate = new Date();
    
    switch (period.type) {
      case 'today':
        newDate = new Date(now);
        break;
      case 'tomorrow':
        newDate = new Date(now);
        newDate.setDate(now.getDate() + 1);
        break;
      case 'this_week':
        newDate = new Date(now);
        newDate.setDate(now.getDate() + 3); // 3 days from now
        break;
      case 'next_week':
        newDate = new Date(now);
        newDate.setDate(now.getDate() + 7); // 7 days from now
        break;
      case 'custom':
        // Initialize picker with current date
        const currentDate = new Date();
        setSelectedYear(currentDate.getFullYear());
        setSelectedMonth(currentDate.getMonth());
        setSelectedDay(currentDate.getDate());
        setSelectedHour(currentDate.getHours());
        setSelectedMinute(currentDate.getMinutes());
        setShowDateModal(true);
        setDatePickerMode('dueDate'); // Set mode to due date
        return;
    }
    
    setDueDate(newDate);
  };

  const handleDateConfirm = () => {
    const newDate = new Date(selectedYear, selectedMonth, selectedDay, selectedHour, selectedMinute);
    setDueDate(newDate);
    setShowDateModal(false);
    setDatePickerMode('dueDate'); // Reset to default mode
  };

  const handleTimeConfirm = () => {
    const newDate = new Date(dueDate);
    const isPM = selectedPeriod === 'PM';
    const hour24 = get24HourFormat(selectedHour, isPM);
    newDate.setHours(hour24);
    newDate.setMinutes(selectedMinute);
    setDueDate(newDate);
    setShowTimeModal(false);
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  // Preset tasks data
  const presetTasks = [
    {
      id: 'chores',
      title: 'Clean Room',
      description: 'Make your bed, put away toys, and organize your space',
      category: 'chores' as TaskCategory,
      points: 15,
      priority: 'medium' as TaskPriority,
      icon: '🧹',
    },
    {
      id: 'homework',
      title: 'Complete Homework',
      description: 'Finish your school assignments and review your notes',
      category: 'homework' as TaskCategory,
      points: 20,
      priority: 'high' as TaskPriority,
      icon: '📚',
    },
    {
      id: 'personal',
      title: 'Read a Book',
      description: 'Spend 20 minutes reading a book of your choice',
      category: 'personal' as TaskCategory,
      points: 10,
      priority: 'low' as TaskPriority,
      icon: '📖',
    },
    {
      id: 'family',
      title: 'Help with Dinner',
      description: 'Help prepare dinner or set the table for the family',
      category: 'family' as TaskCategory,
      points: 12,
      priority: 'medium' as TaskPriority,
      icon: '🍽️',
    },
    {
      id: 'chores2',
      title: 'Do Laundry',
      description: 'Sort, wash, and fold your clothes',
      category: 'chores' as TaskCategory,
      points: 18,
      priority: 'medium' as TaskPriority,
      icon: '👕',
    },
    {
      id: 'personal2',
      title: 'Practice Instrument',
      description: 'Practice your musical instrument for 30 minutes',
      category: 'personal' as TaskCategory,
      points: 15,
      priority: 'medium' as TaskPriority,
      icon: '🎵',
    },
    {
      id: 'family2',
      title: 'Walk the Dog',
      description: 'Take the family dog for a walk around the neighborhood',
      category: 'family' as TaskCategory,
      points: 10,
      priority: 'low' as TaskPriority,
      icon: '🐕',
    },
    {
      id: 'homework2',
      title: 'Study for Test',
      description: 'Review materials and prepare for upcoming test',
      category: 'homework' as TaskCategory,
      points: 25,
      priority: 'high' as TaskPriority,
      icon: '📝',
    },
  ];

  const handlePresetTask = (preset: typeof presetTasks[0]) => {
    setTitle(preset.title);
    setDescription(preset.description);
    setCategory(preset.category);
    setPoints(preset.points.toString());
    setPriority(preset.priority);
    setRecurring(undefined); // Reset to one-time for presets
  };

  const handleCreateTask = async () => {
    
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a task title');
      return;
    }
    if (!assignedTo) {
      Alert.alert('Error', 'Please select a child to assign this task to');
      return;
    }

    if (!familyId) {
      Alert.alert('Error', 'No family found');
      return;
    }

    
    try {
      const taskData = {
        title,
        description,
        assignedTo,
        assignedBy: 'parent',
        points: parseInt(points) || 10,
        dueDate: dueDate,
        completed: false,
        category,
        priority,
        recurring: recurring || undefined,
        customRecurring: recurring === 'custom' ? customRecurring : undefined,
        customRecurringEndDate: recurring === 'custom' ? customRecurringEndDate : undefined,
        customRecurringMaxOccurrences: recurring === 'custom' ? customRecurringMaxOccurrences : undefined,
        familyId,
      };

      
      await createTask(taskData);
      
      Alert.alert('Success', 'Task created successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error creating task:', error);
      Alert.alert('Error', 'Failed to create task. Please try again.');
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setAssignedTo('');
    setPoints('10');
    setCategory('chores');
    setPriority('medium');
    setRecurring(undefined);
    setDueDate(new Date());
    setCustomRecurring({ type: 'days', interval: 1 });
    setCustomRecurringEndDate(undefined);
    setCustomRecurringMaxOccurrences(undefined);
  };

  if (childrenLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading children...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (children.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <User size={48} color="#d1d5db" />
          <Text style={styles.emptyTitle}>No Children Found</Text>
          <Text style={styles.emptyText}>
            You need to add children to your family before creating tasks.
          </Text>
          <TouchableOpacity 
            style={styles.addChildrenButton}
            onPress={() => router.push('/manage-children')}
          >
            <Text style={styles.addChildrenButtonText}>Add Children</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Create New Task</Text>
          <Text style={styles.subtitle}>Assign a task to one of your children</Text>
        </View>

        <View style={styles.form}>
          {/* Preset Tasks Section */}
          <View style={styles.inputGroup}>
            <View style={styles.presetHeader}>
              <Sparkles size={20} color="#3b82f6" />
              <Text style={styles.presetTitle}>Quick Presets</Text>
            </View>
            <Text style={styles.presetSubtitle}>Tap a preset to fill the form</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.presetScroll}
              contentContainerStyle={styles.presetContainer}
            >
              {presetTasks.map(preset => (
                <TouchableOpacity
                  key={preset.id}
                  style={styles.presetCard}
                  onPress={() => handlePresetTask(preset)}
                >
                  <Text style={styles.presetIcon}>{preset.icon}</Text>
                  <Text style={styles.presetTitle}>{preset.title}</Text>
                  <Text style={styles.presetPoints}>{preset.points} pts</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Task Title */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Task Title</Text>
            <TextInput
              style={styles.textInput}
              value={title}
              onChangeText={setTitle}
              placeholder="Enter task title..."
              placeholderTextColor="#94a3b8"
            />
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Add more details about the task..."
              placeholderTextColor="#94a3b8"
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Assign To */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Assign To</Text>
            <View style={styles.childrenGrid}>
              {children.map(child => (
                <TouchableOpacity
                  key={child.id}
                  style={[
                    styles.childOption,
                    assignedTo === child.id && styles.selectedChildOption
                  ]}
                  onPress={() => setAssignedTo(child.id)}
                >
                  <User size={20} color={assignedTo === child.id ? '#ffffff' : '#64748b'} />
                  <Text style={[
                    styles.childOptionText,
                    assignedTo === child.id && styles.selectedChildOptionText
                  ]}>
                    {child.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Points */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Points Reward</Text>
            <View style={styles.pointsContainer}>
              <Star size={20} color="#f59e0b" fill="#f59e0b" />
              <TextInput
                style={styles.pointsInput}
                value={points}
                onChangeText={setPoints}
                placeholder="10"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
              />
              <Text style={styles.pointsLabel}>points</Text>
            </View>
          </View>

          {/* Category */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category</Text>
            <View style={styles.optionsGrid}>
              {categories.map(cat => (
                <TouchableOpacity
                  key={cat.value}
                  style={[
                    styles.option,
                    category === cat.value && styles.selectedOption
                  ]}
                  onPress={() => setCategory(cat.value)}
                >
                  <Text style={styles.optionIcon}>{cat.icon}</Text>
                  <Text style={[
                    styles.optionText,
                    category === cat.value && styles.selectedOptionText
                  ]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Priority */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Priority</Text>
            <View style={styles.priorityContainer}>
              {priorities.map(pri => (
                <TouchableOpacity
                  key={pri.value}
                  style={[
                    styles.priorityOption,
                    priority === pri.value && { backgroundColor: pri.color }
                  ]}
                  onPress={() => setPriority(pri.value)}
                >
                  <View style={[styles.priorityDot, { backgroundColor: pri.color }]} />
                  <Text style={[
                    styles.priorityText,
                    priority === pri.value && styles.selectedPriorityText
                  ]}>
                    {pri.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Due Date Period */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Due Date</Text>
            <View style={styles.periodContainer}>
              {periodOptions.map(period => (
                <TouchableOpacity
                  key={period.type}
                  style={[
                    styles.periodOption,
                    customPeriod.type === period.type && styles.selectedPeriodOption
                  ]}
                  onPress={() => handlePeriodSelect(period)}
                >
                  <Text style={styles.periodIcon}>{period.icon}</Text>
                  <Text style={[
                    styles.periodText,
                    customPeriod.type === period.type && styles.selectedPeriodText
                  ]}>
                    {period.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Custom Date & Time Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Date & Time</Text>
            <View style={styles.dateTimeContainer}>
              <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={() => {
                  const currentDate = new Date();
                  setSelectedYear(currentDate.getFullYear());
                  setSelectedMonth(currentDate.getMonth());
                  setSelectedDay(currentDate.getDate());
                  setShowDateModal(true);
                  setDatePickerMode('dueDate'); // Set mode to due date
                }}
              >
                <Calendar size={20} color="#3b82f6" />
                <Text style={styles.dateTimeText}>{formatDate(dueDate)}</Text>
                <ChevronDown size={16} color="#64748b" />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={() => {
                  setSelectedHour(get12HourFormat(dueDate.getHours()));
                  setSelectedMinute(dueDate.getMinutes());
                  setSelectedPeriod(dueDate.getHours() >= 12 ? 'PM' : 'AM');
                  setShowTimeModal(true);
                }}
              >
                <Clock size={20} color="#3b82f6" />
                <Text style={styles.dateTimeText}>{formatTime(dueDate)}</Text>
                <ChevronDown size={16} color="#64748b" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Recurring */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Recurring</Text>
            <View style={styles.recurringContainer}>
              {recurringOptions.map(option => (
                <TouchableOpacity
                  key={option.label}
                  style={[
                    styles.recurringOption,
                    recurring === option.value && styles.selectedRecurringOption
                  ]}
                  onPress={() => {
                    if (option.value === 'custom') {
                      setShowCustomRecurringModal(true);
                    } else {
                      setRecurring(option.value);
                      // Reset custom recurring when selecting standard options
                      if (option.value && ['daily', 'weekly', 'monthly'].includes(option.value)) {
                        setCustomRecurring({ type: 'days', interval: 1 });
                        setCustomRecurringEndDate(undefined);
                        setCustomRecurringMaxOccurrences(undefined);
                      }
                    }
                  }}
                >
                  {option.icon && <Text style={styles.recurringIcon}>{option.icon}</Text>}
                  <Repeat size={16} color={recurring === option.value ? '#ffffff' : '#64748b'} />
                  <Text style={[
                    styles.recurringText,
                    recurring === option.value && styles.selectedRecurringText
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            {/* Display current recurring selection */}
            {recurring && (
              <View style={styles.recurringDisplay}>
                <Text style={styles.recurringDisplayText}>
                  {getRecurringDisplayText()}
                </Text>
                {recurring === 'custom' && (
                  <TouchableOpacity
                    style={styles.editCustomButton}
                    onPress={() => setShowCustomRecurringModal(true)}
                  >
                    <Settings size={16} color="#3b82f6" />
                    <Text style={styles.editCustomText}>Edit</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          {/* Create Button */}
          <TouchableOpacity style={styles.createButton} onPress={handleCreateTask}>
            <Text style={styles.createButtonText}>Create Task</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Custom Date Picker Modal */}
      <Modal
        visible={showDateModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowDateModal(false);
          setDatePickerMode('dueDate'); // Reset to default mode
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {datePickerMode === 'endDate' ? 'Select End Date' : 'Select Date'}
              </Text>
              <TouchableOpacity onPress={() => {
                setShowDateModal(false);
                setDatePickerMode('dueDate'); // Reset to default mode
              }}>
                <X size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.pickerContainer}>
              {/* Year Picker */}
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Year</Text>
                <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                  {years.map(year => (
                    <TouchableOpacity
                      key={year}
                      style={[
                        styles.pickerItem,
                        selectedYear === year && styles.selectedPickerItem
                      ]}
                      onPress={() => setSelectedYear(year)}
                    >
                      <Text style={[
                        styles.pickerItemText,
                        selectedYear === year && styles.selectedPickerItemText
                      ]}>
                        {year}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Month Picker */}
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Month</Text>
                <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                  {months.map((month, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.pickerItem,
                        selectedMonth === index && styles.selectedPickerItem
                      ]}
                      onPress={() => setSelectedMonth(index)}
                    >
                      <Text style={[
                        styles.pickerItemText,
                        selectedMonth === index && styles.selectedPickerItemText
                      ]}>
                        {month}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Day Picker */}
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Day</Text>
                <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                  {days.map(day => (
                    <TouchableOpacity
                      key={day}
                      style={[
                        styles.pickerItem,
                        selectedDay === day && styles.selectedPickerItem
                      ]}
                      onPress={() => setSelectedDay(day)}
                    >
                      <Text style={[
                        styles.pickerItemText,
                        selectedDay === day && styles.selectedPickerItemText
                      ]}>
                        {day}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.modalButton} 
                onPress={() => {
                  setShowDateModal(false);
                  setDatePickerMode('dueDate'); // Reset to default mode
                }}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalButtonPrimary]} 
                onPress={handleDateConfirm}
              >
                <Text style={styles.modalButtonPrimaryText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Custom Time Picker Modal */}
      <Modal
        visible={showTimeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTimeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Time</Text>
              <TouchableOpacity onPress={() => setShowTimeModal(false)}>
                <X size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.pickerContainer}>
              {/* Hour Picker */}
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Hour</Text>
                <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                  {hours.map(hour => (
                    <TouchableOpacity
                      key={hour}
                      style={[
                        styles.pickerItem,
                        selectedHour === hour && styles.selectedPickerItem
                      ]}
                      onPress={() => setSelectedHour(hour)}
                    >
                      <Text style={[
                        styles.pickerItemText,
                        selectedHour === hour && styles.selectedPickerItemText
                      ]}>
                        {hour}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Minute Picker */}
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Minute</Text>
                <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                  {minutes.map(minute => (
                    <TouchableOpacity
                      key={minute}
                      style={[
                        styles.pickerItem,
                        selectedMinute === minute && styles.selectedPickerItem
                      ]}
                      onPress={() => setSelectedMinute(minute)}
                    >
                      <Text style={[
                        styles.pickerItemText,
                        selectedMinute === minute && styles.selectedPickerItemText
                      ]}>
                        {minute.toString().padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* AM/PM Picker */}
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>AM/PM</Text>
                <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                  {['AM', 'PM'].map((period) => (
                    <TouchableOpacity
                      key={period}
                      style={[
                        styles.pickerItem,
                        selectedPeriod === period && styles.selectedPickerItem
                      ]}
                      onPress={() => setSelectedPeriod(period as 'AM' | 'PM')}
                    >
                      <Text style={[
                        styles.pickerItemText,
                        selectedPeriod === period && styles.selectedPickerItemText
                      ]}>
                        {period}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.modalButton} 
                onPress={() => setShowTimeModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalButtonPrimary]} 
                onPress={handleTimeConfirm}
              >
                <Text style={styles.modalButtonPrimaryText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Custom Recurring Modal */}
      <Modal
        visible={showCustomRecurringModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCustomRecurringModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Custom Recurring</Text>
              <TouchableOpacity onPress={() => setShowCustomRecurringModal(false)}>
                <X size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {/* Interval Type */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Repeat Every</Text>
                <View style={styles.intervalTypeContainer}>
                  {[
                    { value: 'days', label: 'Days', icon: '📅' },
                    { value: 'weeks', label: 'Weeks', icon: '📊' },
                    { value: 'months', label: 'Months', icon: '📈' },
                  ].map(type => (
                    <TouchableOpacity
                      key={type.value}
                      style={[
                        styles.intervalTypeOption,
                        customRecurring.type === type.value && styles.selectedIntervalTypeOption
                      ]}
                      onPress={() => setCustomRecurring({ ...customRecurring, type: type.value as any })}
                    >
                      <Text style={styles.intervalTypeIcon}>{type.icon}</Text>
                      <Text style={[
                        styles.intervalTypeText,
                        customRecurring.type === type.value && styles.selectedIntervalTypeText
                      ]}>
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Interval Number */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Interval</Text>
                <View style={styles.intervalNumberContainer}>
                  <Text style={styles.intervalNumberLabel}>Every</Text>
                  <TextInput
                    style={styles.intervalNumberInput}
                    value={customRecurring.interval.toString()}
                    onChangeText={(text) => {
                      const num = parseInt(text) || 1;
                      setCustomRecurring({ ...customRecurring, interval: Math.max(1, Math.min(365, num)) });
                    }}
                    keyboardType="numeric"
                    placeholder="1"
                    placeholderTextColor="#94a3b8"
                  />
                  <Text style={styles.intervalNumberLabel}>
                    {customRecurring.type === 'days' ? 'day(s)' : 
                     customRecurring.type === 'weeks' ? 'week(s)' : 'month(s)'}
                  </Text>
                </View>
              </View>

              {/* End Date */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>End Date (Optional)</Text>
                <TouchableOpacity
                  style={styles.endDateButton}
                  onPress={() => {
                    // Initialize end date picker with current date + 1 month
                    const futureDate = new Date();
                    futureDate.setMonth(futureDate.getMonth() + 1);
                    setSelectedYear(futureDate.getFullYear());
                    setSelectedMonth(futureDate.getMonth());
                    setSelectedDay(futureDate.getDate());
                    setShowInlineEndDatePicker(true);
                  }}
                >
                  <Calendar size={20} color="#3b82f6" />
                  <Text style={styles.endDateText}>
                    {customRecurringEndDate ? formatDate(customRecurringEndDate) : 'Set end date'}
                  </Text>
                  {customRecurringEndDate && (
                    <TouchableOpacity
                      onPress={() => setCustomRecurringEndDate(undefined)}
                      style={styles.clearEndDateButton}
                    >
                      <X size={16} color="#ef4444" />
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
                
                {/* Inline End Date Picker */}
                {showInlineEndDatePicker && (
                  <View style={styles.inlineDatePicker}>
                    <View style={styles.inlineDatePickerHeader}>
                      <Text style={styles.inlineDatePickerTitle}>Select End Date</Text>
                      <TouchableOpacity onPress={() => setShowInlineEndDatePicker(false)}>
                        <X size={20} color="#64748b" />
                      </TouchableOpacity>
                    </View>
                    
                    <View style={styles.inlinePickerContainer}>
                      {/* Year Picker */}
                      <View style={styles.inlinePickerColumn}>
                        <Text style={styles.inlinePickerLabel}>Year</Text>
                        <ScrollView style={styles.inlinePickerScroll} showsVerticalScrollIndicator={false}>
                          {years.map(year => (
                            <TouchableOpacity
                              key={year}
                              style={[
                                styles.inlinePickerItem,
                                selectedYear === year && styles.selectedInlinePickerItem
                              ]}
                              onPress={() => setSelectedYear(year)}
                            >
                              <Text style={[
                                styles.inlinePickerItemText,
                                selectedYear === year && styles.selectedInlinePickerItemText
                              ]}>
                                {year}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>

                      {/* Month Picker */}
                      <View style={styles.inlinePickerColumn}>
                        <Text style={styles.inlinePickerLabel}>Month</Text>
                        <ScrollView style={styles.inlinePickerScroll} showsVerticalScrollIndicator={false}>
                          {months.map((month, index) => (
                            <TouchableOpacity
                              key={index}
                              style={[
                                styles.inlinePickerItem,
                                selectedMonth === index && styles.selectedInlinePickerItem
                              ]}
                              onPress={() => setSelectedMonth(index)}
                            >
                              <Text style={[
                                styles.inlinePickerItemText,
                                selectedMonth === index && styles.selectedInlinePickerItemText
                              ]}>
                                {month}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>

                      {/* Day Picker */}
                      <View style={styles.inlinePickerColumn}>
                        <Text style={styles.inlinePickerLabel}>Day</Text>
                        <ScrollView style={styles.inlinePickerScroll} showsVerticalScrollIndicator={false}>
                          {days.map(day => (
                            <TouchableOpacity
                              key={day}
                              style={[
                                styles.inlinePickerItem,
                                selectedDay === day && styles.selectedInlinePickerItem
                              ]}
                              onPress={() => setSelectedDay(day)}
                            >
                              <Text style={[
                                styles.inlinePickerItemText,
                                selectedDay === day && styles.selectedInlinePickerItemText
                              ]}>
                                {day}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    </View>

                    <View style={styles.inlineDatePickerFooter}>
                      <TouchableOpacity 
                        style={styles.inlineDatePickerButton} 
                        onPress={() => setShowInlineEndDatePicker(false)}
                      >
                        <Text style={styles.inlineDatePickerButtonText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.inlineDatePickerButton, styles.inlineDatePickerButtonPrimary]} 
                        onPress={() => {
                          const newDate = new Date(selectedYear, selectedMonth, selectedDay);
                          setCustomRecurringEndDate(newDate);
                          setShowInlineEndDatePicker(false);
                        }}
                      >
                        <Text style={styles.inlineDatePickerButtonPrimaryText}>Confirm</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>

              {/* Max Occurrences */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Max Occurrences (Optional)</Text>
                <View style={styles.maxOccurrencesContainer}>
                  <TextInput
                    style={styles.maxOccurrencesInput}
                    value={customRecurringMaxOccurrences?.toString() || ''}
                    onChangeText={(text) => {
                      const num = parseInt(text) || undefined;
                      setCustomRecurringMaxOccurrences(num && num > 0 ? num : undefined);
                    }}
                    keyboardType="numeric"
                    placeholder="No limit"
                    placeholderTextColor="#94a3b8"
                  />
                  <Text style={styles.maxOccurrencesLabel}>occurrences</Text>
                </View>
              </View>

              {/* Preview */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Preview</Text>
                <View style={styles.previewContainer}>
                  <Text style={styles.previewText}>
                    {formatCustomRecurring(customRecurring)}
                    {customRecurringEndDate && ` until ${formatDate(customRecurringEndDate)}`}
                    {customRecurringMaxOccurrences && ` (max ${customRecurringMaxOccurrences} times)`}
                  </Text>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.modalButton} 
                onPress={() => setShowCustomRecurringModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalButtonPrimary]} 
                onPress={() => {
                  setRecurring('custom');
                  setShowCustomRecurringModal(false);
                }}
              >
                <Text style={styles.modalButtonPrimaryText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  addChildrenButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
  },
  addChildrenButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
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
  form: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1e293b',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  childrenGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  childOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    minWidth: 100,
  },
  selectedChildOption: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  childOptionText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#64748b',
    marginLeft: 8,
  },
  selectedChildOptionText: {
    color: '#ffffff',
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  pointsInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
    marginLeft: 8,
  },
  pointsLabel: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#64748b',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    minWidth: 120,
  },
  selectedOption: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  optionIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  optionText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#64748b',
  },
  selectedOptionText: {
    color: '#ffffff',
  },
  priorityContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  priorityText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#64748b',
  },
  selectedPriorityText: {
    color: '#ffffff',
  },
  recurringContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  recurringOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  selectedRecurringOption: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  recurringText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#64748b',
    marginLeft: 8,
  },
  selectedRecurringText: {
    color: '#ffffff',
  },
  recurringIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  recurringDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 8,
  },
  recurringDisplayText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#1e293b',
    flex: 1,
  },
  editCustomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  editCustomText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#3b82f6',
    marginLeft: 4,
  },
  createButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  createButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
  // Preset tasks styles
  presetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  presetTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
    marginLeft: 8,
  },
  presetSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    marginBottom: 16,
  },
  presetScroll: {
    marginHorizontal: -20,
  },
  presetContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  presetCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    width: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  presetIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  presetPoints: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#f59e0b',
    marginTop: 4,
  },
  // Period and DateTime styles
  periodContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  periodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    minWidth: 120,
  },
  selectedPeriodOption: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  periodIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  periodText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#64748b',
  },
  selectedPeriodText: {
    color: '#ffffff',
  },
  dateTimeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  dateTimeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  dateTimeText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#1e293b',
    marginLeft: 8,
  },
  // Picker styles
  pickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
  },
  pickerColumn: {
    flex: 1,
    alignItems: 'center',
  },
  pickerLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#64748b',
    marginBottom: 8,
  },
  pickerScroll: {
    height: 200,
    width: '100%',
  },
  pickerItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginVertical: 2,
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  selectedPickerItem: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  pickerItemText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#1e293b',
  },
  selectedPickerItemText: {
    color: '#ffffff',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    width: '80%',
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  modalButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  modalButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#64748b',
  },
  modalButtonPrimary: {
    backgroundColor: '#3b82f6',
  },
  modalButtonPrimaryText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
  // Custom Recurring Modal Styles
  modalScroll: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  modalSection: {
    marginBottom: 24,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
    marginBottom: 12,
  },
  intervalTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  intervalTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    minWidth: 120,
  },
  selectedIntervalTypeOption: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  intervalTypeIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  intervalTypeText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#64748b',
  },
  selectedIntervalTypeText: {
    color: '#ffffff',
  },
  intervalNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  intervalNumberLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#64748b',
    marginRight: 8,
  },
  intervalNumberInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
  },
  endDateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  endDateText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#64748b',
    marginLeft: 8,
  },
  clearEndDateButton: {
    padding: 4,
  },
  maxOccurrencesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  maxOccurrencesInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
    marginRight: 8,
  },
  maxOccurrencesLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#64748b',
  },
  previewContainer: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  previewText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#1e293b',
    textAlign: 'center',
  },
  // Inline End Date Picker Styles
  inlineDatePicker: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 12,
    padding: 16,
  },
  inlineDatePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  inlineDatePickerTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
  },
  inlinePickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  inlinePickerColumn: {
    flex: 1,
    alignItems: 'center',
  },
  inlinePickerLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#64748b',
    marginBottom: 8,
  },
  inlinePickerScroll: {
    height: 200,
    width: '100%',
  },
  inlinePickerItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginVertical: 2,
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  selectedInlinePickerItem: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  inlinePickerItemText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#1e293b',
  },
  selectedInlinePickerItemText: {
    color: '#ffffff',
  },
  inlineDatePickerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  inlineDatePickerButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  inlineDatePickerButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#64748b',
  },
  inlineDatePickerButtonPrimary: {
    backgroundColor: '#3b82f6',
  },
  inlineDatePickerButtonPrimaryText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
});