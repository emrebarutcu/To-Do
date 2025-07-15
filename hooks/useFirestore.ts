import { useState, useEffect } from 'react';
import { User, Task, Reward, RedeemedReward } from '@/types';
import { familyService, childrenService, taskService, rewardService } from '@/lib/firestore';

// Hook for managing children
export function useChildren(familyId: string | null) {
  const [children, setChildren] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!familyId) {
      setChildren([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = familyService.subscribeToChildren(
      familyId,
      (updatedChildren) => {
        setChildren(updatedChildren);
        setLoading(false);
        setError(null);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [familyId]);

  const addChild = async (childData: Omit<User, 'id'> & { age: number }) => {
    if (!familyId) throw new Error('No family ID');
    try {
      await childrenService.createChild(familyId, childData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add child');
      throw err;
    }
  };

  const updateChild = async (childId: string, updates: Partial<User>) => {
    if (!familyId) throw new Error('No family ID');
    try {
      await childrenService.updateChild(familyId, childId, updates);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update child');
      throw err;
    }
  };

  const deleteChild = async (childId: string) => {
    if (!familyId) throw new Error('No family ID');
    try {
      await childrenService.deleteChild(familyId, childId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete child');
      throw err;
    }
  };

  return {
    children,
    loading,
    error,
    addChild,
    updateChild,
    deleteChild,
  };
}

// Hook for managing tasks
export function useTasks(familyId: string | null, childId: string | null = null, getAllTasks: boolean = false) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('useTasks effect:', { familyId, childId, getAllTasks });
    
    if (!familyId) {
      console.log('No familyId, setting empty tasks');
      setTasks([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    let unsubscribes: (() => void)[] = [];

    if (getAllTasks) {
      // Subscribe to all family tasks with real-time updates
      console.log('Setting up real-time listeners for all family tasks...');
      const setupAllTasksListeners = async () => {
        try {
          const children = await familyService.getChildren(familyId);
          console.log('Found children for task listeners:', children);
          
          const allTasks: Task[] = [];
          let loadedChildren = 0;
          
          if (children.length === 0) {
            setTasks([]);
            setLoading(false);
            return;
          }
          
          children.forEach(child => {
            console.log('Setting up listener for child:', child.id);
            const unsubscribe = taskService.subscribeToChildTasks(
              familyId,
              child.id,
              (childTasks) => {
                console.log(`Received task updates for child ${child.id}:`, childTasks);
                
                // Update tasks for this specific child
                setTasks(prevTasks => {
                  // Remove old tasks for this child
                  const otherChildrenTasks = prevTasks.filter(task => task.assignedTo !== child.id);
                  // Add new tasks for this child
                  const updatedTasks = [...otherChildrenTasks, ...childTasks];
                  console.log('Updated all tasks:', updatedTasks);
                  return updatedTasks;
                });
                
                loadedChildren++;
                if (loadedChildren === 1) {
                  setLoading(false);
                }
                setError(null);
              }
            );
            unsubscribes.push(unsubscribe);
          });
        } catch (err) {
          console.error('Error setting up task listeners:', err);
          setError(err instanceof Error ? err.message : 'Failed to load tasks');
          setLoading(false);
        }
      };
      
      setupAllTasksListeners();
    } else if (childId) {
      // Subscribe to tasks for specific child
      console.log('Subscribing to tasks for child:', childId);
      const unsubscribe = taskService.subscribeToChildTasks(
        familyId,
        childId,
        (updatedTasks) => {
          console.log('Received task updates for child:', childId, updatedTasks);
          setTasks(updatedTasks);
          setLoading(false);
          setError(null);
        }
      );
      unsubscribes.push(unsubscribe);
    } else {
      console.log('No child ID provided, setting empty tasks');
      setTasks([]);
      setLoading(false);
    }

    return () => {
      console.log('Cleaning up task listeners...');
      unsubscribes.forEach(unsubscribe => unsubscribe());
    };
  }, [familyId, childId, getAllTasks]);

  const createTask = async (taskData: Omit<Task, 'id'>) => {
    console.log('Creating task with data:', taskData);
    if (!familyId || !taskData.assignedTo) throw new Error('Missing family ID or child ID');
    try {
      await taskService.createTask(familyId, taskData.assignedTo, taskData);
      console.log('Task created successfully');
    } catch (err) {
      console.error('Error creating task:', err);
      setError(err instanceof Error ? err.message : 'Failed to create task');
      throw err;
    }
  };

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    if (!familyId || !updates.assignedTo) throw new Error('Missing family ID or child ID');
    try {
      await taskService.updateTask(familyId, updates.assignedTo, taskId, updates);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task');
      throw err;
    }
  };

  const toggleTaskCompletion = async (childId: string, taskId: string, completed: boolean, points?: number) => {
    console.log('Toggling task completion:', { childId, taskId, completed, points });
    if (!familyId) throw new Error('Missing family ID');
    try {
      await taskService.toggleTaskCompletion(familyId, childId, taskId, completed, points);
      console.log('Task completion toggled successfully');
      
      // Real-time listeners will automatically update the UI
    } catch (err) {
      console.error('Error toggling task completion:', err);
      setError(err instanceof Error ? err.message : 'Failed to toggle task completion');
      throw err;
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!familyId || !childId) throw new Error('Missing family ID or child ID');
    try {
      await taskService.deleteTask(familyId, childId, taskId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete task');
      throw err;
    }
  };

  return {
    tasks,
    loading,
    error,
    createTask,
    updateTask,
    toggleTaskCompletion,
    deleteTask,
  };
}

// Hook for managing rewards
export function useRewards(familyId: string | null) {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!familyId) {
      setRewards([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = rewardService.subscribeToRewards(
      familyId,
      (updatedRewards) => {
        setRewards(updatedRewards);
        setLoading(false);
        setError(null);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [familyId]);

  const createReward = async (rewardData: Omit<Reward, 'id'>) => {
    if (!familyId) throw new Error('No family ID');
    try {
      await rewardService.createReward(familyId, rewardData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create reward');
      throw err;
    }
  };

  const updateReward = async (rewardId: string, updates: Partial<Reward>) => {
    try {
      await rewardService.updateReward(rewardId, updates);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update reward');
      throw err;
    }
  };

  const deleteReward = async (rewardId: string) => {
    try {
      await rewardService.deleteReward(rewardId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete reward');
      throw err;
    }
  };

  const redeemReward = async (childId: string, rewardId: string, pointsCost: number) => {
    if (!familyId) throw new Error('No family ID');
    try {
      await rewardService.redeemReward(familyId, childId, rewardId, pointsCost);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to redeem reward');
      throw err;
    }
  };

  return {
    rewards,
    loading,
    error,
    createReward,
    updateReward,
    deleteReward,
    redeemReward,
  };
}

// Hook for managing user settings
export function useUserSettings(userId: string | null): {
  settings: any;
  loading: boolean;
  error: string | null;
  updateSettings: (newSettings: any) => Promise<void>;
} {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setSettings(null);
      setLoading(false);
      return;
    }

    const loadSettings = async () => {
      try {
        setLoading(true);
        const userDoc = await userService.getUserById(userId);
        setSettings(userDoc?.settings || {});
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load settings');
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [userId]);

  const updateSettings = async (newSettings: any) => {
    if (!userId) throw new Error('No user ID');
    try {
      await userService.updateUserById(userId, { 
        settings: { ...settings, ...newSettings } 
      });
      setSettings(prev => ({ ...prev, ...newSettings }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update settings');
      throw err;
    }
  };

  return {
    settings,
    loading,
    error,
    updateSettings,
  };
}

// Hook for managing redeemed rewards
export function useRedeemedRewards(familyId: string | null, childId?: string) {
  const [redeemedRewards, setRedeemedRewards] = useState<RedeemedReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!familyId) {
      setRedeemedRewards([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = rewardService.subscribeToRedeemedRewards(
      familyId,
      (updatedRewards) => {
        setRedeemedRewards(updatedRewards);
        setLoading(false);
        setError(null);
      },
      childId
    );

    return () => {
      unsubscribe();
    };
  }, [familyId, childId]);

  const getActiveRedeemedRewards = async () => {
    if (!familyId) throw new Error('No family ID');
    try {
      return await rewardService.getActiveRedeemedRewards(familyId, childId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get active rewards');
      throw err;
    }
  };

  const markRewardAsUsed = async (redemptionId: string) => {
    try {
      await rewardService.markRewardAsUsed(redemptionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark reward as used');
      throw err;
    }
  };

  const cleanupExpiredRewards = async () => {
    try {
      await rewardService.cleanupExpiredRewards();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cleanup expired rewards');
      throw err;
    }
  };

  return {
    redeemedRewards,
    loading,
    error,
    getActiveRedeemedRewards,
    markRewardAsUsed,
    cleanupExpiredRewards,
  };
}