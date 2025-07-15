export interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  assignedBy: string;
  points: number;
  dueDate: Date;
  completed: boolean;
  completedAt?: Date;
  category: TaskCategory;
  priority: TaskPriority;
  recurring?: RecurringType;
  customRecurring?: CustomRecurringConfig;
  customRecurringEndDate?: Date;
  customRecurringMaxOccurrences?: number;
  familyId?: string;
}

export type TaskCategory = 'chores' | 'homework' | 'personal' | 'family' | 'other';
export type TaskPriority = 'low' | 'medium' | 'high';
export type RecurringType = 'daily' | 'weekly' | 'monthly' | 'custom';

export interface CustomRecurringConfig {
  type: 'days' | 'weeks' | 'months';
  interval: number; // Every X days/weeks/months
  endDate?: Date; // Optional end date
  maxOccurrences?: number; // Optional max number of occurrences
}

export interface Reward {
  id: string;
  title: string;
  description: string;
  pointsCost: number;
  category: RewardCategory;
  available: boolean;
  familyId?: string;
}

export type RewardCategory = 'screen-time' | 'treats' | 'activities' | 'money' | 'privileges';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'parent' | 'child';
  avatar?: string;
  familyId?: string; // For child users, links to their family
  userid?: string; // Firebase Auth UID
  user_id?: string; // Database user ID
  // Child-specific fields (only present when role === 'child')
  age?: number;
  points?: number;
  level?: number;
  completedTasks?: number;
  // Timestamps
  createdAt?: any;
  updatedAt?: any;
}

export interface RedeemedReward {
  id: string;
  familyId: string;
  childId: string;
  rewardId: string;
  rewardTitle: string;
  rewardDescription: string;
  rewardCategory: RewardCategory;
  pointsCost: number;
  redeemedAt: Date;
  expiresAt: Date;
  status: 'active' | 'expired' | 'used';
  usedAt?: Date;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}