import { User, Task, Reward } from '@/types';

export const mockChildren: User[] = [
  {
    id: '1',
    userid: '1',
    user_id: '1',
    name: 'Emma',
    email: 'emma@family.com',
    role: 'child',
    age: 12,
    avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400',
    points: 245,
    completedTasks: 18,
  },
  {
    id: '2',
    userid: '2',
    user_id: '2',
    name: 'Liam',
    email: 'liam@family.com',
    role: 'child',
    age: 9,
    avatar: 'https://images.pexels.com/photos/1674752/pexels-photo-1674752.jpeg?auto=compress&cs=tinysrgb&w=400',
    points: 180,
    completedTasks: 12,
  },
  {
    id: '3',
    userid: '3',
    user_id: '3',
    name: 'Sophie',
    email: 'sophie@family.com',
    role: 'child',
    age: 7,
    avatar: 'https://images.pexels.com/photos/1462630/pexels-photo-1462630.jpeg?auto=compress&cs=tinysrgb&w=400',
    points: 95,
    completedTasks: 8,
  },
];

export const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Clean your room',
    description: 'Make bed, organize toys, and vacuum',
    assignedTo: '1',
    assignedBy: 'parent',
    points: 15,
    dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
    completed: false,
    category: 'chores',
    priority: 'medium',
    recurring: 'weekly',
  },
  {
    id: '2',
    title: 'Math homework',
    description: 'Complete pages 24-26 in workbook',
    assignedTo: '1',
    assignedBy: 'parent',
    points: 20,
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    completed: false,
    category: 'homework',
    priority: 'high',
  },
  {
    id: '3',
    title: 'Feed the dog',
    description: 'Give Max his morning and evening meals',
    assignedTo: '2',
    assignedBy: 'parent',
    points: 10,
    dueDate: new Date(Date.now() + 12 * 60 * 60 * 1000),
    completed: true,
    completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    category: 'chores',
    priority: 'medium',
    recurring: 'daily',
  },
  {
    id: '4',
    title: 'Practice piano',
    description: '30 minutes of practice',
    assignedTo: '3',
    assignedBy: 'parent',
    points: 25,
    dueDate: new Date(Date.now() + 6 * 60 * 60 * 1000),
    completed: false,
    category: 'personal',
    priority: 'medium',
  },
];

export const mockRewards: Reward[] = [
  {
    id: '1',
    title: 'Extra Screen Time',
    description: '1 hour of additional screen time',
    pointsCost: 50,
    category: 'screen-time',
    available: true,
  },
  {
    id: '2',
    title: 'Ice Cream Treat',
    description: 'Choose your favorite ice cream',
    pointsCost: 30,
    category: 'treats',
    available: true,
  },
  {
    id: '3',
    title: 'Movie Night Choice',
    description: 'Pick the family movie for movie night',
    pointsCost: 75,
    category: 'privileges',
    available: true,
  },
  {
    id: '4',
    title: 'Zoo Trip',
    description: 'Special trip to the zoo',
    pointsCost: 200,
    category: 'activities',
    available: true,
  },
  {
    id: '5',
    title: '$5 Allowance',
    description: 'Extra pocket money',
    pointsCost: 100,
    category: 'money',
    available: true,
  },
];