import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { User } from '@/types';
import { ArrowLeft, Plus, CreditCard as Edit3, Trash2, Camera, Star, Trophy, Target, Save, X, Users, Eye, EyeOff } from 'lucide-react-native';
import { useChildren } from '@/hooks/useFirestore';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { userService } from '@/lib/firestore';

// Separate modal component to prevent re-renders
const ChildFormModal = ({ 
  visible, 
  onClose, 
  onSave, 
  editingChild, 
  familyId 
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (childData: any, isEdit: boolean) => Promise<void>;
  editingChild: User | null;
  familyId: string | null;
}) => {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    email: '',
    password: '',
    avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const avatarOptions = [
    'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/1674752/pexels-photo-1674752.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/1462630/pexels-photo-1462630.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/1068205/pexels-photo-1068205.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/1545743/pexels-photo-1545743.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/1620760/pexels-photo-1620760.jpeg?auto=compress&cs=tinysrgb&w=400',
  ];

  // Reset form when modal opens/closes or editing child changes
  React.useEffect(() => {
    if (visible) {
      if (editingChild) {
        setFormData({
          name: editingChild.name,
          age: editingChild.age.toString(),
          email: '',
          password: '',
          avatar: editingChild.avatar,
        });
      } else {
        setFormData({
          name: '',
          age: '',
          email: '',
          password: '',
          avatar: avatarOptions[0],
        });
      }
      setShowPassword(false);
    }
  }, [visible, editingChild]);

  const validateForm = () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter a name for the child');
      return false;
    }

    if (!formData.age || isNaN(Number(formData.age)) || Number(formData.age) < 1 || Number(formData.age) > 18) {
      Alert.alert('Error', 'Please enter a valid age between 1 and 18');
      return false;
    }

    if (!editingChild) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!formData.email.trim()) {
        Alert.alert('Error', 'Please enter an email address for the child');
        return false;
      } else if (!emailRegex.test(formData.email)) {
        Alert.alert('Error', 'Please enter a valid email address');
        return false;
      }

      if (!formData.password || formData.password.length < 6) {
        Alert.alert('Error', 'Password must be at least 6 characters long');
        return false;
      }
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm() || isSaving) return;

    setIsSaving(true);
    try {
      await onSave(formData, !!editingChild);
      onClose();
    } catch (error) {
      console.error('Error saving child:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const updateFormField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity style={styles.modalCloseButton} onPress={onClose}>
            <X size={24} color="#64748b" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>
            {editingChild ? 'Edit Child' : 'Add New Child'}
          </Text>
          <TouchableOpacity 
            style={[styles.modalSaveButton, isSaving && styles.disabledButton]} 
            onPress={handleSave}
            disabled={isSaving}
          >
            <Save size={20} color={isSaving ? "#94a3b8" : "#3b82f6"} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Avatar Selection */}
          <View style={styles.formSection}>
            <Text style={styles.formLabel}>Choose Avatar</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.avatarScroll}>
              {avatarOptions.map((avatar, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.avatarOption,
                    formData.avatar === avatar && styles.selectedAvatar
                  ]}
                  onPress={() => updateFormField('avatar', avatar)}
                >
                  <Image source={{ uri: avatar }} style={styles.avatarImage} />
                  {formData.avatar === avatar && (
                    <View style={styles.avatarCheckmark}>
                      <Text style={styles.checkmarkText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Name Input */}
          <View style={styles.formSection}>
            <Text style={styles.formLabel}>Child's Name</Text>
            <TextInput
              style={styles.textInput}
              value={formData.name}
              onChangeText={(text) => updateFormField('name', text)}
              placeholder="Enter child's name"
              placeholderTextColor="#94a3b8"
              autoCorrect={false}
              autoCapitalize="words"
            />
          </View>

          {/* Age Input */}
          <View style={styles.formSection}>
            <Text style={styles.formLabel}>Age</Text>
            <TextInput
              style={styles.textInput}
              value={formData.age}
              onChangeText={(text) => updateFormField('age', text)}
              placeholder="Enter age (1-18)"
              placeholderTextColor="#94a3b8"
              keyboardType="numeric"
              maxLength={2}
              autoCorrect={false}
            />
          </View>

          {/* Email and Password - Only for new children */}
          {!editingChild && (
            <>
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Email Address</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.email}
                  onChangeText={(text) => updateFormField('email', text.toLowerCase().trim())}
                  placeholder="Enter email for child's account"
                  placeholderTextColor="#94a3b8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                />
                <Text style={styles.helpText}>This will be used for the child to log in</Text>
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    value={formData.password}
                    onChangeText={(text) => updateFormField('password', text)}
                    placeholder="Create password (min 6 characters)"
                    placeholderTextColor="#94a3b8"
                    secureTextEntry={!showPassword}
                    autoCorrect={false}
                    autoCapitalize="none"
                    autoComplete="new-password"
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff size={18} color="#64748b" />
                    ) : (
                      <Eye size={18} color="#64748b" />
                    )}
                  </TouchableOpacity>
                </View>
                <Text style={styles.helpText}>The child will use this to log in</Text>
              </View>
            </>
          )}

          {/* Preview Card */}
          <View style={styles.formSection}>
            <Text style={styles.formLabel}>Preview</Text>
            <View style={styles.previewCard}>
              <Image source={{ uri: formData.avatar }} style={styles.previewAvatar} />
              <View style={styles.previewInfo}>
                <Text style={styles.previewName}>
                  {formData.name || 'Child Name'}
                </Text>
                <Text style={styles.previewAge}>
                  {formData.age ? `${formData.age} years old` : 'Age not set'}
                </Text>
                <View style={styles.previewStats}>
                  <View style={styles.previewStat}>
                    <Star size={14} color="#f59e0b" fill="#f59e0b" />
                    <Text style={styles.previewStatText}>0 pts</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

export default function ManageChildrenScreen() {
  const { familyId } = useFirebaseAuth();
  const { children, loading, addChild, updateChild, deleteChild } = useChildren(familyId);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingChild, setEditingChild] = useState<User | null>(null);

  const openAddModal = () => {
    setEditingChild(null);
    setShowAddModal(true);
  };

  const openEditModal = (child: User) => {
    setEditingChild(child);
    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingChild(null);
  };

  const handleSave = async (formData: any, isEdit: boolean) => {
    if (!familyId) throw new Error('No family ID');

    try {
      if (isEdit && editingChild) {
        // Update existing child (only name, age, avatar)
        await updateChild(editingChild.id, {
          name: formData.name,
          age: Number(formData.age),
          avatar: formData.avatar,
        });
        Alert.alert('Success', `${formData.name}'s profile has been updated!`);
      } else {
        // Create new child with Firebase Auth account
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        
        // Create user profile in Firestore
        await userService.createUser(userCredential.user.uid, {
          name: formData.name,
          email: formData.email,
          role: 'child',
          avatar: formData.avatar,
          familyId: familyId,
          userid: userCredential.user.uid,
          user_id: userCredential.user.uid,
        });

        // Create child profile
        const childData = {
          name: formData.name,
          email: formData.email,
          role: 'child' as const,
          age: Number(formData.age),
          avatar: formData.avatar,
          points: 0,
          level: 1,
          completedTasks: 0,
          userid: userCredential.user.uid,
          user_id: userCredential.user.uid,
        };

        await addChild(childData);
        Alert.alert('Success', `${formData.name} has been added to your family with login credentials!`);
      }
    } catch (error: any) {
      console.error('Error saving child:', error);
      if (error.code === 'auth/email-already-in-use') {
        Alert.alert('Error', 'This email address is already in use. Please choose a different email.');
      } else {
        Alert.alert('Error', 'Failed to save child. Please try again.');
      }
      throw error; // Re-throw to let modal handle the error
    }
  };

  const handleDelete = (child: User) => {
    Alert.alert(
      'Delete Child',
      `Are you sure you want to remove ${child.name} from your family? This will also delete their login account and all their tasks and progress.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteChild(child.id);
              Alert.alert('Deleted', `${child.name} has been removed from your family.`);
            } catch (error) {
              console.error('Error deleting child:', error);
              Alert.alert('Error', 'Failed to delete child. Please try again.');
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading children...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color="#1e293b" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Manage Children</Text>
            <Text style={styles.subtitle}>Add and manage your family members</Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
            <Plus size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Family Overview */}
        <View style={styles.overviewCard}>
          <View style={styles.overviewHeader}>
            <Users size={24} color="#3b82f6" />
            <Text style={styles.overviewTitle}>Family Overview</Text>
          </View>
          <View style={styles.overviewStats}>
            <View style={styles.overviewStat}>
              <Text style={styles.overviewStatValue}>{children.length}</Text>
              <Text style={styles.overviewStatLabel}>Children</Text>
            </View>
            <View style={styles.overviewStat}>
              <Text style={styles.overviewStatValue}>
                {children.reduce((sum, child) => sum + child.points, 0)}
              </Text>
              <Text style={styles.overviewStatLabel}>Total Points</Text>
            </View>
            <View style={styles.overviewStat}>
              <Text style={styles.overviewStatValue}>
                {children.reduce((sum, child) => sum + child.completedTasks, 0)}
              </Text>
              <Text style={styles.overviewStatLabel}>Tasks Done</Text>
            </View>
          </View>
        </View>

        {/* Children List */}
        <View style={styles.childrenSection}>
          <Text style={styles.sectionTitle}>Your Children</Text>
          {children.length > 0 ? (
            children.map(child => (
              <View key={child.id} style={styles.childCard}>
                <View style={styles.childCardContent}>
                  <Image source={{ uri: child.avatar }} style={styles.childAvatar} />
                  
                  <View style={styles.childInfo}>
                    <Text style={styles.childName}>{child.name}</Text>
                    <Text style={styles.childAge}>{child.age} years old</Text>
                    
                    <View style={styles.childStats}>
                      <View style={styles.childStat}>
                        <Star size={12} color="#f59e0b" fill="#f59e0b" />
                        <Text style={styles.childStatText}>{child.points} pts</Text>
                      </View>
                      <View style={styles.childStat}>
                        <Target size={12} color="#10b981" />
                        <Text style={styles.childStatText}>{child.completedTasks} tasks</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.childActions}>
                    <TouchableOpacity
                      style={styles.editChildButton}
                      onPress={() => openEditModal(child)}
                    >
                      <Edit3 size={18} color="#3b82f6" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteChildButton}
                      onPress={() => handleDelete(child)}
                    >
                      <Trash2 size={18} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Users size={48} color="#d1d5db" />
              <Text style={styles.emptyStateTitle}>No children added yet</Text>
              <Text style={styles.emptyStateText}>
                Add your first child to start managing family tasks and rewards
              </Text>
              <TouchableOpacity style={styles.emptyStateButton} onPress={openAddModal}>
                <Plus size={20} color="#ffffff" />
                <Text style={styles.emptyStateButtonText}>Add First Child</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      <ChildFormModal 
        visible={showAddModal}
        onClose={closeModal}
        onSave={handleSave}
        editingChild={editingChild}
        familyId={familyId}
      />
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
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 16,
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
  headerContent: {
    flex: 1,
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
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  overviewCard: {
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
  overviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  overviewTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
    marginLeft: 12,
  },
  overviewStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  overviewStat: {
    alignItems: 'center',
    flex: 1,
  },
  overviewStatValue: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1e293b',
  },
  overviewStatLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#64748b',
    marginTop: 4,
  },
  childrenSection: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  childCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  childCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  childAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
    borderWidth: 3,
    borderColor: '#e2e8f0',
  },
  childInfo: {
    flex: 1,
  },
  childName: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  childAge: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    marginBottom: 8,
  },
  childStats: {
    flexDirection: 'row',
    gap: 12,
  },
  childStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  childStatText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#475569',
  },
  childActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editChildButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteChildButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fef2f2',
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: 24,
  },
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
    gap: 8,
  },
  emptyStateButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
  },
  modalSaveButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  formSection: {
    marginBottom: 32,
  },
  formLabel: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
    marginBottom: 12,
  },
  avatarScroll: {
    paddingVertical: 8,
  },
  avatarOption: {
    marginRight: 16,
    position: 'relative',
  },
  selectedAvatar: {
    transform: [{ scale: 1.1 }],
  },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  avatarCheckmark: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    fontSize: 12,
    color: '#ffffff',
    fontFamily: 'Inter-Bold',
  },
  textInput: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1e293b',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  passwordInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1e293b',
  },
  eyeButton: {
    padding: 16,
  },
  helpText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    marginTop: 6,
  },
  previewCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  previewAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  previewInfo: {
    flex: 1,
  },
  previewName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
    marginBottom: 4,
  },
  previewAge: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    marginBottom: 8,
  },
  previewStats: {
    flexDirection: 'row',
    gap: 12,
  },
  previewStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  previewStatText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#475569',
  },
  disabledButton: {
    opacity: 0.5,
  },
});