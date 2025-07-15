import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  setDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import { User, Task, Reward, RedeemedReward } from '@/types';

// Collections
export const COLLECTIONS = {
  FAMILIES: 'families',
  USERS: 'users',
  REWARDS: 'rewards',
  NOTIFICATIONS: 'notifications',
  REDEEMED_REWARDS: 'redeemed_rewards',
} as const;

// Helper function to convert Firestore timestamp to Date
export const timestampToDate = (timestamp: any): Date => {
  if (timestamp?.toDate) {
    return timestamp.toDate();
  }
  if (timestamp?.seconds) {
    return new Date(timestamp.seconds * 1000);
  }
  return new Date(timestamp);
};

// Helper function to convert Date to Firestore timestamp
export const dateToTimestamp = (date: Date) => {
  return Timestamp.fromDate(date);
};

// User Management
export const userService = {
  async createUser(userId: string, userData: Omit<User, 'id'>) {
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    await setDoc(userRef, {
      ...userData,
      userid: userId,
      user_id: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return userRef;
  },

  async getUser(userId: string): Promise<User | null> {
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return { id: userSnap.id, ...userSnap.data() } as User;
    }
    return null;
  },

  async updateUser(userId: string, updates: Partial<User>) {
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  },

  async deleteUser(userId: string) {
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    await deleteDoc(userRef);
  },
};

// Family Management
export const familyService = {
  async createFamily(familyData: { name: string; parentId: string; parentName: string; parentEmail: string }) {
    const familyRef = await addDoc(collection(db, COLLECTIONS.FAMILIES), {
      name: familyData.name,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Create parent subcollection
    const parentRef = doc(collection(familyRef, 'parents'), familyData.parentId);
    await setDoc(parentRef, {
      user_id: familyData.parentId,
      name: familyData.parentName.split(' ')[0] || familyData.parentName,
      surname: familyData.parentName.split(' ').slice(1).join(' ') || '',
      email: familyData.parentEmail,
      createdAt: serverTimestamp(),
    });

    return familyRef;
  },

  async getFamilyByParent(parentId: string) {
    // Get all families and check their parents subcollection
    const familiesSnapshot = await getDocs(collection(db, COLLECTIONS.FAMILIES));
    
    for (const familyDoc of familiesSnapshot.docs) {
      const parentDoc = await getDoc(doc(familyDoc.ref, 'parents', parentId));
      if (parentDoc.exists()) {
        return { id: familyDoc.id, ...familyDoc.data() };
      }
    }
    return null;
  },

  async getFamily(familyId: string) {
    const familyRef = doc(db, COLLECTIONS.FAMILIES, familyId);
    const familySnap = await getDoc(familyRef);
    
    if (familySnap.exists()) {
      return { id: familySnap.id, ...familySnap.data() };
    }
    return null;
  },

  async getParents(familyId: string) {
    const parentsRef = collection(db, COLLECTIONS.FAMILIES, familyId, 'parents');
    const parentsSnapshot = await getDocs(parentsRef);
    
    return parentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  },

  async getChildren(familyId: string): Promise<User[]> {
    const childrenRef = collection(db, COLLECTIONS.FAMILIES, familyId, 'children');
    const childrenSnapshot = await getDocs(childrenRef);
    
    return childrenSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      role: 'child' as const,
    })) as User[];
  },

  subscribeToChildren(familyId: string, callback: (children: User[]) => void) {
    const childrenRef = collection(db, COLLECTIONS.FAMILIES, familyId, 'children');
    
    return onSnapshot(childrenRef, (querySnapshot) => {
      const children = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        role: 'child' as const,
      })) as User[];
      
      callback(children);
    });
  },
};

// Children Management
export const childrenService = {
  async createChild(familyId: string, childData: Omit<User, 'id'> & { age: number; points?: number; level?: number; completedTasks?: number }) {
    const childRef = doc(collection(db, COLLECTIONS.FAMILIES, familyId, 'children'), childData.userid || childData.user_id);
    
    const childDoc = {
      user_id: childData.userid || childData.user_id,
      name: childData.name.split(' ')[0] || childData.name,
      surname: childData.name.split(' ').slice(1).join(' ') || '',
      mail: childData.email,
      age: childData.age,
      completedTasks: childData.completedTasks || 0,
      avatar: childData.avatar,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(childRef, childDoc);
    return childRef;
  },

  async updateChild(familyId: string, childId: string, updates: Partial<User>) {
    const childRef = doc(db, COLLECTIONS.FAMILIES, familyId, 'children', childId);
    const updateData: any = {
      ...updates,
      updatedAt: serverTimestamp(),
    };

    // Handle name updates
    if (updates.name) {
      updateData.name = updates.name.split(' ')[0] || updates.name;
      updateData.surname = updates.name.split(' ').slice(1).join(' ') || '';
    }

    await updateDoc(childRef, updateData);
  },

  async deleteChild(familyId: string, childId: string) {
    const batch = writeBatch(db);
    
    // Delete child document
    const childRef = doc(db, COLLECTIONS.FAMILIES, familyId, 'children', childId);
    batch.delete(childRef);
    
    // Delete all assigned tasks for this child
    const tasksRef = collection(db, COLLECTIONS.FAMILIES, familyId, 'children', childId, 'assigned_tasks');
    const tasksSnapshot = await getDocs(tasksRef);
    tasksSnapshot.docs.forEach(taskDoc => {
      batch.delete(taskDoc.ref);
    });
    
    await batch.commit();
  },

  async getChild(familyId: string, childId: string): Promise<User | null> {
    const childRef = doc(db, COLLECTIONS.FAMILIES, familyId, 'children', childId);
    const childSnap = await getDoc(childRef);
    
    if (childSnap.exists()) {
      const data = childSnap.data();
      return {
        id: childSnap.id,
        name: `${data.name} ${data.surname}`.trim(),
        email: data.mail,
        role: 'child',
        age: data.age,
        points: data.points || 0,
        completedTasks: data.completedTasks || 0,
        avatar: data.avatar,
        familyId,
        userid: data.user_id,
        user_id: data.user_id,
      } as User;
    }
    return null;
  },
};

// Task Management
export const taskService = {
  async createTask(familyId: string, childId: string, taskData: Omit<Task, 'id'>) {
    console.log('Creating task with data:', { familyId, childId, taskData });
    
    const taskDoc: any = {
      type: taskData.category,
      due: dateToTimestamp(taskData.dueDate),
      name: taskData.title,
      description: taskData.description,
      reward: taskData.points,
      priority: taskData.priority,
      completed: taskData.completed || false,
      assignedBy: taskData.assignedBy || 'parent',
      assignedTo: childId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    // Only include optional fields if they have defined values
    if (taskData.recurring !== undefined) {
      taskDoc.recurring = taskData.recurring;
    }
    
    if (taskData.completedAt) {
      taskDoc.completedAt = dateToTimestamp(taskData.completedAt);
    }

    console.log('Final task document:', taskDoc);
    
    const taskRef = await addDoc(
      collection(db, COLLECTIONS.FAMILIES, familyId, 'children', childId, 'assigned_tasks'),
      taskDoc
    );
    
    console.log('Task created with ID:', taskRef.id);
    return taskRef;
  },

  async getTasksForChild(familyId: string, childId: string): Promise<Task[]> {
    console.log('Getting tasks for child:', { familyId, childId });
    const tasksRef = collection(db, COLLECTIONS.FAMILIES, familyId, 'children', childId, 'assigned_tasks');
    const tasksSnapshot = await getDocs(tasksRef);
    console.log('Tasks snapshot size:', tasksSnapshot.size);
    
    const tasks = tasksSnapshot.docs.map(doc => {
      const data = doc.data();
      console.log('Task data:', data);
      return {
        id: doc.id,
        title: data.name,
        description: data.description,
        assignedTo: childId,
        assignedBy: 'parent',
        points: data.reward,
        dueDate: timestampToDate(data.due),
        completed: data.completed || false,
        completedAt: data.completedAt ? timestampToDate(data.completedAt) : undefined,
        category: data.type,
        priority: data.priority || 'medium',
        recurring: data.recurring,
        familyId,
      } as Task;
    });
    
    console.log('Processed tasks:', tasks);
    return tasks;
  },

  async getAllFamilyTasks(familyId: string): Promise<Task[]> {
    console.log('Getting all family tasks for:', familyId);
    const children = await familyService.getChildren(familyId);
    console.log('Found children:', children);
    const allTasks: Task[] = [];
    
    for (const child of children) {
      console.log('Getting tasks for child:', child.id);
      const childTasks = await this.getTasksForChild(familyId, child.id);
      console.log('Child tasks:', childTasks);
      allTasks.push(...childTasks);
    }
    
    console.log('All family tasks:', allTasks);
    return allTasks;
  },

  async updateTask(familyId: string, childId: string, taskId: string, updates: Partial<Task>) {
    const taskRef = doc(db, COLLECTIONS.FAMILIES, familyId, 'children', childId, 'assigned_tasks', taskId);
    const updateData: any = {
      updatedAt: serverTimestamp(),
    };
    
    // Map Task fields to database fields
    if (updates.title !== undefined) updateData.name = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.points !== undefined) updateData.reward = updates.points;
    if (updates.dueDate !== undefined) updateData.due = dateToTimestamp(updates.dueDate);
    if (updates.completed !== undefined) updateData.completed = updates.completed;
    if (updates.completedAt !== undefined) {
      updateData.completedAt = updates.completedAt ? dateToTimestamp(updates.completedAt) : null;
    }
    if (updates.category !== undefined) updateData.type = updates.category;
    if (updates.priority !== undefined) updateData.priority = updates.priority;
    if (updates.recurring !== undefined) updateData.recurring = updates.recurring;
    
    await updateDoc(taskRef, updateData);
  },

  async deleteTask(familyId: string, childId: string, taskId: string) {
    const taskRef = doc(db, COLLECTIONS.FAMILIES, familyId, 'children', childId, 'assigned_tasks', taskId);
    await deleteDoc(taskRef);
  },

  async toggleTaskCompletion(familyId: string, childId: string, taskId: string, completed: boolean, points?: number) {
    console.log('Firestore toggleTaskCompletion called:', { familyId, childId, taskId, completed, points });
    const batch = writeBatch(db);
    
    // Update task
    const taskRef = doc(db, COLLECTIONS.FAMILIES, familyId, 'children', childId, 'assigned_tasks', taskId);
    console.log('Updating task document:', taskRef.path);
    batch.update(taskRef, {
      completed,
      completedAt: completed ? serverTimestamp() : null,
      updatedAt: serverTimestamp(),
    });
    
    // Update child's points and stats based on completion status
    if (points) {
      console.log('Updating child points...');
      const childRef = doc(db, COLLECTIONS.FAMILIES, familyId, 'children', childId);
      const childDoc = await getDoc(childRef);
      
      if (childDoc.exists()) {
        const childData = childDoc.data();
        
        let newPoints, newCompletedTasks;
        
        if (completed) {
          // Task is being completed - add points and increment completed tasks
          newPoints = (childData.points || 0) + points;
          newCompletedTasks = (childData.completedTasks || 0) + 1;
          console.log('Completing task - adding points:', { oldPoints: childData.points, pointsToAdd: points, newPoints });
        } else {
          // Task is being uncompleted - subtract points and decrement completed tasks
          newPoints = Math.max(0, (childData.points || 0) - points);
          newCompletedTasks = Math.max(0, (childData.completedTasks || 0) - 1);
          console.log('Uncompleting task - removing points:', { oldPoints: childData.points, pointsToRemove: points, newPoints });
        }
        
        const newLevel = Math.floor(newPoints / 100) + 1;
        
        console.log('Child update:', { 
          action: completed ? 'completing' : 'uncompleting',
          oldPoints: childData.points, 
          newPoints, 
          oldCompletedTasks: childData.completedTasks,
          newCompletedTasks, 
          newLevel 
        });
        
        batch.update(childRef, {
          points: newPoints,
          completedTasks: newCompletedTasks,
          level: newLevel,
          updatedAt: serverTimestamp(),
        });
      } else {
        console.error('Child document not found:', childId);
      }
    }
    
    console.log('Committing batch update...');
    await batch.commit();
    console.log('Batch update completed successfully');
  },

  subscribeToChildTasks(familyId: string, childId: string, callback: (tasks: Task[]) => void) {
    console.log('Setting up real-time listener for child tasks:', { familyId, childId });
    const tasksRef = collection(db, COLLECTIONS.FAMILIES, familyId, 'children', childId, 'assigned_tasks');
    
    return onSnapshot(tasksRef, (querySnapshot) => {
      console.log('Firestore snapshot received for child:', childId, 'docs:', querySnapshot.size);
      const tasks = querySnapshot.docs.map(doc => {
        const data = doc.data();
        console.log('Processing task document:', doc.id, data);
        return {
          id: doc.id,
          title: data.name,
          description: data.description,
          assignedTo: childId,
          assignedBy: 'parent',
          points: data.reward,
          dueDate: timestampToDate(data.due),
          completed: data.completed || false,
          completedAt: data.completedAt ? timestampToDate(data.completedAt) : undefined,
          category: data.type,
          priority: data.priority || 'medium',
          recurring: data.recurring,
          familyId,
        } as Task;
      });
      console.log('Processed tasks for child:', childId, tasks);
      callback(tasks);
    }, (error) => {
      console.error('Error in task subscription for child:', childId, error);
    });
  },
};

// Reward Management
export const rewardService = {
  async createReward(familyId: string, rewardData: Omit<Reward, 'id'>) {
    const rewardRef = await addDoc(collection(db, COLLECTIONS.REWARDS), {
      ...rewardData,
      familyId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return rewardRef;
  },

  async getRewards(familyId: string): Promise<Reward[]> {
    const q = query(
      collection(db, COLLECTIONS.REWARDS),
      where('familyId', '==', familyId),
      where('available', '==', true)
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Reward[];
  },

  async updateReward(rewardId: string, updates: Partial<Reward>) {
    const rewardRef = doc(db, COLLECTIONS.REWARDS, rewardId);
    await updateDoc(rewardRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  },

  async deleteReward(rewardId: string) {
    const rewardRef = doc(db, COLLECTIONS.REWARDS, rewardId);
    await deleteDoc(rewardRef);
  },

  async redeemReward(familyId: string, childId: string, rewardId: string, pointsCost: number) {
    const batch = writeBatch(db);
    
    // Get reward details
    const rewardRef = doc(db, COLLECTIONS.REWARDS, rewardId);
    const rewardDoc = await getDoc(rewardRef);
    
    if (!rewardDoc.exists()) {
      throw new Error('Reward not found');
    }
    
    const rewardData = rewardDoc.data();
    
    // Deduct points from child
    const childRef = doc(db, COLLECTIONS.FAMILIES, familyId, 'children', childId);
    const childDoc = await getDoc(childRef);
    
    if (childDoc.exists()) {
      const childData = childDoc.data();
      const newPoints = Math.max(0, (childData.points || 0) - pointsCost);
      
      batch.update(childRef, {
        points: newPoints,
        updatedAt: serverTimestamp(),
      });
      
      // Create notification for parent
      const notificationRef = doc(collection(db, COLLECTIONS.NOTIFICATIONS));
      batch.set(notificationRef, {
        type: 'reward_redeemed',
        familyId,
        childId,
        rewardId,
        pointsCost,
        createdAt: serverTimestamp(),
        read: false,
      });
      
      // Save redemption record
      const redemptionRef = doc(collection(db, COLLECTIONS.REDEEMED_REWARDS));
      batch.set(redemptionRef, {
        familyId,
        childId,
        rewardId,
        rewardTitle: rewardData.title,
        rewardDescription: rewardData.description,
        rewardCategory: rewardData.category,
        pointsCost,
        redeemedAt: serverTimestamp(),
        expiresAt: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)), // 7 days from now
        status: 'active', // active, expired, used
      });
    }
    
    await batch.commit();
  },

  subscribeToRewards(familyId: string, callback: (rewards: Reward[]) => void) {
    const q = query(
      collection(db, COLLECTIONS.REWARDS),
      where('familyId', '==', familyId),
      where('available', '==', true)
    );
    
    return onSnapshot(q, (querySnapshot) => {
      const rewards = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Reward[];
      callback(rewards);
    });
  },

  async getRedeemedRewards(familyId: string, childId?: string): Promise<RedeemedReward[]> {
    let q;
    if (childId) {
      // For child-specific queries, we'll filter in memory to avoid complex indexes
      q = query(
        collection(db, COLLECTIONS.REDEEMED_REWARDS),
        where('familyId', '==', familyId)
      );
    } else {
      q = query(
        collection(db, COLLECTIONS.REDEEMED_REWARDS),
        where('familyId', '==', familyId),
        orderBy('redeemedAt', 'desc')
      );
    }
    
    const querySnapshot = await getDocs(q);
    
    let rewards = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        familyId: data.familyId,
        childId: data.childId,
        rewardId: data.rewardId,
        rewardTitle: data.rewardTitle,
        rewardDescription: data.rewardDescription,
        rewardCategory: data.rewardCategory,
        pointsCost: data.pointsCost,
        redeemedAt: timestampToDate(data.redeemedAt),
        expiresAt: timestampToDate(data.expiresAt),
        status: data.status,
        usedAt: data.usedAt ? timestampToDate(data.usedAt) : undefined,
      } as RedeemedReward;
    });
    
    // Filter by childId in memory if specified
    if (childId) {
      rewards = rewards.filter(reward => reward.childId === childId);
      // Sort by redeemedAt desc
      rewards.sort((a, b) => b.redeemedAt.getTime() - a.redeemedAt.getTime());
    }
    
    return rewards;
  },

  async getActiveRedeemedRewards(familyId: string, childId?: string) {
    const now = new Date();
    const redeemedRewards = await this.getRedeemedRewards(familyId, childId);
    
    return redeemedRewards.filter(reward => {
      const isActive = reward.status === 'active';
      const notExpired = reward.expiresAt > now;
      return isActive && notExpired;
    });
  },

  async markRewardAsUsed(redemptionId: string) {
    const redemptionRef = doc(db, COLLECTIONS.REDEEMED_REWARDS, redemptionId);
    await updateDoc(redemptionRef, {
      status: 'used',
      usedAt: serverTimestamp(),
    });
  },

  async cleanupExpiredRewards() {
    const now = new Date();
    const q = query(
      collection(db, COLLECTIONS.REDEEMED_REWARDS),
      where('status', '==', 'active'),
      where('expiresAt', '<', Timestamp.fromDate(now))
    );
    
    const querySnapshot = await getDocs(q);
    const batch = writeBatch(db);
    
    querySnapshot.docs.forEach(doc => {
      batch.update(doc.ref, {
        status: 'expired',
        updatedAt: serverTimestamp(),
      });
    });
    
    await batch.commit();
  },

  subscribeToRedeemedRewards(familyId: string, callback: (rewards: RedeemedReward[]) => void, childId?: string) {
    let q;
    if (childId) {
      // For child-specific queries, we'll filter in memory to avoid complex indexes
      q = query(
        collection(db, COLLECTIONS.REDEEMED_REWARDS),
        where('familyId', '==', familyId)
      );
    } else {
      q = query(
        collection(db, COLLECTIONS.REDEEMED_REWARDS),
        where('familyId', '==', familyId),
        orderBy('redeemedAt', 'desc')
      );
    }
    
    return onSnapshot(q, (querySnapshot) => {
      let rewards = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          familyId: data.familyId,
          childId: data.childId,
          rewardId: data.rewardId,
          rewardTitle: data.rewardTitle,
          rewardDescription: data.rewardDescription,
          rewardCategory: data.rewardCategory,
          pointsCost: data.pointsCost,
          redeemedAt: timestampToDate(data.redeemedAt),
          expiresAt: timestampToDate(data.expiresAt),
          status: data.status,
          usedAt: data.usedAt ? timestampToDate(data.usedAt) : undefined,
        } as RedeemedReward;
      });
      
      // Filter by childId in memory if specified
      if (childId) {
        rewards = rewards.filter(reward => reward.childId === childId);
        // Sort by redeemedAt desc
        rewards.sort((a, b) => b.redeemedAt.getTime() - a.redeemedAt.getTime());
      }
      
      callback(rewards);
    });
  },
};

// Analytics
export const analyticsService = {
  async getFamilyAnalytics(familyId: string) {
    const children = await familyService.getChildren(familyId);
    const allTasks = await taskService.getAllFamilyTasks(familyId);
    
    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter(task => task.completed).length;
    const totalPoints = children.reduce((sum, child) => sum + (child.points || 0), 0);
    const averageCompletion = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    return {
      totalTasks,
      completedTasks,
      totalPoints,
      averageCompletion,
      children: children.length,
      tasks: allTasks,
      childrenData: children,
    };
  },

  async getChildAnalytics(familyId: string, childId: string) {
    const child = await childrenService.getChild(familyId, childId);
    const tasks = await taskService.getTasksForChild(familyId, childId);
    
    if (!child) return null;
    
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.completed).length;
    const averageCompletion = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    return {
      child,
      totalTasks,
      completedTasks,
      averageCompletion,
      tasks,
    };
  },
};